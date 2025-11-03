import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

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
      alert('Please fill in all required fields');
      return;
    }

    navigation.navigate('Results', {
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
          {/* Origin */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="airplane" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>From</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="City or airport"
              value={origin}
              onChangeText={setOrigin}
              autoCapitalize="words"
            />
          </View>

          {/* Swap Button */}
          <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
            <Ionicons name="swap-vertical" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Destination */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>To</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="City or airport"
              value={destination}
              onChangeText={setDestination}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.divider} />

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.inputLabel}>Depart</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={departDate}
                onChangeText={setDepartDate}
              />
            </View>

            {tripType === 'round-trip' && (
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <View style={styles.inputLabelRow}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={styles.inputLabel}>Return</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={returnDate}
                  onChangeText={setReturnDate}
                />
              </View>
            )}
          </View>

          <View style={styles.divider} />

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
    padding: spacing.lg,
    borderRadius: 12,
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

