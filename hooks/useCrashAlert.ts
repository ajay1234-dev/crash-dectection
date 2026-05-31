import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listenToCrashEvent,
  CrashEvent,
  resetCrashState,
} from './useFirebase';

export function useCrashAlert() {
  const router = useRouter();
  const alreadyNavigated = useRef(false);

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

  useEffect(() => {
    const unsubscribe = listenToCrashEvent(async (event: CrashEvent | null) => {
      if (event && event.active && !alreadyNavigated.current) {
        // Check if user disabled notifications in settings
        const storedNotif = await AsyncStorage.getItem('@crashguard_notif_enabled');
        const notifEnabled = storedNotif !== null ? JSON.parse(storedNotif) : true;

        if (!notifEnabled) {
          console.log('[CrashAlert] Alert ignored because notifications are disabled in settings.');
          return;
        }

        alreadyNavigated.current = true;
        triggerCrashNotification(event.gforce);
        router.push('/alert');
      }

      if (event && !event.active) {
        alreadyNavigated.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, triggerCrashNotification]);

  const manualReset = useCallback(async () => {
    alreadyNavigated.current = false;
    await resetCrashState();
  }, []);

  return { manualReset };
}
