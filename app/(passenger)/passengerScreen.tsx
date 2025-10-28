// screens/PassengerHomeScreen.tsx
// NOTE: adjust import path according to your project structure

import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LocationSearchInput from "@/components/LocationSearchInput";
import MapViewComponent from "@/components/MapViewComponent";
import Loader from "../Loader";

import { useTheme } from "@/contexts/ThemeContext";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { auth } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { getRouteWithFare } from "@/services/mapService";
import { addNotification } from "@/services/notifications";
import { notifyRideRequested } from "@/services/NotificationService";
import { requestRide } from "@/services/rides";
import { getUserProfile } from "@/services/users";

type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
};

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const { currentLocation } = useLocationTracking(); // keep using your hook
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState("");

  // Route info saved here; screen calculates route (like before) and passes routeCoords to MapView
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    fare?: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);

  // fetch user profile picture
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getUserProfile();
        if (!profile || !mounted) return;
        setProfilePic(profile.profilePicture);
      } catch (e) {
        console.error("getUserProfile failed", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate route only when both pickup and destination are valid
  useEffect(() => {
    let cancelled = false;

    const isValidPoint = (p?: LocationPoint | null) =>
      !!p && typeof p.lat === "number" && typeof p.lng === "number" && p.lat !== 0 && p.lng !== 0;

    const calculateRoute = async () => {
      if (!isValidPoint(pickup) || !isValidPoint(destination)) {
        setRouteInfo(null);
        setRouteCoords([]);
        return;
      }

      try {
        setLoading(true);
        const from = { latitude: pickup!.lat, longitude: pickup!.lng };
        const to = { latitude: destination!.lat, longitude: destination!.lng };
        const route = await getRouteWithFare(from, to);

        if (cancelled) return;

        // route.expected shape: { distance, duration, fare: { totalFare }, routeCoordinates: [{latitude, longitude}] }
        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
          fare: route.fare?.totalFare,
        });

        // Use route.routeCoordinates (ensure your service returns coords in this shape)
        const coords = Array.isArray(route.coordinates)
          ? route.coordinates.map((p: any) => ({ latitude: p.latitude, longitude: p.longitude }))
          : [];
        setRouteCoords(coords);
      } catch (err) {
        console.error("calculateRoute error:", err);
        setRouteInfo(null);
        setRouteCoords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [pickup, destination]);

  // Request ride function (unchanged logically)
  const handleRequestRide = async () => {
    if (!pickup?.address?.trim() || !destination?.address?.trim()) {
      Alert.alert("Missing Info", "Please enter both pickup and destination.");
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "Please sign in to request a ride");
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const passengerId = auth.currentUser.uid;

      const rideData = {
        pickup,
        dropoff: destination,
        passengerId,
        estimatedFare: routeInfo?.fare,
        estimatedDistance: routeInfo?.distance,
        estimatedDuration: routeInfo?.duration,
      };

      const rideId = await requestRide(rideData);
      notifyRideRequested();
      await addNotification(passengerId, "ride_requested", "Your ride request has been sent.", "looking for a rider...");
      Alert.alert("Ride Requested", "Waiting for a rider to accept...");
      router.push({
        pathname: "/(passenger)/waitForRide",
        params: { rideId },
      });
    } catch (error: any) {
      console.error("Error requesting ride:", error);
      Alert.alert("Error", error?.message || "Could not request ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // register notifications (unchanged)
  useEffect(() => {
    // If you have registerNotificationPermissions they can run here
    // registerNotificationPermissions();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.iconWrapper, { backgroundColor: theme.card }]} onPress={() => router.push("/(passenger)/notifications")}>
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconWrapper, { backgroundColor: theme.card }]} onPress={() => router.push("/(passenger)/passengerSettings")}>
              <Image source={profilePic ? { uri: profilePic } : require("../../assets/images/defaultUserImg.png")} style={styles.profilePic} contentFit="cover" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {/* If your location tracking hook is still fetching, show loader */}
          {!currentLocation && !pickup ? (
            <Loader msg="Loading map..." />
          ) : (
            <MapViewComponent
              pickupLocation={pickup ? { latitude: pickup.lat, longitude: pickup.lng, address: pickup.address } : undefined}
              destinationLocation={destination ? { latitude: destination.lat, longitude: destination.lng, address: destination.address } : undefined}
              currentLocation={currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : undefined}
              routeCoords={routeCoords}
              showRoute={!!pickup && !!destination && routeCoords.length > 0}
            />
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.searchBox}>
              <LocationSearchInput placeholder="Pickup Location" iconName="locate-outline" iconColor={theme.primary} onLocationSelect={setPickup} isPickup={true} autoFillCurrentLocation={false} />
              <LocationSearchInput placeholder="Destination" iconName="flag-outline" iconColor={theme.muted} onLocationSelect={setDestination} isPickup={false} autoFillCurrentLocation={false} />
            </View>

            <TouchableOpacity onPress={handleRequestRide} style={[styles.rideButton, { backgroundColor: theme.primary }, loading && styles.rideButtonDisabled]} disabled={loading}>
              {loading ? <ActivityIndicator color={theme.primaryText} /> : <Text style={[styles.rideButtonText, { color: theme.primaryText }]}>Request Ride</Text>}
            </TouchableOpacity>

            {routeInfo && (
              <View style={[styles.routeInfoCard, { backgroundColor: theme.card }]}>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <Text style={[styles.routeInfoText, { color: theme.text }]}>{routeInfo.duration}</Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="cash-outline" size={16} color={theme.primary} />
                  <Text style={[styles.routeInfoText, { color: theme.text, fontWeight: "700" }]}>{routeInfo.fare ? formatFare(routeInfo.fare) : "Calculating..."}</Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="trending-up-outline" size={16} color={theme.primary} />
                  <Text style={[styles.routeInfoText, { color: theme.text }]}>{routeInfo.distance}</Text>
                </View>
              </View>
            )}

            <View style={[styles.infoSection, { borderColor: theme.border }]}>
              <TouchableOpacity onPress={() => router.push("/(passenger)/requestDelivery")} style={[styles.historyButton, { borderColor: theme.primary }]} disabled={loading}>
                <Text style={[styles.historyButtonText, { color: theme.primary }]}>Request a Delivery Service</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrapper: { alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 22 },
  profilePic: { width: 36, height: 36, borderRadius: 18 },
  mapContainer: { flex: 1 },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 10 },
    }),
  },
  scrollContent: { paddingTop: 20 },
  searchBox: { marginBottom: 20 },
  rideButton: { borderRadius: 12, paddingVertical: 18, alignItems: "center", marginBottom: 20, ...Platform.select({ ios: { shadowColor: "#7500fc", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 2 } }) },
  rideButtonDisabled: { opacity: 0.7 },
  rideButtonText: { fontSize: 18, fontWeight: "600" },
  infoSection: { paddingTop: 16, borderTopWidth: 1 },
  historyButton: { backgroundColor: "transparent", borderWidth: 2, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  historyButtonText: { fontSize: 16, fontWeight: "600" },
  routeInfoCard: { flexDirection: "row", justifyContent: "space-between", padding: 16, borderRadius: 12, marginBottom: 20, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 }, android: { elevation: 2 } }) },
  routeInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeInfoText: { fontSize: 14, fontWeight: "600" },
  backButton: { padding: 8 },
});
