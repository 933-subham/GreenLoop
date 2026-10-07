import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CameraCapture from '../components/CameraCapture';
import ChatbotWidget from '../components/ChatbotWidget';
import api, { BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const WASTE_TYPES = ['Organic', 'Recyclable', 'Hazardous', 'Mixed'];
const INTENSITIES = ['Low', 'Medium', 'High'];

export function ReportGarbageScreen({ navigation, route }) {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [wasteType, setWasteType] = useState('Organic');
  const [garbageIntensity, setGarbageIntensity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [coords, setCoords] = useState(null);

  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Auto-fill from Chatbot or route params if available
  useEffect(() => {
    if (route.params?.prefill) {
      const p = route.params.prefill;
      if (p.wasteType) setWasteType(p.wasteType);
      if (p.address) setLocationAddress(p.address);
    }
  }, [route.params?.prefill]);

  const captureGPS = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to tag garbage location.');
        setLoadingGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCoords({ lat, lng });

      // Reverse geocode address
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
          { headers: { 'User-Agent': 'EcoCityApp/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData?.display_name) {
          setLocationAddress(geoData.display_name);
        } else {
          setLocationAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (e) {
        setLocationAddress(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      Alert.alert('GPS Error', err.message);
    } finally {
      setLoadingGps(false);
    }
  };

  const handlePhotoCaptured = async (uri) => {
    setImageUri(uri);
    setAiAnalyzing(true);
    setAiSuggestion(null);

    // Call AI classifier endpoint
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'live-garbage.jpg',
        type: 'image/jpeg',
      });
      formData.append('description', description);

      const res = await api.post('/reports/classify-waste', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.wasteType) {
        setAiSuggestion(res.data);
        if (WASTE_TYPES.includes(res.data.wasteType)) {
          setWasteType(res.data.wasteType);
        }
      }
    } catch (e) {
      console.warn('AI classification error:', e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!imageUri) {
      Alert.alert('Live Photo Needed', 'Please snap a real-time photo of the garbage.');
      return;
    }
    if (!coords && !locationAddress.trim()) {
      Alert.alert('Location Needed', 'Please capture GPS location so cleanup partners can locate the trash.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('image', {
        uri: imageUri,
        name: 'garbage-report.jpg',
        type: 'image/jpeg',
      });
      fd.append('wasteType', wasteType);
      fd.append('garbageIntensity', garbageIntensity);
      fd.append('description', description);
      if (coords) {
        fd.append('lat', coords.lat.toString());
        fd.append('lng', coords.lng.toString());
      }
      fd.append('address', locationAddress);

      await api.post('/reports', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        '🎉 Report Submitted!',
        'Thank you for reporting! Municipal partners are notified. You will earn 10 Eco Coins once cleaned.'
      );

      // Reset form
      setImageUri(null);
      setDescription('');
      setAiSuggestion(null);
      navigation.navigate('MyReports');
    } catch (err) {
      Alert.alert('Submission Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Report Garbage</Text>
          <Text style={styles.subtitle}>Take a real-time unfiltered photo to request pickup</Text>
        </View>

        {/* Live Camera Box */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Live Photo Capture *</Text>
          <CameraCapture
            imageUri={imageUri}
            onCapture={handlePhotoCaptured}
            onClear={() => {
              setImageUri(null);
              setAiSuggestion(null);
            }}
          />

          {aiAnalyzing && (
            <View style={styles.aiLoadingBadge}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.aiLoadingText}>FastAPI AI is analyzing waste category...</Text>
            </View>
          )}

          {aiSuggestion && (
            <View style={styles.aiResultCard}>
              <View style={styles.aiResultHeader}>
                <MaterialCommunityIcons name="creation" size={20} color="#10b981" />
                <Text style={styles.aiResultTitle}>AI Suggestion: {aiSuggestion.wasteType}</Text>
              </View>
              <Text style={styles.aiResultInstructions}>
                {aiSuggestion.instructions || aiSuggestion.wasteInstructions}
              </Text>
              <Text style={styles.aiConfidence}>
                Confidence: {(aiSuggestion.confidence * 100).toFixed(0)}% • Category auto-selected
              </Text>
            </View>
          )}
        </View>

        {/* Waste Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Waste Classification</Text>
          
          <Text style={styles.fieldLabel}>Waste Type</Text>
          <View style={styles.chipRow}>
            {WASTE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, wasteType === type && styles.chipActive]}
                onPress={() => setWasteType(type)}
              >
                <Text style={[styles.chipText, wasteType === type && styles.chipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Garbage Intensity</Text>
          <View style={styles.chipRow}>
            {INTENSITIES.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.chip, garbageIntensity === lvl && styles.chipActive]}
                onPress={() => setGarbageIntensity(lvl)}
              >
                <Text style={[styles.chipText, garbageIntensity === lvl && styles.chipTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Optional Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., Overflowing dumpster near community park"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={2}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* GPS Location Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Location Coordinates *</Text>
          <TouchableOpacity
            style={[styles.gpsButton, loadingGps && styles.btnDisabled]}
            onPress={captureGPS}
            disabled={loadingGps}
          >
            {loadingGps ? (
              <ActivityIndicator color="#065f46" />
            ) : (
              <>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#065f46" />
                <Text style={styles.gpsButtonText}>
                  {coords ? 'Update GPS Location' : 'Capture Real-Time GPS'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {locationAddress ? (
            <View style={styles.addressBox}>
              <MaterialCommunityIcons name="map-marker-check" size={18} color="#10b981" />
              <Text style={styles.addressText} numberOfLines={2}>
                {locationAddress}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.btnDisabled]}
          onPress={handleSubmitReport}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>🚀 Submit Garbage Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Dedicated Waste AI Chatbot */}
      <ChatbotWidget
        onPrefillReport={(data) => {
          if (data.wasteType) setWasteType(data.wasteType);
          if (data.address) setLocationAddress(data.address);
        }}
      />
    </View>
  );
}

export function MyReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/myreports');
      setReports(res.data || []);
    } catch (e) {
      console.warn('Error fetching my reports:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#10b981';
      case 'Cleaning':
        return '#3b82f6';
      case 'Assigned':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>My Reported Waste</Text>
            <Text style={styles.subtitle}>Track live cleanup progress and earned Eco Coins</Text>
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={54} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Reports Yet</Text>
              <Text style={styles.emptyText}>Tap 'Report' tab to click a live garbage photo and earn Eco Coins.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <Image
              source={{ uri: `${BASE_URL}${item.imageUrl}` }}
              style={styles.reportThumb}
              resizeMode="cover"
            />
            <View style={styles.reportContent}>
              <View style={styles.reportRow}>
                <Text style={styles.reportType}>{item.wasteType}</Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportAddress} numberOfLines={2}>
                {item.location?.address || item.cityName || 'Location tagged'}
              </Text>
              <Text style={styles.reportDate}>
                {new Date(item.createdAt).toLocaleDateString()} • {item.coinsAwarded > 0 ? `+${item.coinsAwarded} Coins 🪙` : 'Pending cleanup'}
              </Text>
            </View>
          </View>
        )}
      />
      <ChatbotWidget />
    </View>
  );
}

export function CitizenDashboardScreen({ navigation }) {
  const { user, refreshProfile, logout } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'C'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutIcon}>
            <MaterialCommunityIcons name="logout" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Eco Coins KPI */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#ecfdf5' }]}>
            <MaterialCommunityIcons name="circle-multiple" size={32} color="#10b981" />
            <Text style={styles.kpiValue}>{user?.ecoCoins || 0}</Text>
            <Text style={styles.kpiLabel}>Eco Coins Earned</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#eff6ff' }]}>
            <MaterialCommunityIcons name="chart-line" size={32} color="#3b82f6" />
            <Text style={styles.kpiValue}>{user?.citizenPoints || 0}</Text>
            <Text style={styles.kpiLabel}>Citizen Points</Text>
          </View>
        </View>

        {/* Action Shortcuts */}
        <View style={styles.actionMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Report')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#d1fae5' }]}>
              <MaterialCommunityIcons name="camera" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Report Real-time Garbage</Text>
              <Text style={styles.menuSubtitle}>Click unfiltered photo & get AI suggestion</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyReports')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#e0e7ff' }]}>
              <MaterialCommunityIcons name="clipboard-text-clock" size={24} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>My Reports History</Text>
              <Text style={styles.menuSubtitle}>Check cleanup status & rewards</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ChatbotWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  aiLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  aiLoadingText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  aiResultCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  aiResultInstructions: {
    fontSize: 12,
    color: '#047857',
    marginBottom: 4,
  },
  aiConfidence: {
    fontSize: 11,
    color: '#6ee7b7',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  chipActive: {
    backgroundColor: '#10b981',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 60,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  listHeader: {
    marginBottom: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reportThumb: {
    width: 90,
    height: 90,
  },
  reportContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reportAddress: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reportDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  logoutIcon: {
    padding: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actionMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
});
