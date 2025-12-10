'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ResetPage() {
  const router = useRouter();
  const [isReset, setIsReset] = useState(false);

  const handleReset = () => {
    if (typeof window === 'undefined') return;

    // Clear all localStorage keys
    const keys = [
      'sparehub_buses',
      'sparehub_work_orders',
      'sparehub_maintenance_history',
      'sparehub_garages',
      'sparehub_component_masters',
      'sparehub_initialized'
    ];

    keys.forEach(key => localStorage.removeItem(key));

    setIsReset(true);

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  if (isReset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Database Reset Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              All data has been cleared. Redirecting to dashboard...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              The system will load the 29 buses from the CSV source of truth.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-6 w-6" />
            Reset Database
          </CardTitle>
          <CardDescription>
            This will clear all localStorage data and reinitialize with 29 buses from the CSV source
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action will delete:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
              <li>All bus data</li>
              <li>All work orders</li>
              <li>All maintenance history</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>After reset:</strong> The system will load 29 buses from <code className="bg-blue-100 px-1 rounded">public/data/buses.json</code>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
              <li>17 buses in North Garage</li>
              <li>12 buses in South Garage</li>
              <li>Components will be regenerated with maintenance issues</li>
              <li>Work orders will be auto-generated for critical/overdue components</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              className="flex-1"
            >
              Reset Database
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
