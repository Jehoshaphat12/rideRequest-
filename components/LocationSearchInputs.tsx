import { useTheme } from '@/contexts/ThemeContext';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface LocationSearchInputProps {
  placeholder: string;
  iconName: string;
  iconColor: string;
  showDropdown?: boolean; // ✅ new prop to control dropdown visibility
  value?: string;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onPredictionsChange?: (predictions: any[]) => void; // ✅ new optional prop
  isPickup?: boolean;
  autoFillCurrentLocation?: boolean;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function LocationSearchInputs({
  placeholder,
  iconName,
  iconColor,
  onLocationSelect,
  onPredictionsChange,
  showDropdown = true,
  value,
  isPickup = false,
  autoFillCurrentLocation = false,
}: LocationSearchInputProps) {
  const { theme } = useTheme();
  const { currentLocation } = useLocationTracking();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | any>();
  const hasAutoFilled = useRef(false);

   // Keep internal query in sync when parent passes a new `value`
  useEffect(() => {
    if (typeof value === 'string' && value !== query) {
      setQuery(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

   useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // --- Auto-fill current location (pickup only) ---
  useEffect(() => {
    if (isPickup && autoFillCurrentLocation && currentLocation && !hasAutoFilled.current) {
      hasAutoFilled.current = true;
      handleSelectLocation({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: 'Current Location',
      });
    }
  }, [currentLocation]);

  // --- Fetch autocomplete predictions ---
  const fetchPredictions = async (text: string) => {
    if (text.length < 3) {
      setPredictions([]);
      setShowResults(false);
      onPredictionsChange?.([]); // ✅ inform parent
      return;
    }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data?.predictions) {
        setPredictions(data.predictions);
        onPredictionsChange?.(data.predictions); // ✅ emit predictions to parent
      } else {
        setPredictions([]);
        onPredictionsChange?.([]);
      }
    } catch (error) {
      console.error('Prediction fetch error:', error);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setShowResults(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchPredictions(text), 500);
  };

  const handleSelectLocation = async (item: any) => {
    setShowResults(false);
    setQuery(item.description || item.address || '');
    setIsGettingLocation(true);

    try {
      let locationData = { lat: 0, lng: 0, address: item.description || item.address || '' };

      if (item.place_id) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await res.json();
        const loc = data.result?.geometry?.location;
        if (loc) locationData = { lat: loc.lat, lng: loc.lng, address: item.description };
      }

      onLocationSelect(locationData);
    } catch (error) {
      console.error('Error selecting location:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View>
      {/* --- Input Row --- */}
      <View style={[styles.inputContainer, { backgroundColor: theme.border }]}>
        <Ionicons name={iconName as any} size={22} color={iconColor} style={{ marginRight: 8 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text }]}
          value={query}
          onChangeText={handleChangeText}
        />
        {isGettingLocation && <ActivityIndicator size="small" color={theme.primary} />}
      </View>

      {/* --- Local dropdown (kept for all pages) --- */}
      {showDropdown && showResults && predictions.length > 0 && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectLocation(item)}
              style={[styles.resultItem, { backgroundColor: theme.card }]}
            >
              <Ionicons name="location-outline" size={18} color={theme.muted} />
              <Text style={[styles.resultText, { color: theme.text }]}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
