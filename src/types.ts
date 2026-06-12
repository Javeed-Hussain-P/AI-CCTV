export interface Camera {
  id: string;
  name: string;
  code: string; // e.g., "CAM-NE-102"
  status: 'online' | 'offline' | 'warning';
  location: string;
  coordinates: string; // e.g., "12.9716° N, 77.5946° E"
  streamType: 'standard' | 'night-vision' | 'thermal';
  overlay: 'ai-detection' | 'heatmap' | 'none';
  peopleCount: number;
  vehicleCount: number;
  fps: number;
  resolution: string;
  ipAddress: string;
  communityEnrolled: boolean; // Part of Community Safety Network
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 'Crowd' | 'Loitering' | 'Intrusion' | 'Weapon' | 'Safety';
export type AlertStatus = 'active' | 'acknowledged' | 'dispatched' | 'resolved';

export interface Alert {
  id: string;
  category: AlertCategory;
  title: string;
  description: string;
  location: string;
  cameraName: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  confidence: number; // e.g., 94.5
  licensePlate?: string;
  suspectImage?: string;
}

export interface AuditLog {
  id: string;
  officerName: string;
  rank: string;
  reason: string;
  cameraAccessed: string;
  timestamp: string;
  actionType: string; // e.g., "Live Feed Access", "PTZ Control Granted", "Footage Export"
  ipAddress: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  type?: 'text' | 'camera-grid' | 'alert-status' | 'vehicle-timeline';
  payload?: any;
}

export interface PersonRecord {
  id: string;
  name: string;
  description: string;
  confidence: number;
  lastSeenCamera: string;
  lastSeenTime: string;
  status: 'Wanted' | 'Missing' | 'Visitor' | 'Suspicious';
  trackHistory: {
    camera: string;
    timestamp: string;
    confidence: number;
  }[];
}

export interface VehicleRecord {
  plateNumber: string;
  owner: string;
  vehicleType: string; // e.g., "Sedan", "SUV", "Motorbike"
  makeModel: string;
  color: string;
  status: 'Flagged' | 'Monitored' | 'Clear';
  reportedReason?: string;
  sequence: {
    camera: string;
    timestamp: string;
    speed: number; // km/h
    snapshotType: 'Front' | 'Rear';
  }[];
}

export interface CommunityPartner {
  id: string;
  name: string;
  type: 'Residential' | 'Commercial' | 'Retail' | 'Public Space';
  camerasCount: number;
  enrolledSince: string;
  contactPerson: string;
  activeFeed: boolean;
}
