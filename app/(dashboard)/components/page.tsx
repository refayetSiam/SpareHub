'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, PackageX, AlertCircle, TrendingDown } from 'lucide-react';
import { COMPONENT_MASTERS } from '@/lib/constants';
import { LocalStorageService } from '@/lib/storage';
import { ComponentMaster, Bus, Component } from '@/types';
import { useMaintenanceStore } from '@/store/maintenance-store';

// Simulated inventory quantities (in a real app, this would come from a database)
const INVENTORY_QTY: Record<string, number> = {
  'tire_fl': 8,
  'tire_fr': 8,
  'tire_rl': 6,
  'tire_rr': 6,
  'brake_pad_fl': 12,
  'brake_pad_fr': 12,
  'brake_pad_rl': 10,
  'brake_pad_rr': 10,
  'rotor_fl': 4,
  'rotor_fr': 4,
  'rotor_rl': 3,
  'rotor_rr': 3,
  'engine': 0,
  'suspension': 2,
  'transmission': 0,
  'battery': 5,
  'air_conditioning': 1,
  'alternator': 0,
};

export default function ComponentsPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const { selectedGarage } = useMaintenanceStore();

  useEffect(() => {
    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);
  }, []);

  // Filter buses by selected garage
  const filteredBuses = useMemo(() => {
    if (selectedGarage === 'all') return buses;
    return buses.filter(bus => bus.garageId === selectedGarage);
  }, [buses, selectedGarage]);

  // Get components that need attention (overdue, critical, or warning)
  const componentsNeedingAttention = useMemo(() => {
    const components: Array<{
      component: Component;
      bus: Bus;
      master: ComponentMaster;
    }> = [];

    filteredBuses.forEach(bus => {
      bus.components.forEach(comp => {
        if (comp.status === 'overdue' || comp.status === 'critical' || comp.status === 'warning') {
          const master = COMPONENT_MASTERS.find(m => m.type === comp.type);
          if (master) {
            components.push({ component: comp, bus, master });
          }
        }
      });
    });

    return components;
  }, [filteredBuses]);

  // Get stats for inventory needs by component type
  const inventoryNeeds = useMemo(() => {
    const needs: Record<string, {
      displayName: string;
      overdue: number;
      critical: number;
      warning: number;
      totalNeeded: number;
      qtyAvailable: number;
      averageCost: number;
      category: string;
    }> = {};

    componentsNeedingAttention.forEach(({ component, master }) => {
      if (!needs[component.type]) {
        needs[component.type] = {
          displayName: master.displayName,
          overdue: 0,
          critical: 0,
          warning: 0,
          totalNeeded: 0,
          qtyAvailable: INVENTORY_QTY[component.type] || 0,
          averageCost: master.averageCost,
          category: master.category,
        };
      }

      if (component.status === 'overdue') needs[component.type].overdue++;
      else if (component.status === 'critical') needs[component.type].critical++;
      else if (component.status === 'warning') needs[component.type].warning++;

      needs[component.type].totalNeeded++;
    });

    return needs;
  }, [componentsNeedingAttention]);

  // Summary stats
  const overdueCount = componentsNeedingAttention.filter(c => c.component.status === 'overdue').length;
  const criticalCount = componentsNeedingAttention.filter(c => c.component.status === 'critical').length;
  const warningCount = componentsNeedingAttention.filter(c => c.component.status === 'warning').length;

  // Out of stock count
  const outOfStockTypes = Object.entries(inventoryNeeds).filter(([type, data]) => data.qtyAvailable === 0).length;
  const lowStockTypes = Object.entries(inventoryNeeds).filter(([type, data]) => data.qtyAvailable > 0 && data.qtyAvailable < data.totalNeeded).length;

  // Group by category
  const needsByCategory = useMemo(() => {
    const categories: Record<string, typeof inventoryNeeds> = {};
    Object.entries(inventoryNeeds).forEach(([type, data]) => {
      if (!categories[data.category]) categories[data.category] = {};
      categories[data.category][type] = data;
    });
    return categories;
  }, [inventoryNeeds]);

  const getStockBadge = (available: number, needed: number) => {
    if (available === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (available < needed) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Component Inventory</h1>
        <p className="text-gray-500">Inventory tracking for components needed for repairs</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue Replacements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-gray-500">Require immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
            <p className="text-xs text-gray-500">Need attention soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockTypes}</div>
            <p className="text-xs text-gray-500">Component types depleted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockTypes}</div>
            <p className="text-xs text-gray-500">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Out of Stock Items */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Out of Stock
            </CardTitle>
            <CardDescription>Components that need immediate restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(inventoryNeeds).filter(([, data]) => data.qtyAvailable === 0).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(inventoryNeeds)
                  .filter(([, data]) => data.qtyAvailable === 0)
                  .map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <div className="font-medium text-red-900">{data.displayName}</div>
                        <div className="text-sm text-red-600">{data.totalNeeded} needed for repairs</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-700">${(data.averageCost * data.totalNeeded).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Est. cost</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All components in stock</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <TrendingDown className="h-5 w-5" />
              Low Stock
            </CardTitle>
            <CardDescription>Components running low - order soon</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(inventoryNeeds).filter(([, data]) => data.qtyAvailable > 0 && data.qtyAvailable < data.totalNeeded).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(inventoryNeeds)
                  .filter(([, data]) => data.qtyAvailable > 0 && data.qtyAvailable < data.totalNeeded)
                  .map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div>
                        <div className="font-medium text-yellow-900">{data.displayName}</div>
                        <div className="text-sm text-yellow-700">
                          {data.qtyAvailable} available / {data.totalNeeded} needed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-700">-{data.totalNeeded - data.qtyAvailable}</div>
                        <div className="text-xs text-gray-500">Shortage</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">Stock levels adequate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Inventory Table by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Full Inventory Status
          </CardTitle>
          <CardDescription>
            All components needed for repairs - grouped by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(needsByCategory).length > 0 ? (
            <Tabs defaultValue={Object.keys(needsByCategory)[0]}>
              <TabsList>
                {Object.keys(needsByCategory).map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category} ({Object.keys(needsByCategory[category]).length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(needsByCategory).map(([category, items]) => (
                <TabsContent key={category} value={category}>
                  <div className="rounded-md border mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead className="text-center">Overdue</TableHead>
                          <TableHead className="text-center">Critical</TableHead>
                          <TableHead className="text-center">Warning</TableHead>
                          <TableHead className="text-center">Total Needed</TableHead>
                          <TableHead className="text-center">Qty Available</TableHead>
                          <TableHead>Stock Status</TableHead>
                          <TableHead className="text-right">Est. Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(items).map(([type, data]) => (
                          <TableRow key={type} className={data.qtyAvailable === 0 ? 'bg-red-50' : data.qtyAvailable < data.totalNeeded ? 'bg-yellow-50' : ''}>
                            <TableCell className="font-medium">{data.displayName}</TableCell>
                            <TableCell className="text-center">
                              {data.overdue > 0 ? (
                                <span className="text-red-600 font-bold">{data.overdue}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {data.critical > 0 ? (
                                <span className="text-orange-600 font-semibold">{data.critical}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {data.warning > 0 ? (
                                <span className="text-yellow-600">{data.warning}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-semibold">{data.totalNeeded}</TableCell>
                            <TableCell className="text-center">
                              <span className={data.qtyAvailable === 0 ? 'text-red-600 font-bold' : data.qtyAvailable < data.totalNeeded ? 'text-yellow-600 font-semibold' : 'text-green-600'}>
                                {data.qtyAvailable}
                              </span>
                            </TableCell>
                            <TableCell>{getStockBadge(data.qtyAvailable, data.totalNeeded)}</TableCell>
                            <TableCell className="text-right">${(data.averageCost * data.totalNeeded).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <PackageX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No Components Need Attention</p>
              <p className="text-sm">All fleet components are in good condition</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
