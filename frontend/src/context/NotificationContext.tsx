import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import { notificationAPI, profileAPI } from '../services/api';
import { useAuth } from './AuthContext';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface Notification {
  notification_id: number;
  user_id: number;
  booking_id?: number;
  flight_id?: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  expoPushToken: string | null;
  notifications: Notification[];
  unreadCount: number;
  notification: Notifications.Notification | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, loading: authLoading } = useAuth(); // Get loading state from auth

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const lastBadgeCount = useRef<number>(0); // Store last badge count to persist across state updates

  // Clear badge on initial mount AFTER auth has finished loading
  useEffect(() => {
    // Wait for auth to finish loading before clearing badge
    if (!authLoading) {
      const clearInitialBadge = async () => {
        // Only clear if user is NOT logged in
        if (!user || !token) {
          try {
            await Notifications.setBadgeCountAsync(0);
            console.log('Initial badge cleared - user not logged in');
          } catch (error) {
            // Silent fail - badge clearing is not critical
          }
        }
      };
      
      clearInitialBadge();
    }
  }, [authLoading, user, token]); // Run when auth loading completes

  // Register for push notifications
  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      // Only proceed if permission already granted (don't request here)
      if (existingStatus !== 'granted') {
        console.log('Notification permission not granted yet');
        return null;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: '41db8150-1fcf-4ca7-8df5-326983ed87c2',
        })).data;
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  // Request notification permissions
  const requestPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert('Device Required', 'Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Failed to get push notification permissions!');
      return false;
    }

    return true;
  };

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!user || !token) return;
    
    try {
      setIsLoading(true);
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data || []);
      await refreshUnreadCount();
    } catch (error: any) {
      // Only log error if it's not a 401 (which means user is not logged in)
      if (error.response?.status !== 401) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh unread count
  const refreshUnreadCount = async () => {
    if (!user || !token) return;
    
    try {
      const response = await notificationAPI.getUnreadCount();
      const count = response.data.data?.count || 0;
      setUnreadCount(count);
      lastBadgeCount.current = count; // Store in ref for persistence
      
      // Update app icon badge count
      await Notifications.setBadgeCountAsync(count);
    } catch (error: any) {
      // Only log error if it's not a 401 (which means user is not logged in)
      if (error.response?.status !== 401) {
        console.error('Error fetching unread count:', error);
      }
      // Don't update badge or count on error - keep existing value
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!user || !token) return;
    
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || !token) return;
    
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      // Clear app icon badge
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Send push token to backend
  const sendPushTokenToBackend = async (pushToken: string) => {
    if (!user || !token) return;
    
    try {
      await profileAPI.registerPushToken(pushToken);
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  };

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user && token) {
      // Fetch initial data
      fetchNotifications();
      refreshUnreadCount();

      // Set up listeners
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        // Refresh notifications when a new one comes in
        fetchNotifications();
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        // You can handle navigation here based on notification data
        const data = response.notification.request.content.data;
        if (data.bookingId) {
          // Navigate to booking details
          console.log('Navigate to booking:', data.bookingId);
        }
      });
    } else {
      // User not logged in or logged out - clear notification state
      setNotifications([]);
      setUnreadCount(0);
      setExpoPushToken(null);
      setNotification(null);
      lastBadgeCount.current = 0;
      
      // Clear app icon badge (important: do this whenever user is not logged in)
      Notifications.setBadgeCountAsync(0).catch(() => {
        // Silent fail
      });
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, token]);

  // Refresh unread count periodically (every 30 seconds)
  useEffect(() => {
    if (user && token) {
      const interval = setInterval(() => {
        refreshUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, token]);

  // Check for notification permissions and register for push token if granted
  useEffect(() => {
    if (user && token && !expoPushToken) {
      const checkAndRegister = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            setExpoPushToken(pushToken);
            sendPushTokenToBackend(pushToken);
          }
        }
      };

      // Check immediately
      checkAndRegister();

      // Check every 5 seconds for the first minute after login
      const interval = setInterval(checkAndRegister, 5000);
      const timeout = setTimeout(() => clearInterval(interval), 60000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [user, token, expoPushToken]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    if (user && token) {
      const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        // When app comes to foreground, restore badge count
        if (nextAppState === 'active') {
          // Restore badge count from ref (more reliable than state)
          // Use setTimeout to ensure this runs after any potential badge clearing
          setTimeout(async () => {
            try {
              const badgeCount = lastBadgeCount.current;
              await Notifications.setBadgeCountAsync(badgeCount);
              console.log('Badge restored to:', badgeCount);
            } catch (error) {
              console.error('Error restoring badge count:', error);
            }
          }, 500); // Increased delay to ensure it runs after any system badge clearing
        }
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        subscription.remove();
      };
    }
  }, [user, token]);

  const value = {
    expoPushToken,
    notifications,
    unreadCount,
    notification,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount,
    requestPermissions,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

