import { create } from 'zustand';
import { WorkOrder } from '@/types';
import { LocalStorageService } from '@/lib/storage';

interface MaintenanceState {
  workOrders: WorkOrder[];
  loading: boolean;
  selectedGarage: string; // 'all', 'garage-north', or 'garage-south'
  loadWorkOrders: () => void;
  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  getWorkOrder: (id: string) => WorkOrder | undefined;
  setSelectedGarage: (garageId: string) => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  workOrders: [],
  loading: false,
  selectedGarage: 'all',

  loadWorkOrders: () => {
    set({ loading: true });
    const workOrders = LocalStorageService.getWorkOrders();
    set({ workOrders, loading: false });
  },

  addWorkOrder: (workOrder) => {
    LocalStorageService.addWorkOrder(workOrder);
    set((state) => ({ workOrders: [...state.workOrders, workOrder] }));
  },

  updateWorkOrder: (id, updates) => {
    LocalStorageService.updateWorkOrder(id, updates);
    set((state) => ({
      workOrders: state.workOrders.map((wo) =>
        wo.id === id ? { ...wo, ...updates } : wo
      )
    }));
  },

  deleteWorkOrder: (id) => {
    LocalStorageService.deleteWorkOrder(id);
    set((state) => ({
      workOrders: state.workOrders.filter((wo) => wo.id !== id)
    }));
  },

  getWorkOrder: (id) => {
    return get().workOrders.find((wo) => wo.id === id);
  },

  setSelectedGarage: (garageId) => {
    set({ selectedGarage: garageId });
  }
}));
