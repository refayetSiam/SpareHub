import { ComponentMaster, Garage } from '@/types';

export const MECHANICS = [
  { id: 'mech-001', name: 'John Smith' },
  { id: 'mech-002', name: 'Maria Garcia' },
  { id: 'mech-003', name: 'David Johnson' },
  { id: 'mech-004', name: 'Sarah Williams' },
  { id: 'mech-005', name: 'Michael Brown' },
];

export const COMPONENT_MASTERS: ComponentMaster[] = [
  // Tires
  { type: 'tire_fl', displayName: 'Front Left Tire', category: 'Tires', defaultLifetimeKm: 80000, averageCost: 450, requiresPosition: true },
  { type: 'tire_fr', displayName: 'Front Right Tire', category: 'Tires', defaultLifetimeKm: 80000, averageCost: 450, requiresPosition: true },
  { type: 'tire_rl', displayName: 'Rear Left Tire', category: 'Tires', defaultLifetimeKm: 80000, averageCost: 450, requiresPosition: true },
  { type: 'tire_rr', displayName: 'Rear Right Tire', category: 'Tires', defaultLifetimeKm: 80000, averageCost: 450, requiresPosition: true },

  // Brake Pads
  { type: 'brake_pad_fl', displayName: 'Front Left Brake Pad', category: 'Brakes', defaultLifetimeKm: 50000, averageCost: 350, requiresPosition: true },
  { type: 'brake_pad_fr', displayName: 'Front Right Brake Pad', category: 'Brakes', defaultLifetimeKm: 50000, averageCost: 350, requiresPosition: true },
  { type: 'brake_pad_rl', displayName: 'Rear Left Brake Pad', category: 'Brakes', defaultLifetimeKm: 50000, averageCost: 350, requiresPosition: true },
  { type: 'brake_pad_rr', displayName: 'Rear Right Brake Pad', category: 'Brakes', defaultLifetimeKm: 50000, averageCost: 350, requiresPosition: true },

  // Rotors
  { type: 'rotor_fl', displayName: 'Front Left Rotor', category: 'Brakes', defaultLifetimeKm: 70000, averageCost: 500, requiresPosition: true },
  { type: 'rotor_fr', displayName: 'Front Right Rotor', category: 'Brakes', defaultLifetimeKm: 70000, averageCost: 500, requiresPosition: true },
  { type: 'rotor_rl', displayName: 'Rear Left Rotor', category: 'Brakes', defaultLifetimeKm: 70000, averageCost: 500, requiresPosition: true },
  { type: 'rotor_rr', displayName: 'Rear Right Rotor', category: 'Brakes', defaultLifetimeKm: 70000, averageCost: 500, requiresPosition: true },

  // Engine Components
  { type: 'engine', displayName: 'Engine', category: 'Engine', defaultLifetimeKm: 500000, averageCost: 25000, requiresPosition: false },
  { type: 'transmission', displayName: 'Transmission', category: 'Engine', defaultLifetimeKm: 300000, averageCost: 8000, requiresPosition: false },
  { type: 'alternator', displayName: 'Alternator', category: 'Engine', defaultLifetimeKm: 150000, averageCost: 800, requiresPosition: false },

  // Other Components
  { type: 'suspension', displayName: 'Suspension System', category: 'Other', defaultLifetimeKm: 100000, averageCost: 2500, requiresPosition: false },
  { type: 'battery', displayName: 'Battery', category: 'Other', defaultLifetimeKm: 60000, averageCost: 400, requiresPosition: false },
  { type: 'air_conditioning', displayName: 'Air Conditioning', category: 'Other', defaultLifetimeKm: 120000, averageCost: 1500, requiresPosition: false },
];

export const GARAGES: Garage[] = [
  {
    id: 'garage-north',
    name: 'North Garage',
    location: 'North',
    capacity: 200,
    address: '123 North Ave, Transitland City, TC 10001',
    coordinates: { lat: 40.7580, lng: -73.9855 }
  },
  {
    id: 'garage-south',
    name: 'South Garage',
    location: 'South',
    capacity: 150,
    address: '456 South Blvd, Transitland City, TC 10002',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  }
];
