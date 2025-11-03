import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';

type ManageTab = 'cities' | 'airports' | 'airlines' | 'routes' | 'flights';

export default function AdminManageScreen() {
  const [activeTab, setActiveTab] = useState<ManageTab>('cities');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleDelete = (type: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${name}? This will cancel all related flights and notify affected users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to delete
            Alert.alert('Success', `${name} deleted successfully. Users have been notified.`);
          },
        },
      ]
    );
  };

  const renderCitiesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Manage cities where your airline operates
      </Text>

      <View style={styles.itemsList}>
        {['Toronto', 'Vancouver', 'Montreal', 'Calgary'].map((city, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name="location" size={24} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{city}</Text>
              <Text style={styles.itemMeta}>Ontario, Canada</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete('city', city)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAirportsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Manage airports and their details
      </Text>

      <View style={styles.itemsList}>
        {[
          { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto' },
          { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver' },
          { code: 'YUL', name: 'Montreal Trudeau', city: 'Montreal' },
          { code: 'YYC', name: 'Calgary Intl', city: 'Calgary' },
        ].map((airport, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name="airplane" size={24} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{airport.name}</Text>
              <Text style={styles.itemMeta}>
                {airport.code} • {airport.city}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete('airport', airport.name)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAirlinesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Manage airline partners and carriers
      </Text>

      <View style={styles.itemsList}>
        {[
          { name: 'FlyPorter', code: 'FP', fleet: 45 },
          { name: 'Air Canada', code: 'AC', fleet: 12 },
          { name: 'WestJet', code: 'WS', fleet: 8 },
        ].map((airline, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name="business" size={24} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{airline.name}</Text>
              <Text style={styles.itemMeta}>
                {airline.code} • {airline.fleet} aircraft
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete('airline', airline.name)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRoutesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Manage flight routes between airports
      </Text>

      <View style={styles.itemsList}>
        {[
          { from: 'YYZ', to: 'YVR', airline: 'FlyPorter', flights: 12 },
          { from: 'YUL', to: 'YYZ', airline: 'FlyPorter', flights: 8 },
          { from: 'YVR', to: 'YYC', airline: 'Air Canada', flights: 6 },
        ].map((route, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {route.from} → {route.to}
              </Text>
              <Text style={styles.itemMeta}>
                {route.airline} • {route.flights} flights
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete('route', `${route.from} to ${route.to}`)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFlightsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Manage flights, schedules, and pricing
      </Text>

      <View style={styles.itemsList}>
        {[
          {
            number: 'FP101',
            route: 'YYZ → YVR',
            time: '08:00 - 11:30',
            price: 299,
            seats: 45,
          },
          {
            number: 'FP203',
            route: 'YUL → YYZ',
            time: '12:30 - 16:00',
            price: 349,
            seats: 23,
          },
          {
            number: 'FP405',
            route: 'YVR → YYC',
            time: '18:00 - 21:30',
            price: 279,
            seats: 67,
          },
        ].map((flight, index) => (
          <View key={index} style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <View>
                <Text style={styles.flightNumber}>{flight.number}</Text>
                <Text style={styles.flightRoute}>{flight.route}</Text>
              </View>
              <Text style={styles.flightPrice}>${flight.price}</Text>
            </View>

            <View style={styles.flightDetails}>
              <View style={styles.flightDetail}>
                <Ionicons name="time" size={16} color={colors.textSecondary} />
                <Text style={styles.flightDetailText}>{flight.time}</Text>
              </View>
              <View style={styles.flightDetail}>
                <Ionicons name="people" size={16} color={colors.textSecondary} />
                <Text style={styles.flightDetailText}>{flight.seats} seats</Text>
              </View>
            </View>

            <View style={styles.flightActions}>
              <TouchableOpacity style={styles.flightActionButton}>
                <Ionicons name="create" size={18} color={colors.primary} />
                <Text style={styles.flightActionText}>Edit Price</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.flightActionButton, styles.cancelFlightButton]}
                onPress={() => handleDelete('flight', flight.number)}
              >
                <Ionicons name="close-circle" size={18} color={colors.error} />
                <Text style={[styles.flightActionText, styles.cancelFlightText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cities':
        return renderCitiesTab();
      case 'airports':
        return renderAirportsTab();
      case 'airlines':
        return renderAirlinesTab();
      case 'routes':
        return renderRoutesTab();
      case 'flights':
        return renderFlightsTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'cities' && styles.tabButtonActive]}
            onPress={() => setActiveTab('cities')}
          >
            <Ionicons
              name="location"
              size={20}
              color={activeTab === 'cities' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'cities' && styles.tabButtonTextActive,
              ]}
            >
              Cities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'airports' && styles.tabButtonActive]}
            onPress={() => setActiveTab('airports')}
          >
            <Ionicons
              name="airplane"
              size={20}
              color={activeTab === 'airports' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'airports' && styles.tabButtonTextActive,
              ]}
            >
              Airports
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'airlines' && styles.tabButtonActive]}
            onPress={() => setActiveTab('airlines')}
          >
            <Ionicons
              name="business"
              size={20}
              color={activeTab === 'airlines' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'airlines' && styles.tabButtonTextActive,
              ]}
            >
              Airlines
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'routes' && styles.tabButtonActive]}
            onPress={() => setActiveTab('routes')}
          >
            <Ionicons
              name="swap-horizontal"
              size={20}
              color={activeTab === 'routes' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'routes' && styles.tabButtonTextActive,
              ]}
            >
              Routes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'flights' && styles.tabButtonActive]}
            onPress={() => setActiveTab('flights')}
          >
            <Ionicons
              name="airplane"
              size={20}
              color={activeTab === 'flights' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'flights' && styles.tabButtonTextActive,
              ]}
            >
              Flights
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
  },
  tabButtonText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
  },
  tabDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  flightCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  flightNumber: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  },
  flightRoute: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  flightPrice: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  flightDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  flightDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flightDetailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  flightActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  flightActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  flightActionText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  cancelFlightButton: {
    borderColor: colors.error,
  },
  cancelFlightText: {
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

