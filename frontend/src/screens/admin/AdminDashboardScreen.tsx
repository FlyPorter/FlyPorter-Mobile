import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/theme';
import { flightAPI, adminAPI } from '../../services/api';

interface DashboardStats {
  totalFlights: number;
  totalBookings: number;
  totalRevenue: number;
  activeCustomers: number;
}

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalFlights: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeCustomers: 0,
  });

  // Load data on initial mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      // Fetch all data in parallel (no /customers endpoint exists, we'll derive from bookings)
      const [flightsRes, bookingsRes] = await Promise.all([
        flightAPI.getAll(),
        adminAPI.getAllBookings(),
      ]);

      const flights = flightsRes.data.data || [];
      const bookings = bookingsRes.data.data || [];

      // Calculate total revenue from confirmed bookings
      const revenue = bookings
        .filter((b: any) => b.status === 'confirmed')
        .reduce((sum: number, b: any) => sum + parseFloat(b.total_price || '0'), 0);

      // Count unique customers from bookings
      const uniqueUserIds = new Set(bookings.map((b: any) => b.user_id));
      const customerCount = uniqueUserIds.size;

      setStats({
        totalFlights: flights.length,
        totalBookings: bookings.length,
        totalRevenue: revenue,
        activeCustomers: customerCount,
      });

      setLoading(false);
      setRefreshing(false);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load dashboard data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Overview of your airline operations</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="airplane" size={32} color="#1976D2" />
          <Text style={styles.statValue}>{stats.totalFlights}</Text>
          <Text style={styles.statLabel}>Total Flights</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="calendar" size={32} color="#388E3C" />
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="cash" size={32} color="#F57C00" />
          <Text style={styles.statValue}>
            ${(stats.totalRevenue / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Ionicons name="people" size={32} color="#7B1FA2" />
          <Text style={styles.statValue}>{stats.activeCustomers}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
      </View>

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.statusLabel}>API Server</Text>
            </View>
            <Text style={styles.statusValue}>Online</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.statusLabel}>Database</Text>
            </View>
            <Text style={styles.statusValue}>Operational</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.statusLabel}>Payment Gateway</Text>
            </View>
            <Text style={styles.statusValue}>Active</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
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
  statValue: {
    ...typography.h2,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    ...typography.body1,
    color: colors.text,
  },
  statusValue: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

