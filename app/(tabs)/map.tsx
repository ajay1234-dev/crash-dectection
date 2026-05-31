import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { listenToGPS, DeviceGPS } from '@/hooks/useFirebase';

export default function MapScreen() {
  const [gps, setGps] = useState<DeviceGPS | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    // Set a timeout so map never hangs forever
    const timeout = setTimeout(() => setLoading(false), 8000);
    const unsub = listenToGPS((data) => {
      clearTimeout(timeout);
      setGps(data);
      setLoading(false);
    });
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  const centerOnVehicle = () => {
    if (!gps || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: gps.lat,
        longitude: gps.lon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      800
    );
  };

  const openInGoogleMaps = () => {
    if (!gps) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lon}`;
    Linking.openURL(url);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  const defaultRegion = {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 20,
    longitudeDelta: 20,
  };

  return (
    <View style={styles.container}>
      {/* Map always renders immediately — no blocking spinner */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          gps
            ? {
                latitude: gps.lat,
                longitude: gps.lon,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : defaultRegion
        }
        customMapStyle={darkMapStyle}
      >
        {gps && (
          <Marker
            coordinate={{ latitude: gps.lat, longitude: gps.lon }}
            title="Vehicle Location"
            description={`Updated: ${formatTime(gps.updatedAt)}`}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
              <View style={styles.markerTail} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Info Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Ionicons name="location" size={16} color={Colors.safe} />
          <View style={styles.topBarText}>
            <Text style={styles.topBarTitle}>Live Vehicle Location</Text>
            {gps ? (
              <Text style={styles.topBarSub}>
                {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}
              </Text>
            ) : (
              <Text style={styles.topBarSub}>
                {loading ? 'Fetching GPS...' : 'No GPS fix'}
              </Text>
            )}
          </View>
        </View>
        {loading && (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
        )}
        {gps && !loading && (
          <View style={styles.updateBadge}>
            <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.updateText}>{formatTime(gps.updatedAt)}</Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.centerBtn}
          onPress={centerOnVehicle}
          disabled={!gps}
        >
          <Ionicons name="locate" size={22} color={gps ? Colors.textPrimary : Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gmapsBtn, !gps && styles.btnDisabled]}
          onPress={openInGoogleMaps}
          disabled={!gps}
        >
          <Ionicons name="map" size={18} color="#fff" />
          <Text style={styles.gmapsBtnText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {!gps && !loading && (
        <View style={styles.noGpsOverlay}>
          <Ionicons name="location-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.noGpsText}>No GPS data available</Text>
          <Text style={styles.noGpsSub}>
            Ensure device is online and has GPS fix
          </Text>
        </View>
      )}
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2c2c3e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: Colors.cardBackground + 'EE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topBarText: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  topBarSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  updateText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  centerBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground + 'EE',
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gmapsBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  gmapsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  markerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  markerTail: {
    width: 2,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  noGpsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background + 'CC',
    gap: 10,
  },
  noGpsText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noGpsSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
