import React, { useState } from 'react';
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

interface Seat {
  id: string;
  row: number;
  column: string;
  type: 'economy' | 'business';
  status: 'available' | 'occupied' | 'selected';
  price: number;
}

export default function SeatSelectionScreen({ route, navigation }: any) {
  const { flight, passengers } = route.params;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Generate mock seat map
  const generateSeats = (): Seat[] => {
    const seats: Seat[] = [];
    const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
    const rows = 20;

    for (let row = 1; row <= rows; row++) {
      for (const column of columns) {
        const isOccupied = Math.random() > 0.7; // 30% chance of being occupied
        seats.push({
          id: `${row}${column}`,
          row,
          column,
          type: row <= 3 ? 'business' : 'economy',
          status: isOccupied ? 'occupied' : 'available',
          price: row <= 3 ? 50 : 0, // Business class extra charge
        });
      }
    }
    return seats;
  };

  const [seats] = useState<Seat[]>(generateSeats());

  const handleSeatSelect = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'occupied') return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      if (selectedSeats.length >= passengers) {
        Alert.alert(
          'Maximum Seats Selected',
          `You can only select ${passengers} seat${passengers > 1 ? 's' : ''}`
        );
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length !== passengers) {
      Alert.alert(
        'Incomplete Selection',
        `Please select ${passengers} seat${passengers > 1 ? 's' : ''}`
      );
      return;
    }

    const selectedSeatDetails = seats.filter(s => selectedSeats.includes(s.id));
    const seatCharges = selectedSeatDetails.reduce((sum, seat) => sum + seat.price, 0);

    navigation.navigate('PassengerInfo', {
      flight,
      passengers,
      selectedSeats: selectedSeatDetails,
      seatCharges,
    });
  };

  const getSeatStatus = (seat: Seat): 'available' | 'occupied' | 'selected' => {
    if (selectedSeats.includes(seat.id)) return 'selected';
    return seat.status;
  };

  const renderSeat = (seat: Seat) => {
    const status = getSeatStatus(seat);
    const isAisle = seat.column === 'C' || seat.column === 'D';

    return (
      <TouchableOpacity
        key={seat.id}
        style={[
          styles.seat,
          status === 'occupied' && styles.seatOccupied,
          status === 'selected' && styles.seatSelected,
          isAisle && styles.seatAfterAisle,
        ]}
        onPress={() => handleSeatSelect(seat.id)}
        disabled={status === 'occupied'}
      >
        <Ionicons
          name={status === 'occupied' ? 'close' : 'checkmark'}
          size={16}
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Your Seats</Text>
        <Text style={styles.headerSubtitle}>
          {selectedSeats.length} of {passengers} selected
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatAvailable]}>
            <Ionicons name="checkmark" size={12} color={colors.textSecondary} />
          </View>
          <Text style={styles.legendText}>Available</Text>
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
          {['A', 'B', 'C', '', 'D', 'E', 'F'].map((col, idx) => (
            <Text key={idx} style={styles.columnLabel}>{col}</Text>
          ))}
        </View>

        {/* Seat Map */}
        {rows.map(row => (
          <View key={row} style={styles.row}>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    width: 36,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
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
    width: 36,
    height: 36,
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

