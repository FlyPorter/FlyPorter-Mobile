import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { colors, spacing, typography } from '../../theme/theme';
import { format } from 'date-fns';

const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    isLoading,
  } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    
    // Note: We don't navigate anywhere since notifications are informational only.
    // Users can view their bookings by going to the My Bookings tab.
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'BOOKING_CONFIRMATION':
        return 'checkmark-circle';
      case 'BOOKING_CANCELLATION':
        return 'close-circle';
      case 'PAYMENT_SUCCESS':
        return 'card';
      case 'PAYMENT_FAILED':
        return 'warning';
      case 'FLIGHT_REMINDER':
        return 'airplane';
      case 'FLIGHT_DELAYED':
        return 'time';
      case 'FLIGHT_CANCELLED':
        return 'alert-circle';
      case 'GENERAL':
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'BOOKING_CONFIRMATION':
      case 'PAYMENT_SUCCESS':
        return colors.success;
      case 'BOOKING_CANCELLATION':
      case 'PAYMENT_FAILED':
      case 'FLIGHT_CANCELLED':
        return colors.error;
      case 'FLIGHT_DELAYED':
        return colors.warning;
      case 'FLIGHT_REMINDER':
        return colors.info;
      case 'GENERAL':
      default:
        return colors.primary;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadBadge} />}
          </View>

          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>

          <Text style={styles.notificationTime}>
            {format(new Date(item.created_at), 'MMM dd, yyyy • hh:mm a')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You don't have any notifications yet. We'll notify you when there are updates to your bookings.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Text style={styles.unreadCountText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {notifications.length > 0 && unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllButtonText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.notification_id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  unreadCountText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  unreadNotification: {
    backgroundColor: colors.primary + '05',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notificationTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default NotificationsScreen;

