import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import DatePicker from '../../components/DatePicker';

interface PassengerInfo {
  firstName: string;
  lastName: string;
  passportNumber: string;
  dateOfBirth: string;
}

export default function PassengerInfoScreen({ route, navigation }: any) {
  const { flight, passengers, selectedSeats, seatCharges } = route.params;
  
  const [passengerData, setPassengerData] = useState<PassengerInfo[]>(
    Array(passengers).fill(null).map(() => ({
      firstName: '',
      lastName: '',
      passportNumber: '',
      dateOfBirth: '',
    }))
  );

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengerData];
    updated[index][field] = value;
    setPassengerData(updated);
  };

  const handleContinue = () => {
    // Validate all fields
    for (let i = 0; i < passengerData.length; i++) {
      const passenger = passengerData[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.passportNumber) {
        Alert.alert('Incomplete Information', `Please fill in all fields for passenger ${i + 1}`);
        return;
      }
    }

    navigation.navigate('Payment', {
      flight,
      passengers,
      selectedSeats,
      seatCharges,
      passengerData,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Passenger Information</Text>
          <Text style={styles.headerSubtitle}>
            Please provide details for all passengers
          </Text>
        </View>

        {passengerData.map((passenger, index) => (
          <View key={index} style={styles.passengerCard}>
            <View style={styles.passengerHeader}>
              <Ionicons name="person" size={24} color={colors.primary} />
              <Text style={styles.passengerTitle}>
                Passenger {index + 1}
              </Text>
              {selectedSeats[index] && (
                <View style={styles.seatBadge}>
                  <Ionicons name="airplane" size={14} color={colors.primary} />
                  <Text style={styles.seatBadgeText}>
                    Seat {selectedSeats[index].row}{selectedSeats[index].column}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                value={passenger.firstName}
                onChangeText={(value) => updatePassenger(index, 'firstName', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                value={passenger.lastName}
                onChangeText={(value) => updatePassenger(index, 'lastName', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Passport Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="AB1234567"
                value={passenger.passportNumber}
                onChangeText={(value) => updatePassenger(index, 'passportNumber', value)}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <DatePicker
                value={passenger.dateOfBirth}
                onChange={(value) => updatePassenger(index, 'dateOfBirth', value)}
                placeholder="Select date of birth"
                label="Date of Birth"
                maximumDate={new Date().toISOString().split('T')[0]}
              />
            </View>
          </View>
        ))}

        {/* Pricing Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Flight ({passengers} × ${flight.price})
            </Text>
            <Text style={styles.summaryValue}>
              ${(flight.price * passengers).toFixed(2)}
            </Text>
          </View>

          {seatCharges > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Seat Selection</Text>
              <Text style={styles.summaryValue}>${seatCharges.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes & Fees</Text>
            <Text style={styles.summaryValue}>
              ${((flight.price * passengers + seatCharges) * 0.15).toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${((flight.price * passengers + seatCharges) * 1.15).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  passengerCard: {
    backgroundColor: '#fff',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  passengerTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  seatBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    ...typography.h4,
    color: colors.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  continueButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  continueButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

