import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../../components/DatePicker';
import AirportAutocomplete from '../../components/AirportAutocomplete';
import * as Location from 'expo-location';

const AIRPORT_COORDS = [
  {
    code: 'YYZ',
    city: 'Toronto',
    name: 'Toronto Pearson International Airport',
    lat: 43.6777,
    lon: -79.6248,
  },
  {
    code: 'YVR',
    city: 'Vancouver',
    name: 'Vancouver International Airport',
    lat: 49.1951,
    lon: -123.1779,
  },
  {
    code: 'YUL',
    city: 'Montreal',
    name: 'Montreal-Pierre Elliott Trudeau International Airport',
    lat: 45.4706,
    lon: -73.7408,
  },
  {
    code: 'YOW',
    city: 'Ottawa',
    name: 'Ottawa Macdonald-Cartier International Airport',
    lat: 45.3225,
    lon: -75.6692,
  },
];

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getNearestAirport = (lat: number, lon: number) => {
  let nearest = null;
  let minDistance = Infinity;

  for (const airport of AIRPORT_COORDS) {
    const distance = calculateDistanceKm(lat, lon, airport.lat, airport.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = airport;
    }
  }

  return nearest;
};

export default function FlightSearchScreen({ navigation, route }: any) {
  const { isAuthenticated, user } = useAuth();
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  // Validate if the airport/city is in the correct format: "City (CODE)"
  const isValidAirport = (value: string) => {
    return /^.+ \(\w{3}\)$/.test(value);
  };

  // Extract airport code from the formatted string "City (CODE)"
  const extractAirportCode = (value: string) => {
    const match = value.match(/\((\w{3})\)$/);
    return match ? match[1] : '';
  };

  // Check if origin and destination are different
  const areDifferentAirports = () => {
    if (!isValidAirport(origin) || !isValidAirport(destination)) return true; // Don't block if invalid format
    const originCode = extractAirportCode(origin);
    const destCode = extractAirportCode(destination);
    return originCode !== destCode;
  };

  // Check if all required fields are valid
  const isSearchEnabled = 
    isValidAirport(origin) && 
    isValidAirport(destination) && 
    areDifferentAirports() &&
    departDate !== '' &&
    (tripType === 'one-way' || (tripType === 'round-trip' && returnDate !== ''));

  useEffect(() => {
    const prefillOriginFromLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        if (!position || origin) return;

        const nearestAirport = getNearestAirport(
          position.coords.latitude,
          position.coords.longitude
        );

        if (nearestAirport) {
          setOrigin(`${nearestAirport.city} (${nearestAirport.code})`);
        }
      } catch (error) {
        // silently fail if location not available
      }
    };

    prefillOriginFromLocation();
  }, []);

  useEffect(() => {
    if (route?.params?.selectedAirport) {
      const { type, value } = route.params.selectedAirport;
      if (type === 'departure') {
        setOrigin(value);
      } else {
        setDestination(value);
      }
      navigation.setParams({ selectedAirport: undefined });
    }
  }, [route?.params?.selectedAirport]);

  const openAirportPicker = (type: 'departure' | 'arrival') => {
    navigation.navigate('AirportPicker', {
      type,
      currentValue: type === 'departure' ? origin : destination,
    });
  };

  const handleSearch = () => {
    if (!origin || !destination || !departDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (!isValidAirport(origin) || !isValidAirport(destination)) {
      Alert.alert('Invalid Selection', 'Please select valid airports from the list');
      return;
    }

    if (!areDifferentAirports()) {
      Alert.alert('Invalid Route', 'Origin and destination cannot be the same airport');
      return;
    }

    if (tripType === 'round-trip' && !returnDate) {
      Alert.alert('Missing Information', 'Please select a return date');
      return;
    }

    navigation.navigate('FlightResults', {
      origin,
      destination,
      departDate,
      returnDate: tripType === 'round-trip' ? returnDate : null,
      passengers,
    });
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
    <View style={styles.container}>
      {/* Header with User Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            {isAuthenticated ? `Hello, ${user?.name}` : 'Welcome to FlyPorter'}
          </Text>
          <Text style={styles.headerSubtext}>Where would you like to go?</Text>
        </View>
        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Trip Type Selector */}
        <View style={styles.tripTypeContainer}>
          <TouchableOpacity
            style={[
              styles.tripTypeButton,
              tripType === 'one-way' && styles.tripTypeButtonActive,
            ]}
            onPress={() => setTripType('one-way')}
          >
            <Text
              style={[
                styles.tripTypeText,
                tripType === 'one-way' && styles.tripTypeTextActive,
              ]}
            >
              One-way
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tripTypeButton,
              tripType === 'round-trip' && styles.tripTypeButtonActive,
            ]}
            onPress={() => setTripType('round-trip')}
          >
            <Text
              style={[
                styles.tripTypeText,
                tripType === 'round-trip' && styles.tripTypeTextActive,
              ]}
            >
              Round-trip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Form */}
        <View style={styles.searchCard}>
          {/* Location Cards - Compact */}
          <View style={styles.locationRow}>
            <View style={styles.locationCard}>
              <View style={styles.locationLabelRow}>
                <Ionicons name="airplane-outline" size={18} color={colors.primary} />
                <Text style={[styles.locationLabel, styles.locationLabelCentered]}>Departure</Text>
              </View>
              <AirportAutocomplete
                value={origin}
                onChange={setOrigin}
                placeholder="Departure"
                compact={true}
                onOpenPicker={() => openAirportPicker('departure')}
              />
            </View>

            <TouchableOpacity style={styles.swapButtonCompact} onPress={swapLocations}>
              <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.locationCard}>
              <View style={styles.locationLabelRow}>
                <Text style={[styles.locationLabel, styles.locationLabelArrival, styles.locationLabelCentered]}>Arrival</Text>
              </View>
              <AirportAutocomplete
                value={destination}
                onChange={setDestination}
                placeholder="Arrival"
                compact={true}
                alignSuggestions="right"
                compactPlaceholderElement={
                  <Ionicons name="airplane-sharp" size={28} color={colors.primary} />
                }
                onOpenPicker={() => openAirportPicker('arrival')}
              />
            </View>
          </View>

          {/* Date Card - Compact */}
          <View style={styles.dateCard}>
            <View style={styles.dateRowCompact}>
            <View style={styles.dateSection}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Depart</Text>
                <DatePicker
                  value={departDate}
                  onChange={setDepartDate}
                  placeholder={tripType === 'one-way' ? 'Select departure date' : 'Select dates'}
                  minimumDate={new Date().toISOString().split('T')[0]}
                  compact={true}
                />
              </View>
            </View>

              {tripType === 'round-trip' && (
                <>
                  <View style={styles.dateDivider} />
                  <View style={styles.dateSection}>
                    <View style={styles.dateInfo}>
                      <Text style={styles.dateLabel}>Return</Text>
                      <DatePicker
                        value={returnDate}
                        onChange={setReturnDate}
                        placeholder="Select date"
                        minimumDate={departDate || new Date().toISOString().split('T')[0]}
                        compact={true}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Passengers */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Passengers</Text>
            </View>
            <View style={styles.passengerControl}>
              <TouchableOpacity
                style={styles.passengerButton}
                onPress={() => setPassengers(Math.max(1, passengers - 1))}
              >
                <Ionicons name="remove" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.passengerCount}>{passengers}</Text>
              <TouchableOpacity
                style={styles.passengerButton}
                onPress={() => setPassengers(Math.min(9, passengers + 1))}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity 
            style={[styles.searchButton, !isSearchEnabled && styles.searchButtonDisabled]} 
            onPress={handleSearch}
            disabled={!isSearchEnabled}
          >
            <Ionicons name="search" size={24} color="#fff" />
            <Text style={styles.searchButtonText}>Search Flights</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        {!isAuthenticated && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoBannerText}>
              Sign in to book flights and manage your trips
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.h3,
    color: '#fff',
  },
  headerSubtext: {
    ...typography.body1,
    color: '#fff',
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  signInButton: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  signInText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tripTypeText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  tripTypeTextActive: {
    color: '#fff',
  },
  searchCard: {
    backgroundColor: '#fff',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'visible',
  },
  locationCard: {
    flex: 1,
    backgroundColor: colors.surface || '#f5f5f5',
    borderRadius: 12,
    padding: spacing.sm,
    minHeight: 70,
    justifyContent: 'center',
    overflow: 'visible',
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationLabel: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
  },
  locationLabelArrival: {
    ...typography.body1,
    fontWeight: '700',
  },
  locationLabelCentered: {
    textAlign: 'center',
    flex: 1,
  },
  swapButtonCompact: {
    padding: spacing.xs,
    alignSelf: 'center',
  },
  dateCard: {
    backgroundColor: colors.surface || '#f5f5f5',
    borderRadius: 12,
    padding: spacing.md,
  },
  dateRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  compactAutocomplete: {
    marginBottom: 0,
  },
  compactDatePicker: {
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  input: {
    ...typography.body1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  swapButton: {
    alignSelf: 'center',
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
  },
  passengerControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  passengerButton: {
    padding: spacing.sm,
  },
  passengerCount: {
    ...typography.h4,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  searchButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  searchButtonText: {
    ...typography.button,
    color: '#fff',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoBannerText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
  },
});

