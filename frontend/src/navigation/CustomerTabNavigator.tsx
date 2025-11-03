import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

// Customer screens
import FlightSearchScreen from '../screens/public/FlightSearchScreen';
import FlightResultsScreen from '../screens/public/FlightResultsScreen';
import MyBookingsScreen from '../screens/customer/MyBookingsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen 
        name="Search" 
        component={FlightSearchScreen}
        options={{ title: 'Search Flights' }}
      />
      <SearchStack.Screen 
        name="Results" 
        component={FlightResultsScreen}
        options={{ title: 'Available Flights' }}
      />
    </SearchStack.Navigator>
  );
}

export default function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'BookingsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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

