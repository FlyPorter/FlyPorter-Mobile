import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

// Customer screens
import FlightSearchScreen from '../screens/public/FlightSearchScreen';
import FlightResultsScreen from '../screens/public/FlightResultsScreen';
import AirportPickerScreen from '../screens/public/AirportPickerScreen';
import MyBookingsScreen from '../screens/customer/MyBookingsScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { useNotifications } from '../context/NotificationContext';

const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#EF4444', // Red background
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <SearchStack.Screen 
        name="Search" 
        component={FlightSearchScreen}
        options={{ title: 'Search Flights' }}
      />
      <SearchStack.Screen 
        name="FlightResults" 
        component={FlightResultsScreen}
        options={{ title: 'Available Flights' }}
      />
      <SearchStack.Screen
        name="AirportPicker"
        component={AirportPickerScreen}
        options={{
          headerShown: false,
          presentation: 'transparentModal',
        }}
      />
    </SearchStack.Navigator>
  );
}

export default function CustomerTabNavigator() {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          // Add badge for notifications
          if (route.name === 'NotificationsTab' && unreadCount > 0) {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#EF4444', // Red color for active tab
        tabBarInactiveTintColor: '#9CA3AF', // Gray color for inactive tabs
        tabBarStyle: {
          backgroundColor: '#000000', // Black background
          borderTopColor: '#374151', // Dark gray border
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#1F2937', // Dark gray/black header
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStackNavigator}
        options={{ 
          tabBarLabel: 'Search',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="BookingsTab" 
        component={MyBookingsScreen}
        options={{ 
          tabBarLabel: 'My Trips',
          title: 'My Trips',
          headerStyle: {
            backgroundColor: '#EF4444', // Red background
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Tab.Screen 
        name="NotificationsTab" 
        component={NotificationsScreen}
        options={{ 
          tabBarLabel: 'Notifications',
          title: 'Notifications',
          headerStyle: {
            backgroundColor: '#EF4444', // Red background
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: 'Profile',
          title: 'My Profile',
          headerStyle: {
            backgroundColor: '#EF4444', // Red background
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

