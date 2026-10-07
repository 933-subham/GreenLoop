import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CameraCapture from '../components/CameraCapture';
import LiveMapComponent from '../components/LiveMapComponent';
import api, { BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function AvailableTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/reports/available');
      setTasks(res.data || []);
    } catch (e) {
      console.warn('Error fetching available tasks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAcceptTask = async (id) => {
    setAcceptingId(id);
    try {
      await api.put(`/reports/${id}/assign`);
      Alert.alert('Task Accepted! 🚛', 'Head to the location and start cleaning.');
      fetchTasks();
      navigation.navigate('MyTasks');
    } catch (err) {
      Alert.alert('Could Not Accept', err.response?.data?.message || err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks(); }} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.headerTitle}>Available Cleanup Tasks</Text>
            <Text style={styles.headerSubtitle}>
              Nearby citizen-reported waste needing collection
            </Text>

            {/* Google Map of Available Tasks */}
            {tasks.length > 0 && (
              <View style={styles.mapWrap}>
                <LiveMapComponent reports={tasks} />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="check-all" size={54} color="#10b981" />
              <Text style={styles.emptyTitle}>All Cleaned Up!</Text>
              <Text style={styles.emptyText}>No pending garbage reports in your municipality right now.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <Image
              source={{ uri: `${BASE_URL}${item.imageUrl}` }}
              style={styles.taskImage}
              resizeMode="cover"
            />
            <View style={styles.taskInfo}>
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={styles.typeText}>{item.wasteType}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: '#fee2e2' }]}>
                  <Text style={[styles.typeText, { color: '#ef4444' }]}>
                    {item.garbageIntensity}
                  </Text>
                </View>
              </View>

              <Text style={styles.addressText} numberOfLines={2}>
                {item.location?.address || item.cityName || 'Location pinned'}
              </Text>

              <TouchableOpacity
                style={[styles.acceptBtn, acceptingId === item._id && styles.btnDisabled]}
                onPress={() => handleAcceptTask(item._id)}
                disabled={acceptingId === item._id}
              >
                {acceptingId === item._id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="truck-fast" size={18} color="#fff" />
                    <Text style={styles.acceptBtnText}>Accept Pickup</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

export function MyTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Proof camera snapshot modal
  const [proofModalId, setProofModalId] = useState(null);
  const [proofUri, setProofUri] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const fetchMyTasks = async () => {
    try {
      const res = await api.get('/reports/mytasks');
      setTasks(res.data || []);
    } catch (e) {
      console.warn('Error loading partner tasks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleMarkCleaning = async (id) => {
    try {
      await api.put(`/reports/${id}/cleaning`);
      Alert.alert('Status Updated', 'Report marked as In Progress (Cleaning).');
      fetchMyTasks();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCompleteWithProof = async () => {
    if (!proofUri) {
      Alert.alert('Proof Required', 'Snap a real-time photo of the cleaned site.');
      return;
    }
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append('proof', {
        uri: proofUri,
        name: 'cleanup-proof.jpg',
        type: 'image/jpeg',
      });
      await api.put(`/reports/${proofModalId}/complete`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Cleanup Verified! 🎉', 'Citizen awarded 10 Eco Coins. Great job keeping the city clean!');
      setProofModalId(null);
      setProofUri(null);
      fetchMyTasks();
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.message || err.message);
    } finally {
      setUploadingProof(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyTasks(); }} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.headerTitle}>My Active Tasks</Text>
            <Text style={styles.headerSubtitle}>
              Clean the assigned garbage and snap a real-time proof photo
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <Image
              source={{ uri: `${BASE_URL}${item.imageUrl}` }}
              style={styles.taskImage}
              resizeMode="cover"
            />
            <View style={styles.taskInfo}>
              <View style={styles.badgeRow}>
                <Text style={styles.typeText}>{item.wasteType}</Text>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: item.status === 'Cleaning' ? '#dbeafe' : '#fef3c7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: item.status === 'Cleaning' ? '#1d4ed8' : '#b45309' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.addressText} numberOfLines={2}>
                {item.location?.address || item.cityName}
              </Text>

              <View style={styles.btnRow}>
                {item.status === 'Assigned' && (
                  <TouchableOpacity
                    style={styles.cleaningBtn}
                    onPress={() => handleMarkCleaning(item._id)}
                  >
                    <MaterialCommunityIcons name="broom" size={16} color="#fff" />
                    <Text style={styles.actionText}>Start Cleaning</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => {
                    setProofModalId(item._id);
                    setProofUri(null);
                  }}
                >
                  <MaterialCommunityIcons name="camera-check" size={16} color="#fff" />
                  <Text style={styles.actionText}>Snap Proof & Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Proof Photo Real-time Capture Modal */}
      <Modal visible={!!proofModalId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Snap Real-Time Proof Photo</Text>
            <Text style={styles.modalSubtitle}>
              Capture an unfiltered live snapshot proving the area has been completely cleaned.
            </Text>

            <View style={{ marginVertical: 16 }}>
              <CameraCapture
                imageUri={proofUri}
                onCapture={(uri) => setProofUri(uri)}
                onClear={() => setProofUri(null)}
                label="Cleanup proof required"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setProofModalId(null);
                  setProofUri(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, uploadingProof && styles.btnDisabled]}
                onPress={handleCompleteWithProof}
                disabled={uploadingProof}
              >
                {uploadingProof ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Submit Proof</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerWrap: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  mapWrap: {
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  taskImage: {
    width: 100,
    height: 120,
  },
  taskInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
    marginTop: 8,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cleaningBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
