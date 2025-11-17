import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminManageScreen from '../screens/admin/AdminManageScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'ManageTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#000000', // Black background
          borderTopColor: '#374151', // Dark gray border
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={AdminDashboardScreen}
        options={{ 
          tabBarLabel: 'Dashboard',
          title: 'Admin Dashboard',
        }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={AdminBookingsScreen}
        options={{ 
          tabBarLabel: 'Bookings',
          title: 'All Bookings',
        }}
      />
      <Tab.Screen 
        name="ManageTab" 
        component={AdminManageScreen}
        options={{ 
          tabBarLabel: 'Manage',
          title: 'Manage Data',
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: 'Profile',
          title: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
}

