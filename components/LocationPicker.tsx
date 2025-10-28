// /components/LocationPicker.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { geocodeAddress } from "@/services/geocodingService";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LocationSearchInput from "./LocationSearchInput";

// Web-compatible map component
const WebMapPicker = React.lazy(() =>
  Platform.OS === "web"
    ? import("./WebMapPicker")
    : Promise.resolve({ default: (props: any) => <></> })
);

// Mobile MapView (only import on native)
let MapView: any;
let Marker: any;

if (Platform.OS !== "web") {
  try {
    // Correct way to import react-native-maps
    const Maps = require("react-native-maps");
    MapView = Maps.default || Maps; // MapView is typically the default export
    Marker = Maps.Marker;

    console.log("Map components loaded:", {
      MapView: !!MapView,
      Marker: !!Marker,
    });
  } catch (error) {
    console.error("Error loading react-native-maps:", error);
  }
}

// Add safety check before using MapView and Marker
const SafeMapView =
  MapView ||
  ((props: any) => {
    const { theme } = useTheme();
    return (
      <View
        {...props}
        style={[
          props.style,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: theme.text }}>Map not available</Text>
      </View>
    );
  });

const SafeMarker = Marker || (() => null);

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  initialAddress?: string;
}

export default function LocationPicker({
  visible,
  onClose,
  onLocationSelect,
  initialAddress = "",
}: LocationPickerProps) {
  const { theme } = useTheme();
  const { location: currentLocation } = useCurrentLocation();

  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{
      address: string;
      lat: number;
      lng: number;
    }>
  >([]);

  // Initialize map with current location
  useEffect(() => {
    if (currentLocation && visible) {
      const region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
      setSelectedLocation({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    }
  }, [currentLocation, visible]);

  // Search for addresses
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await geocodeAddress(searchQuery);
      if (results) {
        setSearchResults([results]);
        setMapRegion({
          latitude: results.lat,
          longitude: results.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSelectedLocation({ lat: results.lat, lng: results.lng });
      }
    } catch (error) {
      Alert.alert(
        "Search Error",
        "Could not find the location. Please try a different address."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle map press to select location
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      address: coordinate.address
    });
  };

  // Handle location selection from search
  const handleLocationSelect = (location: any) => {
    if (location && location.lat !== undefined && location.lng !== undefined) {
      setSelectedLocation({
        lat: location.lat,
        lng: location.lng,
      });
      setMapRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      if (location.address) {
        setSearchQuery(location.address);
      }
    }
  };

  // Confirm location selection
  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    setLoading(true);
    try {
      const address = searchQuery || "Selected Location";
      onLocationSelect({
        address,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
      onClose();
    } catch (error) {
      Alert.alert("Error", "Could not get address for selected location");
    } finally {
      setLoading(false);
    }
  };

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedLocation(null);
      setSearchQuery(initialAddress);
      setLoading(false);
    }
  }, [visible, initialAddress]);

  // Web fallback component
  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>
              Select Location
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Bar */}
          <View
            style={[styles.searchContainer, { backgroundColor: theme.card }]}
          >
            <LocationSearchInput
              placeholder="Enter Location"
              iconName="locate-outline"
              iconColor={theme.primary}
              onLocationSelect={handleLocationSelect}
              isPickup={false}
              autoFillCurrentLocation={true}
            />
          </View>

          {/* Web Map */}
          <View style={styles.mapContainer}>
            <React.Suspense
              fallback={
                <View style={styles.loadingMap}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.text }]}>
                    Loading map...
                  </Text>
                </View>
              }
            >
              <WebMapPicker
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                initialLocation={mapRegion}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
              />
            </React.Suspense>
          </View>

          {/* Selected Location Info */}
          {selectedLocation && (
            <View
              style={[styles.locationInfo, { backgroundColor: theme.card }]}
            >
              <Ionicons name="location" size={20} color={theme.primary} />
              <Text style={[styles.locationText, { color: theme.text }]}>
                {searchQuery || "Selected Location"}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={[styles.footer, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={[styles.button, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleConfirmLocation}
              disabled={loading || !selectedLocation}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryText} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                  Confirm Location
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile implementation
  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            Select Location
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <LocationSearchInput
            placeholder="Enter Location"
            iconName="locate-outline"
            iconColor={theme.primary}
            onLocationSelect={handleLocationSelect}
            isPickup={false}
            autoFillCurrentLocation={true}
          />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {mapRegion && (
            // <MapView
            //   style={styles.map}
            //   region={mapRegion}
            //   onPress={handleMapPress}
            //   showsUserLocation
            //   showsCompass
            //   showsScale
            // >
            //   {selectedLocation && (
            //     <Marker
            //       coordinate={{
            //         latitude: selectedLocation.lat,
            //         longitude: selectedLocation.lng,
            //       }}
            //       pinColor={theme.primary}
            //     />
            //   )}
            // </MapView>
            <SafeMapView
              style={styles.map}
              region={mapRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsCompass
              showsScale
            >
              {selectedLocation && (
                <SafeMarker
                  coordinate={{
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                  }}
                  pinColor={theme.primary}
                />
              )}
            </SafeMapView>
          )}
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={[styles.locationInfo, { backgroundColor: theme.card }]}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[styles.locationText, { color: theme.text }]}>
              {searchQuery || "Selected Location"}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[styles.button, { borderColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleConfirmLocation}
            disabled={loading || !selectedLocation}
          >
            {loading ? (
              <ActivityIndicator color={theme.primaryText} size="small" />
            ) : (
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                Confirm Location
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  searchContainer: {
    flexDirection: "column",
    padding: 16,
    gap: 12,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  locationText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingMap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
