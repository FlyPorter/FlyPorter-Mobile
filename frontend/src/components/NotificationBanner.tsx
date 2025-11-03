import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/theme';

interface NotificationBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onDismiss?: () => void;
}

export default function NotificationBanner({
  type,
  title,
  message,
  onDismiss,
}: NotificationBannerProps) {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.info;
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Ionicons name={getIconName()} size={24} color="#fff" />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    margin: spacing.md,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body1,
    fontWeight: '600',
    color: '#fff',
  },
  message: {
    ...typography.body2,
    color: '#fff',
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  dismissButton: {
    padding: spacing.xs,
  },
});

