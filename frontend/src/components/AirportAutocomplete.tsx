import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
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
  alignSuggestions?: 'left' | 'right';
  compactPlaceholderElement?: React.ReactNode;
  onOpenPicker?: () => void;
}

export default function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'City or airport',
  label,
  style,
  compact = false,
  alignSuggestions = 'left',
  compactPlaceholderElement,
  onOpenPicker,
}: AirportAutocompleteProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isSelectingRef = useRef(false);

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
    // Set flag immediately
    isSelectingRef.current = true;
    
    // Update the value
    const displayText = `${airport.city_name} (${airport.airport_code})`;
    onChange(displayText);
    
    // Hide suggestions and blur input
    setShowSuggestions(false);
    setIsEditing(false);
    
    // Blur the input after a tiny delay to ensure state updates first
    setTimeout(() => {
      inputRef.current?.blur();
    }, 50);
    
    // Reset the flag after selection is complete
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 500);
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
    <Pressable
      style={({ pressed }) => [
        styles.suggestionItem,
        pressed && styles.suggestionItemPressed
      ]}
      onPressIn={() => {
        // Use onPressIn for immediate response on physical devices
        isSelectingRef.current = true;
      }}
      onPress={() => {
        handleSelectAirport(item);
      }}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.airportCode}>{item.airport_code}</Text>
          <View style={styles.suggestionTextContainer}>
            <Text style={styles.cityName}>
              {item.city_name}
            </Text>
            <Text style={styles.airportName} numberOfLines={2} ellipsizeMode="tail">
              {item.airport_name}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const { code, city } = parseValue(value);

  const handleCompactPress = () => {
    if (onOpenPicker) {
      onOpenPicker();
      return;
    }
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      {label && !compact && <Text style={styles.label}>{label}</Text>}
      {compact && !isEditing && (!value || !isAirportFormat(value)) ? (
        <TouchableOpacity
          style={styles.compactDisplay}
          onPress={handleCompactPress}
          activeOpacity={0.7}
        >
          <View style={styles.compactPlaceholderWrapper}>
            {compactPlaceholderElement ? (
              compactPlaceholderElement
            ) : (
              <Text style={styles.compactPlaceholder}>{placeholder}</Text>
            )}
          </View>
        </TouchableOpacity>
      ) : compact && value && !isEditing && isAirportFormat(value) ? (
        <TouchableOpacity
          style={styles.compactDisplay}
          onPress={handleCompactPress}
          activeOpacity={0.7}
        >
          <Text style={styles.compactCode}>{code || placeholder}</Text>
          {city ? (
            <Text style={styles.compactCity}>{city}</Text>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.input, compact && styles.compactInput]}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={(text) => {
              onChange(text);
              setIsEditing(true);
              // Suggestions will be shown automatically when text is entered via useEffect
            }}
            autoCapitalize="words"
            multiline={compact}
            numberOfLines={compact ? 2 : 1}
            onFocus={() => {
              setIsEditing(true);
              // If a previous airport was selected, clear it so user can immediately search again
              if (isAirportFormat(value)) {
                onChange('');
              }
              // Suggestions will be managed by useEffect once text changes
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow onPress to fire
              setTimeout(() => {
                // Don't hide if we're in the middle of selecting
                if (isSelectingRef.current) {
                  return;
                }
                // Only hide editing state if value is in correct format or empty
                if (isAirportFormat(value) || !value.trim()) {
                  setIsEditing(false);
                }
                setShowSuggestions(false);
              }, 300);
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
        <View 
          style={[
            styles.suggestionsContainer,
            alignSuggestions === 'right' ? styles.suggestionsContainerRight : styles.suggestionsContainerLeft
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.suggestionsList} pointerEvents="auto">
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
    overflow: 'visible',
  },
  compactContainer: {
    flex: 1,
    overflow: 'visible',
  },
  compactDisplay: {
    flex: 1,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCode: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  compactCity: {
    ...typography.body1,
    color: colors.textSecondary,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  compactPlaceholder: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  compactPlaceholderWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInput: {
    padding: spacing.sm,
    minHeight: 50,
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    textAlign: 'center',
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
    marginTop: spacing.xs,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    minWidth: 300,
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
  suggestionsContainerLeft: {
    left: 0,
  },
  suggestionsContainerRight: {
    right: 0,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minWidth: 300,
    backgroundColor: '#fff',
  },
  suggestionItemPressed: {
    backgroundColor: colors.surface,
  },
  suggestionContent: {
    flex: 1,
    minWidth: 0,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginRight: spacing.xs,
    minWidth: 0,
  },
  airportName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    flexShrink: 1,
  },
  cityName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
});

