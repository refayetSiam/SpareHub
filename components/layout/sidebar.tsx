'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bus,
  Warehouse,
  Wrench,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Operations role navigation
const operationsNavigation = [
  { name: 'Fleet Summary', href: '/fleet-summary', icon: LayoutDashboard },
  { name: 'Fleet Inventory', href: '/fleet', icon: Bus },
  { name: 'Reporting', href: '/reports', icon: BarChart3 },
];

// Maintenance role navigation
const maintenanceNavigation = [
  { name: 'Maintenance Summary', href: '/maintenance-summary', icon: LayoutDashboard },
  { name: 'Work Orders', href: '/maintenance', icon: Wrench },
  { name: 'Components', href: '/components', icon: ClipboardList },
  { name: 'Fleet Inventory', href: '/fleet', icon: Bus },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useUserStore();

  // Get navigation based on role
  const navigation = currentUser?.role === 'maintenance' ? maintenanceNavigation : operationsNavigation;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-800 px-4">
        <div className="flex items-center gap-3">
          <Bus className="h-8 w-8 text-blue-400 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold">SpareHub</h1>
            <p className="text-xs text-gray-400">Fleet Manager</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-gray-400">{currentUser.email}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant={currentUser.role === 'operations' ? 'default' : 'secondary'}>
              {currentUser.role === 'operations' ? 'Operations' : 'Maintenance'}
            </Badge>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={() => router.push('/settings')}
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:bg-gray-800 hover:text-red-300"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
