import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export default function FlightDetailsScreen({ route, navigation }: any) {
  const { flight, passengers } = route.params;
  const { isAuthenticated } = useAuth();

  const handleBookFlight = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('SeatSelection', { flight, passengers });
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
              <Text style={styles.airlineName}>{flight.airline.name}</Text>
              <Text style={styles.flightNumber}>Flight {flight.flightNumber}</Text>
            </View>
          </View>

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.totalPrice}>
              ${(flight.price * passengers).toFixed(2)}
            </Text>
            <Text style={styles.priceBreakdown}>
              ${flight.price} × {passengers} passenger{passengers > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Route Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flight Route</Text>
          
          <View style={styles.routeContainer}>
            <View style={styles.routeStop}>
              <View style={styles.routeDot} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeTime}>{flight.departureTime}</Text>
                <Text style={styles.routeCode}>{flight.origin.code}</Text>
                <Text style={styles.routeName}>{flight.origin.name}</Text>
                <Text style={styles.routeCity}>{flight.origin.city}</Text>
              </View>
            </View>

            <View style={styles.routeConnector}>
              <View style={styles.routeLine} />
              <View style={styles.durationBox}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text style={styles.durationText}>{flight.duration}</Text>
              </View>
            </View>

            <View style={styles.routeStop}>
              <View style={styles.routeDot} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeTime}>{flight.arrivalTime}</Text>
                <Text style={styles.routeCode}>{flight.destination.code}</Text>
                <Text style={styles.routeName}>{flight.destination.name}</Text>
                <Text style={styles.routeCity}>{flight.destination.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Flight Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flight Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>March 15, 2024</Text>
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
            <Text style={styles.detailValue}>Boeing 737-800</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.detailLabel}>Available Seats</Text>
            </View>
            <Text style={styles.detailValue}>{flight.availableSeats}</Text>
          </View>
        </View>

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

      {/* Book Button */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceAmount}>
            ${(flight.price * passengers).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookFlight}
        >
          <Text style={styles.bookButtonText}>
            {isAuthenticated ? 'Select Seats' : 'Sign in to Book'}
          </Text>
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

