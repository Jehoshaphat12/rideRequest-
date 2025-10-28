// components/MobileMapComponent.tsx
import Loader from "@/app/Loader";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MobileMapComponentProps {
  pickupLocation: Location;
  destinationLocation: Location;
  currentLocation?: Location;
  showRoute?: boolean;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Use React.memo to prevent unnecessary re-renders
export default React.memo(function MobileMapComponent({
  pickupLocation,
  destinationLocation,
  currentLocation,
  showRoute = true,
}: MobileMapComponentProps) {
  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Use useRef for values that shouldn't trigger re-renders
  const hasFittedMap = useRef(false);
  const lastPickupLocation = useRef(pickupLocation);
  const lastDestinationLocation = useRef(destinationLocation);

  // Stable initial region based on pickup location
  const initialRegion: Region = {
    latitude: pickupLocation.latitude,
    longitude: pickupLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Fit map to markers only once when map is ready and locations are valid
  const fitMapToMarkers = useCallback(() => {
    if (
      mapRef.current && 
      isMapReady && 
      !hasFittedMap.current &&
      pickupLocation.latitude !== 0 && 
      pickupLocation.longitude !== 0 &&
      destinationLocation.latitude !== 0 && 
      destinationLocation.longitude !== 0
    ) {
      const coordinates = [
        {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        },
        {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
        },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });

      hasFittedMap.current = true;
    }
  }, [pickupLocation, destinationLocation, isMapReady]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  // Calculate route only when locations change significantly
  useEffect(() => {
    const locationsChanged = 
      lastPickupLocation.current.latitude !== pickupLocation.latitude ||
      lastPickupLocation.current.longitude !== pickupLocation.longitude ||
      lastDestinationLocation.current.latitude !== destinationLocation.latitude ||
      lastDestinationLocation.current.longitude !== destinationLocation.longitude;

    if (locationsChanged && showRoute && isMapReady) {
      calculateRoute();
      lastPickupLocation.current = pickupLocation;
      lastDestinationLocation.current = destinationLocation;
    }
  }, [pickupLocation, destinationLocation, showRoute, isMapReady]);

  // Fit map when ready
  useEffect(() => {
    if (isMapReady) {
      fitMapToMarkers();
    }
  }, [isMapReady, fitMapToMarkers]);

  const calculateRoute = async () => {
    // Don't calculate if locations are invalid
    if (
      !pickupLocation || 
      !destinationLocation ||
      pickupLocation.latitude === 0 || 
      pickupLocation.longitude === 0 ||
      destinationLocation.latitude === 0 || 
      destinationLocation.longitude === 0
    ) {
      setRouteCoordinates([]);
      return;
    }

    setLoadingRoute(true);
    try {
      const routeData = await getRouteFromGoogle(pickupLocation, destinationLocation);
      setRouteCoordinates(routeData.coordinates);
      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
      });

      // Don't refit the map when route changes - let user keep their position
    } catch (error) {
      console.error("Error calculating route:", error);
      // Fallback straight line
      setRouteCoordinates([
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
      ]);
      setRouteInfo({
        distance: "Calculating...",
        duration: "Calculating...",
      });
    } finally {
      setLoadingRoute(false);
    }
  };

  // Prevent map from resetting when user interacts
  const handleRegionChangeComplete = useCallback((region: Region) => {
    // When user manually moves the map, prevent auto-fitting
    hasFittedMap.current = true;
  }, []);

  if (loadingRoute) {
    return <Loader msg="Loading..." />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true} // We're using custom markers
        showsMyLocationButton={true}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        moveOnMarkerPress={false} // Prevent map from moving when markers are pressed
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={pickupLocation}
          title="Pickup Location"
          description={pickupLocation.address || "Pickup point"}
          pinColor="green"
        />

        {/* Destination Marker */}
        <Marker
          coordinate={destinationLocation}
          title="Destination"
          description={destinationLocation.address || "Destination"}
          pinColor="red"
        />

        {/* Route */}
        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#7500fc"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {loadingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#7500fc" />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        </View>
      )}
    </View>
  );
});

// Keep your existing helper functions
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

function decodePolyline(encoded: string): Location[] {
  const points: Location[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
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
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  loadingBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});