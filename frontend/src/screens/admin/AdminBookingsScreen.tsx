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
import { colors, spacing, typography } from '../../theme/theme';

interface Booking {
  id: string;
  bookingReference: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  customerName: string;
  customerEmail: string;
  flight: {
    flightNumber: string;
    route: string;
  };
  passengers: number;
  totalAmount: number;
  bookingDate: string;
}

export default function AdminBookingsScreen() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'cancelled' | 'completed'>('all');

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
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            flight: {
              flightNumber: 'FP101',
              route: 'YYZ → YVR',
            },
            passengers: 2,
            totalAmount: 689.40,
            bookingDate: '2024-03-01',
          },
          {
            id: '2',
            bookingReference: 'FP87654321',
            status: 'confirmed',
            customerName: 'Jane Smith',
            customerEmail: 'jane@example.com',
            flight: {
              flightNumber: 'FP202',
              route: 'YUL → YYZ',
            },
            passengers: 1,
            totalAmount: 344.70,
            bookingDate: '2024-03-02',
          },
          {
            id: '3',
            bookingReference: 'FP11223344',
            status: 'cancelled',
            customerName: 'Bob Johnson',
            customerEmail: 'bob@example.com',
            flight: {
              flightNumber: 'FP303',
              route: 'YVR → YYC',
            },
            passengers: 3,
            totalAmount: 1034.10,
            bookingDate: '2024-02-28',
          },
        ];
        setBookings(mockBookings);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setLoading(false);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel booking ${booking.bookingReference} for ${booking.customerName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to cancel booking
              Alert.alert('Success', 'Booking cancelled successfully. Customer will be notified.');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const renderBookingCard = (booking: Booking) => {
    const statusColor =
      booking.status === 'confirmed' ? colors.success :
      booking.status === 'cancelled' ? colors.error :
      colors.textSecondary;

    return (
      <View key={booking.id} style={styles.bookingCard}>
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
                {booking.customerName.charAt(0)}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{booking.customerName}</Text>
              <Text style={styles.customerEmail}>{booking.customerEmail}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference:</Text>
            <Text style={styles.detailValue}>{booking.bookingReference}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Flight:</Text>
            <Text style={styles.detailValue}>{booking.flight.flightNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route:</Text>
            <Text style={styles.detailValue}>{booking.flight.route}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers:</Text>
            <Text style={styles.detailValue}>{booking.passengers}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={[styles.detailValue, styles.amountText]}>
              ${booking.totalAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked:</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.bookingDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

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
          <TouchableOpacity
            style={[styles.filterTab, filterStatus === 'completed' && styles.filterTabActive]}
            onPress={() => setFilterStatus('completed')}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === 'completed' && styles.filterTabTextActive,
              ]}
            >
              Completed
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

