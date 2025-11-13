import MapViewComponent from "@/components/MapViewComponent";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { addNotification } from "@/services/notifications";
import { completeRide, updateRideStatus } from "@/services/rides";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MINIMIZED_HEIGHT = 100; // Height when minimized
const EXPANDED_HEIGHT = 400; // Increased height to accommodate both buttons

interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

export default function RideInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme();
  const rideId = Array.isArray(params.rideId)
    ? params.rideId[0]
    : params.rideId;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [eta, setEta] = useState<string>("Calculating...");
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  // const { currentLocation } = useLocationTracking(30000, "ride");
  //  const { currentLocation, smoothedLocation, error: locationError } = useSmoothLocationTracking(5000);
  const locationUpdateRef = useRef<NodeJS.Timeout | any>("");
  const panelHeight = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;
  

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit the movement to between MINIMIZED_HEIGHT and EXPANDED_HEIGHT
        const newHeight = Math.max(
          MINIMIZED_HEIGHT,
          Math.min(EXPANDED_HEIGHT, EXPANDED_HEIGHT - gestureState.dy)
        );
        panelHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dragDistance = gestureState.dy;
        const isSwipingUp = dragDistance < -30;
        const isSwipingDown = dragDistance > 30;

        let targetHeight = isPanelExpanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT;

        if (isSwipingUp && !isPanelExpanded) {
          targetHeight = EXPANDED_HEIGHT;
          setIsPanelExpanded(true);
        } else if (isSwipingDown && isPanelExpanded) {
          targetHeight = MINIMIZED_HEIGHT;
          setIsPanelExpanded(false);
        } else {
          // Return to current state if swipe wasn't significant
          targetHeight = isPanelExpanded ? EXPANDED_HEIGHT : MINIMIZED_HEIGHT;
        }

        Animated.spring(panelHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 50,
          friction: 10,
        }).start();
      },
    })
  ).current;

  // Toggle panel function
  const togglePanel = () => {
    const targetHeight = isPanelExpanded ? MINIMIZED_HEIGHT : EXPANDED_HEIGHT;
    setIsPanelExpanded(!isPanelExpanded);

    Animated.spring(panelHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  };

  // // Update rider location in real-time
  // useEffect(() => {
  //   if (rideId && currentLocation && ride?.riderId) {
  //     if (locationUpdateRef.current) {
  //       clearTimeout(locationUpdateRef.current);
  //     }

  //     locationUpdateRef.current = setTimeout(() => {
  //       updateRiderLocation(
  //         rideId,
  //         currentLocation.latitude,
  //         currentLocation.longitude
  //       ).catch(error => {
  //         console.error("Error updating rider location:", error);
  //       });
  //     }, 3000);
  //   }

  //   return () => {
  //     if (locationUpdateRef.current) {
  //       clearTimeout(locationUpdateRef.current);
  //     }
  //   };
  // }, [currentLocation, rideId, ride?.riderId]);

  

  useEffect(() => {
    if (!rideId) {
      Alert.alert("Error", "Ride ID not provided");
      router.back();
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "rides", rideId),
      async (snapshot) => {
        if (snapshot.exists()) {
          const rideData = snapshot.data();
          setRide(rideData);
          setCurrentStatus(rideData.status || "accepted");
          setLoading(false);
          calculateETA(rideData);

          // Broadcast rider's location when ride is accepted
          

          if (rideData.status === "completed") {
            await addNotification(
              rideData.riderId,
              "ride_completed",
              "Ride Completed ✅",
              `You earned ${
                rideData.finalFare
                  ? formatFare(rideData.finalFare)
                  : formatFare(rideData.estimatedFare || 0)
              }`,
              rideId
            );
            router.replace({
              pathname: "/(rider)/rideCompleted",
              params: { rideId },
            });
          }

          if (rideData.status === "cancelled") {
            Alert.alert("Ride Cancelled", "This ride has been cancelled");
            router.back();
          }
        } else {
          Alert.alert("Error", "Ride not found");
          router.back();
        }
      },
      (error) => {
        console.error("Error listening to ride:", error);
        Alert.alert("Error", "Failed to load ride details");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [rideId]);

  

  const calculateETA = (rideData: any) => {
    if (rideData.status === "accepted") {
      setEta("5-10 mins");
    } else if (rideData.status === "picked_up") {
      setEta(rideData.estimatedDuration || "10-15 mins");
    } else {
      setEta("Arrived");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!rideId) return;

    setUpdating(true);
    try {
      const additionalData: any = {};

      if (newStatus === "completed" && ride?.estimatedFare) {
        additionalData.finalFare = ride.estimatedFare;
      }

      await updateRideStatus(rideId, newStatus, additionalData);

      if (newStatus === "completed") {
        await completeRide(rideId, ride.estimatedFare || 0);
        router.replace({
          pathname: "/(rider)/rideCompleted",
          params: { rideId },
        });
      }
    } catch (error) {
      console.error("Error updating ride status:", error);
      Alert.alert("Error", "Failed to update ride status");
    } finally {
      setUpdating(false);
    }
  };

  const callPassenger = () => {
    const phoneNumber = ride?.passengerInfo?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert("Error", "Could not make phone call");
      });
    } else {
      Alert.alert("Info", "Passenger phone number not available");
    }
  };

  const openMaps = (location: LocationPoint) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location.address
    )}`;
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Error", "Could not open maps");
    });
  };

  const openNavigation = (destination: LocationPoint) => {
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    Linking.openURL(navUrl).catch(() => {
      Alert.alert("Error", "Could not open navigation");
    });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "accepted":
        return "Heading to Pickup 🚗";
      case "arrived":
        return "Arrived at Pickup 📍";
      case "picked_up":
        return "On Trip 🚗";
      case "completed":
        return "Trip Completed ✅";
      case "cancelled":
        return "Trip Cancelled ❌";
      default:
        return status;
    }
  };

  const getActionButton = () => {
    switch (currentStatus) {
      case "accepted":
        return (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.secondaryBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.primary,
                  flex: 1,
                },
              ]}
              onPress={() => openNavigation(ride.pickup)}
            >
              <Ionicons name="navigate" size={20} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>
                Start Navigation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.primaryBtn,
                {
                  backgroundColor: theme.primary,
                  flex: 1,
                },
              ]}
              onPress={() => handleUpdateStatus("arrived")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.primaryText}
                  />
                  <Text style={[styles.btnText, { color: theme.primaryText }]}>
                    Arrived at Pickup
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case "arrived":
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              styles.primaryBtn,
              { backgroundColor: theme.primary },
            ]}
            onPress={() => handleUpdateStatus("picked_up")}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <>
                <Ionicons name="person" size={20} color={theme.primaryText} />
                <Text style={[styles.btnText, { color: theme.primaryText }]}>
                  Passenger Picked Up
                </Text>
              </>
            )}
          </TouchableOpacity>
        );

      case "picked_up":
        return (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.secondaryBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.primary,
                  flex: 1,
                },
              ]}
              onPress={() => openNavigation(ride.dropoff)}
            >
              <Ionicons name="navigate" size={20} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>
                Navigate to Destination
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.successBtn,
                {
                  backgroundColor: theme.success,
                  flex: 1,
                },
              ]}
              onPress={() => handleUpdateStatus("completed")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text style={styles.btnText}>Complete Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading ride details...
        </Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Ride not found
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ride in Progress
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Live Map - Takes full space behind the panel */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickupLocation={{
            latitude: ride.pickup.lat,
            longitude: ride.pickup.lng,
            address: ride.pickup.address,
          }}
          destinationLocation={{
            latitude: ride.dropoff.lat,
            longitude: ride.dropoff.lng,
            address: ride.dropoff.address,
          }}
          // currentLocation={smoothedLocation!}
          showRoute={true}
        />
      </View>
      {/* Show location error if any */}
      {/* {locationError && (
        <View style={[styles.errorBanner, { backgroundColor: theme.danger + '20' }]}>
          <Ionicons name="warning-outline" size={16} color={theme.danger} />
          <Text style={[styles.errorBannerText, { color: theme.danger }]}>
            {locationError}
          </Text>
        </View>
      )} */}

      {/* Collapsible Ride Details Panel */}
      <Animated.View
        style={[
          styles.panelContainer,
          {
            backgroundColor: theme.card,
            height: panelHeight,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View style={[styles.dragHandle, { backgroundColor: theme.muted }]} />
        </View>

        {/* Toggle Button */}
        <TouchableOpacity style={styles.toggleButton} onPress={togglePanel}>
          <Ionicons
            name={isPanelExpanded ? "chevron-down" : "chevron-up"}
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>

        {/* Panel Content - Conditionally render based on expansion state */}
        {isPanelExpanded ? (
          <ScrollView
            style={styles.expandedScrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.expandedContent}
          >
            {/* Passenger Info */}
            <View
              style={[
                styles.passengerRow,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Image
                source={
                  ride.passengerInfo?.profilePicture
                    ? { uri: ride.passengerInfo.profilePicture }
                    : require("../../assets/images/defaultUserImg.png")
                }
                style={styles.profilePic}
                contentFit="cover"
              />
              <View style={styles.passengerInfo}>
                <Text style={[styles.passengerName, { color: theme.text }]}>
                  {ride.passengerInfo?.name || "Passenger"}
                </Text>
                <Text style={[styles.passengerRating, { color: theme.muted }]}>
                  ⭐ {ride.passengerInfo?.rating?.toFixed(1) || "4.8"} •{" "}
                  {ride.passengerInfo?.totalRides || "0"} rides
                </Text>
              </View>
              {ride.passengerInfo?.phone && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={callPassenger}
                >
                  <Ionicons
                    name="call-outline"
                    size={24}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Ride Details */}
            <View style={styles.detailsSection}>
              {/* Status and ETA */}
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusLabel, { color: theme.muted }]}>
                    Status
                  </Text>
                  <Text style={[styles.statusValue, { color: theme.primary }]}>
                    {getStatusDisplay(currentStatus)}
                  </Text>
                </View>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusLabel, { color: theme.muted }]}>
                    ETA
                  </Text>
                  <Text style={[styles.statusValue, { color: theme.text }]}>
                    {eta}
                  </Text>
                </View>
              </View>

              {/* Locations */}
              <TouchableOpacity
                style={styles.row}
                onPress={() => openMaps(ride.pickup)}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.primary}
                />
                <View style={styles.locationText}>
                  <Text style={[styles.label, { color: theme.muted }]}>
                    Pickup:
                  </Text>
                  <Text
                    style={[styles.value, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {ride.pickup.address}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                onPress={() => openMaps(ride.dropoff)}
              >
                <Ionicons name="flag-outline" size={20} color={theme.primary} />
                <View style={styles.locationText}>
                  <Text style={[styles.label, { color: theme.muted }]}>
                    Destination:
                  </Text>
                  <Text
                    style={[styles.value, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {ride.dropoff.address}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Fare Information */}
              {(ride.estimatedFare || ride.finalFare) && (
                <View style={styles.fareRow}>
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.label, { color: theme.muted }]}>
                    Fare:
                  </Text>
                  <Text style={[styles.fareValue, { color: theme.success }]}>
                    {ride.finalFare
                      ? formatFare(ride.finalFare)
                      : formatFare(ride.estimatedFare)}
                  </Text>
                </View>
              )}

              {/* Trip Information */}
              <View style={styles.tripInfoRow}>
                <View style={styles.tripInfo}>
                  <Ionicons
                    name="trending-up-outline"
                    size={16}
                    color={theme.muted}
                  />
                  <Text style={[styles.tripText, { color: theme.text }]}>
                    {ride.estimatedDistance || "Calculating..."}
                  </Text>
                </View>
                <View style={styles.tripInfo}>
                  <Ionicons name="time-outline" size={16} color={theme.muted} />
                  <Text style={[styles.tripText, { color: theme.text }]}>
                    {ride.estimatedDuration || "Calculating..."}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {getActionButton()}

              {/* Cancel Button */}
              <TouchableOpacity
                style={[
                  styles.btn,
                  styles.dangerBtn,
                  { backgroundColor: theme.danger },
                ]}
                onPress={() => {
                  Alert.alert(
                    "Cancel Trip",
                    "Are you sure you want to cancel this trip? This will affect your rating.",
                    [
                      { text: "No", style: "cancel" },
                      {
                        text: "Yes, Cancel",
                        onPress: () => handleUpdateStatus("cancelled"),
                        style: "destructive",
                      },
                    ]
                  );
                }}
                disabled={updating}
              >
                <Text style={styles.btnText}>Cancel Trip</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Minimized Content */
          <View style={styles.minimizedContent}>
            <View style={styles.minimizedRow}>
              <View style={styles.minimizedInfo}>
                <Text
                  style={[styles.minimizedStatus, { color: theme.primary }]}
                >
                  {getStatusDisplay(currentStatus)}
                </Text>
                <Text style={[styles.minimizedEta, { color: theme.text }]}>
                  ETA: {eta}
                </Text>
              </View>
              <View style={styles.minimizedFare}>
                <Text
                  style={[styles.minimizedFareText, { color: theme.success }]}
                >
                  {ride.finalFare
                    ? formatFare(ride.finalFare)
                    : formatFare(ride.estimatedFare)}
                </Text>
              </View>
            </View>
            {/* Quick action button in minimized state */}
            {currentStatus === "accepted" && (
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => openNavigation(ride.pickup)}
              >
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={styles.quickActionText}>Navigate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    zIndex: 10,
  },
  // backButton: {
  //   padding: 8,
  // },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject, // Map takes full screen
  },
  panelContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "80%", // Increased to accommodate both buttons
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  toggleButton: {
    position: "absolute",
    top: 8,
    right: 16,
    padding: 4,
  },
  expandedScrollContent: {
    flex: 1,
  },
  expandedContent: {
    flexGrow: 1, // Important for ScrollView content
    padding: 20,
    paddingTop: 30,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
  },
  minimizedContent: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  minimizedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  minimizedEta: {
    fontSize: 14,
    fontWeight: "500",
  },
  minimizedFare: {
    alignItems: "flex-end",
  },
  minimizedFareText: {
    fontSize: 18,
    fontWeight: "700",
  },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
  },
  passengerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  passengerRating: {
    fontSize: 14,
    marginTop: 2,
  },
  callButton: {
    padding: 8,
  },
  detailsSection: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusInfo: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
  },
  label: {
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    flexWrap: "wrap",
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  fareValue: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  tripInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tripInfo: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  tripText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    gap: 12,
    width: "100%",
  },
  actionGroup: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    flexDirection: "row",
    gap: 8,
    flex: 1, // This ensures both buttons take equal space
  },
  primaryBtn: {
    // backgroundColor set dynamically
  },
  secondaryBtn: {
    borderWidth: 2,
  },
  successBtn: {
    // backgroundColor set dynamically
  },
  dangerBtn: {
    // backgroundColor set dynamically
  },
  btnText: {
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorBanner: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    zIndex: 1000,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
