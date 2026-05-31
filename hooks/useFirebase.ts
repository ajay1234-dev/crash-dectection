import { database } from '@/constants/firebaseConfig';
import {
  ref,
  onValue,
  query,
  limitToLast,
  set,
  push,
  get,
  off,
  DataSnapshot,
} from 'firebase/database';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeviceStatus {
  online: boolean;
  lastSeen: number;
  gpsFix: boolean;
  gsmSignal: number;
  gforce: number;
  battery: number;
}

export interface DeviceGPS {
  lat: number;
  lon: number;
  updatedAt: number;
}

export interface DeviceConfig {
  threshold: number;
  countdown: number;
}

export interface CrashEvent {
  active: boolean;
  gforce: number;
  lat: number;
  lon: number;
  triggeredAt: number;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  gforce: number;
  lat: number;
  lon: number;
  outcome: 'sos_sent' | 'cancelled' | 'normal';
}

export interface DeviceData {
  status: DeviceStatus;
  gps: DeviceGPS;
  config: DeviceConfig;
  contacts: string[];
  crashEvent: CrashEvent;
  cancelAlert: boolean;
}

// ─── Listeners ────────────────────────────────────────────────────────────────

export function listenToPath<T>(
  path: string,
  callback: (data: T | null) => void
): () => void {
  const dbRef = ref(database, path);
  const listener = onValue(
    dbRef,
    (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn(`[Firebase] Error reading ${path}:`, error);
      callback(null);
    }
  );
  return () => off(dbRef, 'value', listener);
}

export function listenToDeviceStatus(
  callback: (status: DeviceStatus | null) => void
): () => void {
  return listenToPath<DeviceStatus>('/device/status', callback);
}

export function listenToGPS(
  callback: (gps: DeviceGPS | null) => void
): () => void {
  return listenToPath<DeviceGPS>('/device/gps', callback);
}

export function listenToCrashEvent(
  callback: (event: CrashEvent | null) => void
): () => void {
  return listenToPath<CrashEvent>('/device/crashEvent', callback);
}

export function listenToCancelAlert(
  callback: (cancelled: boolean) => void
): () => void {
  return listenToPath<boolean>('/device/cancelAlert', (val) =>
    callback(val ?? false)
  );
}

export function listenToHistory(
  callback: (events: HistoryEvent[]) => void
): () => void {
  const dbRef = ref(database, '/events');
  // Only fetch last 50 events for fast loading
  const recentQuery = query(dbRef, limitToLast(50));
  const listener = onValue(
    recentQuery,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const raw = snapshot.val();
      const events: HistoryEvent[] = Object.entries(raw).map(
        ([id, val]: [string, any]) => ({ id, ...val })
      );
      // Sort newest first
      events.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      callback(events);
    },
    (error) => {
      console.warn('[Firebase] Error reading /events:', error);
      callback([]);
    }
  );
  return () => off(recentQuery, 'value', listener);
}

export function listenToContacts(
  callback: (contacts: string[]) => void
): () => void {
  return listenToPath<string[]>('/device/contacts', (val) =>
    callback(val ?? [])
  );
}

export function listenToConfig(
  callback: (config: DeviceConfig | null) => void
): () => void {
  return listenToPath<DeviceConfig>('/device/config', callback);
}

// ─── Writers ─────────────────────────────────────────────────────────────────

export async function setCancelAlert(value: boolean): Promise<void> {
  const dbRef = ref(database, '/device/cancelAlert');
  await set(dbRef, value);
}

export async function setThreshold(value: number): Promise<void> {
  const dbRef = ref(database, '/device/config/threshold');
  await set(dbRef, value);
}

export async function setCountdown(value: number): Promise<void> {
  const dbRef = ref(database, '/device/config/countdown');
  await set(dbRef, value);
}

export async function setContacts(contacts: string[]): Promise<void> {
  const dbRef = ref(database, '/device/contacts');
  await set(dbRef, contacts);
}

export async function pushHistoryEvent(
  event: Omit<HistoryEvent, 'id'>
): Promise<void> {
  const dbRef = ref(database, '/events');
  await push(dbRef, event);
}

export async function setCrashEventActive(active: boolean): Promise<void> {
  const dbRef = ref(database, '/device/crashEvent/active');
  await set(dbRef, active);
}

export async function setMockCrashEvent(
  gforce: number,
  lat: number,
  lon: number
): Promise<void> {
  const dbRef = ref(database, '/device/crashEvent');
  await set(dbRef, {
    active: true,
    gforce,
    lat,
    lon,
    triggeredAt: Date.now(),
  });
}

export async function resetCrashState(): Promise<void> {
  await Promise.all([
    set(ref(database, '/device/crashEvent/active'), false),
    set(ref(database, '/device/cancelAlert'), false),
  ]);
}

// ─── Ping ─────────────────────────────────────────────────────────────────────

export async function pingFirebase(): Promise<number> {
  const start = Date.now();
  const dbRef = ref(database, '/device/status/online');
  await get(dbRef);
  return Date.now() - start;
}
