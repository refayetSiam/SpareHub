'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Wrench } from 'lucide-react';
import { COMPONENT_MASTERS } from '@/lib/constants';
import { LocalStorageService } from '@/lib/storage';
import { ComponentMaster } from '@/types';

export default function ComponentsPage() {
  const [buses, setBuses] = useState<any[]>([]);

  useEffect(() => {
    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);
  }, []);

  const getComponentStats = (componentType: string) => {
    let totalInstalled = 0;
    let goodCondition = 0;
    let needsReplacement = 0;

    buses.forEach(bus => {
      const comp = bus.components.find((c: any) => c.type === componentType);
      if (comp) {
        totalInstalled++;
        if (comp.status === 'good') goodCondition++;
        if (comp.status === 'overdue' || comp.status === 'critical') needsReplacement++;
      }
    });

    return { totalInstalled, goodCondition, needsReplacement };
  };

  const componentsByCategory = COMPONENT_MASTERS.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, ComponentMaster[]>);

  const totalComponents = buses.reduce((sum, bus) => sum + bus.components.length, 0);
  const componentsByStatus = buses.reduce((acc, bus) => {
    bus.components.forEach((comp: any) => {
      acc[comp.status] = (acc[comp.status] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Component Database</h1>
        <p className="text-gray-500">Master list of all component types and specifications</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComponents}</div>
            <p className="text-xs text-gray-500">Across {buses.length} buses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Good Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{componentsByStatus.good || 0}</div>
            <p className="text-xs text-gray-500">
              {((componentsByStatus.good || 0) / totalComponents * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(componentsByStatus.warning || 0) + (componentsByStatus.critical || 0)}
            </div>
            <p className="text-xs text-gray-500">Warning + Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{componentsByStatus.overdue || 0}</div>
            <p className="text-xs text-gray-500">Require immediate replacement</p>
          </CardContent>
        </Card>
      </div>

      {/* Component Catalog by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Component Catalog
          </CardTitle>
          <CardDescription>
            Master list of {COMPONENT_MASTERS.length} component types organized by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(componentsByCategory)[0]}>
            <TabsList>
              {Object.keys(componentsByCategory).map(category => (
                <TabsTrigger key={category} value={category}>
                  {category} ({componentsByCategory[category].length})
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(componentsByCategory).map(([category, components]) => (
              <TabsContent key={category} value={category}>
                <div className="rounded-md border mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component Name</TableHead>
                        <TableHead>Default Lifetime</TableHead>
                        <TableHead>Average Cost</TableHead>
                        <TableHead>Total Installed</TableHead>
                        <TableHead>Good Condition</TableHead>
                        <TableHead>Need Replacement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.map((comp) => {
                        const stats = getComponentStats(comp.type);
                        return (
                          <TableRow key={comp.type}>
                            <TableCell className="font-medium">
                              {comp.displayName}
                              {comp.requiresPosition && (
                                <Badge variant="outline" className="ml-2 text-xs">Positional</Badge>
                              )}
                            </TableCell>
                            <TableCell>{comp.defaultLifetimeKm.toLocaleString()} km</TableCell>
                            <TableCell>${comp.averageCost.toLocaleString()}</TableCell>
                            <TableCell>{stats.totalInstalled}</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-semibold">
                                {stats.goodCondition}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-red-600 font-semibold">
                                {stats.needsReplacement}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
