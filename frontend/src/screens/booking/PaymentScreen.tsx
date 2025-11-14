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
  const { flight, passengers, selectedSeats, seatCharges, passengerData } = route.params;
  const { isAuthenticated } = useAuth();
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  const totalAmount = (flight.price * passengers + seatCharges) * 1.15;

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

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number');
      return;
    }

    setProcessing(true);

    try {
      // Validate payment first
      const paymentData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry: expiryDate,
        ccv: cvv,
        bookingDate: new Date().toISOString(),
      };

      await paymentAPI.validate(paymentData);

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
      
      const bookingResponse = await bookingAPI.create({
        flight_id: typeof flightId === 'string' ? parseInt(flightId) : flightId,
        seat_number: seatNumber,
      });

      const booking = bookingResponse.data?.data || bookingResponse.data;
      const bookingId = booking?.confirmation_code || booking?.booking_id || `FP${Date.now().toString().slice(-8)}`;
      
      setProcessing(false);
      
      navigation.replace('BookingConfirmation', {
        bookingId,
        flight,
        passengers,
        selectedSeats,
        passengerData,
        totalAmount,
      });
    } catch (error: any) {
      setProcessing(false);
      console.error('Payment/Booking error:', error);
      
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
      } else if (error.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to process payment. Please try again.');
      }
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setExpiryDate(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
    } else {
      setExpiryDate(cleaned);
    }
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
                onChangeText={setCvv}
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

            {seatCharges > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Seat Selection</Text>
                <Text style={styles.summaryValue}>${seatCharges.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes & Fees</Text>
              <Text style={styles.summaryValue}>
                ${((flight.price * passengers + seatCharges) * 0.15).toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
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
    backgroundColor: colors.surface,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
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

