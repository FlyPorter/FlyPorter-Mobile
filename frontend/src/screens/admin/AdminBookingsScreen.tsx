import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/theme';
import { adminAPI, bookingAPI } from '../../services/api';
import { format } from 'date-fns';

interface Booking {
  booking_id: number;
  confirmation_code: string | null;
  status: 'confirmed' | 'cancelled';
  total_price: string;
  booking_time: string;
  user?: {
    email: string;
    customer_info?: {
      full_name: string;
    } | null;
  };
  flight?: {
    flight_id: number;
    departure_time: string;
    route?: {
      origin_airport?: {
        airport_code: string;
      };
      destination_airport?: {
        airport_code: string;
      };
    };
    airline?: {
      airline_code: string;
    };
  };
  seat?: {
    seat_number: string;
  };
}

export default function AdminBookingsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  // Load data on initial mount
  useEffect(() => {
    loadBookings();
  }, []);

  // Refresh data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllBookings();
      
      if (response.data.success) {
        setBookings(response.data.data || []);
      } else {
        Alert.alert('Error', 'Failed to load bookings');
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load bookings';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    const customerName = booking.user?.customer_info?.full_name || booking.user?.email || 'Unknown';
    const bookingRef = booking.confirmation_code || `#${booking.booking_id}`;
    
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel booking ${bookingRef} for ${customerName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.cancelBooking(booking.booking_id.toString());
              Alert.alert(
                'Success', 
                'Booking cancelled successfully. Customer has been notified via notification.'
              );
              loadBookings();
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              const errorMessage = error.response?.data?.message || 'Failed to cancel booking';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const customerName = booking.user?.customer_info?.full_name || '';
    const customerEmail = booking.user?.email || '';
    const bookingRef = booking.confirmation_code || booking.booking_id.toString();
    
    const matchesSearch = 
      bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const renderBookingCard = (booking: Booking) => {
    const statusColor = booking.status === 'confirmed' ? colors.success : colors.error;
    const customerName = booking.user?.customer_info?.full_name || 'No name provided';
    const customerEmail = booking.user?.email || 'No email';
    const bookingRef = booking.confirmation_code || `#${booking.booking_id}`;
    const flightNumber = `${booking.flight?.airline?.airline_code || 'N/A'}${booking.flight?.flight_id || ''}`;
    const route = `${booking.flight?.route?.origin_airport?.airport_code || 'N/A'} → ${booking.flight?.route?.destination_airport?.airport_code || 'N/A'}`;
    const totalAmount = parseFloat(booking.total_price || '0');
    const departureDate = new Date(booking.flight?.departure_time || Date.now());
    const bookingDate = new Date(booking.booking_time);

    return (
      <View key={booking.booking_id} style={styles.bookingCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('AdminBookingDetails', {
              bookingId: booking.booking_id,
              booking,
            })
          }
        >
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>

          {/* Booking Header */}
          <View style={styles.bookingHeader}>
            <View style={styles.customerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {customerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{customerName}</Text>
                <Text style={styles.customerEmail}>{customerEmail}</Text>
              </View>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference:</Text>
              <Text style={styles.detailValue}>{bookingRef}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Flight:</Text>
              <Text style={styles.detailValue}>{flightNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Route:</Text>
              <Text style={styles.detailValue}>{route}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seat:</Text>
              <Text style={styles.detailValue}>{booking.seat?.seat_number || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Departure:</Text>
              <Text style={styles.detailValue}>
                {format(departureDate, 'MMM dd, yyyy • hh:mm a')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                ${totalAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booked:</Text>
              <Text style={styles.detailValue}>
                {format(bookingDate, 'MMM dd, yyyy')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        {booking.status === 'confirmed' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCancelBooking(booking)}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.actionButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by reference, name, or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === 'all' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'confirmed' && styles.filterTabActive]}
            onPress={() => setFilterStatus('confirmed')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === 'confirmed' && styles.filterTabTextActive,
              ]}
            >
              Confirmed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'cancelled' && styles.filterTabActive]}
            onPress={() => setFilterStatus('cancelled')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === 'cancelled' && styles.filterTabTextActive,
              ]}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.content}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or filters
            </Text>
          </View>
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    ...typography.body1,
    flex: 1,
    paddingVertical: spacing.md,
    lineHeight: 22,
    minHeight: 48,
  },
  filterTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  resultsHeader: {
    padding: spacing.md,
  },
  resultsText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  bookingCard: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h4,
    color: '#fff',
    fontWeight: '700',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  customerEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bookingDetails: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  amountText: {
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.body2,
    color: colors.error,
    fontWeight: '600',
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

