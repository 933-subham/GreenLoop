import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

export default function LeaderboardScreen() {
  const [data, setData] = useState({ citizens: [], partners: [], areas: [] });
  const [activeTab, setActiveTab] = useState('citizens');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard');
        setData({
          citizens: res.data.citizens || [],
          partners: res.data.partners || [],
          areas: res.data.areas || [],
        });
      } catch (err) {
        console.warn('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankBadge = (index) => {
    if (index === 0) return { color: '#eab308', bg: '#fef9c3', icon: 'trophy' };
    if (index === 1) return { color: '#94a3b8', bg: '#f1f5f9', icon: 'medal' };
    if (index === 2) return { color: '#b45309', bg: '#fef3c7', icon: 'medal' };
    return { color: '#64748b', bg: '#f8fafc', icon: null };
  };

  const list = data[activeTab] || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="trophy-award" size={26} color="#10b981" />
          <Text style={styles.title}>Eco Warriors</Text>
        </View>
        <Text style={styles.subtitle}>Top citizens, partners and cleanest civic zones</Text>

        <View style={styles.tabRow}>
          {['citizens', 'partners', 'areas'].map((tabKey) => (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tabBtn, activeTab === tabKey && styles.tabBtnActive]}
              onPress={() => setActiveTab(tabKey)}
            >
              <Text style={[styles.tabText, activeTab === tabKey && styles.tabTextActive]}>
                {tabKey === 'citizens' ? 'Citizens' : tabKey === 'partners' ? 'Partners' : 'Clean Areas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, idx) => item._id || idx.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const badge = getRankBadge(index);
            return (
              <View style={styles.rankCard}>
                <View style={[styles.rankIconWrap, { backgroundColor: badge.bg }]}>
                  {badge.icon ? (
                    <MaterialCommunityIcons name={badge.icon} size={20} color={badge.color} />
                  ) : (
                    <Text style={styles.rankNumText}>{index + 1}</Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.nameText}>
                    {activeTab === 'areas' ? item.cityName || item.name : item.name}
                  </Text>
                  <Text style={styles.cityText}>
                    {activeTab === 'areas' ? `${item.reportsResolved || 0} waste cleanups completed` : item.cityName || 'Eco Warrior'}
                  </Text>
                </View>

                <View style={styles.scoreWrap}>
                  <Text style={styles.scoreNum}>
                    {activeTab === 'citizens' ? `${item.citizenPoints || item.ecoCoins || 0} pts` : activeTab === 'partners' ? `${item.stats?.tasksCompleted || 0} cleaned` : `${item.score || 100}%`}
                  </Text>
                </View>
              </View>
            );
          }}
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
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rankIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cityText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  scoreWrap: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
