import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { flightAPI } from '../../services/api';

interface Flight {
  id: string;
  flightNumber: string;
  airline: { name: string; code: string };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  origin: { code: string; name: string; city: string };
  destination: { code: string; name: string; city: string };
}

export default function FlightResultsScreen({ route, navigation }: any) {
  const { origin, destination, departDate, returnDate, passengers } = route.params;
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    airlines: [] as string[],
  });

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      // Mock data for demonstration
      // TODO: Replace with actual API call
      setTimeout(() => {
        const mockFlights: Flight[] = [
          {
            id: '1',
            flightNumber: 'FP101',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '08:00',
            arrivalTime: '11:30',
            duration: '3h 30m',
            price: 299,
            availableSeats: 45,
            origin: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
            destination: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          },
          {
            id: '2',
            flightNumber: 'FP203',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '12:30',
            arrivalTime: '16:00',
            duration: '3h 30m',
            price: 349,
            availableSeats: 23,
            origin: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
            destination: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          },
          {
            id: '3',
            flightNumber: 'FP405',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '18:00',
            arrivalTime: '21:30',
            duration: '3h 30m',
            price: 279,
            availableSeats: 67,
            origin: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
            destination: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          },
        ];
        setFlights(mockFlights);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading flights:', error);
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight: Flight) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('FlightDetails', { flight, passengers });
  };

  const renderFlightCard = (flight: Flight) => (
    <TouchableOpacity
      key={flight.id}
      style={styles.flightCard}
      onPress={() => handleSelectFlight(flight)}
    >
      <View style={styles.flightHeader}>
        <View style={styles.airlineInfo}>
          <View style={styles.airlineLogo}>
            <Ionicons name="airplane" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.airlineName}>{flight.airline.name}</Text>
            <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.price}>${flight.price}</Text>
        </View>
      </View>

      <View style={styles.flightRoute}>
        <View style={styles.routePoint}>
          <Text style={styles.time}>{flight.departureTime}</Text>
          <Text style={styles.airportCode}>{flight.origin.code}</Text>
        </View>

        <View style={styles.routeMiddle}>
          <View style={styles.routeLine} />
          <Ionicons name="airplane" size={20} color={colors.textSecondary} />
          <View style={styles.routeLine} />
        </View>

        <View style={styles.routePoint}>
          <Text style={styles.time}>{flight.arrivalTime}</Text>
          <Text style={styles.airportCode}>{flight.destination.code}</Text>
        </View>
      </View>

      <View style={styles.flightFooter}>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{flight.duration}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{flight.availableSeats} seats left</Text>
        </View>
      </View>

      <View style={styles.selectButton}>
        <Text style={styles.selectButtonText}>
          {isAuthenticated ? 'Select Flight' : 'Sign in to Book'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Searching for flights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Summary */}
      <View style={styles.searchSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Route:</Text>
          <Text style={styles.summaryValue}>{origin} → {destination}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>{departDate}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passengers:</Text>
          <Text style={styles.summaryValue}>{passengers}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.resultsHeader}>
          {flights.length} flights found
        </Text>

        {flights.map(renderFlightCard)}

        {returnDate && (
          <View style={styles.returnFlightsBanner}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.returnFlightsText}>
              Select your outbound flight first, then choose return flight
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  searchSummary: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  resultsHeader: {
    ...typography.h4,
    color: colors.text,
    padding: spacing.md,
  },
  flightCard: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airlineLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  airlineName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  flightNumber: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  price: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routePoint: {
    flex: 1,
  },
  time: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  airportCode: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  routeMiddle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  flightFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  selectButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  returnFlightsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.sm,
  },
  returnFlightsText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
  },
});

