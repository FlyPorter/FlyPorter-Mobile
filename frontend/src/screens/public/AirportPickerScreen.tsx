import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/theme';
import { airportAPI } from '../../services/api';

interface Airport {
  airport_code: string;
  airport_name: string;
  city_name: string;
  country_name?: string;
}

interface AirportPickerScreenProps {
  navigation: any;
  route: {
    params: {
      type: 'departure' | 'arrival';
      currentValue?: string;
      returnRouteName?: string;
    };
  };
}

const parseValue = (val?: string) => {
  if (!val) return { code: '', city: '', display: '' };
  const match = val.match(/^(.+?)\s*\((\w{3})\)$/);
  if (match) {
    return { city: match[1], code: match[2], display: val };
  }
  return { code: '', city: val, display: val };
};

export default function AirportPickerScreen({ navigation, route }: AirportPickerScreenProps) {
  const { type, currentValue, returnRouteName } = route.params;
  const [airports, setAirports] = useState<Airport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAirports = async () => {
      try {
        setLoading(true);
        const response = await airportAPI.getAirports();
        const airportData = response.data?.data || response.data || [];
        setAirports(Array.isArray(airportData) ? airportData : []);
      } catch (error) {
        setAirports([]);
      } finally {
        setLoading(false);
      }
    };
    loadAirports();
  }, []);

  const filteredAirports = useMemo(() => {
    if (!searchTerm.trim()) return airports;
    const term = searchTerm.toLowerCase();
    return airports.filter((airport) => {
      const codeMatch = airport.airport_code.toLowerCase().includes(term);
      const nameMatch = airport.airport_name.toLowerCase().includes(term);
      const cityMatch = airport.city_name.toLowerCase().includes(term);
      return codeMatch || nameMatch || cityMatch;
    });
  }, [searchTerm, airports]);

  const handleSelectAirport = (airport: Airport) => {
    const displayText = `${airport.city_name} (${airport.airport_code})`;
    const targetRouteName = returnRouteName || 'Search';
    navigation.navigate({
      name: targetRouteName,
      params: {
        selectedAirport: {
          type,
          value: displayText,
        },
      },
      merge: true,
    });
  };

  const currentParsed = parseValue(currentValue);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
      <View style={styles.sheet}>
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{type === 'arrival' ? 'Flying to?' : 'Flying from?'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.selectedCard}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedCode}>{currentParsed.code || '—'}</Text>
            <Text style={styles.selectedCity}>{currentParsed.city}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color={colors.textSecondary} />
        </View>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter city or airport"
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus
          />
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ScrollView 
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {filteredAirports.map((airport) => (
              <TouchableOpacity
                key={airport.airport_code}
                style={styles.listItem}
                onPress={() => handleSelectAirport(airport)}
                activeOpacity={0.8}
              >
                <Ionicons name="airplane-outline" size={18} color={colors.textSecondary} style={styles.listIcon} />
                <View style={styles.listInfo}>
                  <Text style={styles.listCity}>{airport.city_name}</Text>
                  <Text style={styles.listAirport}>{airport.airport_name}</Text>
                </View>
                <Text style={styles.listCode}>{airport.airport_code}</Text>
              </TouchableOpacity>
            ))}
            {filteredAirports.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No airports found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
  },
  cancelText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  selectedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  selectedInfo: {
    flexDirection: 'column',
  },
  selectedCode: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  selectedCity: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    paddingVertical: spacing.xs + 2,
    lineHeight: 22,
    minHeight: 32,
  },
  list: {
    flexGrow: 0,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listIcon: {
    marginRight: spacing.md,
  },
  listInfo: {
    flex: 1,
  },
  listCity: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  listAirport: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listCode: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '700',
  },
  loadingState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
});


