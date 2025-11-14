import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import CustomerTabNavigator from './CustomerTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import FlightResultsScreen from '../screens/public/FlightResultsScreen';
import FlightDetailsScreen from '../screens/public/FlightDetailsScreen';
import SeatSelectionScreen from '../screens/booking/SeatSelectionScreen';
import PassengerInfoScreen from '../screens/booking/PassengerInfoScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Tabs" 
        component={isAdmin ? AdminTabNavigator : CustomerTabNavigator}
      />
      <Stack.Screen 
        name="FlightResults" 
        component={FlightResultsScreen}
        options={{ 
          headerShown: true,
          title: 'Available Flights',
        }}
      />
      <Stack.Screen 
        name="FlightDetails" 
        component={FlightDetailsScreen}
        options={{ 
          headerShown: true,
          title: 'Flight Details',
        }}
      />
      <Stack.Screen 
        name="SeatSelection" 
        component={SeatSelectionScreen}
        options={{ 
          headerShown: true,
          title: 'Select Seat',
        }}
      />
      <Stack.Screen 
        name="PassengerInfo" 
        component={PassengerInfoScreen}
        options={{ 
          headerShown: true,
          title: 'Passenger Information',
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          headerShown: true,
          title: 'Payment',
        }}
      />
      <Stack.Screen 
        name="BookingConfirmation" 
        component={BookingConfirmationScreen}
        options={{ 
          headerShown: true,
          title: 'Booking Confirmed',
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
}

