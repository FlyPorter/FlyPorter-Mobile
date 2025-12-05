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
    bookingId,  // Optional: single booking ID (legacy) if changing seat from booking details
    bookingIds, // Optional: array of booking IDs for multi-passenger seat changes
    currentSeatNumber,  // Optional: current seat to pre-select (single passenger)
    currentSeatNumbers, // Optional: array of current seats (multi-passenger)
    currentSeatClass, // Optional: current seat price modifier to filter seats
    outboundSelectedSeats, // Optional: seats selected for outbound flight (when selecting return)
    selectingReturn, // Optional: true if currently selecting return flight seats
  } = route.params;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Determine which flight we're selecting seats for
  const isSelectingReturn = selectingReturn || false;
  const currentFlight = isSelectingReturn ? returnFlight : (isRoundTrip ? outboundFlight : flight);
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
      
      // Get all current seat numbers (for both single and multi-passenger seat changes)
      const allCurrentSeats = currentSeatNumbers || (currentSeatNumber ? [currentSeatNumber] : []);
      
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
        
        // If this is the user's current seat (seat change mode), treat it as available
        // so they can select it back if they change their mind
        const isCurrentSeat = allCurrentSeats.includes(seat.seat_number);
        const status = (seat.is_available || isCurrentSeat) ? 'available' : 'occupied';
        
        return {
          id: seat.seat_number,
          row,
          column,
          type: seatType,
          status,
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
      
      // Show all available seats (no filtering by class when changing seats)
      setSeats(transformedSeats);
      
      // Pre-select current seats if changing from booking details
      if (currentSeatNumbers && currentSeatNumbers.length > 0) {
        // Multi-passenger: pre-select all current seats
        setSelectedSeats(currentSeatNumbers);
      } else if (currentSeatNumber && bookingId) {
        // Single passenger (legacy): pre-select single seat
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
    // For seat changes, allow partial selection (user may want to keep some original seats)
    const isSeatChangeMode = (bookingIds && bookingIds.length > 0) || (bookingId && currentSeatNumber);
    const oldSeats = currentSeatNumbers || (currentSeatNumber ? [currentSeatNumber] : []);
    
    if (!isSeatChangeMode && selectedSeats.length !== passengers) {
      Alert.alert(
        'Incomplete Selection',
        `Please select ${passengers} seat${passengers > 1 ? 's' : ''}`
      );
      return;
    }
    
    // For seat changes with multiple passengers, handle partial selection
    let finalSelectedSeats = [...selectedSeats];
    if (isSeatChangeMode && selectedSeats.length < passengers) {
      // User selected fewer seats than total passengers
      // Fill remaining slots with unchanged original seats
      const unchangedSeats = oldSeats.filter(seat => !finalSelectedSeats.includes(seat));
      
      while (finalSelectedSeats.length < passengers && unchangedSeats.length > 0) {
        finalSelectedSeats.push(unchangedSeats.shift()!);
      }
      
      // Confirm with user
      const keptSeats = finalSelectedSeats.filter(seat => oldSeats.includes(seat));
      const changedSeats = finalSelectedSeats.filter(seat => !oldSeats.includes(seat));
      
      if (keptSeats.length > 0) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Confirm Seat Change',
            `You are changing ${changedSeats.length} seat${changedSeats.length > 1 ? 's' : ''} to: ${changedSeats.join(', ')}\n\nThe following seat${keptSeats.length > 1 ? 's' : ''} will remain unchanged: ${keptSeats.join(', ')}\n\nDo you want to continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) }
            ]
          );
        });
        
        if (!confirmed) return;
      }
      
      // If still not enough seats, show error
      if (finalSelectedSeats.length < passengers) {
        Alert.alert(
          'Incomplete Selection',
          `Please select ${passengers} seat${passengers > 1 ? 's' : ''}. You currently have ${finalSelectedSeats.length} selected.`
        );
        return;
      }
    }

    const selectedSeatDetails = seats.filter(s => finalSelectedSeats.includes(s.id));
    
    // Get the price_modifier for the first selected seat (for single passenger)
    const firstSeatModifier = selectedSeatDetails[0]?.price_modifier || 1.0;

    // If updating existing booking(s) (from booking details)
    if (bookingIds && bookingIds.length > 0) {
      // Multi-passenger seat changes
      const newSeats = finalSelectedSeats;
      
      // Check if any seats actually changed (compare as sets, not by order)
      const oldSeatsSet = new Set(oldSeats);
      const newSeatsSet = new Set(newSeats);
      const hasAnyChange = oldSeats.some(seat => !newSeatsSet.has(seat)) || 
                           newSeats.some(seat => !oldSeatsSet.has(seat));
      
      if (!hasAnyChange) {
        Alert.alert('No Change', 'You selected the same seats.');
        return;
      }

      // Calculate price difference
      const oldSeatModifier = currentSeatClass || 1.0;
      const newSeatModifiers = selectedSeatDetails.map(s => s.price_modifier);
      const avgNewModifier = newSeatModifiers.reduce((sum, mod) => sum + mod, 0) / newSeatModifiers.length;
      
      // Get base price from flight
      const basePrice = currentFlight.price || currentFlight.base_price || 0;
      const oldTotalPrice = basePrice * oldSeatModifier * bookingIds.length;
      const newTotalPrice = newSeatModifiers.reduce((sum, mod) => sum + (basePrice * mod), 0);
      const priceDifference = newTotalPrice - oldTotalPrice;
      
      // If price increased, require payment
      if (priceDifference > 0.01) {
        Alert.alert(
          'Seat Upgrade',
          `The new seats will cost $${priceDifference.toFixed(2)} more. You'll need to complete payment for the upgrade.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue to Payment',
              onPress: () => {
                // Navigate to payment screen with upgrade info
                navigation.navigate('Payment', {
                  flight: currentFlight,
                  passengers: bookingIds.length,
                  selectedSeats: selectedSeatDetails.map(s => ({ row: s.row, column: s.column })),
                  seatPriceModifier: avgNewModifier,
                  isRoundTrip: false,
                  isSeatChange: true, // Flag to indicate this is a seat change
                  bookingIds, // Original booking IDs to update
                  oldSeatNumbers: oldSeats,
                  newSeatNumbers: newSeats,
                  priceDifference,
                  passengerData: [], // Empty - not needed for seat change
                });
              },
            },
          ]
        );
        return;
      }
      
      // If price decreased, warn user about no refund policy
      if (priceDifference < -0.01) {
        Alert.alert(
          'Lower Price Seat',
          `The new seats cost $${Math.abs(priceDifference).toFixed(2)} less than your current seats. However, no refund will be issued for the price difference. Do you want to continue with the seat change?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: async () => {
                try {
                  setLoading(true);
                  
                  // Smart seat matching: only update seats that actually changed
                  // Create a mapping of which bookings need to be updated to which new seats
                  const seatUpdates: Array<{ bookingId: string; oldSeat: string; newSeat: string }> = [];
                  
                  // Find seats that need to be changed (not in old seats, or changed position)
                  const seatsToChange = newSeats.filter(seat => !oldSeats.includes(seat));
                  const seatsToKeep = newSeats.filter(seat => oldSeats.includes(seat));
                  const seatsToRelease = oldSeats.filter(seat => !newSeats.includes(seat));
                  
                  // Match seats to release with seats to change
                  for (let i = 0; i < seatsToRelease.length && i < seatsToChange.length; i++) {
                    const oldSeatIdx = oldSeats.indexOf(seatsToRelease[i]);
                    if (oldSeatIdx >= 0 && oldSeatIdx < bookingIds.length) {
                      seatUpdates.push({
                        bookingId: bookingIds[oldSeatIdx],
                        oldSeat: seatsToRelease[i],
                        newSeat: seatsToChange[i],
                      });
                    }
                  }
                  
                  console.log('Seat updates:', seatUpdates);
                  
                  // Execute seat changes
                  for (const update of seatUpdates) {
                    await bookingAPI.changeSeat(update.bookingId, {
                      seat_number: update.newSeat,
                    });
                  }
                  
                  Alert.alert(
                    'Success', 
                    seatUpdates.length > 0 
                      ? `${seatUpdates.length} seat${seatUpdates.length > 1 ? 's' : ''} changed to: ${seatsToChange.join(', ')}. No refund has been issued.`
                      : 'No seats were changed.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          navigation.navigate('Tabs', { 
                            screen: 'BookingsTab' 
                          } as never);
                        },
                      },
                    ]
                  );
                } catch (error: any) {
                  let errorMessage = error.response?.data?.message || 
                                     error.message || 
                                     'Failed to change seats. Please try again.';
                  
                  // Better error message for seat unavailability
                  if (error.response?.status === 409 || errorMessage.includes('not available')) {
                    errorMessage = 'One or more selected seats are no longer available. Please refresh and select different seats.';
                  }
                  
                  Alert.alert('Seat Change Failed', errorMessage, [
                    {
                      text: 'Refresh',
                      onPress: () => {
                        loadSeats(); // Reload seats to get fresh availability
                      },
                    },
                  ]);
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      // Price is the same, proceed directly
      try {
        setLoading(true);
        
        // Smart seat matching: only update seats that actually changed
        const seatsToChange = newSeats.filter(seat => !oldSeats.includes(seat));
        const seatsToRelease = oldSeats.filter(seat => !newSeats.includes(seat));
        
        console.log('Smart seat matching:', {
          oldSeats,
          newSeats,
          seatsToChange,
          seatsToRelease,
        });
        
        // Match seats to release with seats to change
        const seatUpdates: Array<{ bookingId: string; oldSeat: string; newSeat: string }> = [];
        for (let i = 0; i < seatsToRelease.length && i < seatsToChange.length; i++) {
          const oldSeatIdx = oldSeats.indexOf(seatsToRelease[i]);
          if (oldSeatIdx >= 0 && oldSeatIdx < bookingIds.length) {
            seatUpdates.push({
              bookingId: bookingIds[oldSeatIdx],
              oldSeat: seatsToRelease[i],
              newSeat: seatsToChange[i],
            });
          }
        }
        
        console.log('Seat updates:', seatUpdates);
        
        // Execute seat changes
        for (const update of seatUpdates) {
          await bookingAPI.changeSeat(update.bookingId, {
            seat_number: update.newSeat,
          });
        }
        
        Alert.alert(
          'Success', 
          seatUpdates.length > 0
            ? `${seatUpdates.length} seat${seatUpdates.length > 1 ? 's' : ''} changed to: ${seatsToChange.join(', ')}.`
            : 'No seats were changed.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Tabs', { 
                  screen: 'BookingsTab' 
                } as never);
              },
            },
          ]
        );
      } catch (error: any) {
        let errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to change seats. Please try again.';
        
        // Better error message for seat unavailability
        if (error.response?.status === 409 || errorMessage.includes('not available')) {
          errorMessage = 'One or more selected seats are no longer available. Please refresh and select different seats.';
        }
        
        Alert.alert('Seat Change Failed', errorMessage, [
          {
            text: 'Refresh',
            onPress: () => {
              loadSeats(); // Reload seats to get fresh availability
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    } else if (bookingId && currentSeatNumber) {
      // Single passenger seat change (legacy path)
      const newSeatNumber = selectedSeats[0];
      
      // Check if seat actually changed
      if (newSeatNumber === currentSeatNumber) {
        Alert.alert('No Change', 'You selected the same seat.');
        return;
      }

      // Calculate price difference
      const oldSeatModifier = currentSeatClass || 1.0;
      const newSeatModifier = firstSeatModifier;
      const basePrice = currentFlight.price || currentFlight.base_price || 0;
      const oldPrice = basePrice * oldSeatModifier;
      const newPrice = basePrice * newSeatModifier;
      const priceDifference = newPrice - oldPrice;
      
      // If price increased, require payment
      if (priceDifference > 0.01) {
        Alert.alert(
          'Seat Upgrade',
          `The new seat will cost $${priceDifference.toFixed(2)} more. You'll need to complete payment for the upgrade.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue to Payment',
              onPress: () => {
                // Navigate to payment screen with upgrade info
                navigation.navigate('Payment', {
                  flight: currentFlight,
                  passengers: 1,
                  selectedSeats: [{ row: selectedSeatDetails[0].row, column: selectedSeatDetails[0].column }],
                  seatPriceModifier: newSeatModifier,
                  isRoundTrip: false,
                  isSeatChange: true,
                  bookingIds: [bookingId],
                  oldSeatNumbers: [currentSeatNumber],
                  newSeatNumbers: [newSeatNumber],
                  priceDifference,
                  passengerData: [],
                });
              },
            },
          ]
        );
        return;
      }
      
      // If price decreased, warn user about no refund policy
      if (priceDifference < -0.01) {
        Alert.alert(
          'Lower Price Seat',
          `The new seat costs $${Math.abs(priceDifference).toFixed(2)} less than your current seat. However, no refund will be issued for the price difference. Do you want to continue with the seat change?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: async () => {
                try {
                  setLoading(true);
                  
                  await bookingAPI.changeSeat(bookingId, {
                    seat_number: newSeatNumber,
                  });
                  
                  Alert.alert(
                    'Success', 
                    `Your seat has been changed to ${newSeatNumber}. No refund has been issued.`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          navigation.navigate('Tabs', { 
                            screen: 'BookingsTab' 
                          } as never);
                        },
                      },
                    ]
                  );
                } catch (error: any) {
                  let errorMessage = error.response?.data?.message || 
                                     error.message || 
                                     'Failed to change seat. Please try again.';
                  
                  // Better error message for seat unavailability
                  if (error.response?.status === 409 || errorMessage.includes('not available')) {
                    errorMessage = 'The selected seat is no longer available. Please refresh and select a different seat.';
                  }
                  
                  Alert.alert('Seat Change Failed', errorMessage, [
                    {
                      text: 'Refresh',
                      onPress: () => {
                        loadSeats(); // Reload seats to get fresh availability
                      },
                    },
                  ]);
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      // Price is the same, proceed directly
      try {
        setLoading(true);
        
        // Debug: Log seat change details
        console.log('Changing seat:', {
          bookingId,
          currentSeat: currentSeatNumber,
          newSeat: newSeatNumber,
          seatStatus: seats.find(s => s.id === newSeatNumber)?.status,
          seatAvailable: seats.find(s => s.id === newSeatNumber)?.status === 'available'
        });
        
        await bookingAPI.changeSeat(bookingId, {
          seat_number: newSeatNumber,
        });
        
        Alert.alert(
          'Success', 
          `Your seat has been changed to ${newSeatNumber}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Tabs', { 
                  screen: 'BookingsTab' 
                } as never);
              },
            },
          ]
        );
      } catch (error: any) {
        let errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to change seat. Please try again.';
        
        // Better error message for seat unavailability
        if (error.response?.status === 409 || errorMessage.includes('not available')) {
          errorMessage = 'The selected seat is no longer available. Please refresh and select a different seat.';
        }
        
        Alert.alert('Seat Change Failed', errorMessage, [
          {
            text: 'Refresh',
            onPress: () => {
              loadSeats(); // Reload seats to get fresh availability
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal booking flow
    // If round-trip and selecting outbound seats, navigate to return seat selection
    if (isRoundTrip && !isSelectingReturn) {
      navigation.replace('SeatSelection', {
        flight,
        outboundFlight,
        returnFlight,
        passengers,
        isRoundTrip,
        outboundSelectedSeats: selectedSeatDetails, // Pass outbound seats
        outboundSeatModifier: firstSeatModifier, // Pass outbound seat modifier
        selectingReturn: true, // Flag to indicate return flight selection
      });
      return;
    }

    // If round-trip and selecting return seats, or one-way, continue to passenger info
    const outboundModifier = route.params.outboundSeatModifier || (isSelectingReturn ? 1.0 : firstSeatModifier);
    const returnModifier = isSelectingReturn ? firstSeatModifier : undefined;

    navigation.navigate('PassengerInfo', {
      flight: isRoundTrip ? outboundFlight : flight,
      outboundFlight,
      returnFlight,
      passengers,
      selectedSeats: isSelectingReturn ? outboundSelectedSeats : selectedSeatDetails, // Outbound seats
      returnSelectedSeats: isSelectingReturn ? selectedSeatDetails : undefined, // Return seats if applicable
      outboundSeatModifier: outboundModifier, // Outbound seat class modifier
      returnSeatModifier: returnModifier, // Return seat class modifier (if round-trip)
      seatPriceModifier: firstSeatModifier, // Keep for backward compatibility with one-way
      isRoundTrip,
    });
  };

  const getSeatStatus = (seat: Seat): 'available' | 'occupied' | 'selected' => {
    if (selectedSeats.includes(seat.id)) return 'selected';
    return seat.status;
  };

  const renderSeat = (seat: Seat) => {
    const status = getSeatStatus(seat);
    // Remove right margin from last seat in each group (C and F) for proper centering
    const isLastInGroup = seat.column === 'C' || seat.column === 'F';
    
    // Get seat class colors based on price_modifier
    const getSeatColors = () => {
      if (status === 'occupied') return { main: '#6B7280', dark: '#4B5563' };
      if (status === 'selected') return { main: '#EF4444', dark: '#DC2626' }; // Red for selected
      
      // Available seats - show class based on price_modifier
      // 1.0 = Economy, 1.5 = Business, 2.0 = First Class
      if (seat.price_modifier >= 2.0) return { main: '#FFA500', dark: '#FF8C00' }; // Orange for First
      if (seat.price_modifier > 1.0) return { main: '#3B82F6', dark: '#2563EB' }; // Blue for Business
      // Economy
      return { main: '#10B981', dark: '#059669' }; // Green for Economy
    };

    const colors = getSeatColors();

    return (
      <TouchableOpacity
        key={seat.id}
        style={[
          styles.seatContainer,
          {
            width: dynamicDimensions.seatSize,
            marginRight: isLastInGroup ? 0 : spacing.xs,
          },
        ]}
        onPress={() => handleSeatSelect(seat.id)}
        disabled={status === 'occupied'}
        activeOpacity={0.7}
      >
        {/* Seat structure */}
        <View style={styles.seatWrapper}>
          {/* Main seat body with armrests */}
          <View style={styles.seatBody}>
            {/* Left armrest */}
            <View style={[styles.seatArmrest, { backgroundColor: colors.dark, height: dynamicDimensions.seatSize * 0.85 }]} />
            
            {/* Seat cushion */}
            <View style={[
              styles.seatCushion,
              { 
                backgroundColor: colors.main,
                height: dynamicDimensions.seatSize * 0.85,
              }
            ]}>
              <Ionicons
                name={status === 'occupied' ? 'close' : (status === 'selected' ? 'star' : 'remove')}
                size={dynamicDimensions.iconSize}
                color={status === 'occupied' ? '#9CA3AF' : '#fff'}
              />
            </View>
            
            {/* Right armrest */}
            <View style={[styles.seatArmrest, { backgroundColor: colors.dark, height: dynamicDimensions.seatSize * 0.85 }]} />
          </View>
          
          {/* Bottom base */}
          <View style={[styles.seatBase, { backgroundColor: colors.dark, height: dynamicDimensions.seatSize * 0.15 }]} />
        </View>
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
          {bookingId ? 'Change Your Seat' : (
            isRoundTrip 
              ? (isSelectingReturn ? 'Select Return Flight Seats' : 'Select Outbound Flight Seats')
              : 'Select Your Seats'
          )}
        </Text>
        {isRoundTrip && !bookingId && (
          <Text style={styles.headerSubtitle}>
            {currentFlight.origin?.code || currentFlight.origin} → {currentFlight.destination?.code || currentFlight.destination}
          </Text>
        )}
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
          <View style={styles.legendSeatContainer}>
            <View style={styles.legendSeatBody}>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#059669' }]} />
              <View style={[styles.legendSeatCushion, { backgroundColor: '#10B981' }]}>
                <Ionicons name="remove" size={10} color="#fff" />
              </View>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#059669' }]} />
            </View>
            <View style={[styles.legendSeatBase, { backgroundColor: '#059669' }]} />
          </View>
          <Text style={styles.legendText}>Economy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendSeatContainer}>
            <View style={styles.legendSeatBody}>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#2563EB' }]} />
              <View style={[styles.legendSeatCushion, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="remove" size={10} color="#fff" />
              </View>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#2563EB' }]} />
            </View>
            <View style={[styles.legendSeatBase, { backgroundColor: '#2563EB' }]} />
          </View>
          <Text style={styles.legendText}>Business</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendSeatContainer}>
            <View style={styles.legendSeatBody}>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#FF8C00' }]} />
              <View style={[styles.legendSeatCushion, { backgroundColor: '#FFA500' }]}>
                <Ionicons name="remove" size={10} color="#fff" />
              </View>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#FF8C00' }]} />
            </View>
            <View style={[styles.legendSeatBase, { backgroundColor: '#FF8C00' }]} />
          </View>
          <Text style={styles.legendText}>First Class</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendSeatContainer}>
            <View style={styles.legendSeatBody}>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#DC2626' }]} />
              <View style={[styles.legendSeatCushion, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="star" size={10} color="#fff" />
              </View>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#DC2626' }]} />
            </View>
            <View style={[styles.legendSeatBase, { backgroundColor: '#DC2626' }]} />
          </View>
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendSeatContainer}>
            <View style={styles.legendSeatBody}>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#4B5563' }]} />
              <View style={[styles.legendSeatCushion, { backgroundColor: '#6B7280' }]}>
                <Ionicons name="close" size={10} color="#9CA3AF" />
              </View>
              <View style={[styles.legendSeatArmrest, { backgroundColor: '#4B5563' }]} />
            </View>
            <View style={[styles.legendSeatBase, { backgroundColor: '#4B5563' }]} />
          </View>
          <Text style={styles.legendText}>Occupied</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Column Labels */}
        <View style={styles.columnLabels}>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize, marginRight: spacing.xs }]}>A</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize, marginRight: spacing.xs }]}>B</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>C</Text>
          <View style={styles.aisleSpace} />
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize, marginRight: spacing.xs }]}>D</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize, marginRight: spacing.xs }]}>E</Text>
          <Text style={[styles.columnLabel, { width: dynamicDimensions.seatSize }]}>F</Text>
        </View>

        {/* Seat Map */}
        {rows.map(row => {
          const rowSeats = seats
            .filter(s => s.row === row)
            .sort((a, b) => a.column.localeCompare(b.column));
          
          const leftSeats = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.column));
          const rightSeats = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.column));
          
          return (
            <View key={row} style={[styles.row, { marginBottom: dynamicDimensions.rowSpacing }]}>
              {leftSeats.map(renderSeat)}
              <View style={[styles.rowNumber, styles.rowNumberCenter]}>
                <Text style={styles.rowNumberText}>{row}</Text>
              </View>
              {rightSeats.map(renderSeat)}
            </View>
          );
        })}

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
  legendSeatContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendSeatBody: {
    flexDirection: 'row',
    width: '100%',
    height: '85%',
    alignItems: 'flex-end',
  },
  legendSeatArmrest: {
    width: '15%',
    height: '100%',
  },
  legendSeatCushion: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  legendSeatBase: {
    width: '70%',
    height: '15%',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
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
    justifyContent: 'center',
  },
  columnLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  aisleSpace: {
    width: spacing.xxl, // Larger gap for aisle (48px) to push DEF to the right
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumber: {
    width: 32,
    alignItems: 'center',
  },
  rowNumberCenter: {
    width: spacing.xxl, // Same width as aisle space for centering
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowNumberText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  seatContainer: {
    alignItems: 'center',
  },
  seatWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  seatBody: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-end',
  },
  seatArmrest: {
    width: '10%',
    height: '100%',
  },
  seatCushion: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  seatBase: {
    width: '70%',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
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
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
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
    marginLeft: spacing.xxl, // Larger gap for aisle (48px) to push DEF to the right
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

