import { Camera, Alert, AuditLog, PersonRecord, VehicleRecord, CommunityPartner } from './types';

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'cam-1',
    name: 'Laptop Dashcam',
    code: 'CAM-LAPTOP-DASHCAM',
    status: 'online',
    location: 'Operator Workstation Desk',
    coordinates: '12.9724° N, 77.5937° E',
    streamType: 'standard',
    overlay: 'ai-detection',
    peopleCount: 1,
    vehicleCount: 0,
    fps: 30,
    resolution: '1080p Full HD',
    ipAddress: '192.168.1.100',
    communityEnrolled: false
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    category: 'Weapon',
    title: 'Suspicious Weapon Brandished',
    description: 'AI object classifier detected a rifle-like object being carried in open sight near the East Terminal Plaza.',
    location: 'Operator Workstation Desk',
    cameraName: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:38:00Z',
    severity: 'critical',
    status: 'active',
    confidence: 96.8,
    suspectImage: 'Subject carrying rifle-case accessory'
  },
  {
    id: 'alert-2',
    category: 'Intrusion',
    title: 'Restricted Tunnel Intrusion',
    description: 'Human warmth signature detected climbing restricted side fence zone into vehicular transit channel.',
    location: 'Operator Workstation Desk',
    cameraName: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:40:15Z',
    severity: 'high',
    status: 'dispatched',
    confidence: 91.2
  },
  {
    id: 'alert-3',
    category: 'Crowd',
    title: 'High Density Crowd Gathering',
    description: 'Abrupt escalation of pedestrian density. Crowding score exceeded critical threshold of 65 people in circular zone.',
    location: 'Operator Workstation Desk',
    cameraName: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:41:48Z',
    severity: 'medium',
    status: 'acknowledged',
    confidence: 89.4
  },
  {
    id: 'alert-4',
    category: 'Loitering',
    title: 'Extended Alleyway Loitering',
    description: 'Suspected group loitering observed behind school premises for over 25 minutes without movement pattern.',
    location: 'Operator Workstation Desk',
    cameraName: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:22:00Z',
    severity: 'low',
    status: 'resolved',
    confidence: 84.1
  },
  {
    id: 'alert-5',
    category: 'Safety',
    title: 'Erratic Driving Incident',
    description: 'Vehicle KA01AB1234 observed executing sharp swerves crossing dual lane markings twice consecutively.',
    location: 'Operator Workstation Desk',
    cameraName: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:42:30Z',
    severity: 'high',
    status: 'active',
    confidence: 95.3,
    licensePlate: 'KA01AB1234'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    officerName: 'Sgt. Marcus Vance',
    rank: 'Chief SOC Supervisor',
    reason: 'Routine perimeter inspection & patrol validation',
    cameraAccessed: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:35:10Z',
    actionType: 'Live Feed Access',
    ipAddress: '10.240.41.98'
  },
  {
    id: 'log-2',
    officerName: 'Officer Sarah Chen',
    rank: 'Incident Responder',
    reason: 'Investigating high density transit anomalies',
    cameraAccessed: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:40:02Z',
    actionType: 'PTZ Zoom Triggered',
    ipAddress: '10.240.41.101'
  },
  {
    id: 'log-3',
    officerName: 'Sgt. Marcus Vance',
    rank: 'Chief SOC Supervisor',
    reason: 'Dispatch action logged for intruder climbing restricted bypass',
    cameraAccessed: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:41:12Z',
    actionType: 'Police Dispatch Notification',
    ipAddress: '10.240.41.98'
  },
  {
    id: 'log-4',
    officerName: 'Officer Chen',
    rank: 'Incident Responder',
    reason: 'Archived review of historical loitering incident',
    cameraAccessed: 'Laptop Dashcam',
    timestamp: '2026-06-10T14:42:00Z',
    actionType: 'Footage Export Authorized',
    ipAddress: '10.240.41.101'
  }
];

export const MOCK_PERSONS: PersonRecord[] = [
  {
    id: 'sub-1',
    name: 'Subject Delta-4',
    description: 'Male, wearing black tactical jacket, blue denim, carrying heavy silver suitcase. High incident priority.',
    confidence: 94.7,
    lastSeenCamera: 'Laptop Dashcam',
    lastSeenTime: '2026-06-10T14:38:00Z',
    status: 'Wanted',
    trackHistory: [
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:38:00Z', confidence: 94.7 },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:25:10Z', confidence: 88.2 },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:10:45Z', confidence: 79.1 }
    ]
  },
  {
    id: 'sub-2',
    name: 'Subject Echo-9 / Missing Kid',
    description: 'Young girl, approx 8 years old, yellow sunhat, pink jumper. Reported lost at Central Mall playground.',
    confidence: 91.5,
    lastSeenCamera: 'Laptop Dashcam',
    lastSeenTime: '2026-06-10T14:41:00Z',
    status: 'Missing',
    trackHistory: [
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:41:00Z', confidence: 91.5 },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:30:15Z', confidence: 86.4 }
    ]
  },
  {
    id: 'sub-3',
    name: 'Unidentified Vendor X',
    description: 'Male, orange safety vest, grey trousers, pushing unauthorized trade-cart structure without safety license.',
    confidence: 84.2,
    lastSeenCamera: 'Laptop Dashcam',
    lastSeenTime: '2026-06-10T14:15:00Z',
    status: 'Suspicious',
    trackHistory: [
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:15:00Z', confidence: 84.2 },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T13:50:00Z', confidence: 78.9 }
    ]
  }
];

export const MOCK_VEHICLES: VehicleRecord[] = [
  {
    plateNumber: 'KA01AB1234',
    owner: 'Unknown (Stolen Vehicle Match)',
    vehicleType: 'Sedan',
    makeModel: 'Hyundai Elantra',
    color: 'Metallic Silver',
    status: 'Flagged',
    reportedReason: 'Reported stolen from Sector 2 Parking lot. Driver flagged for erratic lane switches.',
    sequence: [
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:42:30Z', speed: 82, snapshotType: 'Front' },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:35:12Z', speed: 70, snapshotType: 'Rear' },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:20:00Z', speed: 45, snapshotType: 'Front' }
    ]
  },
  {
    plateNumber: 'KA03XY9988',
    owner: 'H. S. Sharma',
    vehicleType: 'SUV',
    makeModel: 'Mahindra XUV700',
    color: 'Midnight Blue',
    status: 'Monitored',
    reportedReason: 'Neighborhood safety perimeter check. Authorized resident.',
    sequence: [
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:41:05Z', speed: 20, snapshotType: 'Front' },
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:15:30Z', speed: 25, snapshotType: 'Front' }
    ]
  },
  {
    plateNumber: 'KA05ZZ5544',
    owner: 'Delivery Transit Ltd (Fleet)',
    vehicleType: 'Sedan',
    makeModel: 'Maruti Suzuki Dzire',
    color: 'Polar White',
    status: 'Clear',
    sequence: [
      { camera: 'Laptop Dashcam', timestamp: '2026-06-10T14:40:00Z', speed: 52, snapshotType: 'Rear' }
    ]
  }
];

export const MOCK_COMMUNITY_PARTNERS: CommunityPartner[] = [
  {
    id: 'partner-1',
    name: 'Oakwood Homeowners Association',
    type: 'Residential',
    camerasCount: 4,
    enrolledSince: '2025-01-15',
    contactPerson: 'David Miller',
    activeFeed: true
  },
  {
    id: 'partner-2',
    name: 'Sector 4 High Street Retail Guild',
    type: 'Retail',
    camerasCount: 8,
    enrolledSince: '2025-04-20',
    contactPerson: 'Ananya Rao',
    activeFeed: true
  },
  {
    id: 'partner-3',
    name: 'Metropolitan Transit Safety Authority',
    type: 'Public Space',
    camerasCount: 12,
    enrolledSince: '2024-09-10',
    contactPerson: 'Lt. Gary Hobson',
    activeFeed: true
  },
  {
    id: 'partner-4',
    name: 'Hills Park Corporate Campus',
    type: 'Commercial',
    camerasCount: 6,
    enrolledSince: '2025-11-01',
    contactPerson: 'Sophia Chang',
    activeFeed: false
  }
];
