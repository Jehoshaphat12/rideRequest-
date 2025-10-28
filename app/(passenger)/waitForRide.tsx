import MapViewComponent from "@/components/MapViewComponent";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { addNotification } from "@/services/notifications";
import { notifyRideAccepted } from "@/services/NotificationService";
import { cancelRide } from "@/services/rides";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

export default function WaitForRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme();
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;

  const [ride, setRide] = useState<any | null>(null);
  const [rider, setRider] = useState<any | null>(null);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<string>("Calculating...");
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  const { currentLocation } = useLocationTracking();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!rideId) {
      setError("Ride ID is missing");
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "rides", rideId),
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRide(data);
          setStatus(data.status);

          // Fetch rider details if assigned
          if (data.riderId) {
            try {
              const riderSnap = await getDoc(doc(db, "users", data.riderId));
              if (riderSnap.exists()) {
                const riderData = riderSnap.data();
                setRider(riderData);
                
                // Animate when rider is assigned
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }).start();
              }
            } catch (error) {
              console.error("Error fetching rider:", error);
            }
          }

          // Calculate ETA based on status
          if (data.status === "accepted") {
            setEta("5-10 mins");
            notifyRideAccepted();
            await addNotification(
              data.passengerId,
              "ride_accepted",
              "Your ride request has been accepted!",
              "Rider is on the way.",
              rideId
            );
          } else if (data.status === "picked_up") {
            setEta(data.estimatedDuration || "10-15 mins");
          }

          // Navigate to ride in progress when picked up
          if (data.status === "picked_up") {
            router.replace({
              pathname: "/(passenger)/rideProgress",
              params: { rideId: rideId },
            });
          }

          // If ride is completed or cancelled, navigate back after a delay
          if (data.status === "completed" || data.status === "cancelled") {
            setTimeout(() => {
              router.replace("/(passenger)/passengerScreen");
            }, 3000);
          }
        } else {
          setError("Ride not found");
          setTimeout(() => {
            router.back();
          }, 2000);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to ride:", error);
        setError("Failed to load ride details");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [rideId]);

  const handleCancelRide = async () => {
    if (!rideId) return;

    Alert.alert(
      "Cancel Ride", 
      "Are you sure you want to cancel this ride? A cancellation fee may apply.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelRide(rideId, "passenger", "Passenger requested cancellation");
            } catch (error) {
              Alert.alert("Error", "Failed to cancel ride");
            }
          },
        },
      ]
    );
  };

  const callDriver = () => {
    const phoneNumber = ride?.riderInfo?.phone || rider?.phone;
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

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  const getStatusMessage = () => {
    switch (status) {
      case "pending":
        return "🔍 Searching for drivers...";
      case "accepted":
        return "🚗 Driver on the way";
      case "picked_up":
        return "📍 On the way to destination";
      case "completed":
        return "✅ Ride completed";
      case "cancelled":
        return "❌ Ride cancelled";
      default:
        return "🗺 Tracking your ride";
    }
  };

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header with Back Button */}
      <View style={[styles.header]}>
        <TouchableOpacity
          style={[styles.backButton, {backgroundColor: theme.background}]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        {/* <Text style={[styles.headerTitle, { color: theme.text }]}>
          {status === "pending" ? "Finding a Ride" : "Ride Details"}
        </Text> */}
        {/* <View style={styles.headerSpacer} /> */}
      </View>

      {/* Live Map */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickupLocation={{
            latitude: ride?.pickup?.lat || 0,
            longitude: ride?.pickup?.lng || 0,
            address: ride?.pickup?.address || "Pickup location",
          }}
          destinationLocation={{
            latitude: ride?.dropoff?.lat || 0,
            longitude: ride?.dropoff?.lng || 0,
            address: ride?.dropoff?.address || "Destination",
          }}
          currentLocation={currentLocation!}
          showRoute={status === "accepted" || status === "picked_up"}
        />
      </View>

      {/* Collapsible Ride Details Panel */}
      <Animated.View 
        style={[
          styles.panelContainer,
          { 
            backgroundColor: theme.card,
            maxHeight: isPanelExpanded ? "80%" : 120
          }
        ]}
      >
        {/* Drag Handle and Toggle */}
        <View style={styles.panelHeader}>
          <View style={[styles.dragHandle, { backgroundColor: theme.muted }]} />
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
        </View>

        {isPanelExpanded ? (
          <ScrollView 
          style={styles.expandedScrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.expandedContent}>
            {/* PENDING STATE */}
            {status === "pending" && (
              <>
                <View style={styles.statusSection}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.title, { color: theme.text }]}>Looking for a Rider...</Text>
                  <Text style={[styles.subtitle, { color: theme.muted }]}>
                    We're finding the best rider for you
                  </Text>
                </View>

                {/* Ride Details */}
                <View style={styles.detailsSection}>
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => openMaps(ride?.pickup)}
                  >
                    <Ionicons name="location-outline" size={20} color={theme.primary} />
                    <View style={styles.locationText}>
                      <Text style={[styles.label, { color: theme.muted }]}>Pickup:</Text>
                      <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
                        {ride?.pickup?.address || "Current location"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => openMaps(ride?.dropoff)}
                  >
                    <Ionicons name="flag-outline" size={20} color={theme.primary} />
                    <View style={styles.locationText}>
                      <Text style={[styles.label, { color: theme.muted }]}>Destination:</Text>
                      <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
                        {ride?.dropoff?.address || "Loading..."}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Fare Information */}
                  {ride?.estimatedFare && (
                    <View style={styles.fareRow}>
                      <Ionicons name="cash-outline" size={20} color={theme.primary} />
                      <Text style={[styles.label, { color: theme.muted }]}>Estimated Fare:</Text>
                      <Text style={[styles.fareValue, { color: theme.success }]}>
                        {formatFare(ride.estimatedFare)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Cancel Ride Button */}
                <TouchableOpacity 
                  style={[styles.cancelBtn, { borderColor: theme.danger }]} 
                  onPress={handleCancelRide}
                >
                  <Text style={[styles.cancelText, { color: theme.danger }]}>Cancel Ride</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ACCEPTED STATE */}
            {status === "accepted" && ride && (
              <Animated.View style={{ opacity: fadeAnim }}>
                {/* Driver Header */}
                <View style={styles.sectionHeader}>
                  <Ionicons name="car-sport" size={24} color={theme.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Driver Assigned</Text>
                </View>

                {/* Driver Info */}
                <View style={[styles.driverRow, { backgroundColor: theme.primary + "20" }]}>
                  <Image
                    source={
                      ride.riderInfo?.profilePicture || rider?.profilePicture
                        ? { uri: ride.riderInfo?.profilePicture || rider?.profilePicture }
                        : require("../../assets/images/defaultUserImg.png")
                    }
                    style={styles.driverPic}
                    contentFit="cover"
                  />
                  <View style={styles.driverInfo}>
                    <Text style={[styles.driverName, { color: theme.text }]}>
                      {ride.riderInfo?.name || rider?.name || "Driver"}
                    </Text>
                    <Text style={[styles.driverRating, { color: theme.muted }]}>
                      ⭐ {rider?.rating?.toFixed(1) || "4.8"} ({rider?.totalRides || "0"} rides)
                    </Text>
                    <Text style={[styles.etaText, { color: theme.primary }]}>
                      ETA: {eta}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={callDriver}
                  >
                    <Ionicons name="call-outline" size={28} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                {/* Vehicle Info */}
                <View style={styles.section}>
                  <View style={styles.row}>
                    <Ionicons name="car-outline" size={20} color={theme.primary} />
                    <Text style={[styles.label, { color: theme.muted }]}>Vehicle:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>
                      {ride.riderInfo?.vehicle?.model || rider?.vehicle?.model || "Not available"}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="pricetag-outline" size={20} color={theme.primary} />
                    <Text style={[styles.label, { color: theme.muted }]}>Color:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>
                      {ride.riderInfo?.vehicle?.color || rider?.vehicle?.color || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons name="document-outline" size={20} color={theme.primary} />
                    <Text style={[styles.label, { color: theme.muted }]}>Plate:</Text>
                    <Text style={[styles.value, { color: theme.text }]}>
                      {ride.riderInfo?.vehicle?.plateNumber || rider?.vehicle?.plateNumber || "Not available"}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => openNavigation(ride.pickup)}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>View Route</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.cancelBtn, { borderColor: theme.danger }]} 
                    onPress={handleCancelRide}
                  >
                    <Text style={[styles.cancelText, { color: theme.danger }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* COMPLETED/CANCELLED STATES */}
            {(status === "completed" || status === "cancelled") && (
              <View style={styles.statusSection}>
                <Ionicons 
                  name={status === "completed" ? "checkmark-circle" : "close-circle"} 
                  size={48} 
                  color={status === "completed" ? theme.success : theme.danger} 
                />
                <Text style={[styles.title, { color: theme.text }]}>
                  {status === "completed" ? "Ride Completed!" : "Ride Cancelled"}
                </Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  {status === "completed" ? "Thank you for riding with us" : "Your ride has been cancelled"}
                </Text>
                <Text style={[styles.loadingText, { color: theme.muted }]}>
                  Returning to home screen...
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          /* Minimized Content */
          <View style={styles.minimizedContent}>
            <View style={styles.minimizedRow}>
              <View style={styles.minimizedInfo}>
                <Text style={[styles.minimizedStatus, { color: theme.text }]}>
                  {getStatusMessage()}
                </Text>
                {status === "accepted" && (
                  <Text style={[styles.minimizedEta, { color: theme.primary }]}>
                    ETA: {eta}
                  </Text>
                )}
              </View>
              {ride?.estimatedFare && (
                <View style={styles.minimizedFare}>
                  <Text style={[styles.minimizedFareText, { color: theme.success }]}>
                    {formatFare(ride.estimatedFare)}
                  </Text>
                </View>
              )}
            </View>
            {/* Quick action in minimized state */}
            {status === "accepted" && (
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.primary }]}
                onPress={callDriver}
              >
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.quickActionText}>Call Driver</Text>
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
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
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
    flex: 1,
  },
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "80%",
    minHeight: 120,
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
  panelHeader: {
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
    top: 4,
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
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
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
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
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
    textAlign: "center",
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 8,
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
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  callButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    flex: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});