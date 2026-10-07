import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="recycle" size={44} color="#10b981" />
          </View>
          <Text style={styles.brandTitle}>EcoCity Waste</Text>
          <Text style={styles.brandSubtitle}>Clean Neighborhoods, Rewarding Actions</Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to report waste or fulfill tasks</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchAuthRow}>
            <Text style={styles.switchAuthText}>New to EcoCity? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchAuthLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function RegisterScreen({ navigation }) {
  const [role, setRole] = useState('citizen');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerCitizen, registerPartner } = useAuth();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in name, email, and password.');
      return;
    }
    setLoading(true);
    try {
      if (role === 'citizen') {
        await registerCitizen(name.trim(), email.trim(), password);
      } else {
        await registerPartner(name.trim(), email.trim(), password);
        Alert.alert(
          'Registration Submitted',
          'Partner account submitted! A municipal admin will review and approve your credentials before you can accept tasks.'
        );
        navigation.navigate('Login');
      }
    } catch (err) {
      Alert.alert('Registration Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="account-plus" size={38} color="#10b981" />
          </View>
          <Text style={styles.brandTitle}>Join EcoCity</Text>
          <Text style={styles.brandSubtitle}>Be part of the clean city movement</Text>
        </View>

        <View style={styles.formCard}>
          {/* Role selector tab */}
          <View style={styles.roleTabs}>
            <TouchableOpacity
              style={[styles.roleTab, role === 'citizen' && styles.roleTabActive]}
              onPress={() => setRole('citizen')}
            >
              <MaterialCommunityIcons
                name="account"
                size={18}
                color={role === 'citizen' ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.roleTabText, role === 'citizen' && styles.roleTabTextActive]}>
                Citizen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleTab, role === 'partner' && styles.roleTabActive]}
              onPress={() => setRole('partner')}
            >
              <MaterialCommunityIcons
                name="truck"
                size={18}
                color={role === 'partner' ? '#10b981' : '#6b7280'}
              />
              <Text style={[styles.roleTabText, role === 'partner' && styles.roleTabTextActive]}>
                Partner
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                Register as {role === 'citizen' ? 'Citizen' : 'Partner'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchAuthRow}>
            <Text style={styles.switchAuthText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchAuthLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#065f46',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#047857',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 20,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  roleTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleTabTextActive: {
    color: '#10b981',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  primaryBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchAuthText: {
    fontSize: 13,
    color: '#6b7280',
  },
  switchAuthLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
});
