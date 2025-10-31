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
  View
} from 'react-native';

interface LocationSearchInputProps {
  placeholder: string;
  iconName: string;
  iconColor: string;
  showDropdown?: boolean;
  value?: string;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onPredictionsChange?: (predictions: any[]) => void;
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (typeof value === 'string' && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // useEffect(() => {
  //   if (isPickup && autoFillCurrentLocation && currentLocation && !hasAutoFilled.current) {
  //     hasAutoFilled.current = true;
  //     handleSelectLocation({
  //       lat: currentLocation.latitude,
  //       lng: currentLocation.longitude,
  //       address: 'Current Location',
  //     });
  //   }
  // }, [currentLocation]);


  const getReadableLocationName = async (lat: any, lng:any) => {
  try {
    // 1. First try Places API for nearby businesses/landmarks
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100&key=${GOOGLE_MAPS_API_KEY}`
    );
    const placesData = await placesResponse.json();
    
    if (placesData.status === 'OK' && placesData.results.length > 0) {
      const closestPlace = placesData.results[0];
      return `${closestPlace.name}`; // Returns "Starbucks", "Mall", etc.
    }
    
    // 2. Fallback to reverse geocoding
    return await getBestAddressFromGeocoding(lat, lng);
    
  } catch (error) {
    console.error('Location name error:', error);
    return await getBestAddressFromGeocoding(lat, lng);
  }
};

const getBestAddressFromGeocoding = async (lat: any, lng: any) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  
  if (data.status === 'OK' && data.results.length > 0) {
    // Filter out plus codes
    const bestResult = data.results.find((result: any) => 
      !result.types.includes('plus_code') &&
      !result.formatted_address.includes('+')
    );
    
    if (bestResult) {
      return bestResult.formatted_address;
    }
  }
  
  // Final fallback
  return `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Your button handler - simplified using existing currentLocation
const handleUseCurrentLocation = async () => {
  if (!currentLocation) {
    alert('Location not available yet. Please wait or enable location services.');
    return;
  }

  setIsLoadingLocation(true);
  
  try {
    const address = await getReadableLocationName(
      currentLocation.latitude, 
      currentLocation.longitude
    );

    const testAddress = `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
    
    console.log('Testing with coordinates address:', testAddress);
    
    // handleSelectLocation({
    //   lat: currentLocation.latitude,
    //   lng: currentLocation.longitude,
    //   address: testAddress, // Use simple coordinates first
    // });
    
    onLocationSelect({
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      address: address,
    });

    // Also update the query TextInput
    setQuery(address);
    
  } catch (error) {
    console.error('Location error:', error);
    alert('Unable to get your location details');
  } finally {
    setIsLoadingLocation(false);
  }
};

  // 🆕 UPDATED: Fetch predictions with location biasing
  const fetchPredictions = async (text: string) => {
    if (text.length < 3) {
      setPredictions([]);
      setShowResults(false);
      onPredictionsChange?.([]);
      return;
    }

    try {
      // Build parameters with location biasing
      const params = new URLSearchParams({
        input: text,
        key: GOOGLE_MAPS_API_KEY || '',
        // types: 'geocode,establishment,cities,regions', // Focus on geographic locations
      });

      // Add location biasing if we have user's location
      if (currentLocation) {
        const { latitude, longitude } = currentLocation;
        params.append('location', `${latitude},${longitude}`);
        params.append('radius', '20000'); // 20km radius
        // params.append('strictbounds', 'true'); // Only show results within radius
      }

      const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;

      const res = await fetch(apiUrl);
      const data = await res.json();
      
      if (data?.predictions) {
        setPredictions(data.predictions);
        onPredictionsChange?.(data.predictions);
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
      <View style={[styles.inputContainer, { backgroundColor: theme.border }]}>
        <Ionicons name={iconName as any} size={22} color={iconColor} style={{ marginRight: 8 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text }]}
          value={query}
          onChangeText={handleChangeText}
        />
        {/* {isGettingLocation && <ActivityIndicator size="small" color={theme.primary} />} */}
        {isPickup && currentLocation && !isGettingLocation && (
          <TouchableOpacity 
            onPress={handleUseCurrentLocation}
            style={styles.currentLocationButton}
          >
            {isGettingLocation ? (<ActivityIndicator size="small" color={theme.primary} />) : (

            <Ionicons name="navigate" size={18} color={theme.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

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
  currentLocationButton: {
    padding: 4,
    marginLeft: 8,
  },
});