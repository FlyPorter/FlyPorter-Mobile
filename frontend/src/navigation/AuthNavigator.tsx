import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import FlightSearchScreen from '../screens/public/FlightSearchScreen';
import FlightResultsScreen from '../screens/public/FlightResultsScreen';
import FlightDetailsScreen from '../screens/public/FlightDetailsScreen';
import AirportPickerScreen from '../screens/public/AirportPickerScreen';
import { colors } from '../theme/theme';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="FlightSearch" 
        component={FlightSearchScreen}
        options={{ title: 'FlyPorter' }}
      />
      <Stack.Screen 
        name="FlightResults" 
        component={FlightResultsScreen}
        options={{ title: 'Available Flights' }}
      />
      <Stack.Screen 
        name="FlightDetails" 
        component={FlightDetailsScreen}
        options={{ title: 'Flight Details' }}
      />
      <Stack.Screen 
        name="AirportPicker" 
        component={AirportPickerScreen}
        options={{ 
          headerShown: false,
          presentation: 'transparentModal',
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}

