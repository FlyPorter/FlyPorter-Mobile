import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';

// Timezone mapping for Canadian airports
const AIRPORT_TIMEZONES: { [key: string]: string } = {
  YYZ: 'America/Toronto',
  YVR: 'America/Vancouver',
  YUL: 'America/Toronto',
  YOW: 'America/Toronto',
  YYC: 'America/Edmonton',
  YEG: 'America/Edmonton',
  YHZ: 'America/Halifax',
  YWG: 'America/Winnipeg',
  YQB: 'America/Toronto',
  YYJ: 'America/Vancouver',
  TEST: 'America/Toronto',
};

const getAirportTimezone = (airportCode: string): string => {
  return AIRPORT_TIMEZONES[airportCode] || 'America/Toronto';
};

export default function BookingDetailsScreen({ route, navigation }: any) {
  const { booking } = route.params;

  const handleChangeSeat = () => {
    // Navigate to seat selection with booking info
    navigation.navigate('SeatSelection', {
      flight: booking.flight,
      passengers: booking.passengers,
      isRoundTrip: false,
      bookingId: booking.id,
      currentSeatNumber: booking.seatNumber,
      currentSeatClass: booking.seatClass, // Pass the seat class/price_modifier
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      let date: Date;
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateString);
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Format time in city timezone
  const formatTimeInCityTimezone = (timestamp: string, cityTimezone?: string) => {
    if (!timestamp) return '';
    try {
      if (timestamp.match(/^\d{2}:\d{2}$/)) {
        return timestamp;
      }
      const date = new Date(timestamp);
      if (cityTimezone) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: cityTimezone,
        });
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  const statusColor =
    booking.status === 'confirmed' ? colors.success :
    booking.status === 'cancelled' ? colors.error :
    colors.textSecondary;

  const departureTimeDisplay = formatTimeInCityTimezone(
    booking.flight.departure_time || booking.flight.departureTime,
    booking.flight.origin.timezone || getAirportTimezone(booking.flight.origin.code)
  );

  const arrivalTimeDisplay = formatTimeInCityTimezone(
    booking.flight.arrival_time || booking.flight.arrivalTime,
    booking.flight.destination.timezone || getAirportTimezone(booking.flight.destination.code)
  );

  const flightDate = formatDate(booking.flight.departureDate || booking.bookingDate);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Booking Header */}
        <View style={styles.headerCard}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingReference}>{booking.bookingReference}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {booking.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.airlineLogo}>
              <Ionicons name="airplane" size={32} color={colors.primary} />
            </View>
          </View>

          <View style={styles.airlineInfo}>
            <Text style={styles.airlineName}>{booking.flight.airline.name}</Text>
            <Text style={styles.flightNumber}>Flight {booking.flight.flightNumber}</Text>
          </View>
        </View>

        {/* Flight Route */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flight Route</Text>

          <View style={styles.routeContainer}>
            {/* Departure */}
            <View style={styles.routeStop}>
              <View style={styles.routeDot} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeTime}>{departureTimeDisplay}</Text>
                <Text style={styles.routeCode}>{booking.flight.origin.code}</Text>
                <Text style={styles.routeName}>{booking.flight.origin.name}</Text>
                <Text style={styles.routeCity}>{booking.flight.origin.city}</Text>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.routeConnector}>
              <View style={styles.routeLine} />
              <View style={styles.durationBox}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text style={styles.durationText}>{booking.flight.duration}</Text>
              </View>
            </View>

            {/* Arrival */}
            <View style={styles.routeStop}>
              <View style={styles.routeDot} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeTime}>{arrivalTimeDisplay}</Text>
                <Text style={styles.routeCode}>{booking.flight.destination.code}</Text>
                <Text style={styles.routeName}>{booking.flight.destination.name}</Text>
                <Text style={styles.routeCity}>{booking.flight.destination.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Flight Date</Text>
            </View>
            <Text style={styles.detailValue}>{flightDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Passengers</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}
            </Text>
          </View>

          {booking.seatNumber && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.detailLabel}>Seat Number</Text>
              </View>
              <View style={styles.seatNumberRow}>
                <Text style={styles.detailValue}>{booking.seatNumber}</Text>
                {booking.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={styles.changeSeatButton}
                    onPress={handleChangeSeat}
                  >
                    <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
                    <Text style={styles.changeSeatText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Booked On</Text>
            </View>
            <Text style={styles.detailValue}>
              {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Total Amount</Text>
            </View>
            <Text style={styles.detailValue}>${booking.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Included Amenities</Text>

          <View style={styles.amenitiesList}>
            <View style={styles.amenityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.amenityText}>Personal item</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.amenityText}>Carry-on bag</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.amenityText}>Checked baggage (1 piece)</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.amenityText}>In-flight entertainment</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.amenityText}>Complimentary snacks & beverages</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingReference: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  airlineLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineInfo: {
    marginTop: spacing.sm,
  },
  airlineName: {
    ...typography.h4,
    color: colors.text,
  },
  flightNumber: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  routeContainer: {
    paddingVertical: spacing.sm,
  },
  routeStop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeTime: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  routeCode: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  routeName: {
    ...typography.body1,
    color: colors.text,
  },
  routeCity: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingVertical: spacing.md,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  durationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  durationText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  seatNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  changeSeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  changeSeatText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  amenitiesList: {
    gap: spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amenityText: {
    ...typography.body1,
    color: colors.text,
  },
});

