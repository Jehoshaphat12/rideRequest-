// components/MapViewComponent.tsx
import { darkMapStyle, lightMapStyle } from "@/constants/mapStyles";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ✅ Moved outside the component to fix hook order issue
const WebMapComponent = React.lazy(() => import("./WebMapComponent"));

type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

interface Props {
  pickupLocation?: Location | null;
  destinationLocation?: Location | null;
  riderLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  currentLocation?: { latitude: number; longitude: number } | null;
  routeCoords?: Array<{ latitude: number; longitude: number }>;
  showRoute?: boolean;
  fitToMarkers?: boolean; // New prop to control auto-fitting
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function MapViewComponent({
  pickupLocation,
  destinationLocation,
  riderLocation,
  currentLocation,
  routeCoords,
  showRoute = false,
  fitToMarkers = true, // Default to true for auto-fitting
}: Props) {
  const { darkMode } = useTheme();

  const [calculatedRoute, setCalculatedRoute] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const mapRef = useRef<any>(null);

  const initialRegion =
    pickupLocation || currentLocation || destinationLocation || null;

  // Helper: Validate coordinates
  const isValidCoord = (loc: any) =>
    !!loc &&
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number" &&
    !Number.isNaN(loc.latitude) &&
    !Number.isNaN(loc.longitude) &&
    loc.latitude !== 0 &&
    loc.longitude !== 0;

  // ✅ Get all valid coordinates for fitting
  const getValidCoordinates = () => {
    const coords = [];

    if (isValidCoord(pickupLocation)) {
      coords.push({
        latitude: pickupLocation!.latitude,
        longitude: pickupLocation!.longitude,
      });
    }

    if (isValidCoord(destinationLocation)) {
      coords.push({
        latitude: destinationLocation!.latitude,
        longitude: destinationLocation!.longitude,
      });
    }

    if (isValidCoord(currentLocation)) {
      coords.push({
        latitude: currentLocation!.latitude,
        longitude: currentLocation!.longitude,
      });
    }

    return coords;
  };

  // ✅ Fit map to markers whenever pickup/destination changes
  const fitToMarkersOnChange = () => {
    if (!mapRef.current || !fitToMarkers) return;

    const validCoords = getValidCoordinates();

    if (validCoords.length === 0) return;

    try {
      // Small delay to ensure map is ready
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(validCoords, {
            edgePadding: {
              top: 120,
              right: 60,
              bottom: 160,
              left: 60,
            },
            animated: true,
          });
        }
      }, 100);
    } catch (e) {
      console.warn("fitToCoordinates failed:", e);
    }
  };

  // ✅ Fit to markers when pickup/destination changes
  useEffect(() => {
    fitToMarkersOnChange();
  }, [pickupLocation, destinationLocation, fitToMarkers]);

  // ✅ Fetch route automatically when both pickup & destination exist
  useEffect(() => {
    const fetchRoute = async () => {
      if (!showRoute || !pickupLocation || !destinationLocation) return;

      setLoadingRoute(true);
      try {
        const route = await getRouteFromGoogle(
          pickupLocation,
          destinationLocation
        );
        setCalculatedRoute(route.coordinates);
      } catch (err) {
        console.error("Failed to fetch route:", err);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [pickupLocation, destinationLocation, showRoute]);

  // ✅ Fit map to route when route coordinates are available
  useEffect(() => {
    if (
      mapRef.current &&
      Array.isArray(routeCoords) &&
      routeCoords.length > 0
    ) {
      try {
        mapRef.current.fitToCoordinates(routeCoords, {
          edgePadding: { top: 120, right: 60, bottom: 160, left: 60 },
          animated: true,
        });
      } catch (e) {
        console.warn("fitToCoordinates failed:", e);
      }
    }
  }, [routeCoords]);

  // ✅ Fit to calculated route when it changes
  useEffect(() => {
    if (
      mapRef.current &&
      showRoute &&
      calculatedRoute.length > 0 &&
      !routeCoords?.length // Only fit if we don't have explicit routeCoords
    ) {
      try {
        mapRef.current.fitToCoordinates(calculatedRoute, {
          edgePadding: { top: 120, right: 60, bottom: 160, left: 60 },
          animated: true,
        });
      } catch (e) {
        console.warn("fitToCoordinates failed:", e);
      }
    }
  }, [calculatedRoute, showRoute, routeCoords]);

  // ✅ WEB PLATFORM HANDLING
  if (Platform.OS === "web") {
    if (!isValidCoord(initialRegion)) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loaderText}>Loading map...</Text>
        </View>
      );
    }

    return (
      <React.Suspense
        fallback={
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loaderText}>Loading map...</Text>
          </View>
        }
      >
        <WebMapComponent
          pickupLocation={pickupLocation!}
          destinationLocation={destinationLocation!}
          routeCoords={routeCoords}
          showRoute={showRoute}
          fitToMarkers={fitToMarkers}
        />
      </React.Suspense>
    );
  }

  // ✅ NATIVE MAP SETUP (Safe dynamic require)
  let MapView: any, Marker: any, Polyline: any;
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (err) {
    console.error("react-native-maps not available:", err);
    return (
      <View style={[styles.loaderContainer]}>
        <Text style={styles.loaderText}>Map not available</Text>
      </View>
    );
  }

  // Wait until we have valid coordinates before rendering
  if (!isValidCoord(initialRegion)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Waiting for location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={MapView.PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={darkMode ? darkMapStyle : lightMapStyle}
        initialRegion={{
          latitude: initialRegion?.latitude,
          longitude: initialRegion?.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        onMapReady={fitToMarkersOnChange} // Fit when map is ready
      >
        {/* Pickup Marker */}
        {isValidCoord(pickupLocation) && (
          <Marker
            coordinate={{
              latitude: pickupLocation!.latitude,
              longitude: pickupLocation!.longitude,
            }}
            title="Pickup"
            description={pickupLocation!.address || "Pickup"}
            pinColor="green"
          />
        )}

        {/* Destination Marker */}
        {isValidCoord(destinationLocation) && (
          <Marker
            coordinate={{
              latitude: destinationLocation!.latitude,
              longitude: destinationLocation!.longitude,
            }}
            title="Destination"
            description={destinationLocation!.address || "Destination"}
            pinColor="red"
          />
        )}

        {/* Rider Location Marker */}
      {riderLocation && (
        <Marker
          coordinate={{
            latitude: riderLocation.latitude,
            longitude: riderLocation.longitude,
          }}
          title="Your Rider"
          description="Rider is on the way"
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={riderLocation || 0}
        >
          <View style={styles.riderMarker}>
            <Ionicons name="at-circle" size={20} color="#FFFFFF" />
          </View>
        </Marker>
      )}

        {/* Current Location Marker (optional) */}
        {isValidCoord(currentLocation) && (
          <Marker
            coordinate={{
              latitude: currentLocation!.latitude,
              longitude: currentLocation!.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Route Line */}
        {showRoute && (routeCoords?.length || calculatedRoute.length) > 0 && (
          <Polyline
            coordinates={routeCoords?.length ? routeCoords : calculatedRoute}
            strokeWidth={5}
            strokeColor="#6200ee"
          />
        )}
      </MapView>

      {/* Loading overlay for route calculation */}
      {loadingRoute && (
        <View style={styles.routeLoadingOverlay}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.routeLoadingText}>Calculating route...</Text>
        </View>
      )}
    </View>
  );
}

// ✅ Helper: Fetch Google route and decode polyline
async function getRouteFromGoogle(
  origin: Location,
  destination: Location
): Promise<{
  coordinates: Location[];
  distance: string;
  duration: string;
}> {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Directions API error: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const points = decodePolyline(route.overview_polyline.points);

    return {
      coordinates: points,
      distance: leg.distance.text,
      duration: leg.duration.text,
    };
  } catch (error) {
    console.error("Error fetching route from Google:", error);
    throw error;
  }
}

// ✅ Decode Google polyline
function decodePolyline(encoded: string): Location[] {
  const points: Location[] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return points;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative", // For loading overlay positioning
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#666",
  },
  routeLoadingOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  routeLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  riderMarker: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    backgroundColor: '#34C759',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

});
