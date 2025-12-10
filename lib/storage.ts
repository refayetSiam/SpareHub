import { Bus, WorkOrder, MaintenanceHistory, Garage, ComponentMaster } from '@/types';
import { loadFleetData } from './data-loader';
import { GARAGES, COMPONENT_MASTERS } from './constants';

const STORAGE_KEYS = {
  BUSES: 'sparehub_buses',
  WORK_ORDERS: 'sparehub_work_orders',
  MAINTENANCE_HISTORY: 'sparehub_maintenance_history',
  GARAGES: 'sparehub_garages',
  COMPONENT_MASTERS: 'sparehub_component_masters',
  INITIALIZED: 'sparehub_initialized'
} as const;

export class LocalStorageService {
  // Check if running in browser
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Initialize data on first load
  static initialize(): void {
    if (!this.isBrowser()) return;

    if (!this.isInitialized()) {
      console.log('Initializing Transitland data from CSV source...');
      const { buses, workOrders, maintenanceHistory } = loadFleetData();

      this.setBuses(buses);
      this.setWorkOrders(workOrders);
      this.setMaintenanceHistory(maintenanceHistory);
      this.setGarages(GARAGES);
      this.setComponentMasters(COMPONENT_MASTERS);

      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      console.log(`✅ Initialized with ${buses.length} buses and ${workOrders.length} work orders from CSV source`);
    }
  }

  static isInitialized(): boolean {
    if (!this.isBrowser()) return false;
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  }

  // Generic get/set methods
  private static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  }

  // Bus operations
  static getBuses(): Bus[] {
    return this.getItem<Bus[]>(STORAGE_KEYS.BUSES, []);
  }

  static setBuses(buses: Bus[]): void {
    this.setItem(STORAGE_KEYS.BUSES, buses);
  }

  static getBus(id: string): Bus | undefined {
    return this.getBuses().find(b => b.id === id);
  }

  static addBus(bus: Bus): void {
    const buses = this.getBuses();
    buses.push(bus);
    this.setBuses(buses);
  }

  static updateBus(id: string, updates: Partial<Bus>): void {
    const buses = this.getBuses();
    const index = buses.findIndex(b => b.id === id);
    if (index !== -1) {
      buses[index] = { ...buses[index], ...updates };
      this.setBuses(buses);
    }
  }

  static deleteBus(id: string): void {
    const buses = this.getBuses();
    this.setBuses(buses.filter(b => b.id !== id));
  }

  // Work Order operations
  static getWorkOrders(): WorkOrder[] {
    return this.getItem<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, []);
  }

  static setWorkOrders(workOrders: WorkOrder[]): void {
    this.setItem(STORAGE_KEYS.WORK_ORDERS, workOrders);
  }

  static getWorkOrder(id: string): WorkOrder | undefined {
    return this.getWorkOrders().find(wo => wo.id === id);
  }

  static addWorkOrder(workOrder: WorkOrder): void {
    const workOrders = this.getWorkOrders();
    workOrders.push(workOrder);
    this.setWorkOrders(workOrders);
  }

  static updateWorkOrder(id: string, updates: Partial<WorkOrder>): void {
    const workOrders = this.getWorkOrders();
    const index = workOrders.findIndex(wo => wo.id === id);
    if (index !== -1) {
      workOrders[index] = { ...workOrders[index], ...updates };
      this.setWorkOrders(workOrders);
    }
  }

  static deleteWorkOrder(id: string): void {
    const workOrders = this.getWorkOrders();
    this.setWorkOrders(workOrders.filter(wo => wo.id !== id));
  }

  // Maintenance History operations
  static getMaintenanceHistory(): MaintenanceHistory[] {
    return this.getItem<MaintenanceHistory[]>(STORAGE_KEYS.MAINTENANCE_HISTORY, []);
  }

  static setMaintenanceHistory(history: MaintenanceHistory[]): void {
    this.setItem(STORAGE_KEYS.MAINTENANCE_HISTORY, history);
  }

  static addMaintenanceHistory(history: MaintenanceHistory): void {
    const histories = this.getMaintenanceHistory();
    histories.push(history);
    this.setMaintenanceHistory(histories);
  }

  // Garage operations
  static getGarages(): Garage[] {
    return this.getItem<Garage[]>(STORAGE_KEYS.GARAGES, GARAGES);
  }

  static setGarages(garages: Garage[]): void {
    this.setItem(STORAGE_KEYS.GARAGES, garages);
  }

  static getGarage(id: string): Garage | undefined {
    return this.getGarages().find(g => g.id === id);
  }

  // Component Master operations
  static getComponentMasters(): ComponentMaster[] {
    return this.getItem<ComponentMaster[]>(STORAGE_KEYS.COMPONENT_MASTERS, COMPONENT_MASTERS);
  }

  static setComponentMasters(masters: ComponentMaster[]): void {
    this.setItem(STORAGE_KEYS.COMPONENT_MASTERS, masters);
  }

  // Reset all data
  static reset(): void {
    if (!this.isBrowser()) return;

    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initialize();
  }

  // Get statistics
  static getStatistics() {
    const buses = this.getBuses();
    const workOrders = this.getWorkOrders();

    return {
      totalBuses: buses.length,
      active: buses.filter(b => b.status === 'active').length,
      maintenance: buses.filter(b => b.status === 'maintenance').length,
      decommissioned: buses.filter(b => b.status === 'decommissioned').length,
      pendingWorkOrders: workOrders.filter(wo => wo.status === 'pending').length,
      inProgressWorkOrders: workOrders.filter(wo => wo.status === 'in_progress').length,
      completedWorkOrders: workOrders.filter(wo => wo.status === 'completed').length,
    };
  }
}
