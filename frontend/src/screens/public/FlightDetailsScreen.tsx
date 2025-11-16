import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { flightAPI } from '../../services/api';

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

export default function FlightDetailsScreen({ route, navigation }: any) {
  const { 
    flight, 
    outboundFlight, 
    returnFlight, 
    passengers, 
    isRoundTrip,
    seatNumber, // Seat number if viewing from booking
    bookingId, // Booking ID if viewing from booking
  } = route.params;
  const { isAuthenticated } = useAuth();

  const [detailedFlight, setDetailedFlight] = useState<any>(null);
  const [detailedOutbound, setDetailedOutbound] = useState<any>(null);
  const [detailedReturn, setDetailedReturn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Use the appropriate flight(s) based on trip type
  const mainFlight = isRoundTrip ? outboundFlight : flight;

  useEffect(() => {
    // Only fetch flight details if not viewing from a booking
    if (!bookingId) {
      loadFlightDetails();
    } else {
      // Viewing from booking - use data from route params
      setLoading(false);
    }
  }, []);

  const loadFlightDetails = async () => {
    try {
      setLoading(true);
      
      if (isRoundTrip) {
        // Fetch both outbound and return flight details
        const [outboundResponse, returnResponse] = await Promise.all([
          flightAPI.getById(outboundFlight.flight_id || outboundFlight.id),
          flightAPI.getById(returnFlight.flight_id || returnFlight.id),
        ]);
        
        setDetailedOutbound(outboundResponse.data?.data || outboundResponse.data);
        setDetailedReturn(returnResponse.data?.data || returnResponse.data);
      } else {
        // Fetch single flight details
        const flightId = flight.flight_id || flight.id;
        
        if (!flightId) {
          // No flight ID available, use cached data
          console.log('No flight ID available, using cached data from route params');
          setLoading(false);
          return;
        }
        
        const response = await flightAPI.getById(flightId);
        setDetailedFlight(response.data?.data || response.data);
      }
      
      setLoading(false);
    } catch (error: any) {
      // Fallback to cached data from previous screen without showing error popup
      console.log('Failed to load flight details, using cached data:', error.message);
      setLoading(false);
    }
  };

  // Format date or timestamp to display format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
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
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  // Format UTC timestamp to specific city timezone (without timezone abbreviation)
  const formatTimeInCityTimezone = (timestamp: string, cityTimezone?: string) => {
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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading flight details...</Text>
      </View>
    );
  }

  const handleBookFlight = () => {
    // Allow unauthenticated users to proceed - they'll be prompted to login at payment
    if (isRoundTrip) {
      // For round trip, pass both flights
      navigation.navigate('SeatSelection', { 
        outboundFlight, 
        returnFlight,
        passengers,
        isRoundTrip: true
      });
    } else {
      // For one way, pass single flight
      navigation.navigate('SeatSelection', { 
        flight, 
        passengers,
        isRoundTrip: false
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Flight Header */}
        <View style={styles.headerCard}>
          <View style={styles.airlineHeader}>
            <View style={styles.airlineLogo}>
              <Ionicons name="airplane" size={32} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.airlineName}>{mainFlight.airline.name}</Text>
              <Text style={styles.flightNumber}>
                {isRoundTrip 
                  ? `Outbound: ${outboundFlight.flightNumber} | Return: ${returnFlight.flightNumber}`
                  : `Flight ${flight.flightNumber}`
                }
              </Text>
            </View>
          </View>

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.totalPrice}>
              ${isRoundTrip 
                ? ((outboundFlight.price + returnFlight.price) * passengers).toFixed(2)
                : (flight.price * passengers).toFixed(2)
              }
            </Text>
            <Text style={styles.priceBreakdown}>
              {isRoundTrip 
                ? `$${outboundFlight.price + returnFlight.price} × ${passengers} passenger${passengers > 1 ? 's' : ''}`
                : `$${flight.price} × ${passengers} passenger${passengers > 1 ? 's' : ''}`
              }
            </Text>
          </View>
        </View>

        {/* Route Information */}
        {isRoundTrip ? (
          <>
            {/* Outbound Flight Route */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Outbound Flight</Text>
              
              <View style={styles.routeContainer}>
                <View style={styles.routeStop}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTime}>
                      {formatTimeInCityTimezone(
                        detailedOutbound?.departure_time || outboundFlight.departure_time || outboundFlight.departureTime,
                        detailedOutbound?.origin?.timezone || outboundFlight.origin?.timezone || getAirportTimezone(outboundFlight.origin.code)
                      )}
                    </Text>
                    <Text style={styles.routeCode}>{outboundFlight.origin.code}</Text>
                    <Text style={styles.routeName}>{outboundFlight.origin.name}</Text>
                    <Text style={styles.routeCity}>{outboundFlight.origin.city}</Text>
                  </View>
                </View>

                <View style={styles.routeConnector}>
                  <View style={styles.routeLine} />
                  <View style={styles.durationBox}>
                    <Ionicons name="time" size={16} color={colors.textSecondary} />
                    <Text style={styles.durationText}>{outboundFlight.duration}</Text>
                  </View>
                </View>

                <View style={styles.routeStop}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTime}>
                      {formatTimeInCityTimezone(
                        detailedOutbound?.arrival_time || outboundFlight.arrival_time || outboundFlight.arrivalTime,
                        detailedOutbound?.destination?.timezone || outboundFlight.destination?.timezone || getAirportTimezone(outboundFlight.destination.code)
                      )}
                    </Text>
                    <Text style={styles.routeCode}>{outboundFlight.destination.code}</Text>
                    <Text style={styles.routeName}>{outboundFlight.destination.name}</Text>
                    <Text style={styles.routeCity}>{outboundFlight.destination.city}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Return Flight Route */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Return Flight</Text>
              
              <View style={styles.routeContainer}>
                <View style={styles.routeStop}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTime}>
                      {formatTimeInCityTimezone(
                        detailedReturn?.departure_time || returnFlight.departure_time || returnFlight.departureTime,
                        detailedReturn?.origin?.timezone || returnFlight.origin?.timezone || getAirportTimezone(returnFlight.origin.code)
                      )}
                    </Text>
                    <Text style={styles.routeCode}>{returnFlight.origin.code}</Text>
                    <Text style={styles.routeName}>{returnFlight.origin.name}</Text>
                    <Text style={styles.routeCity}>{returnFlight.origin.city}</Text>
                  </View>
                </View>

                <View style={styles.routeConnector}>
                  <View style={styles.routeLine} />
                  <View style={styles.durationBox}>
                    <Ionicons name="time" size={16} color={colors.textSecondary} />
                    <Text style={styles.durationText}>{returnFlight.duration}</Text>
                  </View>
                </View>

                <View style={styles.routeStop}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeTime}>
                      {formatTimeInCityTimezone(
                        detailedReturn?.arrival_time || returnFlight.arrival_time || returnFlight.arrivalTime,
                        detailedReturn?.destination?.timezone || returnFlight.destination?.timezone || getAirportTimezone(returnFlight.destination.code)
                      )}
                    </Text>
                    <Text style={styles.routeCode}>{returnFlight.destination.code}</Text>
                    <Text style={styles.routeName}>{returnFlight.destination.name}</Text>
                    <Text style={styles.routeCity}>{returnFlight.destination.city}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Flight Route</Text>
            
            <View style={styles.routeContainer}>
              <View style={styles.routeStop}>
                <View style={styles.routeDot} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeTime}>
                    {formatTimeInCityTimezone(
                      detailedFlight?.departure_time || mainFlight.departure_time || mainFlight.departureTime,
                      detailedFlight?.origin?.timezone || mainFlight.origin?.timezone || getAirportTimezone(mainFlight.origin.code)
                    )}
                  </Text>
                  <Text style={styles.routeCode}>{mainFlight.origin.code}</Text>
                  <Text style={styles.routeName}>{mainFlight.origin.name}</Text>
                  <Text style={styles.routeCity}>{mainFlight.origin.city}</Text>
                </View>
              </View>

              <View style={styles.routeConnector}>
                <View style={styles.routeLine} />
                <View style={styles.durationBox}>
                  <Ionicons name="time" size={16} color={colors.textSecondary} />
                  <Text style={styles.durationText}>{mainFlight.duration}</Text>
                </View>
              </View>

              <View style={styles.routeStop}>
                <View style={styles.routeDot} />
                <View style={styles.routeInfo}>
                  <Text style={styles.routeTime}>
                    {formatTimeInCityTimezone(
                      detailedFlight?.arrival_time || mainFlight.arrival_time || mainFlight.arrivalTime,
                      detailedFlight?.destination?.timezone || mainFlight.destination?.timezone || getAirportTimezone(mainFlight.destination.code)
                    )}
                  </Text>
                  <Text style={styles.routeCode}>{mainFlight.destination.code}</Text>
                  <Text style={styles.routeName}>{mainFlight.destination.name}</Text>
                  <Text style={styles.routeCity}>{mainFlight.destination.city}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Flight Details */}
        {isRoundTrip ? (
          <>
            {/* Outbound Flight Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Outbound Flight Details</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Depart Date</Text>
                </View>
                <Text style={styles.detailValue}>
                  {detailedOutbound?.departure_time 
                    ? formatDate(detailedOutbound.departure_time)
                    : (outboundFlight.departureDate || formatDate(new Date().toISOString()))
                  }
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="people" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Passengers</Text>
                </View>
                <Text style={styles.detailValue}>{passengers}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="airplane" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Aircraft</Text>
                </View>
                <Text style={styles.detailValue}>
                  {detailedOutbound?.aircraft_type || 'Boeing 737-800'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.detailLabel}>Available Seats</Text>
                </View>
                <Text style={styles.detailValue}>
                  {detailedOutbound?.available_seats || outboundFlight.availableSeats}
                </Text>
              </View>
            </View>

            {/* Return Flight Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Return Flight Details</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Return Date</Text>
                </View>
                <Text style={styles.detailValue}>
                  {detailedReturn?.departure_time 
                    ? formatDate(detailedReturn.departure_time)
                    : (returnFlight.departureDate || formatDate(new Date().toISOString()))
                  }
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="people" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Passengers</Text>
                </View>
                <Text style={styles.detailValue}>{passengers}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="airplane" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailLabel}>Aircraft</Text>
                </View>
                <Text style={styles.detailValue}>
                  {detailedReturn?.aircraft_type || 'Boeing 737-800'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.detailLabel}>Available Seats</Text>
                </View>
                <Text style={styles.detailValue}>
                  {detailedReturn?.available_seats || returnFlight.availableSeats}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Flight Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Date</Text>
              </View>
              <Text style={styles.detailValue}>
                {detailedFlight?.departure_time 
                  ? formatDate(detailedFlight.departure_time)
                  : (flight.departureDate || formatDate(new Date().toISOString()))
                }
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={20} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Passengers</Text>
              </View>
              <Text style={styles.detailValue}>{passengers}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="airplane" size={20} color={colors.textSecondary} />
                <Text style={styles.detailLabel}>Aircraft</Text>
              </View>
              <Text style={styles.detailValue}>
                {detailedFlight?.aircraft_type || 'Boeing 737-800'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.detailLabel}>
                  {seatNumber ? 'Seat Number' : 'Available Seats'}
                </Text>
              </View>
              <Text style={styles.detailValue}>
                {seatNumber || (detailedFlight?.available_seats ?? mainFlight.availableSeats) || 'N/A'}
              </Text>
            </View>
          </View>
        )}

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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book Button - Only show if not viewing from booking */}
      {!bookingId && (
        <View style={styles.footer}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Total</Text>
            <Text style={styles.footerPriceAmount}>
              ${isRoundTrip 
                ? ((outboundFlight.price + returnFlight.price) * passengers).toFixed(2)
                : (flight.price * passengers).toFixed(2)
              }
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookFlight}
          >
            <Text style={styles.bookButtonText}>
              Select Seats
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
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
  airlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  airlineLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  airlineName: {
    ...typography.h3,
    color: colors.text,
  },
  flightNumber: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  priceBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  priceBreakdown: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: '#fff',
    marginTop: spacing.md,
    padding: spacing.lg,
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
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: spacing.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeTime: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  routeCode: {
    ...typography.h4,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  routeName: {
    ...typography.body1,
    color: colors.text,
    marginTop: spacing.xs,
  },
  routeCity: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    marginVertical: spacing.sm,
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
    color: colors.text,
  },
  detailValue: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
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
  footerPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerPriceLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  footerPriceAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  bookButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  bookButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

