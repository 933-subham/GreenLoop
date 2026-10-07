import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STATUS_COLOR = {
  Submitted: '#6c757d',
  Assigned: '#fd7e14',
  Cleaning: '#0d6efd',
  Completed: '#28a745',
};

export default function LiveMapComponent({ reports = [], initialRegion, onSelectReport }) {
  const defaultRegion = initialRegion || {
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {reports
          .filter((r) => r.location && r.location.lat && r.location.lng)
          .map((item) => {
            const pinColor = STATUS_COLOR[item.status] || '#10b981';
            return (
              <Marker
                key={item._id}
                coordinate={{
                  latitude: parseFloat(item.location.lat),
                  longitude: parseFloat(item.location.lng),
                }}
                title={`${item.wasteType} (${item.status})`}
                description={item.location.address || item.cityName || ''}
                onCalloutPress={() => onSelectReport && onSelectReport(item)}
              >
                <View style={[styles.customPin, { backgroundColor: pinColor }]}>
                  <MaterialCommunityIcons name="trash-can" size={16} color="#fff" />
                </View>
              </Marker>
            );
          })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
