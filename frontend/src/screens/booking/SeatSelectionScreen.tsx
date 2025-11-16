import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { seatAPI, bookingAPI } from '../../services/api';

interface Seat {
  id: string;
  row: number;
  column: string;
  type: 'economy' | 'business' | 'first';
  status: 'available' | 'occupied' | 'selected';
  price: number;
  price_modifier: number; // From API: 1.0 (economy), 1.5 (business), 2.0 (first)
  seat_number: string;
}

export default function SeatSelectionScreen({ route, navigation }: any) {
  const { 
    flight, 
    outboundFlight, 
    returnFlight, 
    passengers, 
    isRoundTrip,
    bookingId,  // Optional: if changing seat from booking details
    currentSeatNumber,  // Optional: current seat to pre-select
    currentSeatClass, // Optional: current seat price modifier to filter seats
  } = route.params;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the appropriate flight
  const currentFlight = isRoundTrip ? outboundFlight : flight;
  const flightId = currentFlight.flight_id || currentFlight.id;

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const response = await seatAPI.getSeatsForFlight(flightId);
      
      // Backend returns { success, data: [...seats] }
      const seatData = response.data?.data || response.data || [];
      
      // Transform API seats to our format
      const transformedSeats: Seat[] = seatData.map((seat: any) => {
        // Extract row and column from seat_number (e.g., "1A" -> row: 1, column: "A")
        const match = seat.seat_number.match(/^(\d+)([A-F])$/);
        const row = match ? parseInt(match[1]) : 0;
        const column = match ? match[2] : 'A';
        
        // Get price_modifier from API response (defaults to 1.0 for economy)
        const priceModifier = parseFloat(seat.price_modifier || 1.0);
        
        // Determine seat type based on price_modifier
        let seatType: 'economy' | 'business' | 'first' = 'economy';
        if (priceModifier >= 2.0) seatType = 'first';
        else if (priceModifier > 1.0) seatType = 'business';
        
        return {
          id: seat.seat_number,
          row,
          column,
          type: seatType,
          status: seat.is_available ? 'available' : 'occupied',
          price: 0, // Deprecated - use price_modifier instead
          price_modifier: priceModifier,
          seat_number: seat.seat_number,
        };
      });
      
      // Sort by row and column
      transformedSeats.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.column.localeCompare(b.column);
      });
      
      // If changing seat (bookingId present), filter seats to only show same class
      let filteredSeats = transformedSeats;
      if (bookingId && currentSeatClass !== undefined) {
        filteredSeats = transformedSeats.filter(seat => 
          Math.abs(seat.price_modifier - currentSeatClass) < 0.01 // Same class only
        );
      }
      
      setSeats(filteredSeats);
      
      // Pre-select current seat if changing from booking details
      if (currentSeatNumber && bookingId) {
        setSelectedSeats([currentSeatNumber]);
      }
      
      setLoading(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load seats. Please try again.');
      setLoading(false);
    }
  };

  const handleSeatSelect = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'occupied') return;

    if (selectedSeats.includes(seatId)) {
      // Deselect the seat
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      if (selectedSeats.length >= passengers) {
        // Maximum seats reached - replace the first selected seat with the new one
        const newSelectedSeats = [...selectedSeats];
        newSelectedSeats.shift(); // Remove the first selected seat
        newSelectedSeats.push(seatId); // Add the new seat
        setSelectedSeats(newSelectedSeats);
      } else {
        // Add the seat to selection
        setSelectedSeats([...selectedSeats, seatId]);
      }
    }
  };

  const handleContinue = async () => {
    if (selectedSeats.length !== passengers) {
      Alert.alert(
        'Incomplete Selection',
        `Please select ${passengers} seat${passengers > 1 ? 's' : ''}`
      );
      return;
    }

    const selectedSeatDetails = seats.filter(s => selectedSeats.includes(s.id));
    
    // Get the price_modifier for the first selected seat (for single passenger)
    const firstSeatModifier = selectedSeatDetails[0]?.price_modifier || 1.0;

    // If updating an existing booking (from booking details)
    if (bookingId && currentSeatNumber) {
      const newSeatNumber = selectedSeats[0];
      
      // Check if seat actually changed
      if (newSeatNumber === currentSeatNumber) {
        Alert.alert('No Change', 'You selected the same seat.');
        return;
      }

      try {
        setLoading(true);
        
        // Use the dedicated seat change API
        await bookingAPI.changeSeat(bookingId, {
          seat_number: newSeatNumber,
        });
        
        Alert.alert(
          'Success', 
          `Your seat has been changed to ${newSeatNumber}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to My Trips tab
                navigation.navigate('Tabs', { 
                  screen: 'BookingsTab' 
                } as never);
              },
            },
          ]
        );
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to change seat. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal booking flow - continue to passenger info
    navigation.navigate('PassengerInfo', {
      flight: isRoundTrip ? outboundFlight : flight,
      outboundFlight,
      returnFlight,
      passengers,
      selectedSeats: selectedSeatDetails,
      seatPriceModifier: firstSeatModifier, // Pass modifier instead of hardcoded charges
      isRoundTrip,
    });
  };

  const getSeatStatus = (seat: Seat): 'available' | 'occupied' | 'selected' => {
    if (selectedSeats.includes(seat.id)) return 'selected';
    return seat.status;
  };

  const renderSeat = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const isAisle = seat.column === 'D'; // Only add gap before column D
    
    // Get seat class style based on price_modifier
    const getSeatClassStyle = () => {
      if (status === 'occupied') return styles.seatOccupied;
      if (status === 'selected') return styles.seatSelected;
      
      // Available seats - show class based on price_modifier
      if (seat.price_modifier >= 2.0) return styles.seatFirstClass;
      if (seat.price_modifier >= 1.5) return styles.seatBusiness;
      return styles.seatEconomy;
    };

    return (
      <TouchableOpacity
        key={seat.id}
        style={[
          styles.seat,
          {
            width: dynamicDimensions.seatSize,
            height: dynamicDimensions.seatSize,
          },
          getSeatClassStyle(),
          isAisle && styles.seatAfterAisle,
        ]}
        onPress={() => handleSeatSelect(seat.id)}
        disabled={status === 'occupied'}
      >
        <Ionicons
          name={status === 'occupied' ? 'close' : 'checkmark'}
          size={dynamicDimensions.iconSize}
          color={
            status === 'selected' ? '#fff' :
            status === 'occupied' ? colors.disabled :
            colors.textSecondary
          }
        />
      </TouchableOpacity>
    );
  };

  const rows = Array.from(new Set(seats.map(s => s.row))).sort((a, b) => a - b);
  const { height: screenHeight } = useWindowDimensions();

  // Calculate dynamic dimensions based on available space and number of rows
  const dynamicDimensions = useMemo(() => {
    const numRows = rows.length;
    if (numRows === 0) return { seatSize: 36, rowSpacing: spacing.sm, iconSize: 16 };

    // Calculate available height for seat map
    const headerHeight = 80; // Header section
    const legendHeight = 60; // Legend section
    const footerHeight = 90; // Footer with continue button
    const contentPadding = spacing.md * 2; // Top and bottom padding
    const columnLabelHeight = 30; // Column label row
    const bottomBuffer = 20; // Extra buffer
    
    const availableHeight = screenHeight - headerHeight - legendHeight - footerHeight - contentPadding - columnLabelHeight - bottomBuffer;
    
    // Calculate optimal row height to fit all rows
    const targetRowHeight = availableHeight / numRows;
    
    // Determine seat size and spacing based on available space
    let seatSize = 36;
    let rowSpacing = spacing.sm;
    let iconSize = 16;
    
    if (numRows <= 10) {
      // Few rows - use larger seats
      seatSize = Math.min(40, Math.floor(targetRowHeight * 0.75));
      rowSpacing = Math.max(spacing.sm, Math.floor(targetRowHeight * 0.25));
      iconSize = 18;
    } else if (numRows <= 20) {
      // Medium number of rows - use standard size
      seatSize = Math.min(36, Math.floor(targetRowHeight * 0.7));
      rowSpacing = Math.max(spacing.xs, Math.floor(targetRowHeight * 0.3));
      iconSize = 16;
    } else if (numRows <= 30) {
      // Many rows - use smaller seats
      seatSize = Math.min(32, Math.floor(targetRowHeight * 0.7));
      rowSpacing = Math.max(4, Math.floor(targetRowHeight * 0.3));
      iconSize = 14;
    } else {
      // Very many rows - use minimal size
      seatSize = Math.max(24, Math.floor(targetRowHeight * 0.65));
      rowSpacing = Math.max(2, Math.floor(targetRowHeight * 0.35));
      iconSize = 12;
    }
    
    return { seatSize, rowSpacing, iconSize };
  }, [rows.length, screenHeight]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading seats...</Text>
      </View>
    );
  }

  if (seats.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Ionicons name="alert-circle" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No seats available for this flight</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSeats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {bookingId ? 'Change Your Seat' : 'Select Your Seats'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {selectedSeats.length} of {passengers} selected
        </Text>
        {bookingId && (
          <Text style={styles.headerNote}>
            Note: You can only change to a seat within the same class
          </Text>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatEconomy]}>
            <Ionicons name="checkmark" size={12} color={colors.textSecondary} />
          </View>
          <Text style={styles.legendText}>Economy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatBusiness]}>
            <Ionicons name="checkmark" size={12} color={colors.textSecondary} />
          </View>
          <Text style={styles.legendText}>Business</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatFirstClass]}>
            <Ionicons name="checkmark" size={12} color={colors.textSecondary} />
          </View>
          <Text style={styles.legendText}>First Class</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatSelected]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatOccupied]}>
            <Ionicons name="close" size={12} color={colors.disabled} />
          </View>
          <Text style={styles.legendText}>Occupied</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Column Labels */}
        <View style={styles.columnLabels}>
          <View style={styles.rowNumber} />
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>A</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>B</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>C</Text>
          <View style={styles.aisleSpace} />
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>D</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>E</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>F</Text>
        </View>

        {/* Seat Map */}
        {rows.map(row => (
          <View key={row} style={[styles.row, { marginBottom: dynamicDimensions.rowSpacing }]}>
            <View style={styles.rowNumber}>
              <Text style={styles.rowNumberText}>{row}</Text>
            </View>
            {seats
              .filter(s => s.row === row)
              .sort((a, b) => a.column.localeCompare(b.column))
              .map(renderSeat)}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerInfoText}>
            Selected: {selectedSeats.join(', ') || 'None'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedSeats.length !== passengers && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedSeats.length !== passengers}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    ...typography.button,
    color: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerNote: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSeat: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    ...typography.caption,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  columnLabels: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  columnLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  aisleSpace: {
    width: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowNumber: {
    width: 32,
    alignItems: 'center',
  },
  rowNumberText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  seat: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatAvailable: {
    backgroundColor: '#fff',
  },
  seatEconomy: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d0d0d0',
  },
  seatBusiness: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
  },
  seatFirstClass: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffb74d',
  },
  seatOccupied: {
    backgroundColor: colors.surface,
    borderColor: colors.disabled,
  },
  seatSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatAfterAisle: {
    marginLeft: spacing.md,
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
  footerInfo: {
    marginBottom: spacing.md,
  },
  footerInfoText: {
    ...typography.body2,
    color: colors.textSecondary,
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

