'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocalStorageService } from '@/lib/storage';
import { Bus as BusType } from '@/types';
import { Wrench, Clock, CheckCircle2 } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

  // Generate weekly data for the chart (last 8 weeks)
  const generateWeeklyData = () => {
    const weeks = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekLabel = `Week ${8 - i}`;

      // Simulated data - in production this would come from historical data
      const baseVehicles = stats.totalBuses || 50;
      const variation = Math.floor(Math.random() * 5) - 2;
      const vehicles = Math.max(0, baseVehicles + variation - (7 - i));

      // Calculate total capacity based on average capacity per bus (45 passengers)
      const avgCapacity = 45;
      const totalCapacity = vehicles * avgCapacity;

      weeks.push({
        week: weekLabel,
        vehicles: vehicles,
        capacity: totalCapacity,
      });
    }

    return weeks;
  };

  const chartData = generateWeeklyData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fleet Summary</h1>
        <p className="text-gray-500">Overview of your fleet operations</p>
      </div>

      {/* Work Orders and Fleet Health Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Order Summary */}
        <Card>
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

        {/* Fleet Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Fleet Utilization</span>
                  <span className="text-sm font-medium">
                    {stats.totalBuses > 0 ? Math.round((stats.active / stats.totalBuses) * 100) : 0}% ({stats.active})
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
                    {stats.totalBuses > 0 ? Math.round((stats.maintenance / stats.totalBuses) * 100) : 0}% ({stats.maintenance})
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
                    {stats.totalBuses > 0 ? Math.round((stats.decommissioned / stats.totalBuses) * 100) : 0}% ({stats.decommissioned})
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

      {/* Fleet Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Trends (Weekly)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Vehicles', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 12 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Capacity', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'vehicles') return [value, 'Vehicles'];
                    if (name === 'capacity') return [value.toLocaleString(), 'Total Capacity'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="vehicles"
                  fill="#3b82f6"
                  name="vehicles"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="capacity"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="capacity"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span>Number of Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded" />
              <span>Total Capacity (passengers)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
