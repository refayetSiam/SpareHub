'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">Application settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure your preferences and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Coming Soon</h3>
            <p className="mt-2 text-sm text-gray-500">
              User preferences, notifications, data management, and system configuration
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Phase 6 of implementation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
