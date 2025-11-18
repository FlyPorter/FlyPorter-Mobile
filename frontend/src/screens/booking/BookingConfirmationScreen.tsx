import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Timezone mapping for Canadian airports
const AIRPORT_TIMEZONES: { [key: string]: string } = {
  YYZ: 'America/Toronto',      // Toronto
  YVR: 'America/Vancouver',    // Vancouver
  YUL: 'America/Toronto',      // Montreal (Eastern Time)
  YOW: 'America/Toronto',      // Ottawa
  YYC: 'America/Edmonton',     // Calgary
  YEG: 'America/Edmonton',     // Edmonton
  YHZ: 'America/Halifax',      // Halifax
  YWG: 'America/Winnipeg',     // Winnipeg
  YQB: 'America/Toronto',      // Quebec City (Eastern Time)
  YYJ: 'America/Vancouver',    // Victoria (Pacific Time)
  TEST: 'America/Toronto',     // Test airport
};

// Helper function to get timezone for an airport code
const getAirportTimezone = (airportCode: string): string => {
  return AIRPORT_TIMEZONES[airportCode] || 'America/Toronto'; // Default to Toronto timezone
};

export default function BookingConfirmationScreen({ route, navigation }: any) {
  const { 
    bookingId, 
    returnBookingId,
    flight, 
    outboundFlight,
    returnFlight,
    passengers, 
    selectedSeats,
    returnSelectedSeats,
    passengerData, 
    totalAmount,
    isRoundTrip 
  } = route.params;
  
  // Helper function to format date from date string or UTC timestamp
  const formatFlightDate = (dateString: string) => {
    if (!dateString) return new Date().toLocaleDateString();
    try {
      let date: Date;
      
      // Check if it's just a date string (YYYY-MM-DD) without time
      // To avoid timezone shifts, parse it as local date
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day); // Create as local date
      } else {
        // Parse UTC timestamp and convert to local timezone
        date = new Date(dateString);
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return new Date().toLocaleDateString();
    }
  };

  // Helper function to format time in specific city timezone (without timezone abbreviation)
  const formatFlightTime = (timestamp: string, cityTimezone?: string) => {
    if (!timestamp) return '';
    try {
      // If it's already just a time (HH:MM), return as is
      if (timestamp.match(/^\d{2}:\d{2}$/)) {
        return timestamp;
      }
      
      // Parse UTC timestamp
      const date = new Date(timestamp);
      
      // If timezone is provided (e.g., 'America/Toronto', 'America/Vancouver')
      if (cityTimezone) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
          timeZone: cityTimezone,
        });
      }
      
      // Fallback to local timezone
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  // Helper function to prepare flight data with proper formatting
  const prepareFlightData = (flightData: any) => {
    if (!flightData) return null;
    
    const departureTimestamp = flightData?.departure_time || 
                               flightData?.departureTime || 
                               flightData?.departureDate ||
                               flightData?.date;
    
    const formattedDate = formatFlightDate(departureTimestamp);
    
    const originCode = flightData?.origin?.code || '';
    const destCode = flightData?.destination?.code || '';
    
    const departureTimeWithTz = formatFlightTime(
      flightData?.departure_time || flightData?.departureTime || '',
      flightData?.origin?.timezone || getAirportTimezone(originCode)
    );
    const arrivalTimeWithTz = formatFlightTime(
      flightData?.arrival_time || flightData?.arrivalTime || '',
      flightData?.destination?.timezone || getAirportTimezone(destCode)
    );
    
    return {
      ...flightData,
      formattedDate,
      origin: {
        code: originCode,
        city: flightData?.origin?.city || flightData?.origin?.name || '',
        name: flightData?.origin?.name || flightData?.origin?.city || '',
        timezone: flightData?.origin?.timezone || getAirportTimezone(originCode),
      },
      destination: {
        code: destCode,
        city: flightData?.destination?.city || flightData?.destination?.name || '',
        name: flightData?.destination?.name || flightData?.destination?.city || '',
        timezone: flightData?.destination?.timezone || getAirportTimezone(destCode),
      },
      departureTime: departureTimeWithTz || flightData?.departureTime || '',
      arrivalTime: arrivalTimeWithTz || flightData?.arrivalTime || '',
      duration: flightData?.duration || '',
      flightNumber: flightData?.flightNumber || '',
      airline: {
        name: flightData?.airline?.name || 'FlyPorter',
      },
    };
  };

  // Prepare flight data based on trip type
  const safeFlight = isRoundTrip && outboundFlight 
    ? prepareFlightData(outboundFlight)
    : prepareFlightData(flight);
  
  const safeReturnFlight = isRoundTrip && returnFlight 
    ? prepareFlightData(returnFlight)
    : null;
  
  const formattedFlightDate = safeFlight?.formattedDate || '';

  const handleDone = () => {
    // Navigate to the bookings tab
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your flight has been successfully booked
          </Text>
        </View>

        {/* Email Notification */}
        <View style={styles.emailNotification}>
          <Ionicons name="mail" size={24} color={colors.primary} />
          <Text style={styles.emailText}>
            A confirmation email with your invoice has been sent to your registered email
          </Text>
        </View>

        {/* Booking Reference */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceNumber}>{bookingId}</Text>
          <Text style={styles.referenceNote}>
            Save this reference number for future use
          </Text>
        </View>

        {/* Flight Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Details</Text>
          
          {/* Outbound Flight */}
          {safeFlight && (
            <View style={styles.flightCard}>
              {isRoundTrip && <Text style={styles.flightLabel}>Outbound Flight</Text>}
              <View style={styles.flightHeader}>
                <View>
                  <Text style={styles.airline}>{safeFlight.airline.name}</Text>
                  <Text style={styles.flightNumber}>Flight {safeFlight.flightNumber}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={styles.dateText}>{safeFlight.formattedDate}</Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.airport}>
                  <Text style={styles.airportCode}>{safeFlight.origin.code}</Text>
                  <Text style={styles.airportTime}>{safeFlight.departureTime}</Text>
                  <Text style={styles.airportName}>{safeFlight.origin.city}</Text>
                </View>

                <View style={styles.routeMiddle}>
                  <Ionicons name="airplane" size={24} color={colors.primary} />
                  <Text style={styles.duration}>{safeFlight.duration}</Text>
                </View>

                <View style={styles.airport}>
                  <Text style={styles.airportCode}>{safeFlight.destination.code}</Text>
                  <Text style={styles.airportTime}>{safeFlight.arrivalTime}</Text>
                  <Text style={styles.airportName}>{safeFlight.destination.city}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Return Flight */}
          {isRoundTrip && safeReturnFlight && (
            <View style={[styles.flightCard, { marginTop: spacing.md }]}>
              <Text style={styles.flightLabel}>Return Flight</Text>
              <View style={styles.flightHeader}>
                <View>
                  <Text style={styles.airline}>{safeReturnFlight.airline.name}</Text>
                  <Text style={styles.flightNumber}>Flight {safeReturnFlight.flightNumber}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={styles.dateText}>{safeReturnFlight.formattedDate}</Text>
                </View>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.airport}>
                  <Text style={styles.airportCode}>{safeReturnFlight.origin.code}</Text>
                  <Text style={styles.airportTime}>{safeReturnFlight.departureTime}</Text>
                  <Text style={styles.airportName}>{safeReturnFlight.origin.city}</Text>
                </View>

                <View style={styles.routeMiddle}>
                  <Ionicons name="airplane" size={24} color={colors.primary} />
                  <Text style={styles.duration}>{safeReturnFlight.duration}</Text>
                </View>

                <View style={styles.airport}>
                  <Text style={styles.airportCode}>{safeReturnFlight.destination.code}</Text>
                  <Text style={styles.airportTime}>{safeReturnFlight.arrivalTime}</Text>
                  <Text style={styles.airportName}>{safeReturnFlight.destination.city}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Passenger Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          {passengerData.map((passenger: any, index: number) => (
            <View key={index} style={styles.passengerCard}>
              <View style={styles.passengerInfo}>
                <Ionicons name="person" size={24} color={colors.primary} />
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerName}>
                    {passenger.firstName} {passenger.lastName}
                  </Text>
                  <Text style={styles.passengerMeta}>
                    Passport: {passenger.passportNumber}
                  </Text>
                </View>
              </View>
              <View style={styles.seatBadgeContainer}>
                <View style={styles.seatBadge}>
                  <Ionicons name="airplane" size={16} color="#fff" />
                  <Text style={styles.seatText}>
                    {isRoundTrip ? 'Out: ' : ''}{selectedSeats[index].row}{selectedSeats[index].column}
                  </Text>
                </View>
                {isRoundTrip && returnSelectedSeats && returnSelectedSeats[index] && (
                  <View style={[styles.seatBadge, { marginTop: spacing.xs }]}>
                    <Ionicons name="airplane" size={16} color="#fff" />
                    <Text style={styles.seatText}>
                      Ret: {returnSelectedSeats[index].row}{returnSelectedSeats[index].column}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Paid</Text>
              <Text style={styles.paymentAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.paymentStatusText}>Payment Successful</Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name="mail" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Check Your Email</Text>
                <Text style={styles.stepDescription}>
                  Confirmation sent to your registered email
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Arrive Early</Text>
                <Text style={styles.stepDescription}>
                  Be at the airport 2-3 hours before departure
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name="card" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Bring Documents</Text>
                <Text style={styles.stepDescription}>
                  Valid ID and passport for all passengers
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButtonFull} onPress={handleDone}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  successHeader: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  referenceCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  referenceLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  referenceNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  referenceNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  flightCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flightLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  airline: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  flightNumber: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airport: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  airportTime: {
    ...typography.body1,
    color: colors.text,
    marginTop: spacing.xs,
  },
  airportName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  routeMiddle: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  duration: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerDetails: {
    marginLeft: spacing.sm,
  },
  passengerName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  passengerMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  seatBadgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  seatText: {
    ...typography.body2,
    color: '#fff',
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  paymentLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  paymentAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  paymentStatusText: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '600',
  },
  stepsList: {
    gap: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  footer: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
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
  emailNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.md,
  },
  emailText: {
    flex: 1,
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
  },
  primaryButtonFull: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

