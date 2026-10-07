import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import { LoginScreen, RegisterScreen } from '../screens/AuthScreens';
import {
  ReportGarbageScreen,
  MyReportsScreen,
  CitizenDashboardScreen,
} from '../screens/CitizenScreens';
import LeaderboardScreen from '../components/Leaderboard';
import EcoShopScreen from '../screens/citizen/EcoShopScreen';
import { AvailableTasksScreen, MyTasksScreen } from '../screens/PartnerScreens';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Report') iconName = 'camera-plus';
          else if (route.name === 'MyReports') iconName = 'clipboard-text';
          else if (route.name === 'Leaderboard') iconName = 'trophy';
          else if (route.name === 'EcoShop') iconName = 'shopping';
          else if (route.name === 'Profile') iconName = 'account-circle';
          return <MaterialCommunityIcons name={iconName} size={size + 2} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Report"
        component={ReportGarbageScreen}
        options={{ tabBarLabel: 'Snap Report' }}
      />
      <Tab.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ tabBarLabel: 'My Reports' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Leaderboard' }}
      />
      <Tab.Screen
        name="EcoShop"
        component={EcoShopScreen}
        options={{ tabBarLabel: 'Eco Shop' }}
      />
      <Tab.Screen
        name="Profile"
        component={CitizenDashboardScreen}
        options={{ tabBarLabel: 'Profile & Coins' }}
      />
    </Tab.Navigator>
  );
}

function PartnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Available') iconName = 'map-marker-radius';
          else if (route.name === 'MyTasks') iconName = 'truck-check';
          else if (route.name === 'Leaderboard') iconName = 'trophy';
          return <MaterialCommunityIcons name={iconName} size={size + 2} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Available"
        component={AvailableTasksScreen}
        options={{ tabBarLabel: 'Nearby Tasks' }}
      />
      <Tab.Screen
        name="MyTasks"
        component={MyTasksScreen}
        options={{ tabBarLabel: 'My Pickups' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Leaderboard' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'admin' ? (
          <Stack.Screen name="AdminApp" component={AdminDashboardScreen} />
        ) : user.role === 'partner' ? (
          <Stack.Screen name="PartnerApp" component={PartnerTabs} />
        ) : (
          <Stack.Screen name="CitizenApp" component={CitizenTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
