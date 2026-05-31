import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  focused: boolean;
  size: number;
}

function TabIcon({ name, focused, size }: TabIconProps) {
  return (
    <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
      <Ionicons
        name={name}
        size={size}
        color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Live Map',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name={focused ? 'map' : 'map-outline'} focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 0.5,
    borderTopColor: Colors.tabBarBorder,
    height: Platform.OS === 'android' ? 64 : 80,
    paddingBottom: Platform.OS === 'android' ? 8 : 20,
    paddingTop: 8,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabIconWrapper: {
    width: 40,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabIconActive: {
    backgroundColor: Colors.primary + '18',
  },
});
