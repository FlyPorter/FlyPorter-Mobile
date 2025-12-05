import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { colors, spacing, typography } from '../../theme/theme';
import { bookingAPI } from '../../services/api';
import {
  getTravelReminderPreference,
  saveTravelReminderPreference,
  ReminderPreference,
  ReminderPreferenceOption,
} from '../../utils/reminderPreferences';

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

// Format UTC timestamp to airport-specific timezone
const formatTimeInAirportTimezone = (timestamp: string, airportCode: string): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    const timezone = getAirportTimezone(airportCode);
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
  } catch {
    return timestamp;
  }
};

// Calculate duration between two timestamps
const calculateDuration = (departureTimestamp: string, arrivalTimestamp: string): string => {
  if (!departureTimestamp || !arrivalTimestamp) return 'N/A';
  try {
    const departure = new Date(departureTimestamp);
    const arrival = new Date(arrivalTimestamp);
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  } catch {
    return 'N/A';
  }
};

interface Booking {
  id: string; // Primary booking ID (first one in group)
  bookingIds: string[]; // All booking IDs in this group
  bookingReference: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  flight: {
    flightNumber: string;
    airline: { name: string };
    departureTime: string;
    arrivalTime: string;
    departure_time?: string; // UTC timestamp from backend
    arrival_time?: string; // UTC timestamp from backend
    origin: { code: string; city: string; timezone?: string };
    destination: { code: string; city: string; timezone?: string };
  };
  seatNumbers: string[]; // All seat numbers for this group
  seatClass?: number; // Seat price modifier (1.0, 1.5, 2.0)
  passengers: number; // Number of passengers (group size)
  totalAmount: number; // Sum of all bookings in group
  bookingDate: string;
}

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reminderPreference, setReminderPreference] = useState<ReminderPreference | null>(null);
  const [preferenceLoading, setPreferenceLoading] = useState(true);
  const [reminderPromptVisible, setReminderPromptVisible] = useState(false);
  const [currentBookingHash, setCurrentBookingHash] = useState<string | null>(null);
  const reminderTriggeredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadPreference = async () => {
      const pref = await getTravelReminderPreference();
      if (isMounted) {
        setReminderPreference(pref);
        setPreferenceLoading(false);
      }
    };

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh bookings when tab changes
  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Refresh bookings whenever the screen comes into focus (e.g., after seat change)
  useFocusEffect(
    React.useCallback(() => {
      loadBookings();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])
  );

  useFocusEffect(
    React.useCallback(() => {
      reminderTriggeredRef.current = false;
      return () => {
        reminderTriggeredRef.current = false;
      };
    }, [])
  );

  const loadBookings = async () => {
    try {
      setLoading(true);
      const filter = activeTab === 'upcoming' ? 'upcoming' : activeTab === 'past' ? 'past' : 'all';
      
      const response = await bookingAPI.getMyBookings(filter);
      
      // Transform API response to match Booking interface
      // Handle different response structures
      let bookingsData: any[] = [];
      
      if (response.data?.success && response.data?.data) {
        bookingsData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        bookingsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        bookingsData = response.data.data;
      }
      
      // First, transform all individual bookings
      const individualBookings = bookingsData.map((booking: any) => {
        try {
          const departureTime = booking.flight?.departure_time ? new Date(booking.flight.departure_time) : null;
          const arrivalTime = booking.flight?.arrival_time ? new Date(booking.flight.arrival_time) : null;
          const isPast = departureTime ? departureTime < new Date() : false;
          
          // Get airline info - check multiple possible paths
          const airlineCode = booking.flight?.route?.airline?.airline_code || 
                            booking.flight?.airline?.airline_code || 
                            booking.flight?.airline_code || 
                            'FP';
          const airlineName = booking.flight?.route?.airline?.airline_name || 
                            booking.flight?.airline?.airline_name || 
                            'FlyPorter';
          
          // Get airport info
          const originCode = booking.flight?.route?.origin_airport?.airport_code || '';
          const originCity = booking.flight?.route?.origin_airport?.city_name || '';
          const originAirportName = booking.flight?.route?.origin_airport?.airport_name || originCity;
          const destCode = booking.flight?.route?.destination_airport?.airport_code || '';
          const destCity = booking.flight?.route?.destination_airport?.city_name || '';
          const destAirportName = booking.flight?.route?.destination_airport?.airport_name || destCity;
          
          // Get seat number and price modifier
          const seatNumber = booking.seat?.seat_number || booking.seat_number || '';
          const seatPriceModifier = parseFloat(booking.seat?.price_modifier || '1.0');
          
          // Get raw UTC timestamps
          const departureTimestamp = booking.flight?.departure_time || '';
          const arrivalTimestamp = booking.flight?.arrival_time || '';
          
          // Format times in airport-specific timezones
          const formattedDepartureTime = departureTimestamp ? 
            formatTimeInAirportTimezone(departureTimestamp, originCode) : '';
          const formattedArrivalTime = arrivalTimestamp ? 
            formatTimeInAirportTimezone(arrivalTimestamp, destCode) : '';
          
          // Calculate flight duration
          const flightDuration = calculateDuration(departureTimestamp, arrivalTimestamp);
          
          return {
            bookingId: String(booking.booking_id || booking.id || ''),
            confirmationCode: booking.confirmation_code || `FP${String(booking.booking_id || booking.id || '').padStart(8, '0')}`,
            status: booking.status === 'cancelled' ? 'cancelled' : 
                   isPast ? 'completed' : 'confirmed',
            flightId: booking.flight?.flight_id || booking.flight_id,
            airlineCode,
            airlineName,
            originCode,
            originCity,
            originAirportName,
            destCode,
            destCity,
            destAirportName,
            departureTimestamp,
            arrivalTimestamp,
            formattedDepartureTime,
            formattedArrivalTime,
            flightDuration,
            seatNumber,
            seatPriceModifier,
            totalPrice: parseFloat(booking.total_price || booking.totalAmount || '0'),
            bookingTime: booking.booking_time ? new Date(booking.booking_time).getTime() : Date.now(),
            originTimezone: booking.flight?.route?.origin_airport?.city?.timezone || getAirportTimezone(originCode),
            destTimezone: booking.flight?.route?.destination_airport?.city?.timezone || getAirportTimezone(destCode),
          };
        } catch (transformError) {
          console.error('Error transforming booking:', booking, transformError);
          return null;
        }
      }).filter((b: any): b is NonNullable<typeof b> => b !== null);
      
      // Group bookings by flight_id and booking_time (same flight + booked together = group)
      const groupedMap = new Map<string, typeof individualBookings>();
      individualBookings.forEach(booking => {
        // Group key: flightId + booking time rounded to nearest 5 minutes
        // This ensures bookings created in the same session are grouped together
        const bookingTimeKey = Math.floor(booking.bookingTime / (5 * 60000)); // Round to 5 minutes
        const groupKey = `${booking.flightId}_${bookingTimeKey}`;
        
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, []);
        }
        groupedMap.get(groupKey)!.push(booking);
      });
      
      // Transform grouped bookings into final Booking interface
      const transformedBookings: Booking[] = Array.from(groupedMap.values()).map(group => {
        // Use first booking as the base
        const first = group[0];
        const allBookingIds = group.map(b => b.bookingId);
        const allSeatNumbers = group.map(b => b.seatNumber).filter(Boolean);
        const totalAmount = group.reduce((sum, b) => sum + b.totalPrice, 0);
        
        return {
          id: first.bookingId,
          bookingIds: allBookingIds,
          bookingReference: first.confirmationCode,
          status: first.status,
          flight: {
            id: first.flightId,
            flight_id: first.flightId,
            flightNumber: first.airlineCode + String(first.flightId),
            airline: { name: first.airlineName },
            departureTime: first.formattedDepartureTime,
            arrivalTime: first.formattedArrivalTime,
            departure_time: first.departureTimestamp,
            arrival_time: first.arrivalTimestamp,
            departureDate: first.departureTimestamp ? first.departureTimestamp.split('T')[0] : '',
            duration: first.flightDuration,
            price: first.totalPrice,
            origin: { 
              code: first.originCode, 
              city: first.originCity,
              name: first.originAirportName,
              timezone: first.originTimezone
            },
            destination: { 
              code: first.destCode, 
              city: first.destCity,
              name: first.destAirportName,
              timezone: first.destTimezone
            },
          },
          seatNumbers: allSeatNumbers,
          seatClass: first.seatPriceModifier,
          passengers: group.length, // Number of bookings = number of passengers
          totalAmount,
          bookingDate: first.departureTimestamp ? first.departureTimestamp.split('T')[0] : 
                      new Date().toISOString().split('T')[0],
        };
      });
      
      setBookings(transformedBookings);
      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert(
        'Error', 
        `Failed to load bookings: ${error.response?.data?.message || error.message || 'Unknown error'}`
      );
      setBookings([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ensureNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      return true;
    }
    const requestResult = await Notifications.requestPermissionsAsync();
    return requestResult.status === 'granted';
  };

  const computeBookingHash = (items: Booking[]) => {
    return items
      .map(
        booking =>
          `${booking.bookingReference}-${booking.flight?.flightNumber || booking.flight?.id || booking.id}`
      )
      .sort()
      .join('|');
  };

  const handleReminderSelection = async (option: ReminderPreferenceOption) => {
    const now = new Date().toISOString();
    const hash = currentBookingHash ?? computeBookingHash(upcomingBookings);
    const nextPreference: ReminderPreference = {
      option,
      updatedAt: now,
      ...(option === 'skip_until_change' && hash ? { bookingHash: hash } : {}),
    };

    setReminderPreference(nextPreference);
    await saveTravelReminderPreference(nextPreference);
    if (option === 'remind_next_time') {
      reminderTriggeredRef.current = false;
    }
    setReminderPromptVisible(false);
  };

  const upcomingBookings = useMemo(
    () => bookings.filter(b => b.status === 'confirmed'),
    [bookings]
  );
  const pastBookings = useMemo(
    () => bookings.filter(b => b.status !== 'confirmed'),
    [bookings]
  );

  useEffect(() => {
    const evaluateReminder = async () => {
      if (loading || preferenceLoading) {
        return;
      }
      if (upcomingBookings.length === 0) {
        setReminderPromptVisible(false);
        reminderTriggeredRef.current = false;
        return;
      }

      const bookingHash = computeBookingHash(upcomingBookings);
      const shouldTrigger =
        !reminderPreference ||
        reminderPreference.option === 'remind_next_time' ||
        (reminderPreference.option === 'skip_until_change' &&
          reminderPreference.bookingHash !== bookingHash);

      if (reminderPreference?.option === 'never') {
        setReminderPromptVisible(false);
        return;
      }

      if (shouldTrigger && !reminderTriggeredRef.current) {
        const hasPermission = await ensureNotificationPermission();
        setCurrentBookingHash(bookingHash);

        if (hasPermission) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Upcoming trip reminder',
                body: 'You have upcoming bookings. Please arrive at the airport at least two hours before departure.',
                sound: true,
              },
              trigger: {
                seconds: 1,
              },
            });
          } catch (error) {
            console.warn('Failed to schedule reminder notification', error);
          }
        }

        reminderTriggeredRef.current = true;
        setReminderPromptVisible(true);
      }
    };

    evaluateReminder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingBookings, loading, preferenceLoading, reminderPreference]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleViewDetails = async (booking: Booking) => {
    // Navigate with the full grouped booking data
    navigation.navigate('BookingDetails', {
      booking,
    } as never);
  };

  const handleCancelBooking = (booking: Booking) => {
    const passengerText = booking.passengers > 1 
      ? `all ${booking.passengers} passengers` 
      : '1 passenger';
    
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking for ${passengerText}? This will cancel all ${booking.bookingIds.length} booking record(s).`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel all bookings in the group
              const cancelPromises = booking.bookingIds.map(id => bookingAPI.cancel(id));
              await Promise.all(cancelPromises);
              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings();
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel booking';
              Alert.alert('Error', errorMessage);
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
          <View style={styles.bookingHeaderText}>
            <Text style={styles.bookingReference}>{booking.bookingReference}</Text>
            <Text style={styles.bookingDate}>
              Booked on {new Date(booking.bookingDate).toLocaleDateString()}
            </Text>
            {booking.flight.departure_time && (
              <View style={styles.flightDateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={styles.flightDateText}>
                  Flight on {new Date(booking.flight.departure_time).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.airlineLogo}>
            <Ionicons name="airplane" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Flight Info */}
        <View style={styles.flightInfo}>
        <View style={styles.flightRoute}>
          <View style={[styles.flightPoint, styles.flightPointLeft]}>
              <Text style={styles.flightCode}>{booking.flight.origin.code}</Text>
              <Text style={styles.flightCity}>{booking.flight.origin.city}</Text>
              <Text style={styles.flightTime}>{booking.flight.departureTime}</Text>
            </View>

          <View style={styles.flightMiddle}>
            <Ionicons name="arrow-forward" size={24} color={colors.primary} />
            <Text style={styles.flightNumber}>{booking.flight.flightNumber}</Text>
          </View>

          <View style={[styles.flightPoint, styles.flightPointRight]}>
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
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleViewDetails(booking)}
          >
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

  const openReminderPreferences = () => {
    Alert.alert(
      'Reminder preferences',
      'Choose how you would like to be reminded about upcoming trips.',
      [
        {
          text: 'Remind me next time',
          onPress: () => handleReminderSelection('remind_next_time'),
        },
        {
          text: 'Skip until my bookings change',
          onPress: () => handleReminderSelection('skip_until_change'),
        },
        {
          text: 'Never show again',
          style: 'destructive',
          onPress: () => handleReminderSelection('never'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const renderReminderPrompt = () => {
    if (!reminderPromptVisible) {
      return null;
    }

    return (
      <View style={styles.reminderBanner}>
        <View style={styles.reminderBannerText}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Upcoming trip reminder</Text>
            <Text style={styles.reminderMessage}>
              You have upcoming bookings. Plan to arrive at the airport two hours early.
            </Text>
          </View>
        </View>
        <View style={styles.reminderBannerActions}>
          <TouchableOpacity style={styles.reminderActionButton} onPress={openReminderPreferences}>
            <Text style={styles.reminderActionText}>Reminder options</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reminderActionButton}
            onPress={() => handleReminderSelection('remind_next_time')}
          >
            <Text style={styles.reminderActionText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        {renderReminderPrompt()}
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
  bookingHeaderText: {
    flex: 1,
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
  flightDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  flightDateText: {
    ...typography.caption,
    color: colors.primary,
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
  flightInfo: {
    marginBottom: spacing.md,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flightPoint: {
    flex: 1,
    alignItems: 'flex-start',
  },
  flightPointLeft: {
    alignItems: 'flex-start',
  },
  flightPointRight: {
    alignItems: 'flex-end',
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
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    flex: 0.6,
  },
  flightNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  reminderBanner: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderBannerText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reminderTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  reminderMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reminderBannerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  reminderActionButton: {
    paddingVertical: spacing.xs,
  },
  reminderActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
