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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { flightAPI } from '../../services/api';
import { formatDate } from '../../utils/formatters';

interface Flight {
  id: string;
  flightNumber: string;
  airline: { name: string; code: string };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  origin: { code: string; name: string; city: string };
  destination: { code: string; name: string; city: string };
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
      // Mock data for demonstration
      // TODO: Replace with actual API call
      setTimeout(() => {
        const mockFlights: Flight[] = [
          {
            id: '1',
            flightNumber: 'FP101',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '08:00',
            arrivalTime: '11:30',
            duration: '3h 30m',
            price: 299,
            availableSeats: 45,
            origin: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
            destination: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          },
          {
            id: '2',
            flightNumber: 'FP203',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '12:30',
            arrivalTime: '16:00',
            duration: '3h 30m',
            price: 349,
            availableSeats: 23,
            origin: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
            destination: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          },
          {
            id: '3',
            flightNumber: 'FP405',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '18:00',
            arrivalTime: '21:30',
            duration: '3h 30m',
            price: 279,
            availableSeats: 67,
            origin: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
            destination: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          },
        ];
        setOutboundFlights(mockFlights);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading flights:', error);
      setLoading(false);
    }
  };

  const loadReturnFlights = async () => {
    try {
      setLoadingReturn(true);
      // Mock data for return flights
      // TODO: Replace with actual API call
      setTimeout(() => {
        const mockReturnFlights: Flight[] = [
          {
            id: 'r1',
            flightNumber: 'FP102',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '09:00',
            arrivalTime: '12:30',
            duration: '3h 30m',
            price: 299,
            availableSeats: 52,
            origin: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
            destination: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
          },
          {
            id: 'r2',
            flightNumber: 'FP204',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '14:00',
            arrivalTime: '17:30',
            duration: '3h 30m',
            price: 349,
            availableSeats: 31,
            origin: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
            destination: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
          },
          {
            id: 'r3',
            flightNumber: 'FP406',
            airline: { name: 'FlyPorter', code: 'FP' },
            departureTime: '19:00',
            arrivalTime: '22:30',
            duration: '3h 30m',
            price: 279,
            availableSeats: 58,
            origin: { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
            destination: { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
          },
        ];
        setReturnFlights(mockReturnFlights);
        setLoadingReturn(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading return flights:', error);
      setLoadingReturn(false);
    }
  };

  const handleSelectOutbound = (flight: Flight) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setSelectedOutbound(flight);
    setSelectedReturn(null); // Reset return selection when outbound changes
    if (returnDate) {
      setExpandedSide('return'); // Auto expand return side after selecting outbound
    }
  };

  const handleSelectReturn = (flight: Flight) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setSelectedReturn(flight);
  };

  const handleSideToggle = (side: 'outbound' | 'return') => {
    if (side === 'return' && !selectedOutbound) {
      Alert.alert('Select Depart First', 'Please select a depart flight first');
      return;
    }
    setExpandedSide(side);
  };

  const handleContinue = () => {
    if (!isAuthenticated) {
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
        outboundFlight: selectedOutbound,
        returnFlight: selectedReturn,
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
        flight: selectedOutbound,
        passengers,
        isRoundTrip: false,
      });
    }
  };

  const renderFlightCard = (flight: Flight, isSelected: boolean, onSelect: (flight: Flight) => void) => (
    <TouchableOpacity
      key={flight.id}
      style={[
        styles.flightCard,
        isSelected && styles.selectedFlightCard,
      ]}
      onPress={() => onSelect(flight)}
    >
      <View style={styles.flightCardContent}>
        {/* Top Row: Times and Price */}
        <View style={styles.flightTopRow}>
          <View style={styles.flightTimesRow}>
            <Text style={styles.flightTimeCompact}>{flight.departureTime}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} style={styles.arrowIcon} />
            <Text style={styles.flightTimeCompact}>{flight.arrivalTime}</Text>
          </View>
          <Text style={styles.flightPrice}>${flight.price}</Text>
        </View>

        {/* Bottom Row: Airports and Duration */}
        <View style={styles.flightBottomRow}>
          <Text style={styles.flightAirportCompact}>{flight.origin.code}</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
            <Text style={styles.durationTextCompact}>{flight.duration}</Text>
          </View>
          <Text style={styles.flightAirportCompact}>{flight.destination.code}</Text>
        </View>
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
      {/* Search Summary */}
      <View style={styles.searchSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Route:</Text>
          <View style={styles.routeDisplay}>
            {returnDate ? (
              <>
                <Text style={styles.summaryValue}>{origin}</Text>
                <Ionicons name="repeat" size={18} color={colors.primary} style={styles.routeIcon} />
                <Text style={styles.summaryValue}>{destination}</Text>
              </>
            ) : (
              <>
                <Text style={styles.summaryValue}>{origin}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} style={styles.routeIcon} />
                <Text style={styles.summaryValue}>{destination}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>
            {returnDate 
              ? `${formatDate(departDate)} - ${formatDate(returnDate)}`
              : formatDate(departDate)
            }
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passengers:</Text>
          <Text style={styles.summaryValue}>{passengers}</Text>
        </View>
      </View>

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
                      {selectedOutbound.departureTime} → {selectedOutbound.arrivalTime}
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
                      {selectedReturn.departureTime} → {selectedReturn.arrivalTime}
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
  searchSummary: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
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
    gap: spacing.xs,
  },
  flightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flightTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flightTimeCompact: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  arrowIcon: {
    marginHorizontal: spacing.xs,
  },
  flightPrice: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  flightBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  flightAirportCompact: {
    ...typography.body2,
    color: colors.textSecondary,
    fontSize: 12,
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
    flexDirection: 'column',
    gap: 2,
  },
  durationTextCompact: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
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
  routeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  routeIcon: {
    marginHorizontal: spacing.xs,
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

