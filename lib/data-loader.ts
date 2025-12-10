import { Bus, WorkOrder, MaintenanceHistory, Component, ComponentStatus, BusType, BusStatus } from '@/types';
import { COMPONENT_MASTERS } from './constants';

// Static bus data - Source of truth from buses.csv
const BUSES_DATA: Array<{
  id: string;
  vehicleNumber: string;
  type: BusType;
  capacity: number;
  status: BusStatus;
  estimatedActiveDate: string;
  garageId: string;
  currentMileage: number;
  registrationDate: string;
  lastMaintenanceDate: string;
  coordinates: { lat: number; lng: number };
}> = [
  {"id":"bus-001","vehicleNumber":"TL-N-001","type":"Mini","capacity":25,"status":"decommissioned","estimatedActiveDate":"2026-03-05T01:26:36.642Z","garageId":"garage-north","currentMileage":259026,"registrationDate":"2020-11-15T02:19:23.680Z","lastMaintenanceDate":"2025-12-01T08:37:33.898Z","coordinates":{"lat":40.72206579177863,"lng":-73.9404294029542}},
  {"id":"bus-002","vehicleNumber":"TL-N-002","type":"Mini","capacity":25,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":206913,"registrationDate":"2016-08-09T18:39:19.380Z","lastMaintenanceDate":"2025-12-04T15:34:46.373Z","coordinates":{"lat":40.75126117103824,"lng":-73.9163400937344}},
  {"id":"bus-003","vehicleNumber":"TL-N-003","type":"Double-Decker","capacity":80,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":203656,"registrationDate":"2021-02-19T17:25:16.095Z","lastMaintenanceDate":"2025-10-15T08:04:52.602Z","coordinates":{"lat":40.749852660926344,"lng":-73.98554690837838}},
  {"id":"bus-004","vehicleNumber":"TL-N-004","type":"Double-Decker","capacity":80,"status":"maintenance","estimatedActiveDate":"2026-01-07T01:26:36.642Z","garageId":"garage-north","currentMileage":148127,"registrationDate":"2019-02-14T09:25:15.951Z","lastMaintenanceDate":"2025-10-07T02:00:22.104Z","coordinates":{"lat":40.76058173908186,"lng":-73.93187967920228}},
  {"id":"bus-005","vehicleNumber":"TL-N-005","type":"Articulated","capacity":60,"status":"maintenance","estimatedActiveDate":"2025-12-21T01:26:36.642Z","garageId":"garage-north","currentMileage":125149,"registrationDate":"2015-09-10T10:35:28.613Z","lastMaintenanceDate":"2025-11-22T03:11:24.467Z","coordinates":{"lat":40.70572534810654,"lng":-73.91198422381278}},
  {"id":"bus-006","vehicleNumber":"TL-N-006","type":"Double-Decker","capacity":80,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":64334,"registrationDate":"2017-07-18T13:24:16.905Z","lastMaintenanceDate":"2025-11-29T01:45:09.988Z","coordinates":{"lat":40.74166413592222,"lng":-73.97142822755578}},
  {"id":"bus-007","vehicleNumber":"TL-N-007","type":"Mini","capacity":25,"status":"maintenance","estimatedActiveDate":"2025-12-21T01:26:36.642Z","garageId":"garage-north","currentMileage":132659,"registrationDate":"2016-01-18T20:59:34.035Z","lastMaintenanceDate":"2025-11-08T15:10:16.273Z","coordinates":{"lat":40.77946309737162,"lng":-73.98156588142352}},
  {"id":"bus-008","vehicleNumber":"TL-N-008","type":"Articulated","capacity":60,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":177210,"registrationDate":"2015-01-21T11:29:26.544Z","lastMaintenanceDate":"2025-11-09T02:57:31.489Z","coordinates":{"lat":40.72543577165717,"lng":-73.92724579553155}},
  {"id":"bus-009","vehicleNumber":"TL-N-009","type":"Standard","capacity":40,"status":"decommissioned","estimatedActiveDate":"2026-01-14T01:26:36.642Z","garageId":"garage-north","currentMileage":52213,"registrationDate":"2021-02-19T07:22:10.591Z","lastMaintenanceDate":"2025-09-27T19:49:57.069Z","coordinates":{"lat":40.726079051079125,"lng":-73.96083900813369}},
  {"id":"bus-010","vehicleNumber":"TL-N-010","type":"Mini","capacity":25,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":124866,"registrationDate":"2019-11-28T15:35:14.832Z","lastMaintenanceDate":"2025-11-30T08:56:48.371Z","coordinates":{"lat":40.769100288792394,"lng":-73.91226815319264}},
  {"id":"bus-011","vehicleNumber":"TL-N-011","type":"Mini","capacity":25,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":244863,"registrationDate":"2018-01-10T18:30:06.902Z","lastMaintenanceDate":"2025-10-07T21:24:58.361Z","coordinates":{"lat":40.76162005417054,"lng":-73.99149419819847}},
  {"id":"bus-012","vehicleNumber":"TL-N-012","type":"Mini","capacity":25,"status":"maintenance","estimatedActiveDate":"2025-12-19T01:26:36.642Z","garageId":"garage-north","currentMileage":218167,"registrationDate":"2019-09-29T20:41:14.609Z","lastMaintenanceDate":"2025-10-18T05:23:07.986Z","coordinates":{"lat":40.75969642893211,"lng":-73.95945020617391}},
  {"id":"bus-013","vehicleNumber":"TL-N-013","type":"Mini","capacity":25,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":174988,"registrationDate":"2016-06-05T22:49:10.013Z","lastMaintenanceDate":"2025-12-01T16:07:58.996Z","coordinates":{"lat":40.76130937370226,"lng":-73.98300055453662}},
  {"id":"bus-014","vehicleNumber":"TL-N-014","type":"Standard","capacity":40,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":55202,"registrationDate":"2021-02-24T22:27:42.407Z","lastMaintenanceDate":"2025-11-26T22:06:20.243Z","coordinates":{"lat":40.735455700552414,"lng":-73.96425584255653}},
  {"id":"bus-015","vehicleNumber":"TL-N-015","type":"Double-Decker","capacity":80,"status":"maintenance","estimatedActiveDate":"2026-01-05T01:26:36.642Z","garageId":"garage-north","currentMileage":181464,"registrationDate":"2015-05-17T06:55:45.909Z","lastMaintenanceDate":"2025-11-03T05:53:40.322Z","coordinates":{"lat":40.69969152970484,"lng":-73.93915273668247}},
  {"id":"bus-016","vehicleNumber":"TL-N-016","type":"Double-Decker","capacity":80,"status":"active","estimatedActiveDate":"","garageId":"garage-north","currentMileage":50027,"registrationDate":"2019-02-17T16:22:35.765Z","lastMaintenanceDate":"2025-10-10T20:54:24.469Z","coordinates":{"lat":40.768108646729445,"lng":-73.91541527010465}},
  {"id":"bus-017","vehicleNumber":"TL-N-017","type":"Standard","capacity":40,"status":"decommissioned","estimatedActiveDate":"2026-01-13T01:26:36.642Z","garageId":"garage-north","currentMileage":248657,"registrationDate":"2021-07-18T22:00:29.284Z","lastMaintenanceDate":"2025-10-29T00:26:22.662Z","coordinates":{"lat":40.718366925350466,"lng":-73.90653553978086}},
  {"id":"bus-018","vehicleNumber":"TL-S-018","type":"Double-Decker","capacity":80,"status":"maintenance","estimatedActiveDate":"2025-12-22T01:26:36.642Z","garageId":"garage-south","currentMileage":257523,"registrationDate":"2016-11-06T15:01:28.145Z","lastMaintenanceDate":"2025-09-27T05:34:31.443Z","coordinates":{"lat":40.68215534038438,"lng":-73.9498506548818}},
  {"id":"bus-019","vehicleNumber":"TL-S-019","type":"Articulated","capacity":60,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":108683,"registrationDate":"2016-09-07T23:53:22.678Z","lastMaintenanceDate":"2025-11-28T16:37:42.838Z","coordinates":{"lat":40.6592871183399,"lng":-73.98573317392643}},
  {"id":"bus-020","vehicleNumber":"TL-S-020","type":"Standard","capacity":40,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":76461,"registrationDate":"2019-11-06T13:22:21.005Z","lastMaintenanceDate":"2025-10-21T12:48:41.250Z","coordinates":{"lat":40.721295541187125,"lng":-73.98358221487773}},
  {"id":"bus-021","vehicleNumber":"TL-S-021","type":"Double-Decker","capacity":80,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":180629,"registrationDate":"2020-11-09T17:57:12.295Z","lastMaintenanceDate":"2025-10-20T00:52:21.403Z","coordinates":{"lat":40.67334408157499,"lng":-73.95984170623699}},
  {"id":"bus-022","vehicleNumber":"TL-S-022","type":"Articulated","capacity":60,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":201382,"registrationDate":"2022-05-05T06:12:54.215Z","lastMaintenanceDate":"2025-09-19T00:42:58.657Z","coordinates":{"lat":40.67587654133588,"lng":-73.95954125674427}},
  {"id":"bus-023","vehicleNumber":"TL-S-023","type":"Articulated","capacity":60,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":160995,"registrationDate":"2019-06-10T06:05:27.590Z","lastMaintenanceDate":"2025-11-04T19:11:25.914Z","coordinates":{"lat":40.70380743716128,"lng":-73.93172050823978}},
  {"id":"bus-024","vehicleNumber":"TL-S-024","type":"Mini","capacity":25,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":275164,"registrationDate":"2021-11-21T17:02:33.146Z","lastMaintenanceDate":"2025-11-15T23:29:01.126Z","coordinates":{"lat":40.67920330575445,"lng":-73.9057825075424}},
  {"id":"bus-025","vehicleNumber":"TL-S-025","type":"Mini","capacity":25,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":116789,"registrationDate":"2017-08-16T16:17:14.035Z","lastMaintenanceDate":"2025-10-10T15:37:12.307Z","coordinates":{"lat":40.69868110840154,"lng":-73.93497010621529}},
  {"id":"bus-026","vehicleNumber":"TL-S-026","type":"Double-Decker","capacity":80,"status":"maintenance","estimatedActiveDate":"2025-12-26T01:26:36.642Z","garageId":"garage-south","currentMileage":93909,"registrationDate":"2019-12-20T01:23:28.542Z","lastMaintenanceDate":"2025-11-03T03:42:27.594Z","coordinates":{"lat":40.67708262152771,"lng":-73.94645337130781}},
  {"id":"bus-027","vehicleNumber":"TL-S-027","type":"Standard","capacity":40,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":230415,"registrationDate":"2022-11-16T11:47:02.113Z","lastMaintenanceDate":"2025-10-21T20:45:01.856Z","coordinates":{"lat":40.69394048327184,"lng":-73.94281777876921}},
  {"id":"bus-028","vehicleNumber":"TL-S-028","type":"Double-Decker","capacity":80,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":232926,"registrationDate":"2021-06-04T12:24:01.803Z","lastMaintenanceDate":"2025-09-12T21:24:42.068Z","coordinates":{"lat":40.70274084437773,"lng":-73.96333183709221}},
  {"id":"bus-029","vehicleNumber":"TL-S-029","type":"Standard","capacity":40,"status":"active","estimatedActiveDate":"","garageId":"garage-south","currentMileage":103423,"registrationDate":"2017-07-15T06:12:07.741Z","lastMaintenanceDate":"2025-09-20T23:48:31.232Z","coordinates":{"lat":40.69289927264877,"lng":-73.93509927367941}}
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractPosition(type: string): 'FL' | 'FR' | 'RL' | 'RR' | 'N/A' {
  if (type.includes('_fl')) return 'FL';
  if (type.includes('_fr')) return 'FR';
  if (type.includes('_rl')) return 'RL';
  if (type.includes('_rr')) return 'RR';
  return 'N/A';
}

function generateComponents(currentMileage: number): Component[] {
  const components: Component[] = [];

  COMPONENT_MASTERS.forEach(master => {
    // Randomly determine how much of the component's lifetime has been used
    const usagePercent = Math.random() * 1.5; // 0% to 150% (more overdue components)
    const mileageSinceInstalled = master.defaultLifetimeKm * usagePercent;
    const installedMileage = Math.max(0, currentMileage - mileageSinceInstalled);

    // Calculate status based on usage
    let status: ComponentStatus;
    if (usagePercent > 1.1) status = 'overdue';
    else if (usagePercent > 0.9) status = 'critical';
    else if (usagePercent > 0.7) status = 'warning';
    else status = 'good';

    // Calculate installation date based on mileage (assuming 50km/day average)
    const daysAgo = mileageSinceInstalled / 50;
    const installedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Calculate renewal date
    const daysUntilRenewal = (master.defaultLifetimeKm - mileageSinceInstalled) / 50;
    const renewalDate = new Date(Date.now() + daysUntilRenewal * 24 * 60 * 60 * 1000);

    components.push({
      id: `comp-${Math.random().toString(36).substr(2, 9)}`,
      type: master.type,
      position: master.requiresPosition ? extractPosition(master.type) : 'N/A',
      installedDate: installedDate.toISOString(),
      lifetimeKm: master.defaultLifetimeKm,
      renewalDate: renewalDate.toISOString(),
      estimatedCost: Math.round(master.averageCost * randomBetween(90, 110) / 100),
      currentMileage: installedMileage,
      status
    });
  });

  return components;
}

function getComponentDisplayName(type: string): string {
  const master = COMPONENT_MASTERS.find(m => m.type === type);
  return master?.displayName || type;
}

function generateSingleComponentWorkOrder(bus: Bus, component: Component): WorkOrder {
  const priority = component.status === 'overdue' ? 'critical' as const :
    component.status === 'critical' ? 'high' as const :
    'medium' as const;

  const displayName = getComponentDisplayName(component.type);

  return {
    id: `wo-${Math.random().toString(36).substr(2, 9)}`,
    busId: bus.id,
    garageId: bus.garageId,
    title: `${displayName} Maintenance - ${bus.vehicleNumber}`,
    description: `Scheduled maintenance for ${displayName}. Component has reached ${component.status} status and requires attention.`,
    components: [component.type],
    priority,
    status: 'pending',
    createdDate: new Date().toISOString(),
    estimatedCost: component.estimatedCost,
    notes: '',
    isAutoGenerated: true
  };
}

export function loadFleetData(): {
  buses: Bus[];
  workOrders: WorkOrder[];
  maintenanceHistory: MaintenanceHistory[];
} {
  const buses: Bus[] = [];
  const workOrders: WorkOrder[] = [];
  const maintenanceHistory: MaintenanceHistory[] = [];

  // Load buses from static data and add components
  BUSES_DATA.forEach((busData) => {
    const components = generateComponents(busData.currentMileage);

    const bus: Bus = {
      id: busData.id,
      vehicleNumber: busData.vehicleNumber,
      type: busData.type,
      capacity: busData.capacity,
      status: busData.status,
      estimatedActiveDate: busData.estimatedActiveDate || undefined,
      garageId: busData.garageId,
      currentMileage: busData.currentMileage,
      registrationDate: busData.registrationDate,
      lastMaintenanceDate: busData.lastMaintenanceDate,
      coordinates: busData.coordinates,
      components,
      additionalMaintenanceItems: []
    };

    buses.push(bus);

    // Generate 1 work order per component that needs maintenance (1:1 relationship)
    bus.components.forEach(component => {
      if (component.status === 'overdue' || component.status === 'critical') {
        workOrders.push(generateSingleComponentWorkOrder(bus, component));
      }
    });
  });

  console.log(`📊 Loaded ${buses.length} buses from static source (17 North, 12 South)`);
  console.log(`📋 Generated ${workOrders.length} work orders for maintenance`);

  return { buses, workOrders, maintenanceHistory };
}
