import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api, { BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EcoShopScreen() {
  const { user, refreshProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);

  const fetchShop = async () => {
    try {
      const res = await api.get('/shop');
      setItems(res.data || []);
    } catch (e) {
      console.warn('Error fetching shop items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleBuy = async (item) => {
    const cost = item.costInCoins || item.price || 0;
    if ((user?.ecoCoins || 0) < cost) {
      Alert.alert('Insufficient Eco Coins', `You need ${cost} Eco Coins. Snap and report more garbage to earn coins!`);
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Redeem "${item.title || item.name}" for ${cost} Eco Coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBuyingId(item._id);
            try {
              await api.post(`/shop/buy/${item._id}`);
              Alert.alert('🎉 Redeemed Successfully!', 'Your reward voucher has been added to your profile.');
              refreshProfile();
            } catch (err) {
              Alert.alert('Purchase Error', err.response?.data?.message || err.message);
            } finally {
              setBuyingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Live Eco Coins Badge */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Eco Shop</Text>
          <Text style={styles.subtitle}>Redeem your earned coins for green rewards</Text>
        </View>
        <View style={styles.coinsBadge}>
          <MaterialCommunityIcons name="circle-multiple" size={18} color="#f59e0b" />
          <Text style={styles.coinsText}>{user?.ecoCoins || 0} Coins</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIconWrap}>
                <MaterialCommunityIcons name="gift-outline" size={32} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title || item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.costRow}>
                  <Text style={styles.costText}>{item.costInCoins || item.price} Eco Coins</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.buyBtn, buyingId === item._id && styles.btnDisabled]}
                onPress={() => handleBuy(item)}
                disabled={buyingId === item._id}
              >
                {buyingId === item._id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buyBtnText}>Redeem</Text>
                )}
              </TouchableOpacity>
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
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  coinsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  costRow: {
    marginTop: 6,
  },
  costText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  buyBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
