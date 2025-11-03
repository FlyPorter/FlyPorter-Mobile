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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { bookingAPI } from '../../services/api';

interface Booking {
  id: string;
  bookingReference: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  flight: {
    flightNumber: string;
    airline: { name: string };
    departureTime: string;
    arrivalTime: string;
    origin: { code: string; city: string };
    destination: { code: string; city: string };
  };
  passengers: number;
  totalAmount: number;
  bookingDate: string;
}

export default function MyBookingsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // Mock data for demonstration
      // TODO: Replace with actual API call
      setTimeout(() => {
        const mockBookings: Booking[] = [
          {
            id: '1',
            bookingReference: 'FP12345678',
            status: 'confirmed',
            flight: {
              flightNumber: 'FP101',
              airline: { name: 'FlyPorter' },
              departureTime: '08:00',
              arrivalTime: '11:30',
              origin: { code: 'YYZ', city: 'Toronto' },
              destination: { code: 'YVR', city: 'Vancouver' },
            },
            passengers: 2,
            totalAmount: 689.40,
            bookingDate: '2024-03-01',
          },
          {
            id: '2',
            bookingReference: 'FP87654321',
            status: 'completed',
            flight: {
              flightNumber: 'FP202',
              airline: { name: 'FlyPorter' },
              departureTime: '14:00',
              arrivalTime: '17:30',
              origin: { code: 'YUL', city: 'Montreal' },
              destination: { code: 'YYZ', city: 'Toronto' },
            },
            passengers: 1,
            totalAmount: 344.70,
            bookingDate: '2024-02-15',
          },
        ];
        setBookings(mockBookings);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel booking ${booking.bookingReference}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to cancel booking
              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const renderBookingCard = (booking: Booking) => {
    const isUpcoming = booking.status === 'confirmed';
    const statusColor =
      booking.status === 'confirmed' ? colors.success :
      booking.status === 'cancelled' ? colors.error :
      colors.textSecondary;

    return (
      <TouchableOpacity key={booking.id} style={styles.bookingCard}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>

        {/* Booking Header */}
        <View style={styles.bookingHeader}>
          <View>
            <Text style={styles.bookingReference}>{booking.bookingReference}</Text>
            <Text style={styles.bookingDate}>
              Booked on {new Date(booking.bookingDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.airlineLogo}>
            <Ionicons name="airplane" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Flight Info */}
        <View style={styles.flightInfo}>
          <View style={styles.flightRoute}>
            <View style={styles.flightPoint}>
              <Text style={styles.flightCode}>{booking.flight.origin.code}</Text>
              <Text style={styles.flightCity}>{booking.flight.origin.city}</Text>
              <Text style={styles.flightTime}>{booking.flight.departureTime}</Text>
            </View>

            <View style={styles.flightMiddle}>
              <Ionicons name="arrow-forward" size={24} color={colors.primary} />
              <Text style={styles.flightNumber}>{booking.flight.flightNumber}</Text>
            </View>

            <View style={styles.flightPoint}>
              <Text style={styles.flightCode}>{booking.flight.destination.code}</Text>
              <Text style={styles.flightCity}>{booking.flight.destination.city}</Text>
              <Text style={styles.flightTime}>{booking.flight.arrivalTime}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>${booking.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.bookingActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>

          {isUpcoming && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(booking)}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status !== 'confirmed');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}
          >
            Upcoming
          </Text>
          {upcomingBookings.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcomingBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'upcoming' ? (
          upcomingBookings.length > 0 ? (
            upcomingBookings.map(renderBookingCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Upcoming Trips</Text>
              <Text style={styles.emptyStateText}>
                You don't have any upcoming bookings
              </Text>
            </View>
          )
        ) : (
          pastBookings.length > 0 ? (
            pastBookings.map(renderBookingCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Past Trips</Text>
              <Text style={styles.emptyStateText}>
                Your travel history will appear here
              </Text>
            </View>
          )
        )}

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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  bookingCard: {
    backgroundColor: '#fff',
    margin: spacing.md,
    padding: spacing.lg,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingReference: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  bookingDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  airlineLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flightInfo: {
    marginBottom: spacing.md,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flightPoint: {
    flex: 1,
  },
  flightCode: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  flightCity: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  flightTime: {
    ...typography.body1,
    color: colors.text,
    marginTop: spacing.xs,
  },
  flightMiddle: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  flightNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

