import React, { useState, useEffect } from 'react';
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { 
  cityAPI, 
  airportAPI, 
  airlineAPI, 
  routeAPI, 
  adminAPI 
} from '../../services/api';
type ManageTab = 'cities' | 'airports' | 'airlines' | 'routes';

interface City {
  city_id: number;
  city_name: string;
  country: string;
  timezone: string;
}

interface Airport {
  airport_id: number;
  airport_code: string;
  airport_name: string;
  city_name: string;
  city_id: number;
}

interface Airline {
  airline_id: number;
  airline_code: string;
  airline_name: string;
}

interface Route {
  route_id: number;
  origin_airport_code: string;
  destination_airport_code: string;
  origin_airport: {
    airport_code: string;
    airport_name: string;
    city_name: string;
  };
  destination_airport: {
    airport_code: string;
    airport_name: string;
    city_name: string;
  };
}

export default function AdminManageScreen() {
  const [activeTab, setActiveTab] = useState<ManageTab>('cities');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [cities, setCities] = useState<City[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
const [routes, setRoutes] = useState<Route[]>([]);

  // Load data when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'cities':
          await loadCities();
          break;
        case 'airports':
          await loadAirports();
          break;
        case 'airlines':
          await loadAirlines();
          break;
        case 'routes':
          await loadRoutes();
          break;
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadCities = async () => {
    const response = await cityAPI.getCities();
    setCities(response.data.data);
  };

  const loadAirports = async () => {
    const response = await airportAPI.getAirports();
    setAirports(response.data.data);
  };

  const loadAirlines = async () => {
    const response = await airlineAPI.getAirlines();
    setAirlines(response.data.data);
  };

  const loadRoutes = async () => {
    const response = await routeAPI.getRoutes();
    setRoutes(response.data.data);
  };


  const handleDelete = async (type: string, identifier: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${name}? This may affect related data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              switch (type) {
                case 'city':
                  // Uses city name
                  await adminAPI.deleteCity(identifier);
                  break;
                case 'airport':
                  // Uses airport code
                  await adminAPI.deleteAirport(identifier);
                  break;
                case 'airline':
                  // Uses airline code
                  await adminAPI.deleteAirline(identifier);
                  break;
                case 'route':
                  // Uses route ID
                  await adminAPI.deleteRoute(identifier);
                  break;
              }
              Alert.alert('Success', `${name} deleted successfully`);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const renderCitiesTab = () => (
    <View style={styles.tabContent}>
      <Text key="description" style={styles.tabDescription}>
        Manage cities where your airline operates
      </Text>

      {loading ? (
        <ActivityIndicator key="loader" size="large" color={colors.primary} style={styles.loader} />
      ) : cities.length === 0 ? (
        <Text key="empty" style={styles.emptyText}>No cities found</Text>
      ) : (
        <View key="content" style={styles.itemsList}>
          {cities.map((city, index) => {
            const cityKey = city.city_id ?? city.city_name ?? `city-${index}`;
            return (
              <View key={cityKey} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Ionicons name="location" size={24} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{city.city_name}</Text>
                  <Text style={styles.itemMeta}>{city.country} • {city.timezone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete('city', city.city_name, city.city_name)}
                >
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderAirportsTab = () => (
    <View style={styles.tabContent}>
      <Text key="description" style={styles.tabDescription}>
        Manage airports and their details
      </Text>

      {loading ? (
        <ActivityIndicator key="loader" size="large" color={colors.primary} style={styles.loader} />
      ) : airports.length === 0 ? (
        <Text key="empty" style={styles.emptyText}>No airports found</Text>
      ) : (
        <View key="content" style={styles.itemsList}>
          {airports.map((airport, index) => {
            const airportKey = airport.airport_id ?? airport.airport_code ?? `airport-${index}`;
            return (
              <View key={airportKey} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Ionicons name="airplane" size={24} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{airport.airport_name}</Text>
                  <Text style={styles.itemMeta}>
                    {airport.airport_code} • {airport.city_name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete('airport', airport.airport_code, airport.airport_name)}
                >
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderAirlinesTab = () => (
    <View style={styles.tabContent}>
      <Text key="description" style={styles.tabDescription}>
        Manage airline partners and carriers
      </Text>

      {loading ? (
        <ActivityIndicator key="loader" size="large" color={colors.primary} style={styles.loader} />
      ) : airlines.length === 0 ? (
        <Text key="empty" style={styles.emptyText}>No airlines found</Text>
      ) : (
        <View key="content" style={styles.itemsList}>
          {airlines.map((airline) => (
            <View key={airline.airline_id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name="business" size={24} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{airline.airline_name}</Text>
                <Text style={styles.itemMeta}>{airline.airline_code}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete('airline', airline.airline_code, airline.airline_name)}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRoutesTab = () => {
    // Group routes by origin-destination pair
    const groupedRoutes = routes.reduce((acc, route) => {
      const key = `${route.origin_airport_code}-${route.destination_airport_code}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(route);
      return acc;
    }, {} as Record<string, Route[]>);

    return (
      <View style={styles.tabContent}>
        <Text key="description" style={styles.tabDescription}>
          Manage flight routes between airports
        </Text>

        {loading ? (
          <ActivityIndicator key="loader" size="large" color={colors.primary} style={styles.loader} />
        ) : routes.length === 0 ? (
          <Text key="empty" style={styles.emptyText}>No routes found</Text>
        ) : (
          <View key="content" style={styles.itemsList}>
            {Object.entries(groupedRoutes).map(([key, routeGroup]) => {
              const firstRoute = routeGroup[0];
              return (
                <View key={key} style={styles.routeGroupCard}>
                  <View style={styles.routeGroupHeader}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {firstRoute.origin_airport.airport_code} → {firstRoute.destination_airport.airport_code}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {firstRoute.origin_airport.city_name} to {firstRoute.destination_airport.city_name}
                      </Text>
                      {routeGroup.length > 1 && (
                        <Text style={styles.routeCount}>
                          {routeGroup.length} routes
                        </Text>
                      )}
                    </View>
                    
                    {/* Delete buttons for each route */}
                    <View style={styles.routeDeleteContainer}>
                      {routeGroup.map((route) => (
                        <TouchableOpacity
                          key={route.route_id}
                          style={styles.deleteButton}
                          onPress={() => handleDelete('route', route.route_id.toString(), `${firstRoute.origin_airport.airport_code} to ${firstRoute.destination_airport.airport_code}`)}
                        >
                          <Ionicons name="trash" size={20} color={colors.error} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };


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
            key="cities"
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
            key="airports"
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
            key="airlines"
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
            key="routes"
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

        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs / 2,
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
  routeGroupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
  routeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  routeCount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  routeDeleteContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  limitWarningText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
  },
});

