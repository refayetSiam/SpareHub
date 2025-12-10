'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LocalStorageService } from '@/lib/storage';
import { Bus as BusType, BusStatus } from '@/types';
import { Bus, Activity, Wrench, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBuses: 0,
    active: 0,
    maintenance: 0,
    decommissioned: 0,
    pendingWorkOrders: 0,
    inProgressWorkOrders: 0,
    completedWorkOrders: 0,
  });
  const [buses, setBuses] = useState<BusType[]>([]);

  const loadData = () => {
    const data = LocalStorageService.getStatistics();
    setStats(data);
    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (busId: string, newStatus: BusStatus) => {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;

    const updates: Partial<BusType> = { status: newStatus };

    // Set estimated active date for maintenance/decommissioned
    if (newStatus === 'maintenance' || newStatus === 'decommissioned') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (newStatus === 'maintenance' ? 14 : 60));
      updates.estimatedActiveDate = futureDate.toISOString();
    } else {
      updates.estimatedActiveDate = undefined;
    }

    LocalStorageService.updateBus(busId, updates);
    loadData();
    toast.success(`Bus ${bus.vehicleNumber} status updated to ${newStatus}`);
  };

  const fleetKpis = [
    {
      title: 'Total Fleet',
      value: stats.totalBuses,
      icon: Bus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Maintenance',
      value: stats.maintenance,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Decommissioned',
      value: stats.decommissioned,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const maintenanceKpis = [
    {
      title: 'Pending',
      value: stats.pendingWorkOrders,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
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
        <h1 className="text-3xl font-bold tracking-tight">Fleet Summary</h1>
        <p className="text-gray-500">Overview of your fleet operations</p>
      </div>

      {/* Fleet Inventory Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Fleet Inventory</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {fleetKpis.map((kpi) => (
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
      </div>

      {/* Fleet Table with Editable Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Fleet Status
          </CardTitle>
          <Link href="/fleet">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Garage</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.slice(0, 10).map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.vehicleNumber}</TableCell>
                    <TableCell>{bus.type}</TableCell>
                    <TableCell>{bus.garageId === 'garage-north' ? 'North' : 'South'}</TableCell>
                    <TableCell>{bus.currentMileage.toLocaleString()} km</TableCell>
                    <TableCell>
                      <Select
                        value={bus.status}
                        onValueChange={(value) => handleStatusChange(bus.id, value as BusStatus)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Active
                            </span>
                          </SelectItem>
                          <SelectItem value="maintenance">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-yellow-500" />
                              Maintenance
                            </span>
                          </SelectItem>
                          <SelectItem value="decommissioned">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Decommissioned
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Link href={`/fleet/${bus.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {buses.length > 10 && (
            <div className="mt-4 text-center">
              <Link href="/fleet">
                <Button variant="link">View all {buses.length} vehicles</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Section - Wider Card */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Work Orders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-yellow-600" />
                Work Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {maintenanceKpis.map((kpi) => (
                  <div key={kpi.title} className={`p-4 rounded-lg ${kpi.bgColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-sm font-medium text-gray-600">{kpi.title}</span>
                    </div>
                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Work Orders</span>
                  <span className="font-semibold">
                    {stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Active (Pending + In Progress)</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.pendingWorkOrders + stats.inProgressWorkOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-semibold text-green-600">
                    {stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders > 0
                      ? Math.round(
                          (stats.completedWorkOrders /
                            (stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <Link href="/maintenance">
                <Button className="w-full">View All Work Orders</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Fleet Health Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Fleet Utilization</span>
                    <span className="text-sm font-medium">
                      {stats.totalBuses > 0 ? Math.round((stats.active / stats.totalBuses) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${stats.totalBuses > 0 ? (stats.active / stats.totalBuses) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">In Maintenance</span>
                    <span className="text-sm font-medium">
                      {stats.totalBuses > 0 ? Math.round((stats.maintenance / stats.totalBuses) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalBuses > 0 ? (stats.maintenance / stats.totalBuses) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Decommissioned</span>
                    <span className="text-sm font-medium">
                      {stats.totalBuses > 0 ? Math.round((stats.decommissioned / stats.totalBuses) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${stats.totalBuses > 0 ? (stats.decommissioned / stats.totalBuses) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">North Garage</div>
                    <div className="text-lg font-semibold">
                      {buses.filter(b => b.garageId === 'garage-north').length} buses
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">South Garage</div>
                    <div className="text-lg font-semibold">
                      {buses.filter(b => b.garageId === 'garage-south').length} buses
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
