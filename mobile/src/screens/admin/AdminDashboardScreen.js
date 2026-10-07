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
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LiveMapComponent from '../../components/LiveMapComponent';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardScreen() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'reports' | 'map'
  const [pendingPartners, setPendingPartners] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [pRes, rRes, sRes] = await Promise.all([
        api.get('/admin/pending-partners'),
        api.get('/admin/reports'),
        api.get('/admin/stats'),
      ]);
      setPendingPartners(pRes.data || []);
      setAllReports(rRes.data || []);
      setStats(sRes.data || {});
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePartnerApproval = async (id, approve) => {
    try {
      await api.put(`/admin/partners/${id}/${approve ? 'approve' : 'reject'}`);
      Alert.alert(approve ? 'Partner Approved! ✅' : 'Partner Rejected');
      fetchAdminData();
    } catch (e) {
      Alert.alert('Action Failed', e.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Municipal Admin</Text>
          <Text style={styles.subtitle}>City Waste Operations & Partner Verifications</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Analytics KPI Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.totalReports || allReports.length}</Text>
          <Text style={styles.statLab}>Total Reports</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#f59e0b' }]}>{pendingPartners.length}</Text>
          <Text style={styles.statLab}>Pending Partners</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#10b981' }]}>{stats.completedReports || 0}</Text>
          <Text style={styles.statLab}>Resolved</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'partners' && styles.tabActive]}
          onPress={() => setActiveTab('partners')}
        >
          <Text style={[styles.tabText, activeTab === 'partners' && styles.tabTextActive]}>
            Verify Partners ({pendingPartners.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            City Reports ({allReports.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.tabActive]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>
            Live Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : activeTab === 'map' ? (
        <View style={{ flex: 1, padding: 16 }}>
          <LiveMapComponent reports={allReports} />
        </View>
      ) : activeTab === 'partners' ? (
        <FlatList
          data={pendingPartners}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdminData(); }} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="account-check-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No pending partner registrations to verify.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.email}</Text>
                <Text style={styles.cardMeta}>City: {item.cityName || 'Assigned City'}</Text>
              </View>
              <View style={styles.btnCol}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handlePartnerApproval(item._id, true)}
                >
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handlePartnerApproval(item._id, false)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={allReports}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdminData(); }} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.reportItem}>
              <View style={styles.reportRow}>
                <Text style={styles.reportType}>{item.wasteType}</Text>
                <Text style={styles.reportStatus}>{item.status}</Text>
              </View>
              <Text style={styles.reportLoc} numberOfLines={2}>
                {item.location?.address || item.cityName}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLab: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tabActive: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  cardMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  btnCol: {
    gap: 6,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  reportItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  reportStatus: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  reportLoc: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
