/**
 * Script to generate buses CSV file
 * Run with: npx ts-node scripts/generate-buses-csv.ts
 */

import { generateFleetData } from '../lib/data-generator';
import * as fs from 'fs';
import * as path from 'path';

const { buses } = generateFleetData();

// Create CSV header
const csvHeader = [
  'id',
  'vehicleNumber',
  'type',
  'capacity',
  'status',
  'estimatedActiveDate',
  'garageId',
  'currentMileage',
  'registrationDate',
  'lastMaintenanceDate',
  'latitude',
  'longitude'
].join(',');

// Convert buses to CSV rows
const csvRows = buses.map(bus => [
  bus.id,
  bus.vehicleNumber,
  bus.type,
  bus.capacity,
  bus.status,
  bus.estimatedActiveDate || '',
  bus.garageId,
  bus.currentMileage,
  bus.registrationDate,
  bus.lastMaintenanceDate,
  bus.coordinates?.lat || '',
  bus.coordinates?.lng || ''
].join(','));

const csvContent = [csvHeader, ...csvRows].join('\n');

// Write to public/data directory
const dataDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'buses.csv'), csvContent);

console.log(`✅ Generated ${buses.length} buses to public/data/buses.csv`);

// Also create a JSON version for components data
const busesWithComponents = buses.map(bus => ({
  id: bus.id,
  vehicleNumber: bus.vehicleNumber,
  type: bus.type,
  capacity: bus.capacity,
  status: bus.status,
  estimatedActiveDate: bus.estimatedActiveDate,
  garageId: bus.garageId,
  currentMileage: bus.currentMileage,
  registrationDate: bus.registrationDate,
  lastMaintenanceDate: bus.lastMaintenanceDate,
  coordinates: bus.coordinates,
  components: bus.components
}));

fs.writeFileSync(
  path.join(dataDir, 'buses.json'),
  JSON.stringify(busesWithComponents, null, 2)
);

console.log(`✅ Generated buses.json with full component data`);
