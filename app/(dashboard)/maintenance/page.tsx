'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, AlertTriangle, CheckCircle2, XCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LocalStorageService } from '@/lib/storage';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/types';
import { completeWorkOrder } from '@/lib/work-order-service';
import { COMPONENT_MASTERS, MECHANICS } from '@/lib/constants';
import { toast } from 'sonner';
import { useMaintenanceStore } from '@/store/maintenance-store';

const getComponentDisplayName = (compType: string) => {
  const master = COMPONENT_MASTERS.find(m => m.type === compType);
  return master?.displayName || compType;
};

type SortField = 'title' | 'vehicle' | 'priority' | 'status' | 'dueDate' | 'estimatedCost' | 'completedDate';
type SortDirection = 'asc' | 'desc';

const priorityOrder: Record<WorkOrderPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const statusOrder: Record<WorkOrderStatus, number> = {
  in_progress: 3,
  pending: 2,
  cancelled: 1,
  completed: 0
};

export default function MaintenancePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [completingWorkOrder, setCompletingWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<WorkOrder>>({});
  const [actualCost, setActualCost] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { selectedGarage } = useMaintenanceStore();

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = () => {
    const allWorkOrders = LocalStorageService.getWorkOrders();
    setWorkOrders(allWorkOrders);
    setFilteredWorkOrders(allWorkOrders);
  };

  // Filter work orders by garage first
  const garageFilteredWorkOrders = useMemo(() => {
    if (selectedGarage === 'all') return workOrders;
    return workOrders.filter(wo => wo.garageId === selectedGarage);
  }, [workOrders, selectedGarage]);

  useEffect(() => {
    let filtered = garageFilteredWorkOrders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(wo => wo.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(wo => wo.priority === priorityFilter);
    }

    setFilteredWorkOrders(filtered);
  }, [statusFilter, priorityFilter, garageFilteredWorkOrders]);

  const handleCompleteWorkOrder = async () => {
    if (!completingWorkOrder) return;

    const result = completeWorkOrder(
      completingWorkOrder.id,
      actualCost || completingWorkOrder.estimatedCost,
      completingWorkOrder.components,
      completionNotes
    );

    if (result.success) {
      toast.success(result.message);
      loadWorkOrders();
      setCompletingWorkOrder(null);
      setActualCost(0);
      setCompletionNotes('');
    } else {
      toast.error(result.message);
    }
  };

  const handleCancelWorkOrder = (workOrder: WorkOrder) => {
    LocalStorageService.updateWorkOrder(workOrder.id, { status: 'cancelled' });
    loadWorkOrders();
    toast.success('Work order cancelled');
  };

  const handleEditWorkOrder = () => {
    if (!selectedWorkOrder || !isEditing) return;

    LocalStorageService.updateWorkOrder(selectedWorkOrder.id, editForm);
    loadWorkOrders();
    setIsEditing(false);
    toast.success('Work order updated successfully');

    // Update selected work order with new data
    const updated = LocalStorageService.getWorkOrder(selectedWorkOrder.id);
    if (updated) setSelectedWorkOrder(updated);
  };

  const openWorkOrderDetails = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setEditForm({
      priority: workOrder.priority,
      assignedMechanic: workOrder.assignedMechanic,
      scheduledDate: workOrder.scheduledDate,
      notes: workOrder.notes,
      status: workOrder.status
    });
    setIsEditing(false);
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    const variants: Record<WorkOrderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      pending: { variant: 'outline', label: 'Backlog', icon: Clock },
      in_progress: { variant: 'secondary', label: 'In Progress', icon: Wrench },
      completed: { variant: 'default', label: 'Completed', icon: CheckCircle2 },
      cancelled: { variant: 'destructive', label: 'Cancelled', icon: XCircle }
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    const colors: Record<WorkOrderPriority, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[priority]}>{priority.toUpperCase()}</Badge>;
  };

  // Sort function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortWorkOrders = (orders: WorkOrder[]) => {
    return [...orders].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'vehicle':
          const busA = LocalStorageService.getBus(a.busId)?.vehicleNumber || '';
          const busB = LocalStorageService.getBus(b.busId)?.vehicleNumber || '';
          comparison = busA.localeCompare(busB);
          break;
        case 'priority':
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'status':
          comparison = statusOrder[b.status] - statusOrder[a.status];
          break;
        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'estimatedCost':
          comparison = a.estimatedCost - b.estimatedCost;
          break;
        case 'completedDate':
          const compDateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
          const compDateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
          comparison = compDateB - compDateA; // Most recent first by default
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const activeWorkOrders = useMemo(() => {
    const filtered = filteredWorkOrders.filter(wo =>
      wo.status === 'pending' || wo.status === 'in_progress' || wo.status === 'cancelled'
    );
    return sortWorkOrders(filtered);
  }, [filteredWorkOrders, sortField, sortDirection]);

  const completedWorkOrders = useMemo(() => {
    const filtered = filteredWorkOrders.filter(wo => wo.status === 'completed');
    return sortWorkOrders(filtered);
  }, [filteredWorkOrders, sortField, sortDirection]);

  const stats = useMemo(() => ({
    total: garageFilteredWorkOrders.length,
    pending: garageFilteredWorkOrders.filter(wo => wo.status === 'pending').length,
    inProgress: garageFilteredWorkOrders.filter(wo => wo.status === 'in_progress').length,
    completed: garageFilteredWorkOrders.filter(wo => wo.status === 'completed').length,
    critical: garageFilteredWorkOrders.filter(wo => wo.priority === 'critical' && wo.status !== 'completed').length,
    active: garageFilteredWorkOrders.filter(wo => wo.status === 'pending' || wo.status === 'in_progress' || wo.status === 'cancelled').length
  }), [garageFilteredWorkOrders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance & Work Orders</h1>
        <p className="text-gray-500">Manage maintenance schedules and work orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Work Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Work Orders List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Work Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Backlog</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Title {getSortIcon('title')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('vehicle')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Vehicle {getSortIcon('vehicle')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('priority')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Priority {getSortIcon('priority')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Status {getSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('dueDate')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Due Date {getSortIcon('dueDate')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('estimatedCost')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Est. Cost {getSortIcon('estimatedCost')}
                        </button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWorkOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No active work orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeWorkOrders.map((wo) => {
                        const bus = LocalStorageService.getBus(wo.busId);
                        const isOverdue = wo.dueDate && new Date(wo.dueDate) < new Date();
                        return (
                          <TableRow key={wo.id}>
                            <TableCell className="font-mono text-xs">{wo.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => openWorkOrderDetails(wo)}
                                className="font-medium text-blue-600 hover:underline text-left"
                              >
                                {wo.title}
                              </button>
                              {wo.isAutoGenerated && (
                                <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link href={`/fleet/${wo.busId}`} className="text-blue-600 hover:underline">
                                {bus?.vehicleNumber || 'Unknown'}
                              </Link>
                            </TableCell>
                            <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                            <TableCell>{getStatusBadge(wo.status)}</TableCell>
                            <TableCell>
                              {wo.dueDate ? (
                                <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                  {new Date(wo.dueDate).toLocaleDateString()}
                                  {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>${wo.estimatedCost.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {(wo.status === 'pending' || wo.status === 'in_progress') && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        setCompletingWorkOrder(wo);
                                        setActualCost(wo.estimatedCost);
                                      }}
                                    >
                                      Complete
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelWorkOrder(wo)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('title')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Title {getSortIcon('title')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('vehicle')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Vehicle {getSortIcon('vehicle')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('priority')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Priority {getSortIcon('priority')}
                        </button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('completedDate')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Completed {getSortIcon('completedDate')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('estimatedCost')}
                          className="flex items-center hover:text-gray-900 font-medium"
                        >
                          Actual Cost {getSortIcon('estimatedCost')}
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedWorkOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          No completed work orders yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedWorkOrders.map((wo) => {
                        const bus = LocalStorageService.getBus(wo.busId);
                        return (
                          <TableRow key={wo.id}>
                            <TableCell className="font-mono text-xs">{wo.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => openWorkOrderDetails(wo)}
                                className="font-medium text-blue-600 hover:underline text-left"
                              >
                                {wo.title}
                              </button>
                              {wo.isAutoGenerated && (
                                <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link href={`/fleet/${wo.busId}`} className="text-blue-600 hover:underline">
                                {bus?.vehicleNumber || 'Unknown'}
                              </Link>
                            </TableCell>
                            <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                            <TableCell>{getStatusBadge(wo.status)}</TableCell>
                            <TableCell>{wo.completedDate ? new Date(wo.completedDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>${wo.actualCost?.toLocaleString() || wo.estimatedCost.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Work Order Details Sheet */}
      <Sheet open={!!selectedWorkOrder} onOpenChange={(open) => {
        if (!open) {
          setSelectedWorkOrder(null);
          setIsEditing(false);
        }
      }}>
        <SheetContent className="!w-[800px] sm:!w-[900px] !max-w-[95vw] overflow-y-auto px-10">
          <SheetHeader className="pb-8 border-b mb-8">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-2xl font-bold mb-2">Work Order Details</SheetTitle>
                <SheetDescription className="font-mono text-sm text-gray-400">
                  ID: {selectedWorkOrder?.id}
                </SheetDescription>
              </div>
              {selectedWorkOrder && (
                <div className="flex gap-3">
                  {getStatusBadge(selectedWorkOrder.status)}
                  {getPriorityBadge(selectedWorkOrder.priority)}
                </div>
              )}
            </div>
          </SheetHeader>

          {selectedWorkOrder && (
            <div className="space-y-10">
              {/* Title Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{selectedWorkOrder.title}</h3>
                <p className="text-gray-600 leading-relaxed">{selectedWorkOrder.description}</p>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Vehicle</label>
                    <Link href={`/fleet/${selectedWorkOrder.busId}`} className="text-lg text-blue-600 hover:underline font-medium">
                      {LocalStorageService.getBus(selectedWorkOrder.busId)?.vehicleNumber || 'Unknown'}
                    </Link>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Assigned Mechanic</label>
                    {isEditing && selectedWorkOrder.status !== 'completed' ? (
                      <Select
                        value={editForm.assignedMechanic || 'unassigned'}
                        onValueChange={(value) => setEditForm({ ...editForm, assignedMechanic: value === 'unassigned' ? '' : value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select mechanic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {MECHANICS.map(mech => (
                            <SelectItem key={mech.id} value={mech.name}>{mech.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-lg font-medium">{selectedWorkOrder.assignedMechanic || 'Unassigned'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Created Date</label>
                    <p className="text-lg">{new Date(selectedWorkOrder.createdDate).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Due Date</label>
                    {selectedWorkOrder.dueDate ? (
                      <p className={`text-lg font-medium ${new Date(selectedWorkOrder.dueDate) < new Date() && selectedWorkOrder.status !== 'completed' ? 'text-red-600' : ''}`}>
                        {new Date(selectedWorkOrder.dueDate).toLocaleDateString()}
                        {new Date(selectedWorkOrder.dueDate) < new Date() && selectedWorkOrder.status !== 'completed' && (
                          <span className="ml-2 text-sm">(Overdue)</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400">Not set</p>
                    )}
                  </div>

                  {selectedWorkOrder.completedDate && (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Completed Date</label>
                      <p className="text-lg text-green-600 font-medium">{new Date(selectedWorkOrder.completedDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedWorkOrder.status !== 'completed' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                      {isEditing ? (
                        <Select
                          value={editForm.status || selectedWorkOrder.status}
                          onValueChange={(value) => setEditForm({ ...editForm, status: value as any })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Backlog</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg capitalize">{selectedWorkOrder.status === 'pending' ? 'Backlog' : selectedWorkOrder.status.replace('_', ' ')}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Priority</label>
                    {isEditing && selectedWorkOrder.status !== 'completed' ? (
                      <Select
                        value={editForm.priority || selectedWorkOrder.priority}
                        onValueChange={(value) => setEditForm({ ...editForm, priority: value as any })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-lg capitalize">{selectedWorkOrder.priority}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Scheduled Date</label>
                    {isEditing && selectedWorkOrder.status !== 'completed' ? (
                      <Input
                        type="date"
                        value={editForm.scheduledDate ? new Date(editForm.scheduledDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg">
                        {selectedWorkOrder.scheduledDate ? new Date(selectedWorkOrder.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Components Section */}
              <div className="border-t pt-8">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-4">Components</label>
                <div className="flex flex-wrap gap-3">
                  {selectedWorkOrder.components.length > 0 ? (
                    selectedWorkOrder.components.map((comp) => {
                      const busComp = LocalStorageService.getBus(selectedWorkOrder.busId)?.components.find(c => c.type === comp);
                      return (
                        <div key={comp} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                          {getComponentDisplayName(comp)} {busComp && busComp.position !== 'N/A' && `(${busComp.position})`}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-500">Additional maintenance item</div>
                  )}
                </div>
              </div>

              {/* Cost Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Estimated Cost</label>
                    <p className="text-3xl font-bold text-gray-900">${selectedWorkOrder.estimatedCost.toLocaleString()}</p>
                  </div>
                  {selectedWorkOrder.actualCost && (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Actual Cost</label>
                      <p className="text-3xl font-bold text-green-600">${selectedWorkOrder.actualCost.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="border-t pt-8">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">Notes</label>
                {isEditing && selectedWorkOrder.status !== 'completed' ? (
                  <Input
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Add notes"
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-600">{selectedWorkOrder.notes || 'No notes added'}</p>
                )}
              </div>

              {/* Action Buttons */}
              {selectedWorkOrder.status !== 'completed' && (
                <div className="border-t pt-8 flex gap-4">
                  {!isEditing ? (
                    <>
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="lg" className="flex-1">
                        Edit Work Order
                      </Button>
                      <Button
                        onClick={() => {
                          setCompletingWorkOrder(selectedWorkOrder);
                          setActualCost(selectedWorkOrder.estimatedCost);
                          setSelectedWorkOrder(null);
                        }}
                        size="lg"
                        className="flex-1"
                      >
                        Mark Complete
                      </Button>
                      <Button
                        onClick={() => {
                          handleCancelWorkOrder(selectedWorkOrder);
                          setSelectedWorkOrder(null);
                        }}
                        variant="ghost"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={handleEditWorkOrder} size="lg" className="flex-1">
                        Save Changes
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="lg" className="flex-1">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Complete Work Order Dialog */}
      <Dialog open={!!completingWorkOrder} onOpenChange={(open) => !open && setCompletingWorkOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Work Order</DialogTitle>
            <DialogDescription>
              {completingWorkOrder?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Components</label>
              <div className="mt-2 space-y-1">
                {completingWorkOrder?.components.length ? (
                  completingWorkOrder.components.map((comp) => (
                    <div key={comp} className="text-sm text-gray-600">
                      {getComponentDisplayName(comp)}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Additional maintenance item</div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Actual Cost ($)</label>
              <Input
                type="number"
                value={actualCost}
                onChange={(e) => setActualCost(Number(e.target.value))}
                placeholder="Enter actual cost"
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated: ${completingWorkOrder?.estimatedCost.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Completion Notes (optional)</label>
              <Input
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the completion"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-medium text-blue-900">What happens when you complete:</p>
              <ul className="mt-2 space-y-1 text-blue-800 text-xs">
                <li>• Component installed date will be set to today</li>
                <li>• Component renewal date will be recalculated based on lifetime</li>
                <li>• Component status will be reset to "good"</li>
                <li>• Maintenance history will be recorded</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingWorkOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteWorkOrder}>
              Complete Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
