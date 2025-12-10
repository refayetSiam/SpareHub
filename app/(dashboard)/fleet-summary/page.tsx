'use client';

import { useEffect, useState, useMemo } from 'react';
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
  ReferenceLine,
  Cell,
} from 'recharts';

export default function FleetSummaryPage() {
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

  // Generate weekly data for the chart (8 weeks) - use useMemo to prevent recalculation
  const chartData = useMemo(() => {
    const weeks = [];

    // Simulate fleet data with bigger buses (higher capacity) replacing smaller ones
    // Week 1-2 are past (greyed out), Week 3+ are current/future
    const weeklyData = [
      { week: 'Week 1', vehicles: 22, avgCapacity: 55 },  // Past - older fleet
      { week: 'Week 2', vehicles: 20, avgCapacity: 58 },  // Past - some retirements
      { week: 'Week 3', vehicles: 18, avgCapacity: 65 },  // Current - upgrading fleet
      { week: 'Week 4', vehicles: 17, avgCapacity: 70 },  // Fewer buses but bigger
      { week: 'Week 5', vehicles: 16, avgCapacity: 75 },  // More Double-Deckers
      { week: 'Week 6', vehicles: 15, avgCapacity: 78 },  // Continued upgrades
      { week: 'Week 7', vehicles: 14, avgCapacity: 82 },  // High-capacity fleet
      { week: 'Week 8', vehicles: 14, avgCapacity: 85 },  // Optimized fleet
    ];

    weeklyData.forEach((data, index) => {
      weeks.push({
        week: data.week,
        vehicles: data.vehicles,
        capacity: data.vehicles * data.avgCapacity,
        isPast: index < 2, // Week 1 and 2 are in the past
      });
    });

    return weeks;
  }, []);

  // Capacity limit line at 1000
  const CAPACITY_LIMIT = 1000;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fleet Summary</h1>
        <p className="text-gray-500">Overview of your fleet operations</p>
      </div>

      {/* Work Orders and Fleet Health Section - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Work Order Summary - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-yellow-600" />
              Work Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {maintenanceKpis.map((kpi) => (
                <div key={kpi.title} className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <div className="flex items-center gap-1 mb-1">
                    <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
                    <span className="text-xs font-medium text-gray-600">{kpi.title}</span>
                  </div>
                  <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">
                  {stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-yellow-600">
                  {stats.pendingWorkOrders + stats.inProgressWorkOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-green-600">
                  {stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders > 0
                    ? Math.round(
                        (stats.completedWorkOrders /
                          (stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders)) *
                          100
                      )
                    : 0}%
                </span>
              </div>
            </div>
            <Link href="/maintenance">
              <Button className="w-full" size="sm">View All Work Orders</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Fleet Health Overview - Compact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fleet Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-sm text-gray-600">Fleet Utilization</span>
                  <span className="text-sm font-medium">
                    {stats.totalBuses > 0 ? Math.round((stats.active / stats.totalBuses) * 100) : 0}% ({stats.active})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{
                      width: `${stats.totalBuses > 0 ? (stats.active / stats.totalBuses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-sm text-gray-600">In Maintenance</span>
                  <span className="text-sm font-medium">
                    {stats.totalBuses > 0 ? Math.round((stats.maintenance / stats.totalBuses) * 100) : 0}% ({stats.maintenance})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-yellow-500 h-1.5 rounded-full"
                    style={{
                      width: `${stats.totalBuses > 0 ? (stats.maintenance / stats.totalBuses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-sm text-gray-600">Decommissioned</span>
                  <span className="text-sm font-medium">
                    {stats.totalBuses > 0 ? Math.round((stats.decommissioned / stats.totalBuses) * 100) : 0}% ({stats.decommissioned})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full"
                    style={{
                      width: `${stats.totalBuses > 0 ? (stats.decommissioned / stats.totalBuses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Garage Stats</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">North Garage</div>
                  <div className="text-base font-semibold">
                    {buses.filter(b => b.garageId === 'garage-north').length} buses
                  </div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">South Garage</div>
                  <div className="text-base font-semibold">
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
        <CardHeader className="pb-2">
          <CardTitle>Fleet Trends (Weekly)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 40,
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
                  domain={[0, 1400]}
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
                {/* Capacity Limit Reference Line */}
                <ReferenceLine
                  yAxisId="right"
                  y={CAPACITY_LIMIT}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `Capacity Limit (${CAPACITY_LIMIT})`,
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 11,
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="vehicles"
                  name="vehicles"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isPast ? '#9ca3af' : '#3b82f6'}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="capacity"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="capacity"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`dot-${payload.week}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.isPast ? '#9ca3af' : '#10b981'}
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span>Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded" />
              <span>Past Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded" />
              <span>Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500" />
              <span>Capacity Limit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
