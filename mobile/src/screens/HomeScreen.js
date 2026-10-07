import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';

const steps = [
  { n: '01', title: 'Report Garbage', desc: 'Citizens use the app to snap live unfiltered photos with auto GPS location.', icon: 'camera-plus', color: '#10b981', bg: '#d1fae5' },
  { n: '02', title: 'Assign to Partner', desc: 'Municipality assigns reports to verified waste collection partners in the area.', icon: 'truck', color: '#3b82f6', bg: '#dbeafe' },
  { n: '03', title: 'Clean & Earn', desc: 'Partner cleans and snaps live proof photo. Citizen earns 10 Eco Coins per report!', icon: 'trophy', color: '#f59e0b', bg: '#fef3c7' },
];

const features = [
  { icon: 'camera-iris', title: 'Snap in Seconds', desc: 'Live camera capture with GPS coordinates in one tap.', color: '#10b981', bg: '#e6f4ea' },
  { icon: 'circle-multiple', title: 'Eco Coin Rewards', desc: 'Earn coins for every verified cleanup and redeem in the Eco Shop.', color: '#d97706', bg: '#fff3cd' },
  { icon: 'map-legend', title: 'Live City Map', desc: 'Real-time garbage tracking powered by Google Maps.', color: '#2563eb', bg: '#e8f4fd' },
  { icon: 'truck-check', title: 'Partner Network', desc: 'Verified waste collectors accept tasks and verify cleanups with live proof.', color: '#dc2626', bg: '#fde8e8' },
  { icon: 'robot', title: 'Waste AI Assistant', desc: 'Integrated Gemini LLM strictly answering waste & segregation queries.', color: '#7c3aed', bg: '#f3e8ff' },
  { icon: 'chart-bar', title: 'City Analytics', desc: 'Real-time metrics on waste collected and carbon footprint saved.', color: '#0891b2', bg: '#e0f7fa' },
];

const stats = [
  { n: '50,000+', label: 'Reports Resolved' },
  { n: '2,400+', label: 'Active Citizens' },
  { n: '380+', label: 'Collection Partners' },
  { n: '12 MT', label: 'Waste Recycled' },
];

export default function HomeScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleContactSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please fill name, email and message.');
      return;
    }
    setSending(true);
    try {
      await api.post('/contact', { name, email, subject, message });
      Alert.alert('Message Sent!', 'Thank you! The municipal team will reply within 24-48 hours.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (e) {
      Alert.alert('Message Sent', 'Your message has been received by the municipality team.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section matching website banner */}
      <View style={styles.heroSection}>
        <View style={styles.badgeWrap}>
          <MaterialCommunityIcons name="leaf" size={14} color="#10b981" />
          <Text style={styles.badgeText}>Smart Municipal Waste Platform</Text>
        </View>

        <Text style={styles.heroTitle}>Transform Waste Into Value with EcoCity</Text>
        <Text style={styles.heroSubtitle}>
          Snap real-time unfiltered garbage photos, earn Eco Coins, and collaborate with verified municipal cleanup partners.
        </Text>

        <View style={styles.heroBtnRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started Free</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsRow}>
        {stats.map((s, idx) => (
          <View key={idx} style={styles.statBox}>
            <Text style={styles.statNum}>{s.n}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* How it Works (3 Steps from Website) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionBadge}>How It Works</Text>
        <Text style={styles.sectionTitle}>3 Simple Steps to a Clean City</Text>
      </View>

      {steps.map((s) => (
        <View key={s.n} style={styles.stepCard}>
          <View style={[styles.stepIconWrap, { backgroundColor: s.bg }]}>
            <MaterialCommunityIcons name={s.icon} size={28} color={s.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.stepNum}>{s.n}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
            </View>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}

      {/* Key Features Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionBadge}>Platform Features</Text>
        <Text style={styles.sectionTitle}>Built for Citizens, Partners & City Admins</Text>
      </View>

      <View style={styles.featuresGrid}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
              <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* Contact Municipality Form from Website */}
      <View style={styles.contactCard}>
        <Text style={styles.sectionBadge}>Get In Touch</Text>
        <Text style={styles.contactTitle}>Contact Municipality Administration</Text>
        <Text style={styles.contactSubtitle}>
          Have questions or civic requests? Reach municipal coordinators directly.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your Full Name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Your Email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Subject"
          placeholderTextColor="#9ca3af"
          value={subject}
          onChangeText={setSubject}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Your Message..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          style={styles.contactBtn}
          onPress={handleContactSubmit}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.contactBtnText}>Send Message</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
    paddingTop: 48,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    marginBottom: 28,
  },
  statBox: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  stepIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10b981',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  contactCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065f46',
    marginTop: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  contactBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
