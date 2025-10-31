import MapViewComponent from "@/components/MapViewComponent";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { cancelRide } from "@/services/rides";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINIMIZED_HEIGHT = 120;
const EXPANDED_HEIGHT = 380;

export default function RideInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme();
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [eta, setEta] = useState("Calculating...");
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  const { currentLocation } = useLocationTracking();
  const panelHeight = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;

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
          setLoading(false);

          // Update ETA based on status
          if (rideData.status === "accepted") {
            setEta("5-10 mins");
          } else if (rideData.status === "picked_up") {
            setEta(rideData.estimatedDuration || "10-15 mins");
          }

          // Handle different ride statuses
          if (rideData?.status === "completed") {
            router.replace({
              pathname: "/(passenger)/completedRide",
              params: { rideId },
            });
          }

          if (rideData?.status === "cancelled") {
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

  const callDriver = () => {
    const phoneNumber = ride?.riderInfo?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert("Error", "Could not make phone call");
      });
    } else {
      Alert.alert("Info", "Driver phone number not available");
    }
  };

  const openMaps = (location: any) => {
    if (!location) return;
    
    const address = location.address || location;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Error", "Could not open maps");
    });
  };

  const openNavigation = (destination: any) => {
    if (!destination?.lat || !destination?.lng) return;
    
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    Linking.openURL(navUrl).catch(() => {
      Alert.alert("Error", "Could not open navigation");
    });
  };

  const handleEmergency = () => {
    Alert.alert(
      "Emergency Assistance",
      "Would you like to call emergency services?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Call Emergency",
          onPress: () =>
            Linking.openURL("tel:911").catch(() => {
              Alert.alert("Error", "Could not make emergency call");
            }),
          style: "destructive",
        },
      ]
    );
  };

  const handleCancelRide = async () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride? Cancellation fees may apply.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              await cancelRide(rideId!, "passenger", "Passenger requested during trip");
              Alert.alert("Ride Cancelled", "Your ride has been cancelled");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel ride");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusMessage = () => {
    if (!ride || !ride.status) return "Loading...";

    switch (ride.status) {
      case "accepted":
        return "Driver is on the way 🚗";
      case "arrived":
        return "Driver has arrived 📍";
      case "picked_up":
        return "Ride in progress 🚗";
      case "completed":
        return "Ride completed ✅";
      case "cancelled":
        return "Ride cancelled ❌";
      default:
        return "Ride in progress";
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading ride details...
        </Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Ride not found
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.backButton, {backgroundColor: theme.background}]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ride in Progress
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Live Map */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickupLocation={{
            latitude: ride.pickup?.lat || 0,
            longitude: ride.pickup?.lng || 0,
            address: ride.pickup?.address || "Pickup location",
          }}
          destinationLocation={{
            latitude: ride.dropoff?.lat || 0,
            longitude: ride.dropoff?.lng || 0,
            address: ride.dropoff?.address || "Destination",
          }}
          // currentLocation={currentLocation!}
          showRoute={ride.status === "accepted" || ride.status === "picked_up"}
        />
      </View>

      {/* Collapsible Ride Details Panel */}
      <Animated.View 
        style={[
          styles.panelContainer,
          { 
            backgroundColor: theme.card,
            height: panelHeight,
          }
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View style={[styles.dragHandle, { backgroundColor: theme.muted }]} />
        </View>

        {/* Toggle Button */}
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={togglePanel}
        >
          <Ionicons 
            name={isPanelExpanded ? "chevron-down" : "chevron-up"} 
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>

        {/* Panel Content */}
        {isPanelExpanded ? (
          <ScrollView 
          style={styles.expandedScrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.expandedContent}>
            {/* Driver Row */}
            <View style={[styles.driverRow, { backgroundColor: theme.primary + "20" }]}>
              <Image
                source={
                  ride.riderInfo?.profilePicture
                    ? { uri: ride.riderInfo.profilePicture }
                    : require("../../assets/images/defaultUserImg.png")
                }
                style={styles.driverPic}
                contentFit="cover"
              />
              <View style={styles.driverInfo}>
                <Text style={[styles.driverName, { color: theme.text }]}>
                  {ride.riderInfo?.userName || "Driver"}
                </Text>
                <Text style={[styles.driverRating, { color: theme.muted }]}>
                  ⭐ {ride.riderInfo?.rating?.toFixed(1) || "4.8"} ({ride.riderInfo?.totalRides || "0"} rides)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={callDriver}
                disabled={!ride.riderInfo?.phone}
              >
                <Ionicons name="call-outline" size={28} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Trip Info */}
            <View style={styles.tripInfo}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => openMaps(ride.pickup)}
              >
                <Ionicons name="location-outline" size={20} color={theme.primary} />
                <View style={styles.locationText}>
                  <Text style={[styles.label, { color: theme.muted }]}>From:</Text>
                  <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
                    {ride.pickup?.address || "Current location"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                onPress={() => openMaps(ride.dropoff)}
              >
                <Ionicons name="flag-outline" size={20} color={theme.primary} />
                <View style={styles.locationText}>
                  <Text style={[styles.label, { color: theme.muted }]}>To:</Text>
                  <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
                    {ride.dropoff?.address || "Destination"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Status and ETA */}
              <View style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusLabel, { color: theme.muted }]}>Status</Text>
                  <Text style={[styles.statusValue, { color: theme.primary }]}>
                    {getStatusMessage()}
                  </Text>
                </View>
                <View style={styles.statusInfo}>
                  <Text style={[styles.statusLabel, { color: theme.muted }]}>ETA</Text>
                  <Text style={[styles.statusValue, { color: theme.text }]}>
                    {eta}
                  </Text>
                </View>
              </View>

              {/* Fare Information */}
              {(ride.estimatedFare || ride.finalFare) && (
                <View style={styles.fareRow}>
                  <Ionicons name="cash-outline" size={20} color={theme.primary} />
                  <Text style={[styles.label, { color: theme.muted }]}>Fare:</Text>
                  <Text style={[styles.fareValue, { color: theme.success }]}>
                    {ride.finalFare ? formatFare(ride.finalFare) : formatFare(ride.estimatedFare)}
                  </Text>
                </View>
              )}

              {/* Trip Details */}
              <View style={styles.tripDetailsRow}>
                <View style={styles.tripDetail}>
                  <Ionicons name="trending-up-outline" size={16} color={theme.muted} />
                  <Text style={[styles.tripDetailText, { color: theme.text }]}>
                    {ride.estimatedDistance || "Calculating..."}
                  </Text>
                </View>
                <View style={styles.tripDetail}>
                  <Ionicons name="time-outline" size={16} color={theme.muted} />
                  <Text style={[styles.tripDetailText, { color: theme.text }]}>
                    {ride.estimatedDuration || "Calculating..."}
                  </Text>
                </View>
              </View>
            </View>

            {/* Emergency + Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.sosBtn} onPress={handleEmergency}>
                <Ionicons name="warning-outline" size={20} color="#fff" />
                <Text style={styles.sosText}>Emergency</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.danger }]}
                onPress={handleCancelRide}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={theme.danger} />
                ) : (
                  <Text style={[styles.cancelText, { color: theme.danger }]}>
                    Cancel Ride
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Minimized Content */
          <View style={styles.minimizedContent}>
            <View style={styles.minimizedRow}>
              <View style={styles.minimizedInfo}>
                <Text style={[styles.minimizedStatus, { color: theme.text }]}>
                  {getStatusMessage()}
                </Text>
                <Text style={[styles.minimizedEta, { color: theme.primary }]}>
                  ETA: {eta}
                </Text>
              </View>
              {(ride.estimatedFare || ride.finalFare) && (
                <View style={styles.minimizedFare}>
                  <Text style={[styles.minimizedFareText, { color: theme.success }]}>
                    {ride.finalFare ? formatFare(ride.finalFare) : formatFare(ride.estimatedFare)}
                  </Text>
                </View>
              )}
            </View>
            {/* Quick actions in minimized state */}
            <View style={styles.minimizedActions}>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.primary }]}
                onPress={callDriver}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.quickActionText}>Call Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.danger }]}
                onPress={handleEmergency}
              >
                <Ionicons name="warning" size={16} color="#fff" />
                <Text style={styles.quickActionText}>SOS</Text>
              </TouchableOpacity>
            </View>
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
    ...StyleSheet.absoluteFillObject,
  },
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    alignItems: 'center',
    paddingTop: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  toggleButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    padding: 4,
  },
  expandedScrollContent: {
    flex: 1,
  },
  expandedContent: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  minimizedContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  minimizedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  minimizedEta: {
    fontSize: 14,
    fontWeight: '500',
  },
  minimizedFare: {
    alignItems: 'flex-end',
  },
  minimizedFareText: {
    fontSize: 18,
    fontWeight: '700',
  },
  minimizedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "600",
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
  },
  driverPic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
  },
  driverRating: {
    fontSize: 14,
    marginTop: 2,
  },
  callButton: {
    padding: 8,
  },
  tripInfo: {
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
  tripDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tripDetail: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  tripDetailText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e63946",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  sosText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
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
});