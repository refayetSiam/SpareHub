'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse, Bus, MapPin, Plus, Wrench } from 'lucide-react';
import { LocalStorageService } from '@/lib/storage';
import { GARAGES } from '@/lib/constants';
import { Bus as BusType } from '@/types';

export default function GaragesPage() {
  const [buses, setBuses] = useState<BusType[]>([]);

  useEffect(() => {
    const allBuses = LocalStorageService.getBuses();
    setBuses(allBuses);
  }, []);

  const getGarageStats = (garageId: string) => {
    const garageBuses = buses.filter(b => b.garageId === garageId);
    const garage = GARAGES.find(g => g.id === garageId);

    return {
      total: garageBuses.length,
      capacity: garage?.capacity || 0,
      active: garageBuses.filter(b => b.status === 'active' || b.status === 'operational').length,
      maintenance: garageBuses.filter(b => b.status === 'maintenance' || b.status === 'in_maintenance').length,
      decommissioned: garageBuses.filter(b => b.status === 'decommissioned' || b.status === 'out_of_service').length,
      utilization: garage ? (garageBuses.length / garage.capacity) * 100 : 0
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Garages</h1>
          <p className="text-gray-500">Manage North and South garage facilities</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Garage
        </Button>
      </div>

      {/* Garage Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {GARAGES.map((garage) => {
          const stats = getGarageStats(garage.id);
          const garageBuses = buses.filter(b => b.garageId === garage.id);

          return (
            <Card key={garage.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-6 w-6" />
                  {garage.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {garage.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capacity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Capacity</span>
                    <span className="text-sm text-gray-500">
                      {stats.total} / {stats.capacity} buses
                    </span>
                  </div>
                  <Progress value={stats.utilization} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.utilization.toFixed(1)}% utilized
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Decommissioned</p>
                    <p className="text-2xl font-bold text-red-600">{stats.decommissioned}</p>
                  </div>
                </div>

                {/* Buses in Maintenance */}
                {stats.maintenance > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-yellow-600" />
                      Buses Being Worked On ({stats.maintenance})
                    </h4>
                    <div className="space-y-2">
                      {garageBuses.filter(b => b.status === 'maintenance' || b.status === 'in_maintenance').slice(0, 5).map((bus) => (
                        <div key={bus.id} className="flex items-center justify-between text-sm bg-yellow-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">{bus.vehicleNumber}</span>
                            <Badge variant="outline" className="text-xs">{bus.type}</Badge>
                            {bus.estimatedActiveDate && (
                              <span className="text-xs text-gray-500">
                                Est. active: {new Date(bus.estimatedActiveDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <Link href={`/fleet/${bus.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Buses List */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">All Buses</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {garageBuses.slice(0, 10).map((bus) => (
                      <div key={bus.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{bus.vehicleNumber}</span>
                          <Badge variant="outline" className="text-xs">{bus.type}</Badge>
                        </div>
                        <Link href={`/fleet/${bus.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                  {garageBuses.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{garageBuses.length - 10} more buses
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All Buses by Garage */}
      {GARAGES.map((garage) => {
        const garageBuses = buses.filter(b => b.garageId === garage.id);

        return (
          <Card key={`table-${garage.id}`}>
            <CardHeader>
              <CardTitle>{garage.name} - All Buses ({garageBuses.length})</CardTitle>
              <CardDescription>Complete list of buses at this facility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {garageBuses.slice(0, 10).map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">{bus.vehicleNumber}</TableCell>
                        <TableCell>{bus.type}</TableCell>
                        <TableCell>{bus.capacity}</TableCell>
                        <TableCell>
                          <Badge variant={
                            bus.status === 'active' ? 'default' :
                            bus.status === 'maintenance' ? 'secondary' :
                            'destructive'
                          }>
                            {bus.status === 'active' ? 'Active' :
                             bus.status === 'maintenance' ? 'Maintenance' :
                             'Decommissioned'}
                          </Badge>
                        </TableCell>
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
              {garageBuses.length > 10 && (
                <div className="mt-4 text-center">
                  <Link href={`/fleet?garage=${garage.id}`}>
                    <Button variant="outline">
                      View All {garageBuses.length} Buses
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
