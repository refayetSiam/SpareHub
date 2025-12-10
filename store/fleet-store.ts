import { create } from 'zustand';
import { Bus } from '@/types';
import { LocalStorageService } from '@/lib/storage';

interface FleetState {
  buses: Bus[];
  loading: boolean;
  loadBuses: () => void;
  addBus: (bus: Bus) => void;
  updateBus: (id: string, updates: Partial<Bus>) => void;
  deleteBus: (id: string) => void;
  getBus: (id: string) => Bus | undefined;
}

export const useFleetStore = create<FleetState>((set, get) => ({
  buses: [],
  loading: false,

  loadBuses: () => {
    set({ loading: true });
    const buses = LocalStorageService.getBuses();
    set({ buses, loading: false });
  },

  addBus: (bus) => {
    LocalStorageService.addBus(bus);
    set((state) => ({ buses: [...state.buses, bus] }));
  },

  updateBus: (id, updates) => {
    LocalStorageService.updateBus(id, updates);
    set((state) => ({
      buses: state.buses.map((b) => (b.id === id ? { ...b, ...updates } : b))
    }));
  },

  deleteBus: (id) => {
    LocalStorageService.deleteBus(id);
    set((state) => ({ buses: state.buses.filter((b) => b.id !== id) }));
  },

  getBus: (id) => {
    return get().buses.find((b) => b.id === id);
  }
}));
