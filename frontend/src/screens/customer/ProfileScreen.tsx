import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import DatePicker from '../../components/DatePicker';

export default function ProfileScreen() {
  const { user, logout, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [passport, setPassport] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load profile data when component mounts
    loadProfile();
  }, []);

  const formatDateForInput = (dateValue?: string | Date | null) => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const loadProfile = async () => {
    try {
      const response = await profileAPI.get();
      const profileData = response.data?.data || response.data;
      
      if (profileData) {
        const loadedName = profileData.customer_info?.full_name || profileData.full_name || profileData.name || user?.name || '';
        const loadedEmail = profileData.email || user?.email || '';
        let loadedPhone = profileData.customer_info?.phone || profileData.phone || profileData.phone_number || user?.phone || '';
        const loadedPassport = profileData.customer_info?.passport_number || '';
        const loadedDob = formatDateForInput(profileData.customer_info?.date_of_birth);
        
        // Strip non-numeric characters from phone number (remove +, spaces, dashes, etc.)
        if (loadedPhone) {
          loadedPhone = loadedPhone.replace(/[^0-9]/g, '');
        }
        
        setName(loadedName);
        setEmail(loadedEmail);
        setPhone(loadedPhone);
        setPassport(loadedPassport);
        setDateOfBirth(loadedDob);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use user data from context as fallback
      setName(user?.name || '');
      setEmail(user?.email || '');
      setPhone(user?.phone || '');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await profileAPI.update({
        full_name: name.trim(),
        phone: phone.trim() || undefined,
        passport_number: passport.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
      });
      
      const responseData = response.data;
      // Check if response has success field
      if (responseData?.success === false) {
        throw new Error(responseData?.error || responseData?.message || 'Profile update failed');
      }
      
      // Reload profile to get updated data first
      await loadProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {isAdmin ? 'Admin' : 'Customer'}
          </Text>
        </View>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity
            onPress={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            disabled={loading}
          >
            <Text style={styles.editButton}>
              {loading ? 'Saving...' : editing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={name}
              onChangeText={setName}
              editable={editing}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              editable={editing}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={phone}
              onChangeText={(text) => {
                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                setPhone(numericText);
              }}
              editable={editing}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Passport Number</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={passport}
              onChangeText={(text) => {
                // Only allow alphanumeric characters, max 9 characters
                const alphanumericText = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9);
                setPassport(alphanumericText);
              }}
              editable={editing}
              autoCapitalize="characters"
              maxLength={9}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            {editing ? (
              <DatePicker
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="Select date"
                minimumDate="1949-10-01"
                maximumDate={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formatDateForDisplay(dateOfBirth)}
                editable={false}
              />
            )}
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>FlyPorter v1.0.0</Text>
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
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '700',
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
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
  },
  editButton: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.sm,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

