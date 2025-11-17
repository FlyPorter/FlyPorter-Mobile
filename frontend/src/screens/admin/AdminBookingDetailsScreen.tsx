import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/theme';
import { bookingAPI, adminAPI } from '../../services/api';
import { format } from 'date-fns';

interface BookingDetails {
  booking_id: number;
  confirmation_code: string;
  status: string;
  total_price: string;
  booking_time: string;
  seat_number: string;
  user?: {
    email: string;
    customer_info?: {
      full_name: string;
    };
  };
  flight?: {
    flight_id: number;
    departure_time: string;
    arrival_time: string;
    base_price: string;
    route: {
      route_id: number;
      origin_airport: {
        airport_code: string;
        airport_name: string;
        city_name: string;
      };
      destination_airport: {
        airport_code: string;
        airport_name: string;
        city_name: string;
      };
    };
    airline: {
      airline_code: string;
      airline_name: string;
    };
  };
}

export default function AdminBookingDetailsScreen({ route }: any) {
  const navigation = useNavigation();
  const { bookingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getById(bookingId.toString());
      setBooking(response.data.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await adminAPI.cancelBooking(bookingId.toString());
              Alert.alert('Success', 'Booking cancelled successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const statusColor =
    booking.status === 'confirmed' ? colors.success :
    booking.status === 'cancelled' ? colors.error :
    colors.textSecondary;

  const departureTime = new Date(booking.flight?.departure_time || '');
  const arrivalTime = new Date(booking.flight?.arrival_time || '');
  const bookingTime = new Date(booking.booking_time);

  const flightNumber = `${booking.flight?.airline.airline_code}${booking.flight?.flight_id}`;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Booking Header */}
        <View style={styles.headerCard}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingReference}>{booking.confirmation_code}</Text>
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
            <Text style={styles.airlineName}>{booking.flight?.airline.airline_name}</Text>
            <Text style={styles.flightNumber}>Flight {flightNumber}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Name</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.user?.customer_info?.full_name || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="mail" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Email</Text>
            </View>
            <Text style={styles.detailValue}>{booking.user?.email || 'N/A'}</Text>
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
                <Text style={styles.routeTime}>
                  {format(departureTime, 'HH:mm')}
                </Text>
                <Text style={styles.routeCode}>
                  {booking.flight?.route.origin_airport.airport_code}
                </Text>
                <Text style={styles.routeName}>
                  {booking.flight?.route.origin_airport.airport_name}
                </Text>
                <Text style={styles.routeCity}>
                  {booking.flight?.route.origin_airport.city_name}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.routeConnector}>
              <View style={styles.routeLine} />
              <View style={styles.durationBox}>
                <Ionicons name="airplane" size={16} color={colors.textSecondary} />
              </View>
            </View>

            {/* Arrival */}
            <View style={styles.routeStop}>
              <View style={styles.routeDot} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeTime}>
                  {format(arrivalTime, 'HH:mm')}
                </Text>
                <Text style={styles.routeCode}>
                  {booking.flight?.route.destination_airport.airport_code}
                </Text>
                <Text style={styles.routeName}>
                  {booking.flight?.route.destination_airport.airport_name}
                </Text>
                <Text style={styles.routeCity}>
                  {booking.flight?.route.destination_airport.city_name}
                </Text>
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
            <Text style={styles.detailValue}>
              {format(departureTime, 'MMM dd, yyyy')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="seat" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Seat</Text>
            </View>
            <Text style={styles.detailValue}>{booking.seat_number}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Booked On</Text>
            </View>
            <Text style={styles.detailValue}>
              {format(bookingTime, 'MMM dd, yyyy HH:mm')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Total Amount</Text>
            </View>
            <Text style={styles.detailValue}>
              ${parseFloat(booking.total_price).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Admin Actions */}
      {booking.status === 'confirmed' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelBooking}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  errorText: {
    ...typography.body1,
    color: colors.error,
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
  actionsContainer: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...typography.body1,
    color: '#fff',
    fontWeight: '600',
  },
});

