'use client';

import { useEffect, useState } from 'react';
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
import { Wrench, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { LocalStorageService } from '@/lib/storage';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '@/types';
import { completeWorkOrder, generateAllWorkOrders } from '@/lib/work-order-service';
import { COMPONENT_MASTERS, MECHANICS } from '@/lib/constants';
import { toast } from 'sonner';

const getComponentDisplayName = (compType: string) => {
  const master = COMPONENT_MASTERS.find(m => m.type === compType);
  return master?.displayName || compType;
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

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = () => {
    const allWorkOrders = LocalStorageService.getWorkOrders();
    setWorkOrders(allWorkOrders);
    setFilteredWorkOrders(allWorkOrders);
  };

  useEffect(() => {
    let filtered = workOrders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(wo => wo.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(wo => wo.priority === priorityFilter);
    }

    setFilteredWorkOrders(filtered);
  }, [statusFilter, priorityFilter, workOrders]);

  const handleGenerateWorkOrders = () => {
    const count = generateAllWorkOrders();
    loadWorkOrders();
    toast.success(`Generated ${count} new work orders`);
  };

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
      pending: { variant: 'outline', label: 'Pending', icon: Clock },
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

  const activeWorkOrders = filteredWorkOrders.filter(wo =>
    wo.status === 'pending' || wo.status === 'in_progress' || wo.status === 'cancelled'
  );
  const completedWorkOrders = filteredWorkOrders.filter(wo => wo.status === 'completed');

  const stats = {
    total: workOrders.length,
    pending: workOrders.filter(wo => wo.status === 'pending').length,
    inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
    critical: workOrders.filter(wo => wo.priority === 'critical' && wo.status !== 'completed').length,
    active: workOrders.filter(wo => wo.status === 'pending' || wo.status === 'in_progress' || wo.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance & Work Orders</h1>
          <p className="text-gray-500">Manage maintenance schedules and work orders</p>
        </div>
        <Button onClick={handleGenerateWorkOrders}>
          <Wrench className="h-4 w-4 mr-2" />
          Generate Work Orders
        </Button>
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
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
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
                <SelectItem value="pending">Pending</SelectItem>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Est. Cost</TableHead>
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
                            <TableCell>{new Date(wo.createdDate).toLocaleDateString()}</TableCell>
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
                      <TableHead>Title</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Actual Cost</TableHead>
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
        <SheetContent className="w-[700px] sm:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Work Order Details</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              {selectedWorkOrder?.id}
            </SheetDescription>
          </SheetHeader>

          {selectedWorkOrder && (
            <div className="space-y-6 py-6">
              {/* Header Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-base font-medium">{selectedWorkOrder.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle</label>
                    <Link href={`/fleet/${selectedWorkOrder.busId}`} className="block text-blue-600 hover:underline">
                      {LocalStorageService.getBus(selectedWorkOrder.busId)?.vehicleNumber || 'Unknown'}
                    </Link>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedWorkOrder.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    {isEditing && selectedWorkOrder.status !== 'completed' ? (
                      <Select
                        value={editForm.priority || selectedWorkOrder.priority}
                        onValueChange={(value) => setEditForm({ ...editForm, priority: value as any })}
                      >
                        <SelectTrigger className="w-full mt-1">
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
                      <div className="mt-1">{getPriorityBadge(selectedWorkOrder.priority)}</div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-sm">{new Date(selectedWorkOrder.createdDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedWorkOrder.status !== 'completed' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Change Status</label>
                      {isEditing ? (
                        <Select
                          value={editForm.status || selectedWorkOrder.status}
                          onValueChange={(value) => setEditForm({ ...editForm, status: value as any })}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm capitalize">{selectedWorkOrder.status.replace('_', ' ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm mt-1">{selectedWorkOrder.description}</p>
              </div>

              {/* Components */}
              <div>
                <label className="text-sm font-medium text-gray-500">Components</label>
                <div className="mt-2 space-y-1">
                  {selectedWorkOrder.components.length > 0 ? (
                    selectedWorkOrder.components.map((comp) => {
                      const busComp = LocalStorageService.getBus(selectedWorkOrder.busId)?.components.find(c => c.type === comp);
                      return (
                        <div key={comp} className="text-sm bg-gray-50 px-3 py-2 rounded">
                          {getComponentDisplayName(comp)} {busComp && busComp.position !== 'N/A' && `(${busComp.position})`}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-500">Additional maintenance item</div>
                  )}
                </div>
              </div>

              {/* Assigned Mechanic */}
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned Mechanic</label>
                {isEditing && selectedWorkOrder.status !== 'completed' ? (
                  <Select
                    value={editForm.assignedMechanic || 'unassigned'}
                    onValueChange={(value) => setEditForm({ ...editForm, assignedMechanic: value === 'unassigned' ? '' : value })}
                  >
                    <SelectTrigger className="w-full mt-1">
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
                  <p className="text-sm mt-1">{selectedWorkOrder.assignedMechanic || 'Unassigned'}</p>
                )}
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                {isEditing && selectedWorkOrder.status !== 'completed' ? (
                  <Input
                    type="date"
                    value={editForm.scheduledDate ? new Date(editForm.scheduledDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">
                    {selectedWorkOrder.scheduledDate ? new Date(selectedWorkOrder.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                  </p>
                )}
              </div>

              {/* Costs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Cost</label>
                  <p className="text-lg font-bold">${selectedWorkOrder.estimatedCost.toLocaleString()}</p>
                </div>
                {selectedWorkOrder.actualCost && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Actual Cost</label>
                    <p className="text-lg font-bold text-green-600">${selectedWorkOrder.actualCost.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                {isEditing && selectedWorkOrder.status !== 'completed' ? (
                  <Input
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Add notes"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">{selectedWorkOrder.notes || 'No notes'}</p>
                )}
              </div>

              {selectedWorkOrder.completedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Completed Date</label>
                  <p className="text-sm mt-1">{new Date(selectedWorkOrder.completedDate).toLocaleDateString()}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedWorkOrder.status !== 'completed' && (
                  <>
                    {!isEditing ? (
                      <>
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            setCompletingWorkOrder(selectedWorkOrder);
                            setActualCost(selectedWorkOrder.estimatedCost);
                            setSelectedWorkOrder(null);
                          }}
                          className="flex-1"
                        >
                          Complete
                        </Button>
                        <Button
                          onClick={() => {
                            handleCancelWorkOrder(selectedWorkOrder);
                            setSelectedWorkOrder(null);
                          }}
                          variant="ghost"
                        >
                          Cancel WO
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={handleEditWorkOrder} className="flex-1">
                          Save Changes
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                          Cancel Edit
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
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
