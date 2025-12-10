'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-gray-500">View fleet performance and cost analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Report Dashboard
          </CardTitle>
          <CardDescription>
            Inventory reports, maintenance reports, and cost analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Coming Soon</h3>
            <p className="mt-2 text-sm text-gray-500">
              Comprehensive reports with charts: Inventory breakdown, maintenance metrics, cost analysis
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Phase 5 of implementation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
