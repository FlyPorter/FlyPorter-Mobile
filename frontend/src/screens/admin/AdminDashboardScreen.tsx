import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data for demonstration
      // TODO: Replace with actual API call
      setTimeout(() => {
        setStats({
          totalFlights: 156,
          totalBookings: 1243,
          totalRevenue: 487650,
          activeCustomers: 892,
        });
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Flight</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="location" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Airport</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="business" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Airline</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="map" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Route</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bookingsList}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.bookingItem}>
              <View style={styles.bookingIcon}>
                <Ionicons name="ticket" size={24} color={colors.primary} />
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingReference}>FP1234567{item}</Text>
                <Text style={styles.bookingRoute}>YYZ → YVR</Text>
              </View>
              <View style={styles.bookingMeta}>
                <Text style={styles.bookingAmount}>$344.70</Text>
                <Text style={styles.bookingTime}>2h ago</Text>
              </View>
            </View>
          ))}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  bookingsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingReference: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  bookingRoute: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bookingMeta: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  bookingTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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

