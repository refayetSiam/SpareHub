'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bus, Search, Filter, Plus } from 'lucide-react';
import { LocalStorageService } from '@/lib/storage';
import { Bus as BusType, BusStatus } from '@/types';
import { toast } from 'sonner';

export default function FleetPage() {
  const [buses, setBuses] = useState<BusType[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<BusType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [garageFilter, setGarageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadBuses = () => {
    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);
  };

  useEffect(() => {
    loadBuses();
  }, []);

  const handleStatusChange = (busId: string, newStatus: BusStatus) => {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;

    const updates: Partial<BusType> = { status: newStatus };

    if (newStatus === 'maintenance' || newStatus === 'decommissioned') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (newStatus === 'maintenance' ? 14 : 60));
      updates.estimatedActiveDate = futureDate.toISOString();
    } else {
      updates.estimatedActiveDate = undefined;
    }

    LocalStorageService.updateBus(busId, updates);
    loadBuses();
    toast.success(`Bus ${bus.vehicleNumber} status updated to ${newStatus}`);
  };

  useEffect(() => {
    let filtered = buses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(bus =>
        bus.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.status === statusFilter);
    }

    // Garage filter
    if (garageFilter !== 'all') {
      filtered = filtered.filter(bus => bus.garageId === garageFilter);
    }

    setFilteredBuses(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, garageFilter, buses]);

  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBuses = filteredBuses.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: BusStatus) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      maintenance: { variant: 'secondary', label: 'Maintenance' },
      decommissioned: { variant: 'destructive', label: 'Decommissioned' },
      // Legacy status values for backwards compatibility
      operational: { variant: 'default', label: 'Active' },
      in_maintenance: { variant: 'secondary', label: 'Maintenance' },
      out_of_service: { variant: 'destructive', label: 'Decommissioned' }
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = {
    total: buses.length,
    active: buses.filter(b => b.status === 'active').length,
    maintenance: buses.filter(b => b.status === 'maintenance').length,
    decommissioned: buses.filter(b => b.status === 'decommissioned').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Inventory</h1>
          <p className="text-gray-500">Manage your entire bus fleet</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Decommissioned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.decommissioned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Fleet List ({filteredBuses.length} buses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by vehicle number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={garageFilter} onValueChange={setGarageFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Garage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Garages</SelectItem>
                <SelectItem value="garage-north">North Garage</SelectItem>
                <SelectItem value="garage-south">South Garage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Garage</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBuses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell className="font-medium">{bus.vehicleNumber}</TableCell>
                    <TableCell>{bus.type}</TableCell>
                    <TableCell>{bus.capacity}</TableCell>
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
                    <TableCell>{bus.garageId === 'garage-north' ? 'North' : 'South'}</TableCell>
                    <TableCell>{bus.currentMileage.toLocaleString()} km</TableCell>
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBuses.length)} of {filteredBuses.length} buses
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
