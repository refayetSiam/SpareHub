/**
 * Script to generate buses CSV and JSON files
 * Run with: node scripts/generate-buses-csv.js
 */

const fs = require('fs');
const path = require('path');

// Import the data generator (we'll use the already modified version)
// Since we can't easily import TS from JS, we'll generate the data inline

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateBetween(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomCoordinates(garageId) {
  const garages = {
    'garage-north': { lat: 40.7350, lng: -73.9485 },
    'garage-south': { lat: 40.6782, lng: -73.9442 }
  };

  const garage = garages[garageId] || { lat: 40.7350, lng: -73.9485 };

  const latOffset = (Math.random() - 0.5) * 0.09;
  const lngOffset = (Math.random() - 0.5) * 0.09;

  return {
    lat: garage.lat + latOffset,
    lng: garage.lng + lngOffset
  };
}

// Generate 29 buses
const buses = [];

// North Garage: 17 buses
for (let i = 1; i <= 17; i++) {
  const busTypes = ['Standard', 'Articulated', 'Double-Decker', 'Mini'];
  const type = busTypes[Math.floor(Math.random() * busTypes.length)];

  const capacityMap = {
    'Standard': 40,
    'Articulated': 60,
    'Double-Decker': 80,
    'Mini': 25
  };

  const registrationDate = randomDateBetween(
    new Date('2015-01-01'),
    new Date('2023-01-01')
  );

  const currentMileage = randomBetween(50000, 300000);

  const bus = {
    id: `bus-${String(i).padStart(3, '0')}`,
    vehicleNumber: `TL-N-${String(i).padStart(3, '0')}`,
    type: type,
    capacity: capacityMap[type],
    status: 'active',
    estimatedActiveDate: '',
    garageId: 'garage-north',
    currentMileage: currentMileage,
    registrationDate: registrationDate.toISOString(),
    lastMaintenanceDate: randomDateBetween(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      new Date()
    ).toISOString(),
    coordinates: generateRandomCoordinates('garage-north')
  };

  buses.push(bus);
}

// South Garage: 12 buses
for (let i = 18; i <= 29; i++) {
  const busTypes = ['Standard', 'Articulated', 'Double-Decker', 'Mini'];
  const type = busTypes[Math.floor(Math.random() * busTypes.length)];

  const capacityMap = {
    'Standard': 40,
    'Articulated': 60,
    'Double-Decker': 80,
    'Mini': 25
  };

  const registrationDate = randomDateBetween(
    new Date('2015-01-01'),
    new Date('2023-01-01')
  );

  const currentMileage = randomBetween(50000, 300000);

  const bus = {
    id: `bus-${String(i).padStart(3, '0')}`,
    vehicleNumber: `TL-S-${String(i).padStart(3, '0')}`,
    type: type,
    capacity: capacityMap[type],
    status: 'active',
    estimatedActiveDate: '',
    garageId: 'garage-south',
    currentMileage: currentMileage,
    registrationDate: registrationDate.toISOString(),
    lastMaintenanceDate: randomDateBetween(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      new Date()
    ).toISOString(),
    coordinates: generateRandomCoordinates('garage-south')
  };

  buses.push(bus);
}

// Set some buses to maintenance status
const maintenanceCount = randomBetween(5, 7);
const busesToMaintain = [...buses]
  .sort(() => Math.random() - 0.5)
  .slice(0, maintenanceCount);

busesToMaintain.forEach(bus => {
  bus.status = 'maintenance';
  const daysUntilActive = randomBetween(7, 30);
  bus.estimatedActiveDate = new Date(Date.now() + daysUntilActive * 24 * 60 * 60 * 1000).toISOString();
});

// Set some buses to decommissioned
const decommissionedCount = randomBetween(2, 3);
const busesToDecommission = buses
  .filter(b => b.status === 'active')
  .sort(() => Math.random() - 0.5)
  .slice(0, decommissionedCount);

busesToDecommission.forEach(bus => {
  bus.status = 'decommissioned';
  const daysUntilActive = randomBetween(30, 90);
  bus.estimatedActiveDate = new Date(Date.now() + daysUntilActive * 24 * 60 * 60 * 1000).toISOString();
});

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

// Also create a simple JSON version
const busesSimple = buses.map(bus => ({
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
  coordinates: bus.coordinates
}));

fs.writeFileSync(
  path.join(dataDir, 'buses.json'),
  JSON.stringify(busesSimple, null, 2)
);

console.log(`✅ Generated buses.json with ${buses.length} buses`);
console.log(`\nBreakdown:`);
console.log(`- North Garage: ${buses.filter(b => b.garageId === 'garage-north').length} buses`);
console.log(`- South Garage: ${buses.filter(b => b.garageId === 'garage-south').length} buses`);
console.log(`- Active: ${buses.filter(b => b.status === 'active').length}`);
console.log(`- Maintenance: ${buses.filter(b => b.status === 'maintenance').length}`);
console.log(`- Decommissioned: ${buses.filter(b => b.status === 'decommissioned').length}`);
