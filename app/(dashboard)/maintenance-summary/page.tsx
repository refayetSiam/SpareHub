'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LocalStorageService } from '@/lib/storage';
import { WorkOrder, Bus as BusType, Component } from '@/types';
import { Wrench, Clock, CheckCircle2, AlertTriangle, ClipboardList } from 'lucide-react';
import { COMPONENT_MASTERS } from '@/lib/constants';

export default function MaintenanceSummaryPage() {
  const [stats, setStats] = useState({
    pendingWorkOrders: 0,
    inProgressWorkOrders: 0,
    completedWorkOrders: 0,
  });
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [buses, setBuses] = useState<BusType[]>([]);
  const [criticalComponents, setCriticalComponents] = useState<{ bus: BusType; component: Component }[]>([]);

  useEffect(() => {
    const data = LocalStorageService.getStatistics();
    setStats({
      pendingWorkOrders: data.pendingWorkOrders,
      inProgressWorkOrders: data.inProgressWorkOrders,
      completedWorkOrders: data.completedWorkOrders,
    });

    const allWorkOrders = LocalStorageService.getWorkOrders();
    setWorkOrders(allWorkOrders);

    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);

    // Find all critical/overdue components
    const critical: { bus: BusType; component: Component }[] = [];
    allBuses.forEach(bus => {
      bus.components.forEach(comp => {
        if (comp.status === 'critical' || comp.status === 'overdue') {
          critical.push({ bus, component: comp });
        }
      });
    });
    setCriticalComponents(critical);
  }, []);

  const getComponentDisplayName = (compType: string) => {
    const master = COMPONENT_MASTERS.find(m => m.type === compType);
    return master?.displayName || compType;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      critical: { variant: 'destructive', label: 'Critical' },
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'secondary', label: 'Medium' },
      low: { variant: 'outline', label: 'Low' },
    };
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'secondary', label: 'Completed' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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

  const activeWorkOrders = workOrders.filter(wo => wo.status !== 'completed').slice(0, 10);

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

      {/* Critical Components Alert */}
      {criticalComponents.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Components Requiring Attention ({criticalComponents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle #</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalComponents.slice(0, 5).map(({ bus, component }, idx) => (
                    <TableRow key={`${bus.id}-${component.type}-${idx}`}>
                      <TableCell className="font-medium">{bus.vehicleNumber}</TableCell>
                      <TableCell>
                        {getComponentDisplayName(component.type)}
                        {component.position !== 'N/A' && ` (${component.position})`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={component.status === 'critical' ? 'destructive' : 'secondary'}>
                          {component.status === 'critical' ? 'Critical' : 'Overdue'}
                        </Badge>
                      </TableCell>
                      <TableCell>${component.estimatedCost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Link href={`/fleet/${bus.id}`}>
                          <Button variant="ghost" size="sm">View Bus</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {criticalComponents.length > 5 && (
              <div className="mt-4 text-center">
                <Link href="/components">
                  <Button variant="link" className="text-red-700">
                    View all {criticalComponents.length} critical components
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Work Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Active Work Orders
          </CardTitle>
          <Link href="/maintenance">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeWorkOrders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeWorkOrders.map((wo) => {
                    const bus = buses.find(b => b.id === wo.busId);
                    return (
                      <TableRow key={wo.id}>
                        <TableCell className="font-medium">{wo.title}</TableCell>
                        <TableCell>{bus?.vehicleNumber || 'N/A'}</TableCell>
                        <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                        <TableCell>{getStatusBadge(wo.status)}</TableCell>
                        <TableCell>{wo.assignedMechanic || 'Unassigned'}</TableCell>
                        <TableCell>
                          <Link href="/maintenance">
                            <Button variant="ghost" size="sm">Manage</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No active work orders</p>
            </div>
          )}
        </CardContent>
      </Card>

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
            <CardTitle>Component Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">Critical/Overdue</div>
                <div className="text-2xl font-bold text-red-600">{criticalComponents.length}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-gray-600">Warnings</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {buses.reduce((count, bus) =>
                    count + bus.components.filter(c => c.status === 'warning').length, 0
                  )}
                </div>
              </div>
            </div>
            <Link href="/components">
              <Button className="w-full" variant="outline">View All Components</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
