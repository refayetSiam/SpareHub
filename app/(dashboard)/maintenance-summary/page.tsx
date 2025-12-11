'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalStorageService } from '@/lib/storage';
import { WorkOrder, Bus as BusType, Component } from '@/types';
import { Wrench, Clock, CheckCircle2 } from 'lucide-react';
import { COMPONENT_MASTERS } from '@/lib/constants';
import { useMaintenanceStore } from '@/store/maintenance-store';

// Simulated inventory quantities (same as components page)
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

export default function MaintenanceSummaryPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const { selectedGarage } = useMaintenanceStore();

  useEffect(() => {
    const allWorkOrders = LocalStorageService.getWorkOrders();
    setWorkOrders(allWorkOrders);

    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);
  }, []);

  // Filter buses and work orders by selected garage
  const filteredBuses = useMemo(() => {
    if (selectedGarage === 'all') return buses;
    return buses.filter(bus => bus.garageId === selectedGarage);
  }, [buses, selectedGarage]);

  const filteredWorkOrders = useMemo(() => {
    if (selectedGarage === 'all') return workOrders;
    return workOrders.filter(wo => wo.garageId === selectedGarage);
  }, [workOrders, selectedGarage]);

  // Calculate stats from filtered data
  const stats = useMemo(() => ({
    pendingWorkOrders: filteredWorkOrders.filter(wo => wo.status === 'pending').length,
    inProgressWorkOrders: filteredWorkOrders.filter(wo => wo.status === 'in_progress').length,
    completedWorkOrders: filteredWorkOrders.filter(wo => wo.status === 'completed').length,
  }), [filteredWorkOrders]);

  // Calculate inventory stats dynamically from filtered buses
  const inventoryStats = useMemo(() => {
    const componentsNeedingAttention: Array<{ component: Component; bus: BusType }> = [];

    filteredBuses.forEach(bus => {
      bus.components.forEach(comp => {
        if (comp.status === 'overdue' || comp.status === 'critical' || comp.status === 'warning') {
          componentsNeedingAttention.push({ component: comp, bus });
        }
      });
    });

    // Calculate needs by type
    const needsByType: Record<string, number> = {};
    componentsNeedingAttention.forEach(({ component }) => {
      needsByType[component.type] = (needsByType[component.type] || 0) + 1;
    });

    // Count out of stock and low stock
    let outOfStock = 0;
    let lowStock = 0;

    Object.entries(needsByType).forEach(([type, needed]) => {
      const available = INVENTORY_QTY[type] || 0;
      if (available === 0) outOfStock++;
      else if (available < needed) lowStock++;
    });

    return { outOfStock, lowStock };
  }, [filteredBuses]);

  const maintenanceKpis = [
    {
      title: 'Pending',
      value: stats.pendingWorkOrders,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'In Progress',
      value: stats.inProgressWorkOrders,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats.completedWorkOrders,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Summary</h1>
        <p className="text-gray-500">Overview of maintenance operations</p>
      </div>

      {/* Work Order KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {maintenanceKpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Work Order Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium">
                  {stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders > 0
                    ? Math.round(
                        (stats.completedWorkOrders /
                          (stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders)) *
                          100
                      )
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${
                      stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders > 0
                        ? (stats.completedWorkOrders /
                            (stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders)) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Work Orders</span>
                <span className="font-semibold">
                  {stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Requiring Action</span>
                <span className="font-semibold text-orange-600">
                  {stats.pendingWorkOrders + stats.inProgressWorkOrders}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
                <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
                <div className="text-xs text-gray-500 mt-1">Component types depleted</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-gray-600 mb-1">Low Stock</div>
                <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
                <div className="text-xs text-gray-500 mt-1">Inventory running low</div>
              </div>
            </div>
            <div className="pt-2">
              {(inventoryStats.outOfStock > 0 || inventoryStats.lowStock > 0) ? (
                <p className="text-xs text-gray-600 mb-3">Restocking required to maintain operations</p>
              ) : (
                <p className="text-xs text-green-600 mb-3">Inventory levels adequate</p>
              )}
              <Link href="/components">
                <Button className="w-full" variant="outline">Manage Inventory</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
