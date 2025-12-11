'use client';

import { Search, Warehouse } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserStore } from '@/store/user-store';
import { useMaintenanceStore } from '@/store/maintenance-store';
import { GARAGES } from '@/lib/constants';

export function Header() {
  const { currentUser } = useUserStore();
  const { selectedGarage, setSelectedGarage } = useMaintenanceStore();

  const isMaintenance = currentUser?.role === 'maintenance';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search vehicles, work orders..."
            className="pl-10"
          />
        </div>
      </div>

      {isMaintenance && (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-gray-500" />
          <Select value={selectedGarage} onValueChange={setSelectedGarage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Garage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Garages</SelectItem>
              {GARAGES.map(garage => (
                <SelectItem key={garage.id} value={garage.id}>
                  {garage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </header>
  );
}
