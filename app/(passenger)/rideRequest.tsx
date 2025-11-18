import MapViewComponent from "@/components/MapViewComponent";
import { useTheme } from "@/contexts/ThemeContext";
// import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import FullLocationPicker from "@/components/FullLocationPicker";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { auth } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { getRouteWithFare } from "@/services/mapService";
import { addNotification } from "@/services/notifications";
import {
  registerNotificationPermissions
} from "@/services/NotificationService";
import { notifyNearbyRiders, requestRide } from "@/services/rides";
import { getUserProfile } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import Loader from "../Loader";

type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    fare?: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [loading, setLoading] = useState(false);
  // const { location } = useCurrentLocation();
  const { currentLocation } = useLocationTracking();
  const [profilePic, setProfilePic] = useState("");
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  // Get user's Profile Picture
  useEffect(() => {
    const getProfilePic = async () => {
      const profile = await getUserProfile();
      if (!profile) return;
      setProfilePic(profile.profilePicture);
    };
    getProfilePic();
  }, []);

  // Add this effect to calculate route info
  useEffect(() => {
    const calculateRouteInfo = async () => {
      if (pickup && destination) {
        try {
          const route = await getRouteWithFare(
            { latitude: pickup.lat, longitude: pickup.lng },
            { latitude: destination.lat, longitude: destination.lng }
          );

          setRouteInfo({
            distance: route.distance,
            duration: route.duration,
            fare: route.fare.totalFare,
          });

          // Use route.routeCoordinates (ensure your service returns coords in this shape)
          const coords = Array.isArray(route.coordinates)
            ? route.coordinates.map((p: any) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }))
            : [];
          setRouteCoords(coords);
        } catch (error) {
          console.error("Error calculating route info:", error);
          setRouteInfo(null);
        }
      } else {
        setRouteInfo(null);
      }
    };

    calculateRouteInfo();
  }, [pickup, destination]);

  // Set current location as default pickup
  useEffect(() => {
    if (currentLocation && !pickup) {
      // You might want to reverse geocode here to get the address
      setPickup({
        lat: currentLocation?.latitude,
        lng: currentLocation?.longitude,
        address: "Current Location",
      });
    }
  }, [currentLocation]);

  // Ride Request function
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
        estimatedFare: routeInfo?.fare, // Include the calculated fare
        estimatedDistance: routeInfo?.distance,
        estimatedDuration: routeInfo?.duration,
      };

      const rideId = await requestRide(rideData);

      if(pickup.lat && pickup.lng) {
            await notifyNearbyRiders(pickup.lat, pickup.lng, rideId).then(result => {
              console.log("notifyNearbyRiders result: ", result);
              
            }).catch (error => {
              console.error("Error notifying nearby riders: ", error);
              
            })
          }
      setPickup(null);
      setDestination(null);
      
      await addNotification(
        passengerId,
        "ride_requested",
        "Your ride request has been sent.",
        "looking for a rider...",
        rideId,
        "/(passenger)/waitingForRider"
      );
      Alert.alert("Ride Requested", "Waiting for a rider to accept...");
      router.push({
        pathname: "/(passenger)/waitForRide",
        params: { rideId },
      });
    } catch (error: any) {
      console.error("Error requesting ride:", error);
      Alert.alert(
        "Error",
        error.message || "Could not request ride. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Ask for notification permissions when the screen loads
  useEffect(() => {
    try {
      registerNotificationPermissions();
    } catch (e) {
      console.warn("Notification permission failed", e);
    }
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(passenger)/passengerWelcomeScreen')}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconWrapper, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(passenger)/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconWrapper, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(passenger)/passengerSettings")}
            >
              <Image
                source={
                  profilePic
                    ? { uri: profilePic, cache: 'reload' }
                    : require("../../assets/images/defaultUserImg.png")
                }
                style={styles.profilePic}
                contentFit="cover"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Container - NOW WITH ACTUAL MAP */}
        <View style={styles.mapContainer}>
          {/* <MapScreen pickup={pickup} destination={destination} /> */}
          {!currentLocation && !pickup ? (
            <Loader msg="Loading map..." />
          ) : (
            <MapViewComponent
              pickupLocation={{
                latitude: pickup?.lat || currentLocation?.latitude || 0,
                longitude: pickup?.lng || currentLocation?.longitude || 0,
                address: pickup?.address,
              }}
              destinationLocation={{
                latitude: destination?.lat || currentLocation?.latitude || 0,
                longitude: destination?.lng || currentLocation?.longitude || 0,
                address: destination?.address,
              }}
              currentLocation={
                currentLocation
                  ? {
                      latitude: currentLocation?.latitude,
                      longitude: currentLocation?.longitude,
                    }
                  : undefined
              }
              showRoute={!!pickup && !!destination}
              fitToMarkers={true} // This will auto-fit whenever markers change
            />
          )}
        </View>

        {/* Content Area */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Pickup & Destination Inputs */}
            {/* <View style={styles.searchBox}> */}
            {/* Pickup Input */}
            {/* <LocationSearchInput
                placeholder="Pickup Location"
                iconName="locate-outline"
                iconColor={theme.primary}
                onLocationSelect={setPickup}
                isPickup={true}
                autoFillCurrentLocation={false} // This enables auto-fill
              /> */}

            {/* Destination Input */}
            {/* <LocationSearchInput
                placeholder="Where to"
                iconName="flag-outline"
                iconColor={theme.muted}
                onLocationSelect={setDestination}
                isPickup={false}
                autoFillCurrentLocation={false}
              /> */}
            {/* </View> */}

            <View style={styles.searchBox}>
              {/* Header with clear purpose */}
              <View style={styles.questionTextContainer}>
                <Ionicons
                  name="navigate-outline" // More relevant icon
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.questionText, { color: theme.text }]}>
                  {destination?.address
                    ? "Your Trip Details"
                    : "Where would you like to go?"}
                </Text>
              </View>
              {/* Interactive area */}
              <TouchableOpacity
                onPress={() => setLocationPickerVisible(true)}
                style={[
                  styles.locationSelector,
                  {
                    backgroundColor: theme.card,
                    borderColor: destination?.address
                      ? theme.primary
                      : theme.border, // Visual feedback when destination is set
                    borderWidth: destination?.address ? 1 : 0.5,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.locationContent}>
                  {/* Pickup indicator (if you want to show both) */}
                  {destination?.address && (
                    <View style={styles.locationRow}>
                      <Ionicons name="locate" size={16} color={theme.success} />
                      <Text
                        style={[styles.locationText, { color: theme.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {pickup?.address}
                      </Text>
                    </View>
                  )}

                  {/* Destination indicator */}
                  <View style={styles.locationRow}>
                    <Ionicons
                      name={destination?.address ? "flag" : "flag-outline"}
                      size={16}
                      color={destination?.address ? theme.primary : theme.muted}
                    />
                    <Text
                      style={[
                        styles.locationText,
                        {
                          color: destination?.address
                            ? theme.text
                            : theme.muted,
                          fontWeight: destination?.address ? "600" : "400",
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {destination?.address || "Select destination"}
                    </Text>
                  </View>
                </View>

                {/* Edit/Change button */}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.muted}
                />
              </TouchableOpacity>
            </View>

            <FullLocationPicker
              visible={locationPickerVisible}
              onClose={() => setLocationPickerVisible(false)}
              onConfirm={(pickupLoc, destLoc) => {
                setPickup(pickupLoc);
                setDestination(destLoc);
              }}
              initialPickup={pickup}
              initialDestination={destination}
            />

            {/* Request Ride Button */}

            <TouchableOpacity
              onPress={handleRequestRide}
              style={[
                styles.rideButton,
                { backgroundColor: theme.primary },
                loading && styles.rideButtonDisabled,
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <Text
                  style={[styles.rideButtonText, { color: theme.primaryText }]}
                >
                  Request Ride
                </Text>
              )}
            </TouchableOpacity>

            {routeInfo && (
              <>
                <View
                  style={[
                    styles.routeInfoCard,
                    { backgroundColor: theme.card },
                  ]}
                >
                  {/* Duration */}
                  <View style={styles.routeInfoRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text style={[styles.routeInfoText, { color: theme.text }]}>
                      {routeInfo.duration}
                    </Text>
                  </View>
                  {/* Fare - Added in the middle */}
                  <View style={styles.routeInfoRow}>
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.routeInfoText,
                        { color: theme.text, fontWeight: "700" },
                      ]}
                    >
                      {routeInfo.fare
                        ? formatFare(routeInfo.fare)
                        : "Calculating..."}
                    </Text>
                  </View>
                  <View style={styles.routeInfoRow}>
                    <Ionicons
                      name="trending-up-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text style={[styles.routeInfoText, { color: theme.text }]}>
                      {routeInfo.distance}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Delivery Request*/}
            {/* <View style={[styles.infoSection, { borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => router.push("/(passenger)/requestDelivery")}
                style={[styles.historyButton, { borderColor: theme.primary }]}
                disabled={loading}
              >
                <Text
                  style={[styles.historyButtonText, { color: theme.primary }]}
                >
                  Request a Delivery Service
                </Text>
              </TouchableOpacity>
            </View> */}
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logo: { width: 40, height: 40, borderRadius: 20 },
  profilePic: { width: 36, height: 36, borderRadius: 18 },
  mapContainer: { flex: 1 },
  content: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 10 },
    }),
  },
  scrollContent: { paddingTop: 20 },
  searchBox: { paddingBottom: 40 },
  rideButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#7500fc",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  rideButtonDisabled: { opacity: 0.7 },
  rideButtonText: { fontSize: 18, fontWeight: "600" },
  infoSection: { paddingTop: 16, borderTopWidth: 1 },
  historyButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  historyButtonText: { fontSize: 16, fontWeight: "600" },
  routeInfoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  routeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    padding: 8,
  },
  fakeInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    gap: 8,
  },
  fakeInputText: {
    fontSize: 16,
  },
  // questionTextContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 8,
  //   gap: 6,
  // },
  questionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationContent: {
    flex: 1,
    marginRight: 12,
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
});
