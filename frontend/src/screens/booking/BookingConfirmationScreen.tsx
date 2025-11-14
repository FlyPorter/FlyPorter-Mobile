import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function BookingConfirmationScreen({ route, navigation }: any) {
  const { bookingId, flight, passengers, selectedSeats, passengerData, totalAmount } = route.params;
  
  // Ensure flight object has all required fields with fallbacks
  const safeFlight = {
    ...flight,
    origin: {
      code: flight?.origin?.code || '',
      city: flight?.origin?.city || flight?.origin?.name || '',
      name: flight?.origin?.name || flight?.origin?.city || '',
    },
    destination: {
      code: flight?.destination?.code || '',
      city: flight?.destination?.city || flight?.destination?.name || '',
      name: flight?.destination?.name || flight?.destination?.city || '',
    },
    departureTime: flight?.departureTime || '',
    arrivalTime: flight?.arrivalTime || '',
    duration: flight?.duration || '',
    flightNumber: flight?.flightNumber || '',
    airline: {
      name: flight?.airline?.name || 'FlyPorter',
    },
  };

  const handleDownloadPDF = async () => {
    try {
      // Generate HTML for PDF
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Booking Confirmation</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #C8102E;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #C8102E;
                margin: 0;
              }
              .section {
                margin: 30px 0;
              }
              .section-title {
                color: #C8102E;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .label {
                font-weight: bold;
              }
              .total {
                background-color: #f5f5f5;
                padding: 15px;
                margin-top: 20px;
                text-align: right;
              }
              .total-amount {
                font-size: 24px;
                color: #C8102E;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>FlyPorter Airlines</h1>
              <p>Booking Confirmation</p>
            </div>
            
            <div class="section">
              <div class="section-title">Booking Information</div>
              <div class="info-row">
                <span class="label">Booking Reference:</span>
                <span>${bookingId}</span>
              </div>
              <div class="info-row">
                <span class="label">Flight Number:</span>
                <span>${safeFlight.flightNumber}</span>
              </div>
              <div class="info-row">
                <span class="label">Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Flight Details</div>
              <div class="info-row">
                <span class="label">From:</span>
                <span>${safeFlight.origin.city || safeFlight.origin.name || ''} (${safeFlight.origin.code})</span>
              </div>
              <div class="info-row">
                <span class="label">To:</span>
                <span>${safeFlight.destination.city || safeFlight.destination.name || ''} (${safeFlight.destination.code})</span>
              </div>
              <div class="info-row">
                <span class="label">Departure:</span>
                <span>${safeFlight.departureTime}</span>
              </div>
              <div class="info-row">
                <span class="label">Arrival:</span>
                <span>${safeFlight.arrivalTime}</span>
              </div>
              ${safeFlight.duration ? `<div class="info-row">
                <span class="label">Duration:</span>
                <span>${safeFlight.duration}</span>
              </div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">Passengers</div>
              ${passengerData.map((p: any, i: number) => `
                <div class="info-row">
                  <span class="label">Passenger ${i + 1}:</span>
                  <span>${p.firstName} ${p.lastName} - Seat ${selectedSeats[i].row}${selectedSeats[i].column}</span>
                </div>
              `).join('')}
            </div>

            <div class="total">
              <div>Total Amount Paid</div>
              <div class="total-amount">$${totalAmount.toFixed(2)}</div>
            </div>

            <div class="section">
              <p><strong>Important:</strong> Please arrive at the airport at least 2 hours before departure for domestic flights and 3 hours for international flights.</p>
              <p>For any queries, please contact us at support@flyporter.com or call +1-800-FLY-PORT</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Booking Confirmation',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleDone = () => {
    // Navigate to the bookings tab
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your flight has been successfully booked
          </Text>
        </View>

        {/* Booking Reference */}
        <View style={styles.referenceCard}>
          <Text style={styles.referenceLabel}>Booking Reference</Text>
          <Text style={styles.referenceNumber}>{bookingId}</Text>
          <Text style={styles.referenceNote}>
            Save this reference number for future use
          </Text>
        </View>

        {/* Flight Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Details</Text>
          
          <View style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <View>
                <Text style={styles.airline}>{safeFlight.airline.name}</Text>
                <Text style={styles.flightNumber}>Flight {safeFlight.flightNumber}</Text>
              </View>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
              </View>
            </View>

            <View style={styles.routeInfo}>
              <View style={styles.airport}>
                <Text style={styles.airportCode}>{safeFlight.origin.code}</Text>
                <Text style={styles.airportTime}>{safeFlight.departureTime}</Text>
                <Text style={styles.airportName}>{safeFlight.origin.city}</Text>
              </View>

              <View style={styles.routeMiddle}>
                <Ionicons name="airplane" size={24} color={colors.primary} />
                <Text style={styles.duration}>{safeFlight.duration}</Text>
              </View>

              <View style={styles.airport}>
                <Text style={styles.airportCode}>{safeFlight.destination.code}</Text>
                <Text style={styles.airportTime}>{safeFlight.arrivalTime}</Text>
                <Text style={styles.airportName}>{safeFlight.destination.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Passenger Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          {passengerData.map((passenger: any, index: number) => (
            <View key={index} style={styles.passengerCard}>
              <View style={styles.passengerInfo}>
                <Ionicons name="person" size={24} color={colors.primary} />
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerName}>
                    {passenger.firstName} {passenger.lastName}
                  </Text>
                  <Text style={styles.passengerMeta}>
                    Passport: {passenger.passportNumber}
                  </Text>
                </View>
              </View>
              <View style={styles.seatBadge}>
                <Ionicons name="airplane" size={16} color="#fff" />
                <Text style={styles.seatText}>
                  {selectedSeats[index].row}{selectedSeats[index].column}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Paid</Text>
              <Text style={styles.paymentAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.paymentStatusText}>Payment Successful</Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name="mail" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Check Your Email</Text>
                <Text style={styles.stepDescription}>
                  Confirmation sent to your registered email
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Arrive Early</Text>
                <Text style={styles.stepDescription}>
                  Be at the airport 2-3 hours before departure
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name="card" size={24} color={colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Bring Documents</Text>
                <Text style={styles.stepDescription}>
                  Valid ID and passport for all passengers
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleDownloadPDF}
        >
          <Ionicons name="download" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
          <Text style={styles.primaryButtonText}>Done</Text>
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
  content: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  referenceCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  referenceLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  referenceNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  referenceNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  flightCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  airline: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  flightNumber: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airport: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  airportTime: {
    ...typography.body1,
    color: colors.text,
    marginTop: spacing.xs,
  },
  airportName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  routeMiddle: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  duration: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerDetails: {
    marginLeft: spacing.sm,
  },
  passengerName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  passengerMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  seatText: {
    ...typography.body2,
    color: '#fff',
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  paymentLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  paymentAmount: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  paymentStatusText: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '600',
  },
  stepsList: {
    gap: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  footer: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
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
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#fff',
    gap: spacing.xs,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

