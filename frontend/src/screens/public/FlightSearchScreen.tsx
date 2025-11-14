import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../../components/DatePicker';
import AirportAutocomplete from '../../components/AirportAutocomplete';

export default function FlightSearchScreen({ navigation }: any) {
  const { isAuthenticated, user } = useAuth();
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = () => {
    if (!origin || !destination || !departDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
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

      <ScrollView style={styles.content}>
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
              <AirportAutocomplete
                value={origin}
                onChange={setOrigin}
                placeholder="Select origin"
                compact={true}
              />
            </View>

            <TouchableOpacity style={styles.swapButtonCompact} onPress={swapLocations}>
              <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.locationCard}>
              <AirportAutocomplete
                value={destination}
                onChange={setDestination}
                placeholder="Select destination"
                compact={true}
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
                    placeholder="Select date"
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
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
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
  },
  locationCard: {
    flex: 1,
    backgroundColor: colors.surface || '#f5f5f5',
    borderRadius: 12,
    padding: spacing.sm,
    minHeight: 70,
    justifyContent: 'center',
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

