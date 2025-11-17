import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';

interface PassengerInfo {
  firstName: string;
  lastName: string;
  passportNumber: string;
  dateOfBirth: string;
}

export default function PassengerInfoScreen({ route, navigation }: any) {
  const { 
    flight, 
    outboundFlight, 
    returnFlight, 
    passengers, 
    selectedSeats, 
    returnSelectedSeats, 
    seatPriceModifier,
    outboundSeatModifier,
    returnSeatModifier,
    isRoundTrip 
  } = route.params;
  
  const { isAuthenticated } = useAuth();
  const [passengerData, setPassengerData] = useState<PassengerInfo[]>(
    Array(passengers).fill(null).map(() => ({
      firstName: '',
      lastName: '',
      passportNumber: '',
      dateOfBirth: '',
    }))
  );
  const [profileDetails, setProfileDetails] = useState<PassengerInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const formatDateForInput = (dateValue?: string | Date | null) => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const loadProfileDetails = async () => {
    if (!isAuthenticated) return;
    setProfileLoading(true);
    try {
      const response = await profileAPI.get();
      const profileData = response.data?.data || response.data;
      if (profileData) {
        const fullName =
          profileData.customer_info?.full_name ||
          profileData.full_name ||
          profileData.name ||
          '';
        let firstName = '';
        let lastName = '';
        if (fullName.trim()) {
          const nameParts = fullName.trim().split(/\s+/);
          firstName = nameParts.shift() || '';
          lastName = nameParts.join(' ');
        }
        const passport =
          profileData.customer_info?.passport_number ||
          profileData.passport_number ||
          '';
        const dob = formatDateForInput(profileData.customer_info?.date_of_birth);

        setProfileDetails({
          firstName,
          lastName,
          passportNumber: passport || '',
          dateOfBirth: dob,
        });
      }
    } catch (error) {
      console.warn('Unable to load profile for autofill', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfileDetails();
  }, [isAuthenticated]);


  const passengersLabel = `${passengers} ${passengers === 1 ? 'passenger' : 'passengers'}`;

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const getSeatClassLabel = (modifier?: number) => {
    if (!modifier || modifier < 1.05) return 'Economy';
    if (modifier >= 1.95) return 'First Class';
    return 'Business Class';
  };

  const formatSeatAdjustment = (seatAdjustment: number) => {
    if (Math.abs(seatAdjustment) < 0.01) {
      return '';
    }
    const sign = seatAdjustment > 0 ? '+' : '-';
    return ` (${sign}${formatCurrency(Math.abs(seatAdjustment))})`;
  };

  const summarizeSegment = (pricePerPassenger?: number, seatModifier?: number) => {
    const perPassenger = Number(pricePerPassenger ?? 0);
    const modifier = seatModifier ?? 1;
    const base = perPassenger * passengers;
    const total = base * modifier;
    const seatAdjustment = total - base;
    return {
      perPassenger,
      base,
      total,
      seatAdjustment,
      seatClass: getSeatClassLabel(modifier),
    };
  };

  const outboundSummary = outboundFlight
    ? summarizeSegment(outboundFlight.price, outboundSeatModifier)
    : null;
  const returnSummary = returnFlight
    ? summarizeSegment(returnFlight.price, returnSeatModifier)
    : null;
  const oneWaySummary = flight ? summarizeSegment(flight.price, seatPriceModifier) : null;

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const updated = [...passengerData];
    updated[index][field] = value;
    setPassengerData(updated);
  };

  const applyProfileToPassenger = () => {
    if (!profileDetails) return;
    setPassengerData((current) => {
      const updated = [...current];
      const target = { ...updated[0] };
      if (profileDetails.firstName) {
        target.firstName = profileDetails.firstName;
      }
      if (profileDetails.lastName) {
        target.lastName = profileDetails.lastName;
      }
      if (profileDetails.passportNumber) {
        target.passportNumber = profileDetails.passportNumber;
      }
      if (profileDetails.dateOfBirth) {
        target.dateOfBirth = profileDetails.dateOfBirth;
      }
      updated[0] = target;
      return updated;
    });
  };

  const shouldShowProfileButton = isAuthenticated && profileDetails && passengers >= 1;

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
      outboundFlight,
      returnFlight,
      passengers,
      selectedSeats,
      returnSelectedSeats, // Pass return seats if round-trip
      seatPriceModifier, // Keep for backward compatibility
      outboundSeatModifier,
      returnSeatModifier,
      passengerData,
      isRoundTrip,
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
              <View style={styles.seatBadgesContainer}>
                {selectedSeats[index] && (
                  <View style={styles.seatBadge}>
                    <Ionicons name="airplane" size={14} color={colors.primary} />
                    <Text style={styles.seatBadgeText}>
                      Outbound: {selectedSeats[index].row}{selectedSeats[index].column}
                    </Text>
                  </View>
                )}
                {returnSelectedSeats && returnSelectedSeats[index] && (
                  <View style={styles.seatBadge}>
                    <Ionicons name="airplane" size={14} color={colors.primary} />
                    <Text style={styles.seatBadgeText}>
                      Return: {returnSelectedSeats[index].row}{returnSelectedSeats[index].column}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {index === 0 && shouldShowProfileButton && (
              <TouchableOpacity
                style={[
                  styles.profileFillButton,
                  profileLoading && styles.profileFillButtonDisabled,
                ]}
                onPress={applyProfileToPassenger}
                disabled={profileLoading}
              >
                <Ionicons
                  name="person-circle"
                  size={20}
                  color={profileLoading ? colors.disabled : colors.primary}
                />
                <Text
                  style={[
                    styles.profileFillButtonText,
                    profileLoading && styles.profileFillButtonTextDisabled,
                  ]}
                >
                  {profileLoading ? 'Loading profile...' : 'Use My Profile'}
                </Text>
              </TouchableOpacity>
            )}

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
                onChangeText={(value) => {
                  // Only allow alphanumeric characters, max 9 characters
                  const alphanumericText = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9);
                  updatePassenger(index, 'passportNumber', alphanumericText);
                }}
                autoCapitalize="characters"
                maxLength={9}
              />
            </View>

            <View style={styles.inputGroup}>
              <DatePicker
                value={passenger.dateOfBirth}
                onChange={(value) => updatePassenger(index, 'dateOfBirth', value)}
                placeholder="Select date of birth"
                label="Date of Birth"
                minimumDate="1949-10-01"
                maximumDate={new Date().toISOString().split('T')[0]}
              />
            </View>
          </View>
        ))}

        {/* Pricing Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Summary</Text>
          
          {isRoundTrip && outboundFlight && returnFlight ? (
            // Round-trip pricing
            <>
              <View style={styles.summaryRowStack}>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryLabel}>
                    Outbound Flight ({passengersLabel})
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Base fare {formatCurrency(outboundSummary?.perPassenger || 0)} per passenger
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Seat class: {outboundSummary?.seatClass || 'Economy'}
                    {outboundSummary ? formatSeatAdjustment(outboundSummary.seatAdjustment) : ''}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(outboundSummary?.total || 0)}
                </Text>
              </View>

              <View style={styles.summaryRowStack}>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryLabel}>
                    Return Flight ({passengersLabel})
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Base fare {formatCurrency(returnSummary?.perPassenger || 0)} per passenger
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Seat class: {returnSummary?.seatClass || 'Economy'}
                    {returnSummary ? formatSeatAdjustment(returnSummary.seatAdjustment) : ''}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(returnSummary?.total || 0)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    (outboundSummary?.total || 0) + (returnSummary?.total || 0)
                  )}
                </Text>
              </View>
            </>
          ) : (
            // One-way pricing
            <>
              <View style={styles.summaryRowStack}>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryLabel}>
                    Flight ({passengersLabel})
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Base fare {formatCurrency(oneWaySummary?.perPassenger || 0)} per passenger
                  </Text>
                  <Text style={styles.summarySubtext}>
                    Seat class: {oneWaySummary?.seatClass || 'Economy'}
                    {oneWaySummary ? formatSeatAdjustment(oneWaySummary.seatAdjustment) : ''}
                  </Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(oneWaySummary?.total || 0)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(oneWaySummary?.total || 0)}
                </Text>
              </View>
            </>
          )}
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
  seatBadgesContainer: {
    flexDirection: 'column',
    gap: spacing.xs,
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
    paddingVertical: 14,
    backgroundColor: colors.surface,
    minHeight: 50,
    lineHeight: 22,
  },
  profileFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(200,16,46,0.08)',
  },
  profileFillButtonDisabled: {
    backgroundColor: colors.surface,
  },
  profileFillButtonText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary,
  },
  profileFillButtonTextDisabled: {
    color: colors.textSecondary,
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
    alignItems: 'center',
  },
  summaryRowStack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  summarySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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

