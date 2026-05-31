import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listenToCrashEvent,
  CrashEvent,
  resetCrashState,
} from './useFirebase';

export function useCrashAlert() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const alreadyNavigated = useRef(false);
  const pendingAlert = useRef(false);
  const latestGforce = useRef(0);

  const triggerCrashNotification = useCallback(async (gforce: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 CRASH DETECTED – CrashGuard',
        body: `Impact detected: ${gforce.toFixed(1)}g. Open app to cancel SOS.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#E24B4A',
        vibrate: [0, 500, 200, 500],
      },
      trigger: null, // Immediate
    });
  }, []);

  // Handle pending navigation when layout is ready
  useEffect(() => {
    if (pendingAlert.current && rootNavigationState?.key) {
      pendingAlert.current = false;
      alreadyNavigated.current = true;
      triggerCrashNotification(latestGforce.current);
      router.push('/alert');
    }
  }, [rootNavigationState?.key, triggerCrashNotification]);

  useEffect(() => {
    const unsubscribe = listenToCrashEvent(async (event: CrashEvent | null) => {
      if (event && event.active && !alreadyNavigated.current && !pendingAlert.current) {
        // Check if user disabled notifications in settings
        const storedNotif = await AsyncStorage.getItem('@crashguard_notif_enabled');
        const notifEnabled = storedNotif !== null ? JSON.parse(storedNotif) : true;

        if (!notifEnabled) {
          console.log('[CrashAlert] Alert ignored because notifications are disabled in settings.');
          return;
        }

        latestGforce.current = event.gforce;

        if (rootNavigationState?.key) {
          alreadyNavigated.current = true;
          triggerCrashNotification(event.gforce);
          router.push('/alert');
        } else {
          pendingAlert.current = true;
        }
      }

      if (event && !event.active) {
        alreadyNavigated.current = false;
        pendingAlert.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, triggerCrashNotification, rootNavigationState?.key]);

  const manualReset = useCallback(async () => {
    alreadyNavigated.current = false;
    pendingAlert.current = false;
    await resetCrashState();
  }, []);

  return { manualReset };
}
