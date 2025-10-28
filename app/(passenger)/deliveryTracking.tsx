// /app/(customer)/deliveryTracking.tsx
import MapViewComponent from "@/components/MapViewComponent";
import { useTheme } from "@/contexts/ThemeContext";
import { useSmoothLocationTracking } from "@/hooks/useSmoothLocationTracking";
import { db } from "@/lib/firebaseConfig";
import { getRiderDetails } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

interface DeliveryData {
  id: string;
  customerId: string;
  pickup: {
    address: string;
    lat: number;
    lng: number;
    contact?: {
      name: string;
      phone: string;
    };
  };
  dropoff: {
    address: string;
    lat: number;
    lng: number;
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
  status: DeliveryStatus;
  urgent: boolean;
  instructions?: string;
  riderId?: string;
  riderInfo?: {
    name?: string;
    phone?: string;
    vehicle?: Vehicle;
    rating?: number;
    profilePicture?: string;
    totalDeliveries?: number;
  };
  createdAt: any;
  acceptedAt?: any;
  pickedUpAt?: any;
  deliveredAt?: any;
  cancelledAt?: any;
}

interface Vehicle {
  make?: string;
  model?: string;
  color?: string;
  plateNumber?: string;
}

interface RiderProfile {
  userName: string;
  phone: string;
  profilePicture?: string;
  vehicle?: {
    make?: string;
    model?: string;
    color?: string;
    plateNumber?: string;
  };
  rating?: number;
  totalDeliveries?: number;
}

export default function DeliveryTrackingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { deliveryId } = useLocalSearchParams();
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactingRider, setContactingRider] = useState(false);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [fetchingRiderProfile, setFetchingRiderProfile] = useState(false);

  const { currentLocation, smoothedLocation } =
    useSmoothLocationTracking(15000);

  // Real-time delivery updates
  useEffect(() => {
    if (!deliveryId) {
      Alert.alert("Error", "No delivery ID provided");
      router.back();
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "deliveries", deliveryId as string),
      async (doc) => {
        if (doc.exists()) {
          const deliveryData = { id: doc.id, ...doc.data() } as DeliveryData;
          setDelivery(deliveryData);

          // Fetch rider profile when rider is assigned
          if (deliveryData.riderId && !riderProfile) {
            const riderDetails = await getRiderDetails(deliveryData.riderId);
            if (riderDetails) {
              setRiderProfile({
                userName:
                  (riderDetails.userName as string) ||
                  (riderDetails.displayName as string) ||
                  "Rider",
                phone:
                  (riderDetails.phone as string) ||
                  (riderDetails.phoneNumber as string) ||
                  "Not available",
                profilePicture:
                  (riderDetails.profilePicture as string) ||
                  (riderDetails.photoURL as string) ||
                  undefined,
                vehicle:
                  (riderDetails.vehicleDetails as Vehicle) ||
                  (riderDetails.vehicle as Vehicle) ||
                  undefined,
                rating:
                  typeof riderDetails.rating === "number"
                    ? (riderDetails.rating as number)
                    : undefined,
                totalDeliveries:
                  (riderDetails.totalDeliveries as number) ||
                  (riderDetails.totalRides as number) ||
                  undefined,
              });
            }
          }
        } else {
          Alert.alert("Error", "Delivery not found");
          router.back();
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to delivery:", error);
        Alert.alert("Error", "Failed to load delivery details");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [deliveryId]);

  // Fetch rider profile details
  // const fetchRiderProfile = async (riderId: string) => {
  //   setFetchingRiderProfile(true);
  //   try {
  //     const profile = await getUserProfile(riderId);
  //     if (profile) {
  //       setRiderProfile({
  //         name: profile.displayName || profile.name || "Rider",
  //         phone: profile.phoneNumber || "Not available",
  //         profilePicture: profile.profilePicture,
  //         vehicle: profile.vehicleDetails,
  //         rating: profile.rating,
  //         totalDeliveries: profile.totalDeliveries || profile.totalRides || 0,
  //       });

  //       // Update delivery with enhanced rider info
  //       setDelivery(prev => prev ? {
  //         ...prev,
  //         riderInfo: {
  //           ...prev.riderInfo,
  //           name: profile.displayName || profile.name,
  //           phone: profile.phoneNumber,
  //           profilePicture: profile.profilePicture,
  //           vehicle: profile.vehicleDetails ?
  //             `${profile.vehicleDetails.color || ''} ${profile.vehicleDetails.make || ''} ${profile.vehicleDetails.model || ''}`.trim()
  //             : undefined,
  //           rating: profile.rating,
  //           totalDeliveries: profile.totalDeliveries || profile.totalRides || 0,
  //         }
  //       } : null);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching rider profile:", error);
  //   } finally {
  //     setFetchingRiderProfile(false);
  //   }
  // };

  const getStatusInfo = (status: DeliveryStatus) => {
    const statusConfig = {
      pending: {
        message: "Waiting for Rider",
        icon: "time-outline",
        color: theme.muted,
        description: "Looking for available riders in your area",
      },
      accepted: {
        message: "Rider Assigned",
        icon: "checkmark-circle-outline",
        color: theme.primary,
        description: "A rider has accepted your delivery",
      },
      picked_up: {
        message: "Package Picked Up",
        icon: "cube-outline",
        color: theme.warning,
        description: "Your package has been collected",
      },
      in_transit: {
        message: "On the Way",
        icon: "car-outline",
        color: theme.warning,
        description: "Your package is being delivered",
      },
      delivered: {
        message: "Delivered Successfully",
        icon: "checkmark-done-outline",
        color: theme.success,
        description: "Package has been delivered",
      },
      cancelled: {
        message: "Cancelled",
        icon: "close-circle-outline",
        color: theme.warning,
        description: "Delivery was cancelled",
      },
    };

    return statusConfig[status];
  };

  const handleContactRider = async () => {
    const phoneNumber = riderProfile?.phone;

    if (!phoneNumber) {
      Alert.alert("Error", "Rider contact information not available");
      return;
    }

    setContactingRider(true);
    try {
      // Show contact options
      Alert.alert(
        "Contact Rider",
        `How would you like to contact ${
          riderProfile?.userName || "the rider"
        }?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Call",
            onPress: () => callRider(phoneNumber),
          },
          {
            text: "Send SMS",
            onPress: () => sendSMS(phoneNumber),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to contact rider");
    } finally {
      setContactingRider(false);
    }
  };

  const callRider = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Error", "Could not make phone call");
    });
  };

  const sendSMS = (phoneNumber: string) => {
    const message = `Hi, I'm contacting you about my delivery #${deliveryId}`;
    Linking.openURL(
      `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
    ).catch(() => {
      Alert.alert("Error", "Could not open messaging app");
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

  const handleCancelDelivery = async () => {
    if (!delivery || delivery.status !== "pending") {
      Alert.alert("Error", "Cannot cancel delivery at this stage");
      return;
    }

    Alert.alert(
      "Cancel Delivery",
      "Are you sure you want to cancel this delivery?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "deliveries", delivery.id), {
                status: "cancelled",
                cancelledAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              Alert.alert("Cancelled", "Delivery has been cancelled");
            } catch (error) {
              Alert.alert("Error", "Failed to cancel delivery");
            }
          },
        },
      ]
    );
  };

  const getProgressPercentage = (status: DeliveryStatus): number => {
    const progressMap = {
      pending: 0,
      accepted: 25,
      picked_up: 50,
      in_transit: 75,
      delivered: 100,
      cancelled: 0,
    };
    return progressMap[status];
  };

  const getEstimatedTime = (status: DeliveryStatus): string => {
    if (status === "delivered" || status === "cancelled") return "";

    const timeMap = {
      pending: "5-15 min",
      accepted: "5-10 min",
      picked_up: "3-8 min",
      in_transit: "1-5 min",
    };

    return `Estimated: ${timeMap[status]}`;
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading delivery details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.warning}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>
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
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(delivery.status);
  const progressPercentage = getProgressPercentage(delivery.status);
  const estimatedTime = getEstimatedTime(delivery.status);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Track Delivery
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
          <View style={styles.statusHeader}>
            <View
              style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}
            >
              <Ionicons
                name={statusInfo.icon as any}
                size={24}
                color={theme.primaryText}
              />
            </View>
            <View style={styles.statusText}>
              <Text style={[styles.statusMessage, { color: theme.text }]}>
                {statusInfo.message}
              </Text>
              <Text style={[styles.statusDescription, { color: theme.muted }]}>
                {statusInfo.description}
              </Text>
              {estimatedTime && (
                <Text style={[styles.estimatedTime, { color: theme.primary }]}>
                  {estimatedTime}
                </Text>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBackground,
                { backgroundColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${progressPercentage}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.muted }]}>
              {progressPercentage}% Complete
            </Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {delivery.pickup?.lat && delivery.dropoff?.lat ? (
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
              currentLocation={currentLocation}
              showRoute={
                delivery.status !== "pending" && delivery.status !== "cancelled"
              }
            />
          ) : (
            <View
              style={[styles.mapPlaceholder, { backgroundColor: theme.card }]}
            >
              <Ionicons name="map-outline" size={48} color={theme.muted} />
              <Text style={[styles.placeholderText, { color: theme.muted }]}>
                Map unavailable - invalid coordinates
              </Text>
            </View>
          )}
        </View>

        {/* Enhanced Rider Information */}
        {(delivery.riderInfo || riderProfile) &&
          delivery.status !== "pending" &&
          delivery.status !== "cancelled" && (
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Your Delivery Rider
              </Text>

              <View style={styles.riderCard}>
                {/* Rider Profile */}
                <View style={styles.riderProfile}>
                  <Image
                    source={
                      riderProfile?.profilePicture
                        ? { uri: riderProfile?.profilePicture }
                        : require("@/assets/images/defaultUserImg.png")
                    }
                    style={styles.riderAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.riderDetails}>
                    <Text style={[styles.riderName, { color: theme.text }]}>
                      {riderProfile?.userName || "Rider"}
                    </Text>

                    {riderProfile?.vehicle && (
                      <Text
                        style={[styles.riderVehicle, { color: theme.muted }]}
                      >
                        {riderProfile?.vehicle.model}
                      </Text>
                    )}

                    <View style={styles.riderStats}>
                      {riderProfile?.rating && (
                        <View style={styles.ratingContainer}>
                          <Ionicons
                            name="star"
                            size={14}
                            color={theme.warning}
                          />
                          <Text
                            style={[styles.ratingText, { color: theme.muted }]}
                          >
                            {riderProfile.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}

                      {riderProfile?.totalDeliveries && (
                        <View style={styles.deliveriesContainer}>
                          <Ionicons
                            name="cube"
                            size={14}
                            color={theme.primary}
                          />
                          <Text
                            style={[
                              styles.deliveriesText,
                              { color: theme.muted },
                            ]}
                          >
                            {riderProfile.totalDeliveries} deliveries
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Contact Actions */}
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={[
                      styles.contactButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={handleContactRider}
                    disabled={contactingRider || fetchingRiderProfile}
                  >
                    {contactingRider ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.primaryText}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color={theme.primaryText}
                        />
                        <Text
                          style={[
                            styles.contactButtonText,
                            { color: theme.primaryText },
                          ]}
                        >
                          Call
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.messageButton,
                      { borderColor: theme.primary },
                    ]}
                    onPress={() =>
                      sendSMS(
                        delivery.riderInfo?.phone || riderProfile?.phone || ""
                      )
                    }
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.messageButtonText,
                        { color: theme.primary },
                      ]}
                    >
                      Message
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Emergency Button */}
              <TouchableOpacity
                style={[
                  styles.emergencyButton,
                  { backgroundColor: theme.danger + "20" },
                ]}
                onPress={handleEmergency}
              >
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={theme.danger}
                />
                <Text style={[styles.emergencyText, { color: theme.danger }]}>
                  Emergency Assistance
                </Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Delivery Timeline */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Delivery Timeline
          </Text>

          <View style={styles.timeline}>
            {/* Order Placed */}
            <View style={styles.timelineItem}>
              <View
                style={[styles.timelineDot, { backgroundColor: theme.primary }]}
              />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>
                  Order Placed
                </Text>
                <Text style={[styles.timelineTime, { color: theme.muted }]}>
                  {delivery.createdAt?.toDate?.()?.toLocaleTimeString() ||
                    "Recently"}
                </Text>
              </View>
            </View>

            {/* Rider Assigned */}
            {delivery.acceptedAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: theme.text }]}>
                    Rider Assigned
                  </Text>
                  <Text style={[styles.timelineTime, { color: theme.muted }]}>
                    {delivery.acceptedAt.toDate().toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Package Picked Up */}
            {delivery.pickedUpAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: theme.text }]}>
                    Package Collected
                  </Text>
                  <Text style={[styles.timelineTime, { color: theme.muted }]}>
                    {delivery.pickedUpAt.toDate().toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Delivered */}
            {delivery.deliveredAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.success },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: theme.text }]}>
                    Delivered Successfully
                  </Text>
                  <Text style={[styles.timelineTime, { color: theme.muted }]}>
                    {delivery.deliveredAt.toDate().toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Cancelled */}
            {delivery.cancelledAt && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.warning },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: theme.text }]}>
                    Delivery Cancelled
                  </Text>
                  <Text style={[styles.timelineTime, { color: theme.muted }]}>
                    {delivery.cancelledAt.toDate().toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Package Details */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Package Details
          </Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="cube-outline" size={20} color={theme.primary} />
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Size
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {delivery.packageDetails.size.charAt(0).toUpperCase() +
                  delivery.packageDetails.size.slice(1)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={20} color={theme.primary} />
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Fee
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                GHS {delivery.estimatedFare?.toFixed(2)}
              </Text>
            </View>
          </View>

          {delivery.packageDetails.fragile && (
            <View
              style={[
                styles.warningBadge,
                { backgroundColor: `${theme.warning}20` },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={theme.warning}
              />
              <Text style={[styles.warningText, { color: theme.warning }]}>
                Fragile Item - Handle with care
              </Text>
            </View>
          )}

          {delivery.urgent && (
            <View
              style={[
                styles.warningBadge,
                { backgroundColor: `${theme.warning}20` },
              ]}
            >
              <Ionicons name="flash-outline" size={16} color={theme.warning} />
              <Text style={[styles.warningText, { color: theme.warning }]}>
                Urgent Delivery
              </Text>
            </View>
          )}

          {delivery.packageDetails.description && (
            <View style={styles.description}>
              <Text style={[styles.descriptionLabel, { color: theme.muted }]}>
                Description:
              </Text>
              <Text style={[styles.descriptionText, { color: theme.text }]}>
                {delivery.packageDetails.description}
              </Text>
            </View>
          )}
        </View>

        {/* Cancel Button for Pending Deliveries */}
        {delivery.status === "pending" && (
          <View style={styles.cancelSection}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.danger }]}
              onPress={handleCancelDelivery}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={theme.danger}
              />
              <Text style={[styles.cancelButtonText, { color: theme.danger }]}>
                Cancel Delivery
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    flex: 1,
  },
  statusMessage: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  // Enhanced Rider Card Styles
  riderCard: {
    marginBottom: 16,
  },
  riderProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  riderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  riderVehicle: {
    fontSize: 14,
    marginBottom: 8,
  },
  riderStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deliveriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deliveriesText: {
    fontSize: 12,
    fontWeight: "500",
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 14,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cancelSection: {
    padding: 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
