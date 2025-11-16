import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI, paymentAPI } from '../../services/api';

export default function PaymentScreen({ route, navigation }: any) {
  const { 
    flight, 
    outboundFlight, 
    returnFlight, 
    passengers, 
    selectedSeats, 
    returnSelectedSeats, 
    seatPriceModifier,
    outboundSeatModifier,
    returnSeatModifier,
    passengerData, 
    isRoundTrip 
  } = route.params;
  const { isAuthenticated } = useAuth();
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  // Backend formula: base_price × price_modifier
  // For round-trip: (outbound_price × outbound_modifier) + (return_price × return_modifier)
  // Each leg has its own seat class multiplier
  const totalAmount = isRoundTrip && outboundFlight && returnFlight
    ? (
        (outboundFlight.price * passengers * (outboundSeatModifier || 1.0)) +
        (returnFlight.price * passengers * (returnSeatModifier || 1.0))
      )
    : (flight.price * passengers) * (seatPriceModifier || 1.0);

  const handlePayment = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to complete your booking',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      return;
    }

    // Validate payment info
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      Alert.alert('Incomplete Information', 'Please fill in all payment fields');
      return;
    }

    // Validate card number is exactly 16 digits
    const cardDigits = cardNumber.replace(/\s/g, '');
    if (cardDigits.length !== 16) {
      Alert.alert('Invalid Card Number', 'Card number must be exactly 16 digits');
      return;
    }

    // Validate expiry date format
    if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert('Invalid Expiry Date', 'Please enter expiry date in MM/YY format');
      return;
    }

    // Validate expiry date is in the future
    const [month, year] = expiryDate.split('/');
    const expiryMonth = parseInt(month);
    const expiryYear = parseInt(`20${year}`);
    
    // Validate month range
    if (expiryMonth < 1 || expiryMonth > 12) {
      Alert.alert('Invalid Expiry Date', 'Please enter a valid month (01-12)');
      return;
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    
    // Check if expiry date is in the past or current month
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth <= currentMonth)) {
      Alert.alert('Invalid Expiry Date', 'Card expiry date must be in the future');
      return;
    }

    // Validate CVV is 3 or 4 digits
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      Alert.alert('Invalid CVV', 'CVV must be 3 or 4 digits');
      return;
    }

    setProcessing(true);

    try {
      // Convert expiry date from MM/YY to YYYY-MM format
      // expiryDate is in format "MM/YY" (e.g., "12/25")
      let expiryFormatted = '';
      if (expiryDate.includes('/')) {
        const [month, year] = expiryDate.split('/');
        if (month && year) {
          // Convert YY to YYYY (assuming 20YY for years 00-99)
          const fullYear = year.length === 2 ? `20${year}` : year;
          expiryFormatted = `${fullYear}-${month.padStart(2, '0')}`;
        }
      } else {
        expiryFormatted = expiryDate;
      }

      // Validate payment first
      const paymentData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry: expiryFormatted,
        ccv: cvv,
        bookingDate: new Date().toISOString(),
      };

      // Validate payment first
      const paymentResponse = await paymentAPI.validate(paymentData);
      
      const responseData = paymentResponse.data;
      // Check if response has success field
      if (responseData?.success === false) {
        throw new Error(responseData?.error || responseData?.message || 'Payment validation failed');
      }
      
      const paymentResult = responseData?.data || responseData;
      
      if (!paymentResult?.valid) {
        throw new Error('Payment validation failed. Please check your card details.');
      }

      // Create booking for each passenger/seat
      // For now, create booking for the first passenger/seat
      // In a real app, you'd create multiple bookings for multiple passengers
      const firstSeat = selectedSeats[0];
      const seatNumber = `${firstSeat.row}${firstSeat.column}`;
      
      // Get flight_id from flight object
      // flight.id is String(flight.flight_id) from FlightResultsScreen
      const flightId = flight.flight_id || (flight.id ? parseInt(String(flight.id)) : null);
      
      if (!flightId) {
        throw new Error('Flight ID is missing');
      }
      
      // Create outbound booking
      const bookingResponse = await bookingAPI.create({
        flight_id: typeof flightId === 'string' ? parseInt(flightId) : flightId,
        seat_number: seatNumber,
      });

      const bookingResponseData = bookingResponse.data;
      // Check if response has success field
      if (bookingResponseData?.success === false) {
        throw new Error(bookingResponseData?.error || bookingResponseData?.message || 'Booking creation failed');
      }
      
      const booking = bookingResponseData?.data || bookingResponseData;
      const bookingId = booking?.confirmation_code || booking?.booking_id || `FP${Date.now().toString().slice(-8)}`;

      // If round-trip, create return booking as well
      let returnBookingId = null;
      if (isRoundTrip && returnSelectedSeats && returnSelectedSeats.length > 0) {
        const returnFlight = route.params.returnFlight;
        const returnFirstSeat = returnSelectedSeats[0];
        const returnSeatNumber = `${returnFirstSeat.row}${returnFirstSeat.column}`;
        const returnFlightId = returnFlight.flight_id || (returnFlight.id ? parseInt(String(returnFlight.id)) : null);
        
        if (returnFlightId) {
          const returnBookingResponse = await bookingAPI.create({
            flight_id: typeof returnFlightId === 'string' ? parseInt(returnFlightId) : returnFlightId,
            seat_number: returnSeatNumber,
          });
          
          const returnBookingData = returnBookingResponse.data;
          if (returnBookingData?.success !== false) {
            const returnBooking = returnBookingData?.data || returnBookingData;
            returnBookingId = returnBooking?.confirmation_code || returnBooking?.booking_id;
          }
        }
      }
      
      setProcessing(false);
      
      navigation.replace('BookingConfirmation', {
        bookingId,
        returnBookingId, // Pass return booking ID if applicable
        flight,
        outboundFlight, // Pass outbound flight for round-trip
        returnFlight, // Pass return flight for round-trip
        passengers,
        selectedSeats,
        returnSelectedSeats, // Pass return seats if applicable
        passengerData,
        totalAmount,
        isRoundTrip,
      });
    } catch (error: any) {
      setProcessing(false);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to complete your booking',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign In', 
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to process payment. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-numeric characters (including spaces and letters)
    const cleaned = text.replace(/\D/g, '');
    // Limit to 16 digits
    const limited = cleaned.slice(0, 16);
    // Format with spaces every 4 digits
    const formatted = limited.match(/.{1,4}/g)?.join(' ') || limited;
    setCardNumber(formatted);
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setExpiryDate(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
    } else {
      setExpiryDate(cleaned);
    }
  };

  const formatCVV = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <View style={styles.paymentMethodCard}>
            <Ionicons name="card" size={32} color={colors.primary} />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>Credit/Debit Card</Text>
              <Text style={styles.paymentMethodSubtitle}>
                Visa, Mastercard, Amex
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number *</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={formatCardNumber}
                keyboardType="number-pad"
                maxLength={19}
              />
              <Ionicons name="card-outline" size={24} color={colors.textSecondary} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cardholder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={cardName}
              onChangeText={setCardName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={styles.label}>Expiry Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                value={expiryDate}
                onChangeText={formatExpiryDate}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={styles.label}>CVV *</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                value={cvv}
                onChangeText={formatCVV}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Booking Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>

          <View style={styles.summaryCard}>
            {isRoundTrip && outboundFlight && returnFlight ? (
              // Round-trip summary
              <>
                <View style={styles.summaryHeader}>
                  <Ionicons name="airplane" size={24} color={colors.primary} />
                  <View style={styles.summaryHeaderText}>
                    <Text style={styles.flightNumber}>Round Trip</Text>
                    <Text style={styles.route}>
                      {outboundFlight.origin.code} ⇄ {outboundFlight.destination.code}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Passengers</Text>
                  <Text style={styles.summaryValue}>{passengers}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Outbound Seats</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSeats.map((s: any) => `${s.row}${s.column}`).join(', ')}
                  </Text>
                </View>

                {returnSelectedSeats && returnSelectedSeats.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Return Seats</Text>
                    <Text style={styles.summaryValue}>
                      {returnSelectedSeats.map((s: any) => `${s.row}${s.column}`).join(', ')}
                    </Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Outbound Fare</Text>
                  <Text style={styles.summaryValue}>
                    ${(outboundFlight.price * passengers).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Outbound Seat Multiplier</Text>
                  <Text style={styles.summaryValue}>×{(outboundSeatModifier || 1.0).toFixed(1)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Return Fare</Text>
                  <Text style={styles.summaryValue}>
                    ${(returnFlight.price * passengers).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Return Seat Multiplier</Text>
                  <Text style={styles.summaryValue}>×{(returnSeatModifier || 1.0).toFixed(1)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
                </View>
              </>
            ) : (
              // One-way summary
              <>
                <View style={styles.summaryHeader}>
                  <Ionicons name="airplane" size={24} color={colors.primary} />
                  <View style={styles.summaryHeaderText}>
                    <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
                    <Text style={styles.route}>
                      {flight.origin.code} → {flight.destination.code}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Passengers</Text>
                  <Text style={styles.summaryValue}>{passengers}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Seats</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSeats.map((s: any) => `${s.row}${s.column}`).join(', ')}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Fare</Text>
                  <Text style={styles.summaryValue}>
                    ${(flight.price * passengers).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Seat Class Multiplier</Text>
                  <Text style={styles.summaryValue}>×{(seatPriceModifier || 1.0).toFixed(1)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <Text style={styles.securityText}>
            Your payment is secure and encrypted
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalAmount}>${totalAmount.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.payButtonText}>Processing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Pay Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  paymentMethodTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  paymentMethodSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body1,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    minHeight: 50,
    lineHeight: 22,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 50,
  },
  row: {
    flexDirection: 'row',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryHeaderText: {
    marginLeft: spacing.sm,
  },
  flightNumber: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  route: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  totalLabel: {
    ...typography.h4,
    color: colors.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  securityText: {
    ...typography.body2,
    color: colors.success,
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
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerTotalLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  footerTotalAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  payButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

