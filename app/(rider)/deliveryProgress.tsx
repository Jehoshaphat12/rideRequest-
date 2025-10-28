// /app/(rider)/deliveryInProgress.tsx
import MapViewComponent from "@/components/MapViewComponent";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { addNotification } from "@/services/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MINIMIZED_HEIGHT = 100;
const EXPANDED_HEIGHT = 420; // Increased height to accommodate delivery-specific buttons

interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

interface DeliveryData {
  id: string;
  customerId: string;
  pickup: LocationPoint & {
    contact?: {
      name: string;
      phone: string;
    };
  };
  dropoff: LocationPoint & {
    contact: {
      name: string;
      phone: string;
    };
  };
  packageDetails: {
    size: "small" | "medium" | "large";
    description?: string;
    fragile?: boolean;
    weight?: number;
  };
  estimatedFare: number;
  status: string;
  urgent: boolean;
  instructions?: string;
  riderId?: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    profilePicture?: string;
    rating?: number;
  };
  createdAt: any;
  acceptedAt?: any;
  pickedUpAt?: any;
  deliveredAt?: any;
}

export default function DeliveryInProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme();
  const deliveryId = Array.isArray(params.deliveryId) ? params.deliveryId[0] : params.deliveryId;

  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [eta, setEta] = useState<string>("Calculating...");
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  const panelHeight = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
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

  useEffect(() => {
    if (!deliveryId) {
      Alert.alert("Error", "Delivery ID not provided");
      router.back();
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "deliveries", deliveryId),
      async (snapshot) => {
        if (snapshot.exists()) {
          const deliveryData = { id: snapshot.id, ...snapshot.data() } as DeliveryData;
          setDelivery(deliveryData);
          setCurrentStatus(deliveryData.status || "accepted");
          setLoading(false);
          calculateETA(deliveryData);

          if (deliveryData.status === "delivered") {
            await addNotification(
              deliveryData.riderId!,
              "delivery_completed",
              "Delivery Completed ✅",
              `You earned ${formatFare(deliveryData.estimatedFare || 0)}`,
              deliveryId
            );
            router.replace({
              pathname: "/(rider)/deliveryCompleted",
              params: { deliveryId },
            });
          }

          if (deliveryData.status === "cancelled") {
            Alert.alert("Delivery Cancelled", "This delivery has been cancelled");
            router.back();
          }
        } else {
          Alert.alert("Error", "Delivery not found");
          router.back();
        }
      },
      (error) => {
        console.error("Error listening to delivery:", error);
        Alert.alert("Error", "Failed to load delivery details");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deliveryId]);

  const calculateETA = (deliveryData: DeliveryData) => {
    if (deliveryData.status === "accepted") {
      setEta("5-10 mins");
    } else if (deliveryData.status === "picked_up") {
      setEta("10-15 mins");
    } else {
      setEta("Arrived");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!deliveryId) return;

    setUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      // Add timestamp based on status
      if (newStatus === "picked_up") {
        updateData.pickedUpAt = serverTimestamp();
      } else if (newStatus === "delivered") {
        updateData.deliveredAt = serverTimestamp();
      }

      await updateDoc(doc(db, "deliveries", deliveryId), updateData);

      if (newStatus === "delivered") {
        router.replace({
          pathname: "/(rider)/deliveryCompleted",
          params: { deliveryId },
        });
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      Alert.alert("Error", "Failed to update delivery status");
    } finally {
      setUpdating(false);
    }
  };

  const callCustomer = () => {
    const phoneNumber = delivery?.dropoff?.contact?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert("Error", "Could not make phone call");
      });
    } else {
      Alert.alert("Info", "Customer phone number not available");
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
      case "arrived_pickup":
        return "Arrived at Pickup 📦";
      case "picked_up":
        return "Package Collected ✅";
      case "arrived_dropoff":
        return "Arrived at Delivery 📍";
      case "delivered":
        return "Delivery Completed 🎉";
      case "cancelled":
        return "Delivery Cancelled ❌";
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
              onPress={() => openNavigation(delivery!.pickup)}
            >
              <Ionicons name="navigate" size={20} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>
                Navigate to Pickup
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
              onPress={() => handleUpdateStatus("arrived_pickup")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Ionicons name="location" size={20} color={theme.primaryText} />
                  <Text style={[styles.btnText, { color: theme.primaryText }]}>
                    Arrived at Pickup
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case "arrived_pickup":
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
                <Ionicons name="cube" size={20} color={theme.primaryText} />
                <Text style={[styles.btnText, { color: theme.primaryText }]}>
                  Item Picked Up
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
              onPress={() => openNavigation(delivery!.dropoff)}
            >
              <Ionicons name="navigate" size={20} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>
                Navigate to Delivery
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
              onPress={() => handleUpdateStatus("arrived_dropoff")}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <>
                  <Ionicons name="location" size={20} color={theme.primaryText} />
                  <Text style={[styles.btnText, { color: theme.primaryText }]}>
                    Arrived at Delivery
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      case "arrived_dropoff":
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              styles.successBtn,
              { backgroundColor: theme.success },
            ]}
            onPress={() => handleUpdateStatus("delivered")}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  Item Delivered
                </Text>
              </>
            )}
          </TouchableOpacity>
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
          Loading delivery details...
        </Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Delivery not found
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
          Delivery in Progress
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Live Map - Takes full space behind the panel */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          pickupLocation={{
            latitude: delivery.pickup.lat,
            longitude: delivery.pickup.lng,
            address: delivery.pickup.address,
          }}
          destinationLocation={{
            latitude: delivery.dropoff.lat,
            longitude: delivery.dropoff.lng,
            address: delivery.dropoff.address,
          }}
          showRoute={true}
        />
      </View>

      {/* Collapsible Delivery Details Panel */}
      <Animated.View 
        style={[
          styles.panelContainer,
          { 
            backgroundColor: theme.card,
            height: panelHeight,
          }
        ]}
        {...panResponder.panHandlers}
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
            contentContainerStyle={styles.expandedContent}
          >
            {/* Customer Info */}
            <View
              style={[
                styles.customerRow,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Image
                source={
                  delivery.customerInfo?.profilePicture
                    ? { uri: delivery.customerInfo.profilePicture }
                    : require("@/assets/images/defaultUserImg.png")
                }
                style={styles.profilePic}
                contentFit="cover"
              />
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: theme.text }]}>
                  {delivery.dropoff.contact.name}
                </Text>
                <Text style={[styles.customerPhone, { color: theme.muted }]}>
                  {delivery.dropoff.contact.phone}
                </Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={callCustomer}>
                <Ionicons name="call-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Delivery Details */}
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

              {/* Package Details */}
              <View style={styles.packageInfo}>
                <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
                  Package Details
                </Text>
                <View style={styles.packageDetails}>
                  <View style={styles.packageItem}>
                    <Ionicons name="cube-outline" size={16} color={theme.primary} />
                    <Text style={[styles.packageText, { color: theme.text }]}>
                      {delivery.packageDetails.size.charAt(0).toUpperCase() + delivery.packageDetails.size.slice(1)}
                    </Text>
                  </View>
                  {delivery.packageDetails.fragile && (
                    <View style={styles.packageItem}>
                      <Ionicons name="warning-outline" size={16} color={theme.warning} />
                      <Text style={[styles.packageText, { color: theme.warning }]}>
                        Fragile
                      </Text>
                    </View>
                  )}
                  {delivery.urgent && (
                    <View style={styles.packageItem}>
                      <Ionicons name="flash-outline" size={16} color={theme.warning} />
                      <Text style={[styles.packageText, { color: theme.warning }]}>
                        Urgent
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Locations */}
              <TouchableOpacity
                style={styles.row}
                onPress={() => openMaps(delivery.pickup)}
              >
                <Ionicons name="business-outline" size={20} color={theme.primary} />
                <View style={styles.locationText}>
                  <Text style={[styles.label, { color: theme.muted }]}>Pickup:</Text>
                  <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
                    {delivery.pickup.address}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                onPress={() => openMaps(delivery.dropoff)}
              >
                <Ionicons name="home-outline" size={20} color={theme.primary} />
                <View style={styles.locationText}>
                  <Text style={[styles.label, { color: theme.muted }]}>Delivery:</Text>
                  <Text style={[styles.value, { color: theme.text }]} numberOfLines={2}>
                    {delivery.dropoff.address}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Fare Information */}
              <View style={styles.fareRow}>
                <Ionicons name="cash-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.muted }]}>Delivery Fee:</Text>
                <Text style={[styles.fareValue, { color: theme.success }]}>
                  {formatFare(delivery.estimatedFare)}
                </Text>
              </View>

              {/* Special Instructions */}
              {delivery.instructions && (
                <View style={styles.instructions}>
                  <Text style={[styles.instructionsLabel, { color: theme.muted }]}>
                    Special Instructions:
                  </Text>
                  <Text style={[styles.instructionsText, { color: theme.text }]}>
                    {delivery.instructions}
                  </Text>
                </View>
              )}
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
                    "Cancel Delivery",
                    "Are you sure you want to cancel this delivery? This will affect your rating.",
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
                <Text style={styles.btnText}>Cancel Delivery</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* Minimized Content */
          <View style={styles.minimizedContent}>
            <View style={styles.minimizedRow}>
              <View style={styles.minimizedInfo}>
                <Text style={[styles.minimizedStatus, { color: theme.primary }]}>
                  {getStatusDisplay(currentStatus)}
                </Text>
                <Text style={[styles.minimizedEta, { color: theme.text }]}>
                  ETA: {eta}
                </Text>
              </View>
              <View style={styles.minimizedFare}>
                <Text style={[styles.minimizedFareText, { color: theme.success }]}>
                  {formatFare(delivery.estimatedFare)}
                </Text>
              </View>
            </View>
            {/* Quick action button in minimized state */}
            {(currentStatus === "accepted" || currentStatus === "picked_up") && (
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => 
                  currentStatus === "accepted" 
                    ? openNavigation(delivery.pickup)
                    : openNavigation(delivery.dropoff)
                }
              >
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={styles.quickActionText}>
                  {currentStatus === "accepted" ? "To Pickup" : "To Delivery"}
                </Text>
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
    ...StyleSheet.absoluteFillObject,
  },
  panelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
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
    flexGrow: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
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
  customerRow: {
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
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  customerPhone: {
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
  packageInfo: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  packageDetails: {
    flexDirection: "row",
    gap: 12,
  },
  packageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  packageText: {
    fontSize: 14,
    fontWeight: "500",
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
  instructions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    width: "100%",
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    flexDirection: "row",
    gap: 8,
    flex: 1,
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
});