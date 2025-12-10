'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Bus, Wrench, AlertTriangle, Plus, Edit2, Save, X } from 'lucide-react';
import { LocalStorageService } from '@/lib/storage';
import { Bus as BusType, Component, ComponentStatus, AdditionalMaintenanceItem, WorkOrder, WorkOrderStatus, BusStatus, BusType as BusTypeEnum } from '@/types';
import { COMPONENT_MASTERS, GARAGES } from '@/lib/constants';
import { toast } from 'sonner';
import { handleComponentStatusChange, generateWorkOrdersForMaintenanceItems } from '@/lib/work-order-service';
import Link from 'next/link';

const BUS_TYPES: BusTypeEnum[] = ['Standard', 'Articulated', 'Double-Decker', 'Mini'];
const BUS_CAPACITIES: Record<BusTypeEnum, number> = {
  'Standard': 45,
  'Articulated': 60,
  'Double-Decker': 80,
  'Mini': 25
};

export default function BusDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bus, setBus] = useState<BusType | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [isEditingVehicleInfo, setIsEditingVehicleInfo] = useState(false);
  const [vehicleEditForm, setVehicleEditForm] = useState<Partial<BusType>>({});
  const [isAddingMaintenanceItem, setIsAddingMaintenanceItem] = useState(false);
  const [newMaintenanceItem, setNewMaintenanceItem] = useState<Partial<AdditionalMaintenanceItem>>({
    description: '',
    installedDate: new Date().toISOString().split('T')[0],
    renewalDate: '',
    cost: 0,
    status: 'good',
    notes: ''
  });

  useEffect(() => {
    const busData = LocalStorageService.getBus(params.id as string);
    if (busData) {
      setBus(busData);

      // Load work orders for this bus
      const allWorkOrders = LocalStorageService.getWorkOrders()
        .filter(wo => wo.busId === busData.id)
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      setWorkOrders(allWorkOrders);
    }
  }, [params.id]);

  const handleUpdateComponent = (componentId: string, updates: Partial<Component>) => {
    if (!bus) return;

    const updatedComponents = bus.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    );

    const updatedBus = { ...bus, components: updatedComponents };
    LocalStorageService.updateBus(bus.id, updatedBus);
    setBus(updatedBus);
    setEditingComponent(null);

    // If status was changed to non-good, trigger work order generation
    if (updates.status && updates.status !== 'good') {
      handleComponentStatusChange(bus.id, componentId);
      toast.success('Component updated and work order created');
    } else {
      toast.success('Component updated successfully');
    }
  };

  const handleAddMaintenanceItem = () => {
    if (!bus || !newMaintenanceItem.description || !newMaintenanceItem.renewalDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const item: AdditionalMaintenanceItem = {
      id: `maintenance-${Date.now()}`,
      description: newMaintenanceItem.description,
      installedDate: newMaintenanceItem.installedDate!,
      renewalDate: newMaintenanceItem.renewalDate,
      cost: newMaintenanceItem.cost || 0,
      status: newMaintenanceItem.status as ComponentStatus,
      notes: newMaintenanceItem.notes
    };

    const updatedBus = {
      ...bus,
      additionalMaintenanceItems: [...(bus.additionalMaintenanceItems || []), item]
    };

    LocalStorageService.updateBus(bus.id, updatedBus);
    setBus(updatedBus);

    // Generate work order if status is not 'good'
    if (item.status !== 'good') {
      const newWorkOrders = generateWorkOrdersForMaintenanceItems(updatedBus);
      newWorkOrders.forEach(wo => LocalStorageService.addWorkOrder(wo));

      // Reload work orders
      const allWorkOrders = LocalStorageService.getWorkOrders()
        .filter(wo => wo.busId === updatedBus.id)
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      setWorkOrders(allWorkOrders);

      toast.success('Maintenance item added and work order created');
    } else {
      toast.success('Maintenance item added successfully');
    }

    setIsAddingMaintenanceItem(false);
    setNewMaintenanceItem({
      description: '',
      installedDate: new Date().toISOString().split('T')[0],
      renewalDate: '',
      cost: 0,
      status: 'good',
      notes: ''
    });
  };

  const handleUpdateMaintenanceItem = (itemId: string, updates: Partial<AdditionalMaintenanceItem>) => {
    if (!bus) return;

    const updatedItems = (bus.additionalMaintenanceItems || []).map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    const updatedBus = { ...bus, additionalMaintenanceItems: updatedItems };
    LocalStorageService.updateBus(bus.id, updatedBus);
    setBus(updatedBus);

    // If status was changed to non-good, generate work order if needed
    if (updates.status && updates.status !== 'good') {
      const newWorkOrders = generateWorkOrdersForMaintenanceItems(updatedBus);
      newWorkOrders.forEach(wo => LocalStorageService.addWorkOrder(wo));

      // Reload work orders
      const allWorkOrders = LocalStorageService.getWorkOrders()
        .filter(wo => wo.busId === updatedBus.id)
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      setWorkOrders(allWorkOrders);

      toast.success('Maintenance item updated and work order created');
    } else {
      toast.success('Maintenance item updated successfully');
    }
  };

  const handleDeleteMaintenanceItem = (itemId: string) => {
    if (!bus) return;

    const updatedItems = (bus.additionalMaintenanceItems || []).filter(item => item.id !== itemId);
    const updatedBus = { ...bus, additionalMaintenanceItems: updatedItems };

    LocalStorageService.updateBus(bus.id, updatedBus);
    setBus(updatedBus);
    toast.success('Maintenance item deleted successfully');
  };

  const handleStartEditVehicleInfo = () => {
    if (!bus) return;
    setVehicleEditForm({
      vehicleNumber: bus.vehicleNumber,
      type: bus.type,
      capacity: bus.capacity,
      status: bus.status,
      garageId: bus.garageId,
      currentMileage: bus.currentMileage,
      registrationDate: bus.registrationDate,
      lastMaintenanceDate: bus.lastMaintenanceDate,
      estimatedActiveDate: bus.estimatedActiveDate
    });
    setIsEditingVehicleInfo(true);
  };

  const handleSaveVehicleInfo = () => {
    if (!bus) return;

    const updates: Partial<BusType> = {
      ...vehicleEditForm
    };

    // If status is active, clear estimated active date
    if (updates.status === 'active') {
      updates.estimatedActiveDate = undefined;
    }

    LocalStorageService.updateBus(bus.id, updates);
    setBus({ ...bus, ...updates });
    setIsEditingVehicleInfo(false);
    toast.success('Vehicle information updated successfully');
  };

  const handleCancelEditVehicleInfo = () => {
    setIsEditingVehicleInfo(false);
    setVehicleEditForm({});
  };

  if (!bus) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Bus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Bus not found</h3>
          <Button onClick={() => router.push('/fleet')} className="mt-4">
            Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', label: 'Maintenance' },
      decommissioned: { color: 'bg-red-100 text-red-800', label: 'Decommissioned' }
    };
    const config = variants[status] || variants.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getComponentStatusBadge = (status: ComponentStatus) => {
    const variants: Record<ComponentStatus, { color: string; label: string }> = {
      good: { color: 'bg-green-100 text-green-800', label: 'Good' },
      warning: { color: 'bg-yellow-100 text-yellow-800', label: 'Warning' },
      critical: { color: 'bg-orange-100 text-orange-800', label: 'Critical' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' }
    };
    const config = variants[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getComponentDisplayName = (comp: Component) => {
    const master = COMPONENT_MASTERS.find(m => m.type === comp.type);
    return master?.displayName || comp.type;
  };

  const getWorkOrderStatusBadge = (status: WorkOrderStatus) => {
    const variants: Record<WorkOrderStatus, { color: string; label: string }> = {
      pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    const config = variants[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const criticalComponents = bus.components.filter(c => c.status === 'overdue' || c.status === 'critical');
  const warningComponents = bus.components.filter(c => c.status === 'warning');

  const componentsByCategory = bus.components.reduce((acc, comp) => {
    const master = COMPONENT_MASTERS.find(m => m.type === comp.type);
    const category = master?.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {} as Record<string, Component[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/fleet')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{bus.vehicleNumber}</h1>
          <p className="text-gray-500">{bus.type} Bus - Capacity: {bus.capacity} passengers</p>
        </div>
      </div>

      {/* Alerts */}
      {criticalComponents.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Critical Components ({criticalComponents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              This vehicle has {criticalComponents.length} component(s) that need immediate attention.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(bus.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Mileage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bus.currentMileage.toLocaleString()} km</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Garage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {bus.garageId === 'garage-north' ? 'North Garage' : 'South Garage'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Component Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {criticalComponents.length + warningComponents.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Information</CardTitle>
            {isEditingVehicleInfo ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEditVehicleInfo}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveVehicleInfo}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleStartEditVehicleInfo}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingVehicleInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Vehicle Number</label>
                <Input
                  value={vehicleEditForm.vehicleNumber || ''}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, vehicleNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                <Select
                  value={vehicleEditForm.type}
                  onValueChange={(value) => setVehicleEditForm({
                    ...vehicleEditForm,
                    type: value as BusTypeEnum,
                    capacity: BUS_CAPACITIES[value as BusTypeEnum]
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUS_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Capacity</label>
                <Input
                  type="number"
                  value={vehicleEditForm.capacity || ''}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, capacity: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Select
                  value={vehicleEditForm.status}
                  onValueChange={(value) => setVehicleEditForm({ ...vehicleEditForm, status: value as BusStatus })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Garage</label>
                <Select
                  value={vehicleEditForm.garageId}
                  onValueChange={(value) => setVehicleEditForm({ ...vehicleEditForm, garageId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GARAGES.map(garage => (
                      <SelectItem key={garage.id} value={garage.id}>{garage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Mileage (km)</label>
                <Input
                  type="number"
                  value={vehicleEditForm.currentMileage || ''}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, currentMileage: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <Input
                  type="date"
                  value={vehicleEditForm.registrationDate?.split('T')[0] || ''}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, registrationDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Maintenance Date</label>
                <Input
                  type="date"
                  value={vehicleEditForm.lastMaintenanceDate?.split('T')[0] || ''}
                  onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, lastMaintenanceDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              {vehicleEditForm.status !== 'active' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Est. Active Date</label>
                  <Input
                    type="date"
                    value={vehicleEditForm.estimatedActiveDate?.split('T')[0] || ''}
                    onChange={(e) => setVehicleEditForm({ ...vehicleEditForm, estimatedActiveDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vehicle Number</p>
                <p className="font-medium">{bus.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle Type</p>
                <p className="font-medium">{bus.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium">{bus.capacity} passengers</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(bus.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Garage</p>
                <p className="font-medium">{bus.garageId === 'garage-north' ? 'North Garage' : 'South Garage'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Mileage</p>
                <p className="font-medium">{bus.currentMileage.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium">{new Date(bus.registrationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Maintenance</p>
                <p className="font-medium">{new Date(bus.lastMaintenanceDate).toLocaleDateString()}</p>
              </div>
              {bus.status !== 'active' && bus.estimatedActiveDate && (
                <div>
                  <p className="text-sm text-gray-500">Est. Active Date</p>
                  <p className="font-medium">{new Date(bus.estimatedActiveDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Components by Category */}
      {Object.entries(componentsByCategory).map(([category, components]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category} Components</CardTitle>
            <CardDescription>
              {components.filter(c => c.status === 'good').length} good,
              {components.filter(c => c.status === 'warning').length} warning,
              {components.filter(c => c.status === 'critical').length} critical,
              {components.filter(c => c.status === 'overdue').length} overdue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Installed Date</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Cost Override</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">{getComponentDisplayName(comp)}</TableCell>
                      <TableCell>{comp.position}</TableCell>
                      <TableCell>
                        {editingComponent === comp.id ? (
                          <Select
                            value={comp.status}
                            onValueChange={(value) => handleUpdateComponent(comp.id, { status: value as ComponentStatus })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getComponentStatusBadge(comp.status)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingComponent === comp.id ? (
                          <Input
                            type="date"
                            defaultValue={comp.installedDate}
                            onBlur={(e) => handleUpdateComponent(comp.id, { installedDate: e.target.value })}
                            className="w-40"
                          />
                        ) : (
                          new Date(comp.installedDate).toLocaleDateString()
                        )}
                      </TableCell>
                      <TableCell>{new Date(comp.renewalDate).toLocaleDateString()}</TableCell>
                      <TableCell>${comp.estimatedCost.toLocaleString()}</TableCell>
                      <TableCell>
                        {editingComponent === comp.id ? (
                          <Input
                            type="number"
                            placeholder="Override"
                            defaultValue={comp.costOverride || ''}
                            onBlur={(e) => handleUpdateComponent(comp.id, { costOverride: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-32"
                          />
                        ) : (
                          comp.costOverride ? `$${comp.costOverride.toLocaleString()}` : '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingComponent === comp.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingComponent(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingComponent(comp.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Additional Maintenance Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Additional Maintenance Items</CardTitle>
              <CardDescription>
                Custom maintenance items not covered by standard components
              </CardDescription>
            </div>
            <Dialog open={isAddingMaintenanceItem} onOpenChange={setIsAddingMaintenanceItem}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Maintenance Item</DialogTitle>
                  <DialogDescription>
                    Add a custom maintenance item with editable dates and costs
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="e.g., Annual inspection, Oil change"
                      value={newMaintenanceItem.description}
                      onChange={(e) => setNewMaintenanceItem({ ...newMaintenanceItem, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Installed Date</label>
                      <Input
                        type="date"
                        value={newMaintenanceItem.installedDate}
                        onChange={(e) => setNewMaintenanceItem({ ...newMaintenanceItem, installedDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Renewal Date</label>
                      <Input
                        type="date"
                        value={newMaintenanceItem.renewalDate}
                        onChange={(e) => setNewMaintenanceItem({ ...newMaintenanceItem, renewalDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Cost ($)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newMaintenanceItem.cost}
                        onChange={(e) => setNewMaintenanceItem({ ...newMaintenanceItem, cost: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={newMaintenanceItem.status}
                        onValueChange={(value) => setNewMaintenanceItem({ ...newMaintenanceItem, status: value as ComponentStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Input
                      placeholder="Additional notes"
                      value={newMaintenanceItem.notes}
                      onChange={(e) => setNewMaintenanceItem({ ...newMaintenanceItem, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingMaintenanceItem(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMaintenanceItem}>
                    Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {bus.additionalMaintenanceItems && bus.additionalMaintenanceItems.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Installed Date</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bus.additionalMaintenanceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value) => handleUpdateMaintenanceItem(item.id, { status: value as ComponentStatus })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.installedDate}
                          onChange={(e) => handleUpdateMaintenanceItem(item.id, { installedDate: e.target.value })}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.renewalDate}
                          onChange={(e) => handleUpdateMaintenanceItem(item.id, { renewalDate: e.target.value })}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.cost}
                          onChange={(e) => handleUpdateMaintenanceItem(item.id, { cost: Number(e.target.value) })}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Notes"
                          value={item.notes || ''}
                          onChange={(e) => handleUpdateMaintenanceItem(item.id, { notes: e.target.value })}
                          className="w-48"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaintenanceItem(item.id)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No additional maintenance items. Click "Add Item" to create one.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance History
          </CardTitle>
          <CardDescription>All work orders for this vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          {workOrders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Components</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell>
                        {wo.completedDate
                          ? new Date(wo.completedDate).toLocaleDateString()
                          : new Date(wo.createdDate).toLocaleDateString()
                        }
                      </TableCell>
                      <TableCell>
                        <Link href="/maintenance" className="font-medium text-blue-600 hover:underline">
                          {wo.title}
                        </Link>
                        {wo.isAutoGenerated && (
                          <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getWorkOrderStatusBadge(wo.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {wo.components.slice(0, 2).join(', ')}
                          {wo.components.length > 2 && ` +${wo.components.length - 2} more`}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(wo.actualCost || wo.estimatedCost).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No maintenance history for this vehicle yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
