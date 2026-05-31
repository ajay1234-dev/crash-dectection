import { DeviceStatus, DeviceGPS, DeviceConfig, CrashEvent, HistoryEvent } from '@/hooks/useFirebase';

export const MOCK_STATUS: DeviceStatus = {
  online: true,
  lastSeen: Date.now() - 5000,
  gpsFix: true,
  gsmSignal: 3,
  gforce: 0.98,
  battery: 72,
};

export const MOCK_GPS: DeviceGPS = {
  lat: 20.5937,
  lon: 78.9629,
  updatedAt: Date.now() - 3000,
};

export const MOCK_CONFIG: DeviceConfig = {
  threshold: 2.5,
  countdown: 30,
};

export const MOCK_CRASH_EVENT: CrashEvent = {
  active: true,
  gforce: 4.2,
  lat: 20.5937,
  lon: 78.9629,
  triggeredAt: Date.now(),
};

export const MOCK_HISTORY: HistoryEvent[] = [
  {
    id: 'evt001',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    gforce: 4.2,
    lat: 20.5937,
    lon: 78.9629,
    outcome: 'sos_sent',
  },
  {
    id: 'evt002',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    gforce: 3.1,
    lat: 20.6011,
    lon: 78.9654,
    outcome: 'cancelled',
  },
  {
    id: 'evt003',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    gforce: 1.8,
    lat: 20.5885,
    lon: 78.9701,
    outcome: 'normal',
  },
];
