import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { flightAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

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

interface Flight {
  id: string;
  flightNumber: string;
  airline: { name: string; code: string };
  departureTime: string;
  arrivalTime: string;
  departure_time?: string; // UTC timestamp from backend
  arrival_time?: string; // UTC timestamp from backend
  duration: string;
  price: number;
  availableSeats: number;
  origin: { code: string; name: string; city: string; timezone?: string };
  destination: { code: string; name: string; city: string; timezone?: string };
}

export default function FlightResultsScreen({ route, navigation }: any) {
  const { origin, destination, departDate, returnDate, passengers } = route.params;
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(null);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [expandedSide, setExpandedSide] = useState<'outbound' | 'return'>('outbound');
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    airlines: [] as string[],
  });

  useEffect(() => {
    loadOutboundFlights();
  }, []);

  useEffect(() => {
    if (selectedOutbound && returnDate) {
      loadReturnFlights();
    }
  }, [selectedOutbound, returnDate]);

  const loadOutboundFlights = async () => {
    try {
      setLoading(true);
      
      // Extract airport codes from origin and destination
      const extractAirportCode = (input: string) => {
        const match = input.match(/\((\w{3})\)$/);
        return match ? match[1] : input;
      };
      
      const originCode = extractAirportCode(origin);
      const destCode = extractAirportCode(destination);
      
      if (!originCode || !destCode) {
        Alert.alert('Invalid Selection', 'Please select valid origin and destination airports');
        setLoading(false);
        return;
      }

      // Call API with search filters - let backend do the filtering
      const response = await flightAPI.search({
        departure_airport: originCode,
        destination_airport: destCode,
        date: departDate,
      });
      
      if (response.data?.success && response.data?.data) {
        // Map flights to our format
        const filteredFlights = response.data.data
          .map((flight: any) => {
            const departureTime = new Date(flight.departure_time);
            const arrivalTime = new Date(flight.arrival_time);
            const durationMs = arrivalTime.getTime() - departureTime.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const originAirportCode = flight.route?.origin_airport_code || '';
            const destAirportCode = flight.route?.destination_airport_code || '';
            
            return {
              id: String(flight.flight_id),
              flight_id: flight.flight_id, // Keep original flight_id for API calls
              flightNumber: `${flight.route?.airline?.airline_code || 'FP'}${flight.flight_id}`,
              airline: { 
                name: flight.route?.airline?.airline_name || 'FlyPorter', 
                code: flight.route?.airline?.airline_code || 'FP' 
              },
              departureTime: departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              arrivalTime: arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              departure_time: flight.departure_time, // Keep original UTC timestamp
              arrival_time: flight.arrival_time, // Keep original UTC timestamp
              duration: `${hours}h ${minutes}m`,
              price: parseFloat(flight.base_price || '0'),
              availableSeats: flight.available_seats || flight.seats?.filter((s: any) => s.is_available).length || 0,
              origin: { 
                code: originAirportCode,
                name: flight.route?.origin_airport?.airport_name || '',
                city: flight.route?.origin_airport?.city_name || '',
                timezone: flight.route?.origin_airport?.city?.timezone || getAirportTimezone(originAirportCode)
              },
              destination: { 
                code: destAirportCode,
                name: flight.route?.destination_airport?.airport_name || '',
                city: flight.route?.destination_airport?.city_name || '',
                timezone: flight.route?.destination_airport?.city?.timezone || getAirportTimezone(destAirportCode)
              },
            };
          });
        
        setOutboundFlights(filteredFlights);
      } else {
        setOutboundFlights([]);
      }
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load flights. Please try again.');
      setOutboundFlights([]);
      setLoading(false);
    }
  };

  const loadReturnFlights = async () => {
    try {
      setLoadingReturn(true);
      
      // Extract airport codes - reverse for return trip
      const extractAirportCode = (input: string) => {
        const match = input.match(/\((\w{3})\)$/);
        return match ? match[1] : input;
      };
      
      const originCode = extractAirportCode(destination); // Reverse for return
      const destCode = extractAirportCode(origin); // Reverse for return
      
      if (!originCode || !destCode) {
        setLoadingReturn(false);
        return;
      }

      // Call API with search filters - let backend do the filtering
      const response = await flightAPI.search({
        departure_airport: originCode,
        destination_airport: destCode,
        date: returnDate,
      });
      
      if (response.data?.success && response.data?.data) {
        // Map flights to our format
        const filteredFlights = response.data.data
          .map((flight: any) => {
            const departureTime = new Date(flight.departure_time);
            const arrivalTime = new Date(flight.arrival_time);
            const durationMs = arrivalTime.getTime() - departureTime.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const originAirportCode = flight.route?.origin_airport_code || '';
            const destAirportCode = flight.route?.destination_airport_code || '';
            
            return {
              id: String(flight.flight_id),
              flight_id: flight.flight_id, // Keep original flight_id for API calls
              flightNumber: `${flight.route?.airline?.airline_code || 'FP'}${flight.flight_id}`,
              airline: { 
                name: flight.route?.airline?.airline_name || 'FlyPorter', 
                code: flight.route?.airline?.airline_code || 'FP' 
              },
              departureTime: departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              arrivalTime: arrivalTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              departure_time: flight.departure_time, // Keep original UTC timestamp
              arrival_time: flight.arrival_time, // Keep original UTC timestamp
              duration: `${hours}h ${minutes}m`,
              price: parseFloat(flight.base_price || '0'),
              availableSeats: flight.available_seats || flight.seats?.filter((s: any) => s.is_available).length || 0,
              origin: { 
                code: originAirportCode,
                name: flight.route?.origin_airport?.airport_name || '',
                city: flight.route?.origin_airport?.city_name || '',
                timezone: flight.route?.origin_airport?.city?.timezone || getAirportTimezone(originAirportCode)
              },
              destination: { 
                code: destAirportCode,
                name: flight.route?.destination_airport?.airport_name || '',
                city: flight.route?.destination_airport?.city_name || '',
                timezone: flight.route?.destination_airport?.city?.timezone || getAirportTimezone(destAirportCode)
              },
            };
          });
        
        setReturnFlights(filteredFlights);
      } else {
        setReturnFlights([]);
      }
      setLoadingReturn(false);
    } catch (error: any) {
      setReturnFlights([]);
      setLoadingReturn(false);
    }
  };

  const handleSelectOutbound = (flight: Flight) => {
    // Allow selection without authentication - user can view flights
    setSelectedOutbound(flight);
    setSelectedReturn(null); // Reset return selection when outbound changes
    if (returnDate) {
      setExpandedSide('return'); // Auto expand return side after selecting outbound
    }
  };

  const handleSelectReturn = (flight: Flight) => {
    // Allow selection without authentication - user can view flights
    setSelectedReturn(flight);
  };

  const handleSideToggle = (side: 'outbound' | 'return') => {
    if (side === 'return' && !selectedOutbound) {
      Alert.alert('Select Depart First', 'Please select a depart flight first');
      return;
    }
    setExpandedSide(side);
  };

  const handleContinue = async () => {
    if (!isAuthenticated) {
      // Store the pending navigation before redirecting to login
      try {
        const pendingNavigation = {
          screen: 'FlightDetails',
          params: returnDate ? {
            outboundFlight: selectedOutbound,
            returnFlight: selectedReturn,
            passengers,
            isRoundTrip: true,
          } : {
            flight: selectedOutbound,
            passengers,
            isRoundTrip: false,
          },
          // Also store search params to restore FlightResults if needed
          searchParams: {
            origin,
            destination,
            departDate,
            returnDate,
            passengers,
          },
        };
        await AsyncStorage.setItem('pendingNavigation', JSON.stringify(pendingNavigation));
      } catch (error) {
        // Continue to login even if storage fails
      }
      navigation.navigate('Login');
      return;
    }

    if (returnDate) {
      // Round trip - must have both flights selected
      if (!selectedOutbound || !selectedReturn) {
        Alert.alert(
          'Incomplete Selection',
          'Please select both depart and return flights'
        );
        return;
      }
      navigation.navigate('FlightDetails', {
        outboundFlight: { ...selectedOutbound, departureDate: departDate },
        returnFlight: { ...selectedReturn, departureDate: returnDate },
        passengers,
        isRoundTrip: true,
      });
    } else {
      // One way - only need outbound
      if (!selectedOutbound) {
        Alert.alert('Please Select', 'Please select a flight to continue');
        return;
      }
      navigation.navigate('FlightDetails', {
        flight: { ...selectedOutbound, departureDate: departDate },
        passengers,
        isRoundTrip: false,
      });
    }
  };

  // Format time in city timezone (without timezone abbreviation)
  const formatTimeWithTimezone = (timestamp: string, cityTimezone?: string): string => {
    if (!timestamp) return '';
    
    try {
      // If it's already just a time (HH:MM), return as is
      if (timestamp.match(/^\d{2}:\d{2}$/)) {
        return timestamp;
      }
      
      // Parse UTC timestamp
      const date = new Date(timestamp);
      
      // If timezone is provided, format time in that timezone
      if (cityTimezone) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: cityTimezone,
        });
      }
      
      // Fallback to local timezone
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  const renderFlightCard = (flight: Flight, isSelected: boolean, onSelect: (flight: Flight) => void) => {
    // Format times with timezone
    const departureTimeDisplay = formatTimeWithTimezone(
      flight.departure_time || flight.departureTime,
      flight.origin.timezone
    );
    const arrivalTimeDisplay = formatTimeWithTimezone(
      flight.arrival_time || flight.arrivalTime,
      flight.destination.timezone
    );

    return (
      <TouchableOpacity
        key={flight.id}
        style={[
          styles.flightCard,
          isSelected && styles.selectedFlightCard,
        ]}
        onPress={() => onSelect(flight)}
      >
        <View style={styles.flightCardContent}>
          {/* Times and Price Row */}
          <View style={styles.flightTopSection}>
            {/* Departure */}
            <View style={styles.flightTimeSection}>
              <Text style={styles.flightTimeLarge}>{departureTimeDisplay}</Text>
              <Text style={styles.flightAirportCode}>{flight.origin.code}</Text>
            </View>

            {/* Spacer for duration line */}
            <View style={styles.flightMiddleSpacer} />

            {/* Arrival */}
            <View style={styles.flightTimeSection}>
              <Text style={styles.flightTimeLarge}>{arrivalTimeDisplay}</Text>
              <Text style={styles.flightAirportCode}>{flight.destination.code}</Text>
            </View>

            {/* Price */}
            <Text style={styles.flightPrice}>${flight.price}</Text>
          </View>

          {/* Duration Line */}
          <View style={styles.flightDurationRow}>
            <View style={styles.flightDot} />
            <View style={styles.flightLine} />
            <View style={styles.flightDurationBadge}>
              <Text style={styles.flightDuration}>{flight.duration}</Text>
            </View>
            <View style={styles.flightLine} />
            <View style={styles.flightDot} />
          </View>

          {/* Non-stop label */}
          <Text style={styles.flightNonStop}>Non-stop</Text>
        </View>

        {/* Selection Status */}
        {isSelected && (
          <View style={styles.selectionStatus}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.selectionText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTextTop}>Searching for flights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {returnDate ? (
        // Round trip - Split view
        <View style={styles.splitContainer}>
          {/* Outbound Side */}
          <TouchableOpacity
            style={[
              styles.splitSide,
              expandedSide === 'outbound' && styles.expandedSide,
              expandedSide !== 'outbound' && styles.collapsedSide,
            ]}
            onPress={() => handleSideToggle('outbound')}
            activeOpacity={0.9}
          >
            <View style={styles.sideHeader}>
              <Text style={styles.sideTitle}>Depart</Text>
              <Text style={styles.sideDate}>{departDate}</Text>
              {selectedOutbound && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            
            {expandedSide === 'outbound' ? (
              <ScrollView style={styles.sideContent} nestedScrollEnabled>
                {outboundFlights.length === 0 && !loading && (
                  <Text style={styles.noFlightsText}>No flights found</Text>
                )}
                {outboundFlights.map((flight) =>
                  renderFlightCard(
                    flight,
                    selectedOutbound?.id === flight.id,
                    handleSelectOutbound
                  )
                )}
              </ScrollView>
            ) : (
              <View style={styles.collapsedContent}>
                {selectedOutbound ? (
                  <View style={styles.miniFlightCard}>
                    <Text style={styles.miniFlightTime}>
                      {formatTimeWithTimezone(selectedOutbound.departure_time || selectedOutbound.departureTime, selectedOutbound.origin.timezone)} → {formatTimeWithTimezone(selectedOutbound.arrival_time || selectedOutbound.arrivalTime, selectedOutbound.destination.timezone)}
                    </Text>
                    <Text style={styles.miniFlightPrice}>${selectedOutbound.price}</Text>
                  </View>
                ) : (
                  <Text style={styles.tapToSelectText}>Tap to select</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Return Side */}
          <TouchableOpacity
            style={[
              styles.splitSide,
              styles.splitSideRight,
              expandedSide === 'return' && styles.expandedSide,
              expandedSide !== 'return' && styles.collapsedSide,
            ]}
            onPress={() => handleSideToggle('return')}
            activeOpacity={0.9}
            disabled={!selectedOutbound}
          >
            <View style={styles.sideHeader}>
              <View style={styles.sideTitleRow}>
                <Text style={styles.sideTitle}>Return</Text>
                {!selectedReturn && <Text style={styles.requiredTextMini}>Required</Text>}
              </View>
              <Text style={styles.sideDate}>{returnDate}</Text>
              {selectedReturn && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            
            {expandedSide === 'return' ? (
              <ScrollView style={styles.sideContent} nestedScrollEnabled>
                {loadingReturn ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <>
                    {returnFlights.length === 0 ? (
                      <Text style={styles.noFlightsText}>No return flights found</Text>
                    ) : (
                      returnFlights.map((flight) =>
                        renderFlightCard(
                          flight,
                          selectedReturn?.id === flight.id,
                          handleSelectReturn
                        )
                      )
                    )}
                  </>
                )}
              </ScrollView>
            ) : (
              <View style={styles.collapsedContent}>
                {selectedReturn ? (
                  <View style={styles.miniFlightCard}>
                    <Text style={styles.miniFlightTime}>
                      {formatTimeWithTimezone(selectedReturn.departure_time || selectedReturn.departureTime, selectedReturn.origin.timezone)} → {formatTimeWithTimezone(selectedReturn.arrival_time || selectedReturn.arrivalTime, selectedReturn.destination.timezone)}
                    </Text>
                    <Text style={styles.miniFlightPrice}>${selectedReturn.price}</Text>
                  </View>
                ) : selectedOutbound ? (
                  <Text style={styles.tapToSelectText}>Tap to select</Text>
                ) : (
                  <Text style={styles.tapToSelectTextDisabled}>Select depart first</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        // One way - Normal scroll view
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Flights</Text>
            <Text style={styles.sectionSubtitle}>
              {departDate} • {origin} → {destination}
            </Text>
            
            {outboundFlights.length === 0 && !loading && (
              <Text style={styles.noFlightsText}>No flights found</Text>
            )}
            
            {outboundFlights.map((flight) =>
              renderFlightCard(
                flight,
                selectedOutbound?.id === flight.id,
                handleSelectOutbound
              )
            )}
          </View>
        </ScrollView>
      )}

      {/* Next Button - Always visible at bottom */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceAmount}>
            ${returnDate && selectedOutbound && selectedReturn
              ? ((selectedOutbound.price + selectedReturn.price) * passengers).toFixed(2)
              : selectedOutbound
              ? (selectedOutbound.price * passengers).toFixed(2)
              : '0.00'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedOutbound || (returnDate && !selectedReturn)) && styles.nextButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedOutbound || (returnDate && !selectedReturn)}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTextTop: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  resultsHeader: {
    ...typography.h4,
    color: colors.text,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  requiredBadge: {
    backgroundColor: colors.warning || '#FF9800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  requiredText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  flightCard: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectedFlightCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface || '#f5f5f5',
  },
  flightCardContent: {
    flexDirection: 'column',
  },
  flightTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  flightTimeSection: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  flightTimeLarge: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 26,
  },
  flightAirportCode: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  flightMiddleSpacer: {
    flex: 1,
  },
  flightPrice: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
    marginLeft: spacing.md,
  },
  flightDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 70, // Space for the price column
    marginBottom: 6,
  },
  flightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    opacity: 0.4,
  },
  flightLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.3,
  },
  flightDurationBadge: {
    backgroundColor: colors.surface || '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  flightDuration: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  flightNonStop: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  selectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  selectionText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoBannerText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
  },
  noFlightsText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  continueSection: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
    fontWeight: '600',
  },
  // Split view styles
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  splitSide: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  splitSideRight: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  expandedSide: {
    flex: 2,
    backgroundColor: colors.background,
  },
  collapsedSide: {
    flex: 1,
    backgroundColor: colors.surface || '#f5f5f5',
  },
  sideHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sideTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  sideDate: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  requiredTextMini: {
    ...typography.caption,
    color: colors.warning || '#FF9800',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
  },
  sideContent: {
    flex: 1,
  },
  collapsedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  miniFlightCard: {
    backgroundColor: '#fff',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  miniFlightTime: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  miniFlightPrice: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '700',
  },
  tapToSelectText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tapToSelectTextDisabled: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.5,
  },
  footer: {
    backgroundColor: '#fff',
    padding: spacing.md,
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
    marginBottom: spacing.sm,
  },
  footerPriceLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  footerPriceAmount: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '600',
  },
});

