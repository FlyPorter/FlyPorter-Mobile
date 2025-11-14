import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/theme';
import { airportAPI } from '../services/api';

interface Airport {
  airport_code: string;
  airport_name: string;
  city_name: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
  compact?: boolean;
}

export default function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'City or airport',
  label,
  style,
  compact = false,
}: AirportAutocompleteProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Check if the current value matches an airport format
  const isAirportFormat = (text: string) => {
    return /^.+ \(\w{3}\)$/.test(text);
  };

  // Extract search term from value (remove airport code if present)
  const getSearchTerm = (text: string) => {
    if (isAirportFormat(text)) {
      // If it's already in format "City (CODE)", extract city name
      return text.split(' (')[0];
    }
    return text;
  };

  const loadAirports = async () => {
    try {
      setLoading(true);
      const response = await airportAPI.getAirports();
      // Backend returns { success: true, data: [...] }
      const airportData = response.data?.data || response.data || [];
      setAirports(Array.isArray(airportData) ? airportData : []);
    } catch (error: any) {
      console.error('Error loading airports:', error);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Backend server is not running or not accessible');
        console.error('Please start the backend server: cd backend && npm run dev');
      }
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAirport = (airport: Airport) => {
    const displayText = `${airport.city_name} (${airport.airport_code})`;
    onChange(displayText);
    setShowSuggestions(false);
    setIsEditing(false);
    inputRef.current?.blur();
  };

  const parseValue = (val: string) => {
    if (!val) return { code: '', city: '' };
    const match = val.match(/^(.+?)\s*\((\w{3})\)$/);
    if (match) {
      return { code: match[2], city: match[1] };
    }
    return { code: '', city: val };
  };

  // Load airports on mount
  useEffect(() => {
    loadAirports();
  }, []);

  // Filter airports based on input
  useEffect(() => {
    const searchTerm = getSearchTerm(value).toLowerCase().trim();
    if (searchTerm.length > 0) {
      const filtered = airports.filter((airport) => {
        const codeMatch = airport.airport_code.toLowerCase().includes(searchTerm);
        const nameMatch = airport.airport_name.toLowerCase().includes(searchTerm);
        const cityMatch = airport.city_name.toLowerCase().includes(searchTerm);
        return codeMatch || nameMatch || cityMatch;
      });
      // Sort by relevance: exact matches first, then code matches, then name/city matches
      const sorted = filtered.sort((a, b) => {
        const aCode = a.airport_code.toLowerCase();
        const bCode = b.airport_code.toLowerCase();
        const aName = a.airport_name.toLowerCase();
        const bName = b.airport_name.toLowerCase();
        const aCity = a.city_name.toLowerCase();
        const bCity = b.city_name.toLowerCase();
        const term = searchTerm;
        
        // Exact code match
        if (aCode === term && bCode !== term) return -1;
        if (bCode === term && aCode !== term) return 1;
        
        // Code starts with
        if (aCode.startsWith(term) && !bCode.startsWith(term)) return -1;
        if (bCode.startsWith(term) && !aCode.startsWith(term)) return 1;
        
        // City/name starts with
        if ((aCity.startsWith(term) || aName.startsWith(term)) && 
            !(bCity.startsWith(term) || bName.startsWith(term))) return -1;
        if ((bCity.startsWith(term) || bName.startsWith(term)) && 
            !(aCity.startsWith(term) || aName.startsWith(term))) return 1;
        
        return 0;
      });
      
      setFilteredAirports(sorted.slice(0, 10)); // Limit to 10 results
      // Only show suggestions if we have filtered results and value doesn't match airport format
      if (isEditing && sorted.length > 0 && !isAirportFormat(value)) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      // Don't show suggestions when input is empty - only show after user starts typing
      setFilteredAirports([]);
      setShowSuggestions(false);
    }
  }, [value, airports, isEditing]);

  const renderSuggestion = ({ item }: { item: Airport }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectAirport(item)}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.airportCode}>{item.airport_code}</Text>
          <View style={styles.suggestionTextContainer}>
            <Text style={styles.airportName} numberOfLines={1} ellipsizeMode="tail">
              {item.airport_name}
            </Text>
            <Text style={styles.cityName} numberOfLines={1} ellipsizeMode="tail">
              {item.city_name}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const { code, city } = parseValue(value);

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      {label && !compact && <Text style={styles.label}>{label}</Text>}
      {compact && value && !isEditing && isAirportFormat(value) ? (
        <TouchableOpacity
          style={styles.compactDisplay}
          onPress={() => {
            setIsEditing(true);
            // Don't clear value, just allow editing
            // Focus input after a short delay
            setTimeout(() => {
              inputRef.current?.focus();
            }, 50);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.compactCode}>{code}</Text>
          <Text style={styles.compactCity}>{city}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.input, compact && styles.compactInput]}
            placeholder={placeholder}
            value={value}
            onChangeText={(text) => {
              onChange(text);
              setIsEditing(true);
              // Suggestions will be shown automatically when text is entered via useEffect
            }}
            autoCapitalize="words"
            onFocus={() => {
              setIsEditing(true);
              // Always show suggestions when focused (useEffect will handle the logic)
              // This allows users to see suggestions even when input is empty
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow onPress to fire
              setTimeout(() => {
                // Only hide editing state if value is in correct format or empty
                if (isAirportFormat(value) || !value.trim()) {
                  setIsEditing(false);
                }
                setShowSuggestions(false);
              }, 200);
            }}
          />
        </View>
      )}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : null}

      {showSuggestions && filteredAirports.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsList}>
            {filteredAirports.map((item) => (
              <View key={item.airport_code}>
                {renderSuggestion({ item })}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  compactContainer: {
    flex: 1,
  },
  compactDisplay: {
    flex: 1,
    padding: spacing.xs,
  },
  compactCode: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  compactCity: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  compactInput: {
    padding: spacing.sm,
    minHeight: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  label: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    ...typography.body1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  loaderContainer: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  airportCode: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 50,
  },
  suggestionTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  airportName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  cityName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

