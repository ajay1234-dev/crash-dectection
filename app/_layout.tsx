import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert, StyleSheet, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useCrashAlert } from '@/hooks/useCrashAlert';

// Keep the native splash screen visible until our custom one is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Configure notification handler globally (works in Expo Go for local notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications() {
  // Must be a real device
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('crash-alerts', {
        name: 'Crash Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: Colors.primary,
        sound: 'default',
        enableVibrate: true,
      });
    } catch (e) {
      // Channel setup failed silently
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Enable notifications to receive crash alerts.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Remote push tokens are NOT supported in Expo Go (SDK 53+)
  // They require a development build. We skip silently here.
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.log('[Notifications] Running in Expo Go — remote push tokens skipped. Local notifications still work.');
    return;
  }

  // Only try to get push token in a proper dev/production build
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (projectId) {
      await Notifications.getExpoPushTokenAsync({ projectId });
    }
  } catch (e) {
    // Silently handle — app still works without push tokens
    console.log('[Notifications] Push token unavailable:', e);
  }
}

function RootLayoutInner() {
  useCrashAlert();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="alert"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Hide native splash screen
    SplashScreen.hideAsync().catch(() => {});

    // 3D Rotation Effect
    rotation.value = withRepeat(
      withTiming(360, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1
    );

    // Breathing Scale Effect
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 1250, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    // Display for 3 seconds then fade out
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 600 }, () => {
        runOnJS(onFinish)();
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 800 },
        { rotateY: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.splashContainer, containerStyle]}>
      <LinearGradient
        colors={Colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[styles.splashLogo, animatedLogoStyle]}
        resizeMode="contain"
      />
      <Text style={styles.splashTitle}>CRASH GUARD</Text>
      <Text style={styles.splashSubtitle}>Initializing Systems...</Text>
    </Animated.View>
  );
}

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <RootLayoutInner />
      {!appReady && (
        <CustomSplashScreen onFinish={() => setAppReady(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashLogo: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  splashTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 10,
    textShadowColor: 'rgba(255, 51, 102, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  splashSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
