import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import CustomerTabNavigator from './CustomerTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import FlightResultsScreen from '../screens/public/FlightResultsScreen';
import FlightDetailsScreen from '../screens/public/FlightDetailsScreen';
import BookingDetailsScreen from '../screens/customer/BookingDetailsScreen';
import AdminBookingDetailsScreen from '../screens/admin/AdminBookingDetailsScreen';
import SeatSelectionScreen from '../screens/booking/SeatSelectionScreen';
import PassengerInfoScreen from '../screens/booking/PassengerInfoScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';

const Stack = createStackNavigator();

function MainNavigatorContent() {
  const { isAdmin } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    checkPendingNavigation();
  }, []);

  const checkPendingNavigation = async () => {
    try {
      const pendingNavigationStr = await AsyncStorage.getItem('pendingNavigation');
      if (pendingNavigationStr) {
        const pendingNavigation = JSON.parse(pendingNavigationStr);
        // Clear the pending navigation
        await AsyncStorage.removeItem('pendingNavigation');
        
        // Navigate to the stored destination after a short delay to ensure stack is ready
        setTimeout(() => {
          if (pendingNavigation.screen && pendingNavigation.params) {
            navigation.navigate(pendingNavigation.screen as never, pendingNavigation.params as never);
          }
        }, 100);
      }
    } catch (error) {
      // Silent fail - continue with normal navigation
    }
  };

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
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="FlightDetails" 
        component={FlightDetailsScreen}
        options={{ 
          headerShown: true,
          title: 'Flight Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="BookingDetails" 
        component={BookingDetailsScreen}
        options={{ 
          headerShown: true,
          title: 'Booking Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="AdminBookingDetails" 
        component={AdminBookingDetailsScreen}
        options={{ 
          headerShown: true,
          title: 'Booking Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="SeatSelection" 
        component={SeatSelectionScreen}
        options={{ 
          headerShown: true,
          title: 'Select Seat',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="PassengerInfo" 
        component={PassengerInfoScreen}
        options={{ 
          headerShown: true,
          title: 'Passenger Information',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          headerShown: true,
          title: 'Payment',
          headerBackTitle: 'Back',
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

export default function MainNavigator() {
  return <MainNavigatorContent />;
}

