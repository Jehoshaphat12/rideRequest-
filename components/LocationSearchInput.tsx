 // components/LocationSearchInput.tsx
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
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  isPickup?: boolean; // New prop to identify pickup field
  autoFillCurrentLocation?: boolean; // New prop to enable auto-fill
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function LocationSearchInput({
  placeholder,
  iconName,
  iconColor,
  onLocationSelect,
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
  const hasAutoFilled = useRef(false); // Prevent multiple auto-fills

  // Auto-fill current location for pickup field
  useEffect(() => {
    if (isPickup && autoFillCurrentLocation && currentLocation && !hasAutoFilled.current) {
      autoFillWithCurrentLocation();
    }
  }, [currentLocation, isPickup, autoFillCurrentLocation]);

  const autoFillWithCurrentLocation = async () => {
    if (!currentLocation || hasAutoFilled.current) return;
    
    setIsGettingLocation(true);
    try {
      // Try to get the address from coordinates (reverse geocoding)
      const address = await getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      const locationData = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: address || 'Current Location'
      };
      
      setQuery(address || 'Current Location');
      onLocationSelect(locationData);
      hasAutoFilled.current = true;
      
    } catch (error) {
      console.error('Error getting current location address:', error);
      // Fallback: just use "Current Location" text
      const locationData = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: 'Current Location'
      };
      setQuery('Current Location');
      onLocationSelect(locationData);
      hasAutoFilled.current = true;
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
         // Get the most specific address (not the generic one)
        const result = data.results.find((r: any) => 
          r.types.includes('street_address') || 
          r.types.includes('premise') ||
          r.types.includes('point_of_interest')
        ) || data.results[0];
        
        return result.formatted_address;
      }
      return '';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return '';
    }
  };

  useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

  const searchPlaces = async (searchText: string) => {
    if (searchText.length < 3) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          searchText
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:gh`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setPredictions(data.predictions);
        setShowResults(true);
      } else {
        setPredictions([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPredictions([]);
      setShowResults(false);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handlePredictionSelect = async (prediction: any) => {
    try {
      // Get place details
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === 'OK') {
        const location = detailsData.result.geometry.location;
        onLocationSelect({
          lat: location.lat,
          lng: location.lng,
          address: prediction.description,
        });
        setQuery(prediction.description);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!currentLocation) {
      return;
    }
    
    
    setIsGettingLocation(true);
    try {
      const address = await getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      
      const locationData = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: address || 'Current Location'
      };
      
      setQuery(address || 'Current Location');
      onLocationSelect(locationData);
      setShowResults(false);
      
    } catch (error) {
      console.error('Error using current location:', error);
      const locationData = {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        address: 'Current Location'
      };
      setQuery('Current Location');
      onLocationSelect(locationData);
      setShowResults(false);
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
        {isGettingLocation ? (
          <ActivityIndicator size="small" color={iconColor} style={styles.icon} />
        ) : (
          <Ionicons name={iconName as any} size={20} color={iconColor} style={styles.icon} />
        )}
        
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          value={query}
          onChangeText={handleTextChange}
          onFocus={() => query.length >= 3 && setShowResults(true)}
          
        />
        
        {/* Current Location Button - Only show for pickup field */}
        {isPickup && currentLocation && !isGettingLocation && (
          <TouchableOpacity 
            onPress={handleUseCurrentLocation}
            style={styles.currentLocationButton}
          >
            <Ionicons name="navigate" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && predictions.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: theme.card }]}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { borderBottomColor: theme.border }]}
                onPress={() => handlePredictionSelect(item)}
              >
                <Ionicons name="location-outline" size={16} color={theme.muted} />
                <Text style={[styles.resultText, { color: theme.text }]}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  icon: {
    marginRight: 12,
    width: 20, // Fixed width for alignment
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  currentLocationButton: {
    padding: 4,
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  resultText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});