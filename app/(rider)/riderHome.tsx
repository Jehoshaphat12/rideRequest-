import MapViewComponent from "@/components/MapViewComponent";
import { useRideRequestListener } from "@/contexts/RideRequestListenerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { auth, db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { addNotification } from "@/services/notifications";
import { acceptRide, updateRiderLocation } from "@/services/rides";
import { getUserProfile } from "@/services/users";
import {
  DeliveryRequest,
  RideRequest,
  ServiceRequest,
} from "@/types/serviceRequests";
import { calculateDistance } from "@/utils/LocationUtiles";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_MARGIN = 8;
const MAX_DISTANCE_KM = 20;

export default function RiderHomeScreen() {
  const [status, setStatus] = useState<"online" | "offline">("offline");
  const [activeService, setActiveService] = useState<
    "rides" | "deliveries" | "both"
  >("both");
  const { theme, darkMode } = useTheme();
  const router = useRouter();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { location } = useCurrentLocation();
  const [mounted, setMounted] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(true);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const { currentLocation } = useLocationTracking();
  const [shownRequests, setShownRequests] = useState<Set<string>>(new Set());
  const { isListening, currentRequests } = useRideRequestListener();

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const rideListenerRef = useRef<(() => void) | null>(null);

  // Add this to your RiderHomeScreen for testing
  // const testIncomingCall = () => {
  //   console.log("🧪 Testing incoming call...");
  //   router.push({
  //     pathname: "/(rider)/incomingCallScreen",
  //     params: {
  //       id: "test-ride-123",
  //       riderId: auth.currentUser?.uid || "test-rider",
  //       passengerPhoto: "https://via.placeholder.com/100",
  //       passengerName: "Test Passenger",
  //       pickupAddress: "123 Test Street, Test City",
  //       destinationAddress: "456 Destination Ave, Test City",
  //       estimatedFare: "15.50",
  //       estimatedDuration: "15 mins",
  //       estimatedDistance: "3.2 km",
  //     },
  //   });
  // };

  useEffect(() => {
    if (status !== "online" || filteredRequests.length === 0) return;

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const requestsFromLast10Mins = filteredRequests.filter((req) => {
      if (!req.createdAt || shownRequests.has(req.id)) return false;

      try {
        const createdAt = req.createdAt?.toDate
          ? req.createdAt.toDate()
          : new Date(req.createdAt.seconds * 1000);
        return createdAt >= tenMinutesAgo;
      } catch (error) {
        console.error("Error parsing createdAt:", error);
        return false;
      }
    });

    if (requestsFromLast10Mins.length > 0) {
      const currentRequest = requestsFromLast10Mins[0];

      if (currentRequest && currentRequest.pickup && currentRequest.dropoff) {
        console.log(
          "📞 Showing incoming call for new request:",
          currentRequest.id
        );

        // 🆕 Mark this request as shown
        setShownRequests((prev) => new Set(prev).add(currentRequest.id));

        router.push({
          pathname: "/(rider)/incomingCallScreen",
          params: {
            id: currentRequest.id,
            riderId: auth.currentUser?.uid,
            passengerPhoto: "https://via.placeholder.com/100",
            passengerName: "Passenger",
            passengerId: currentRequest.passengerId,
            pickupAddress: currentRequest.pickup.address || "Pickup location",
            destinationAddress: currentRequest.dropoff.address || "Destination",
            estimatedFare: currentRequest.estimatedFare?.toString() || "0",
            estimatedDuration:
              currentRequest.estimatedDuration || "Calculating...",
            estimatedDistance:
              currentRequest.estimatedDistance || "Calculating...",
            requestType: currentRequest.type,
          },
        });
      }
    }
  }, [filteredRequests, status, shownRequests, router]);

  // Clean up shownRequests every minute to prevent memory issues
  // 🆕 Reset shownRequests more frequently
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Refreshing shownRequests...");
      setShownRequests((prev) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const newSet = new Set<string>();
        // Only keep requests that are still recent
        filteredRequests.forEach((req) => {
          if (req.createdAt) {
            try {
              const createdAt = req.createdAt?.toDate
                ? req.createdAt.toDate()
                : new Date(req.createdAt.seconds * 1000);
              if (createdAt >= fiveMinutesAgo && prev.has(req.id)) {
                newSet.add(req.id);
              }
            } catch (error) {
              console.error("Error cleaning shown requests:", error);
            }
          }
        });

        console.log(
          `🔄 shownRequests refreshed: ${prev.size} -> ${newSet.size}`
        );
        return newSet;
      });
    }, 30000); // Clean every 30 seconds

    return () => clearInterval(interval);
  }, [filteredRequests]);

  // 🆕 Reset when going offline
  useEffect(() => {
    if (status === "offline") {
      setShownRequests(new Set());
    }
  }, [status]);

  // Filter requests based on location and service type
  useEffect(() => {
    if (currentLocation && serviceRequests.length > 0) {
      const nearbyRequests = serviceRequests.filter((request) => {
        if (!request.pickup?.lat || !request.pickup?.lng) {
          return false;
        }

        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          request.pickup.lat,
          request.pickup.lng
        );
        const isNearby = distance <= MAX_DISTANCE_KM;

        const serviceMatch =
          activeService === "both" ||
          (activeService === "rides" && request.type === "ride") ||
          (activeService === "deliveries" && request.type === "delivery");

        return isNearby && serviceMatch;
      });

      // 🆕 Sort by most recent and take only the latest
      // const sortedByRecent = nearbyRequests.sort((a, b) => {
      //   const timeA = a.createdAt?.toDate?.()
      //     ? a.createdAt.toDate().getTime()
      //     : 0;
      //   const timeB = b.createdAt?.toDate?.()
      //     ? b.createdAt.toDate().getTime()
      //     : 0;
      //   return timeB - timeA; // Most recent first
      // });

      // // 🆕 Take only the latest request
      // const latestRequestOnly = sortedByRecent.slice(0, 1);

      const latestRequestOnly = [...nearbyRequests]
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate()
            : new Date(a.createdAt?.seconds * 1000 || 0);
          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate()
            : new Date(b.createdAt?.seconds * 1000 || 0);

          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 1);

      setFilteredRequests(latestRequestOnly);
      setCurrentIndex(0);
    } else {
      setFilteredRequests([]);
    }
  }, [serviceRequests, location, activeService]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (!profile) return;

        setProfilePic(profile.profilePicture);

        if (profile.onboardingStatus === "incomplete") {
          router.replace("/(rider)/OnboardingScreen2");
        } else if (profile.onboardingStatus === "pending") {
          router.replace("/(rider)/waitingScreen");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error checking profile:", err);
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  // NEW: Status toggle function from first code
  const updateRiderStatus = async (newStatus: "online" | "offline") => {
    setUpdatingStatus(true);

    try {
      const riderId = auth.currentUser!.uid;

      const updateData: any = {
        status: newStatus,
        lastOnlineAt: serverTimestamp(),
      };

      if (newStatus === "online") {
        updateData.availableServices = activeService;
        if (currentLocation) {
          updateData.lastLocation = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            updatedAt: serverTimestamp(),
          };
        }
      }

      await updateDoc(doc(db, "users", riderId), updateData);
      setStatus(newStatus);
    } catch (error: any) {
      console.error("Error updating rider status:", error);
      Alert.alert("Error", "Failed to update status. Please try again.");
      setStatus(newStatus === "online" ? "offline" : "online");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Listen to both ride and delivery requests
  useEffect(() => {
    let rideUnsubscribe: (() => void) | undefined;
    let deliveryUnsubscribe: (() => void) | undefined;

    if (status === "online") {
      const rideQuery = query(
        collection(db, "rides"),
        where("status", "==", "pending"),
        limit(10)
      );

      rideUnsubscribe = onSnapshot(
        rideQuery,
        (snapshot) => {
          const rideRequests: RideRequest[] = snapshot.docs.map((doc) => {
            const rideData = doc.data();
            return {
              id: doc.id,
              type: "ride" as const,
              ...rideData,
              receivedAt: new Date().toLocaleTimeString(),
            } as RideRequest;
          });

          setServiceRequests((prev) => {
            const otherRequests = prev.filter((req) => req.type !== "ride");
            return [...otherRequests, ...rideRequests];
          });
        },
        (error) => {
          console.error("Error listening to ride requests:", error);
        }
      );

      const deliveryQuery = query(
        collection(db, "deliveries"),
        where("status", "==", "pending"),
        limit(20)
      );

      deliveryUnsubscribe = onSnapshot(
        deliveryQuery,
        (snapshot) => {
          const deliveryRequests: DeliveryRequest[] = snapshot.docs.map(
            (doc) => {
              const deliveryData = doc.data();
              return {
                id: doc.id,
                type: "delivery" as const,
                ...deliveryData,
                receivedAt: new Date().toLocaleTimeString(),
              } as DeliveryRequest;
            }
          );

          setServiceRequests((prev) => {
            const otherRequests = prev.filter((req) => req.type !== "delivery");
            return [...otherRequests, ...deliveryRequests];
          });
        },
        (error) => {
          console.error("Error listening to delivery requests:", error);
        }
      );
    } else {
      setServiceRequests([]);
      setFilteredRequests([]);
      setCurrentIndex(0);
    }

    return () => {
      if (rideUnsubscribe) rideUnsubscribe();
      if (deliveryUnsubscribe) deliveryUnsubscribe();
    };
  }, [status, activeService]);

  // Sync rider status from Firestore
  useEffect(() => {
    const riderId = auth.currentUser?.uid;
    if (!riderId) return;

    const unsubscribe = onSnapshot(doc(db, "users", riderId), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.status && userData.status !== status) {
          setStatus(userData.status);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Notify rider when filtered requests change
  useEffect(() => {
    const notifyRiderOfRequests = async () => {
      if (status === "online" && filteredRequests.length > 0) {
        const rideCount = filteredRequests.filter(
          (req) => req.type === "ride"
        ).length;
        const deliveryCount = filteredRequests.filter(
          (req) => req.type === "delivery"
        ).length;

        let message = "";
        if (rideCount > 0 && deliveryCount > 0) {
          message = `🚖 ${rideCount} Ride${
            rideCount > 1 ? "s" : ""
          } & 📦 ${deliveryCount} Deliver${
            deliveryCount > 1 ? "ies" : "y"
          } Nearby`;
        } else if (rideCount > 0) {
          message = `🚖 ${rideCount} Nearby Ride Request${
            rideCount > 1 ? "s" : ""
          }`;
        } else if (deliveryCount > 0) {
          message = `📦 ${deliveryCount} Nearby Deliver${
            deliveryCount > 1 ? "ies" : "y"
          }`;
        }

        await addNotification(
          auth.currentUser!.uid,
          "new_service_requests",
          message,
          `Requests within ${MAX_DISTANCE_KM}km of your location`,
          filteredRequests[0].id
        );
      }
    };

    notifyRiderOfRequests();
  }, [filteredRequests, status]);

  // Enhanced accept service function
  const handleAcceptService = async (request: ServiceRequest) => {
    setLoading(true);
    try {
      const rider = auth.currentUser;
      if (!rider) throw new Error("No rider logged in");

      if (request.type === "ride") {
        await acceptRide(request.id);

        if (location) {
          await updateRiderLocation(
            request.id,
            location.coords.latitude,
            location.coords.longitude
          );
        }

        await addNotification(
          rider.uid,
          "ride_accepted",
          "Ride Accepted ✅",
          "You are now assigned to a passenger",
          request.id
        );

        Alert.alert("Ride Accepted", "You've accepted the ride request! 🚗");
        router.push({
          pathname: "/(rider)/riderRideProgress",
          params: { rideId: request.id },
        });
      } else if (request.type === "delivery") {
        await updateDoc(doc(db, "deliveries", request.id), {
          status: "accepted",
          riderId: rider.uid,
          acceptedAt: serverTimestamp(),
        });

        await addNotification(
          rider.uid,
          "delivery_accepted",
          "Delivery Accepted ✅",
          "You are now assigned to a delivery",
          request.id
        );

        Alert.alert(
          "Delivery Accepted",
          "You've accepted the delivery request! 📦"
        );
        router.push({
          pathname: "/(rider)/deliveryProgress",
          params: { deliveryId: request.id },
        });
      }
    } catch (error: any) {
      console.error("Error accepting service:", error);
      Alert.alert("Error", error.message || "Failed to accept request");
    } finally {
      setLoading(false);
    }
  };

  const ignoreRequest = (requestId: string) => {
    setServiceRequests((prev) => prev.filter((req) => req.id !== requestId));
    setFilteredRequests((prev) => prev.filter((req) => req.id !== requestId));

    if (filteredRequests.length > 1) {
      setCurrentIndex((prev) => Math.min(prev, filteredRequests.length - 2));
    } else {
      setCurrentIndex(1);
    }
  };

  // // Carousel navigation
  // const goToNextRequest = () => {
  //   if (currentIndex < filteredRequests.length) {
  //     const nextIndex = currentIndex + 1;
  //     setCurrentIndex(nextIndex);
  //     flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  //   }
  // };

  // const goToPrevRequest = () => {
  //   if (currentIndex > 0) {
  //     const prevIndex = currentIndex - 1;
  //     setCurrentIndex(prevIndex);
  //     flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  //   }
  // };

  // const onScroll = Animated.event(
  //   [{ nativeEvent: { contentOffset: { x: scrollX } } }],
  //   { useNativeDriver: false }
  // );

  // const onMomentumScrollEnd = (event: any) => {
  //   const contentOffset = event.nativeEvent.contentOffset;
  //   const viewSize = event.nativeEvent.layoutMeasurement;
  //   const newIndex = Math.floor(contentOffset.x / viewSize.width);
  //   setCurrentIndex(newIndex);
  // };

  // Get map locations based on current request
  const getMapLocations = () => {
    if (filteredRequests.length > 0) {
      const currentRequest = filteredRequests[0];
      return {
        pickupLocation: {
          latitude: currentRequest.pickup?.lat || 0,
          longitude: currentRequest.pickup?.lng || 0,
          address: currentRequest.pickup?.address || "Pickup location",
        },
        destinationLocation: {
          latitude: currentRequest.dropoff?.lat || 0,
          longitude: currentRequest.dropoff?.lng || 0,
          address: currentRequest.dropoff?.address || "Destination",
        },
        showRoute: true,
      };
    } else {
      return {
        pickupLocation: currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              address: "Your location",
            }
          : {
              latitude: 0,
              longitude: 0,
              address: "Loading...",
            },
        destinationLocation: {
          latitude: 0,
          longitude: 0,
          address: "No destination",
        },
        showRoute: false,
      };
    }
  };

  // NEW: Service Toggle Component from first code
  const ServiceToggle = () => (
    <View style={styles.serviceToggle}>
      {[
        { key: "rides", label: "Rides", icon: "car-sport" },
        { key: "deliveries", label: "Deliveries", icon: "cube" },
        { key: "both", label: "Both", icon: "options" },
      ].map((service) => (
        <TouchableOpacity
          key={service.key}
          style={[
            styles.serviceOption,
            activeService === service.key && [
              styles.serviceOptionActive,
              { backgroundColor: theme.primary },
            ],
          ]}
          onPress={() => setActiveService(service.key as any)}
        >
          <Ionicons
            name={service.icon as any}
            size={18}
            color={
              activeService === service.key ? theme.primaryText : theme.primary
            }
          />
          <Text
            style={[
              styles.serviceOptionText,
              {
                color:
                  activeService === service.key
                    ? theme.primaryText
                    : theme.text,
              },
            ]}
          >
            {service.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render Ride Card
  const renderRideCard = (item: RideRequest) => {
    const distance = currentLocation
      ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          item.pickup.lat,
          item.pickup.lng
        )
      : 0;

    return (
      <View
        style={[
          styles.rideCard,
          { width: CARD_WIDTH, backgroundColor: theme.card },
        ]}
      >
        <ScrollView
          style={styles.cardScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardHeader}>
            <View style={styles.serviceBadge}>
              <Ionicons name="car-sport" size={16} color={theme.primary} />
              <Text style={[styles.serviceBadgeText, { color: theme.primary }]}>
                Ride Request
              </Text>
            </View>
            <Text style={[styles.cardTime, { color: theme.muted }]}>
              Requested at{" "}
              {new Date(item.createdAt.seconds * 1000).toLocaleTimeString()} -
              Received at {item.receivedAt}
            </Text>
          </View>

          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={14} color={theme.primary} />
            <Text style={[styles.distanceText, { color: theme.primary }]}>
              {distance.toFixed(1)} km away
            </Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.row}>
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
                  {item.pickup?.address || "Current location"}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
              <View style={styles.locationText}>
                <Text style={[styles.label, { color: theme.muted }]}>
                  Destination:
                </Text>
                <Text
                  style={[styles.value, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {item.dropoff?.address || "Unknown destination"}
                </Text>
              </View>
            </View>
            {/* RIDE DETAILS (DURATION / FARE / DISTANCE) */}
          </View>
          <View style={styles.rideInfoContainer}>
            <View style={styles.infoColumn}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {item.estimatedDuration || "Calculating..."}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>
                Duration
              </Text>
            </View>

            <View style={[styles.infoColumn, styles.fareColumn]}>
              <Ionicons name="cash-outline" size={16} color={theme.primary} />
              <Text style={[styles.fareValue, { color: theme.text }]}>
                {item.estimatedFare
                  ? formatFare(item.estimatedFare)
                  : "Calculating..."}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>
                Estimated Fare
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Ionicons
                name="trending-up-outline"
                size={16}
                color={theme.primary}
              />
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {item.estimatedDistance || "Calculating..."}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>
                Distance
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.ignoreBtn, { borderColor: theme.border }]}
              onPress={() => ignoreRequest(item.id)}
              disabled={loading}
            >
              <Text style={[styles.ignoreText, { color: theme.muted }]}>
                Ignore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptBtn,
                { backgroundColor: theme.success },
                loading && styles.acceptBtnDisabled,
              ]}
              onPress={() => handleAcceptService(item)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.acceptText}>Accept Ride</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Delivery Card
  const renderDeliveryCard = (item: DeliveryRequest) => {
    const distance = currentLocation
      ? calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          item.pickup.lat,
          item.pickup.lng
        )
      : 0;

    return (
      <View
        style={[
          styles.rideCard,
          { width: CARD_WIDTH, backgroundColor: theme.card },
        ]}
      >
        <ScrollView
          style={styles.cardScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardHeader}>
            <View style={styles.serviceBadge}>
              <Ionicons name="cube" size={16} color={theme.primary} />
              <Text style={[styles.serviceBadgeText, { color: theme.primary }]}>
                Delivery
              </Text>
              {item.urgent && (
                <View
                  style={[
                    styles.urgentBadge,
                    { backgroundColor: theme.warning },
                  ]}
                >
                  <Text
                    style={[styles.urgentText, { color: theme.primaryText }]}
                  >
                    URGENT
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.cardTime, { color: theme.muted }]}>
              Received at {item.receivedAt}
            </Text>
          </View>

          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={14} color={theme.primary} />
            <Text style={[styles.distanceText, { color: theme.primary }]}>
              {distance.toFixed(1)} km away
            </Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.row}>
              <Ionicons
                name="business-outline"
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
                  {item.pickup.address}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <Ionicons name="home-outline" size={20} color={theme.primary} />
              <View style={styles.locationText}>
                <Text style={[styles.label, { color: theme.muted }]}>
                  Delivery:
                </Text>
                <Text
                  style={[styles.value, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {item.dropoff.address}
                </Text>
              </View>
            </View>
          </View>

          {item.packageDetails.description && (
            <View style={styles.packageDescription}>
              <Text style={[styles.descriptionText, { color: theme.muted }]}>
                📝 {item.packageDetails.description}
                {item.packageDetails.fragile && " • 🚫 Fragile"}
              </Text>
            </View>
          )}

          {/* DELIVERY INFO ( DURATION / FARE / DISTANCE) */}
          <View style={styles.rideInfoContainer}>
            <View style={styles.infoColumn}>
              <Ionicons name="cube-outline" size={16} color={theme.primary} />
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {item.packageDetails.size}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>
                Size
              </Text>
            </View>

            <View style={[styles.infoColumn, styles.fareColumn]}>
              <Ionicons name="cash-outline" size={16} color={theme.primary} />
              <Text style={[styles.fareValue, { color: theme.text }]}>
                {formatFare(item.estimatedFare!)}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>
                Delivery Fee
              </Text>
            </View>

            <View style={styles.infoColumn}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {item.estimatedDuration}
              </Text>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>
                Time
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.ignoreBtn, { borderColor: theme.border }]}
              onPress={() => ignoreRequest(item.id)}
              disabled={loading}
            >
              <Text style={[styles.ignoreText, { color: theme.muted }]}>
                Ignore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptBtn,
                { backgroundColor: theme.success },
                loading && styles.acceptBtnDisabled,
              ]}
              onPress={() => handleAcceptService(item)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.acceptText}>Accept Delivery</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Unified render function
  const renderServiceCard = ({
    item,
    index,
  }: {
    item: ServiceRequest;
    index: number;
  }) => {
    if (item.type === "ride") {
      return renderRideCard(item);
    } else {
      return renderDeliveryCard(item);
    }
  };

  const mapLocations = getMapLocations();
  const currentRequest =
    filteredRequests.length > 0 ? filteredRequests[currentIndex] : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.card }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconWrapper, { backgroundColor: theme.card }]}
            onPress={() => router.push("/(rider)/requestedRide")}
          >
            <Ionicons name="list-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconWrapper, { backgroundColor: theme.card }]}
            onPress={() => router.push("/(rider)/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconWrapper, { backgroundColor: theme.card }]}
            onPress={() => router.push("/(rider)/riderProfileSettings")}
          >
            <Image
              source={
                profilePic
                  ? { uri: profilePic }
                  : require("../../assets/images/defaultUserImg2.png")
              }
              style={styles.profilePic}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Map - Takes full screen */}
      <View style={styles.mapContainer}>
        {!location || !mounted ? (
          <Loader msg="Loading map..." />
        ) : (
          <MapViewComponent
            pickupLocation={mapLocations.pickupLocation}
            destinationLocation={mapLocations.destinationLocation}
            showRoute={mapLocations.showRoute}
            key={`map-${mapLocations.showRoute}`}
          />
        )}
      </View>
      {/* NEW: Status Panel from first code */}
      <View style={[styles.statusPanel, { backgroundColor: theme.card }]}>
        <ServiceToggle />

        <TouchableOpacity
          style={[
            styles.statusToggle,
            {
              backgroundColor:
                status === "online" ? theme.danger : theme.success,
              opacity: updatingStatus ? 0.7 : 1,
            },
          ]}
          onPress={() =>
            updateRiderStatus(status === "online" ? "offline" : "online")
          }
          disabled={updatingStatus}
        >
          {updatingStatus ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={
                  status === "online" ? "radio-button-on" : "radio-button-off"
                }
                size={20}
                color="#fff"
              />
              <Text style={styles.statusToggleText}>
                {status === "online" ? "Go Offline" : "Go Online"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {/* Show Only Latest Request (Single Card) */}
      {status === "online" && filteredRequests.length > 0 && (
        <View
          style={[
            styles.singleRequestContainer,
            { backgroundColor: theme.card },
          ]}
        >
          {/* Show the most recent request (first in array) */}
          {renderServiceCard({ item: filteredRequests[0], index: 0 })}
        </View>
      )}
      {/* Add a test button to your RiderHomeScreen (temporarily): */}
      {/* <TouchableOpacity
        style={[styles.testButton, { backgroundColor: theme.primary }]}
        onPress={testIncomingCall}
      >
        <Text style={[styles.testButtonText, { color: theme.primaryText }]}>
          Test Incoming Call
        </Text>
      </TouchableOpacity> */}
      {/* No Requests Available Messages */}
      {status === "online" &&
        filteredRequests.length === 0 &&
        serviceRequests.length > 0 && (
          <View
            style={[styles.noRidesContainer, { backgroundColor: theme.card }]}
          >
            <Ionicons name="pin-outline" size={48} color={theme.muted} />
            <Text style={[styles.noRidesText, { color: theme.text }]}>
              No nearby {activeService} available
            </Text>
            <Text style={[styles.noRidesSubtext, { color: theme.muted }]}>
              {serviceRequests.length} requests available but outside your{" "}
              {MAX_DISTANCE_KM}km radius
            </Text>
          </View>
        )}
      {status === "online" && serviceRequests.length === 0 && (
        <View
          style={[styles.noRidesContainer, { backgroundColor: theme.card }]}
        >
          <Ionicons name="car-outline" size={48} color={theme.muted} />
          <Text style={[styles.noRidesText, { color: theme.text }]}>
            No service requests available
          </Text>
          <Text style={[styles.noRidesSubtext, { color: theme.muted }]}>
            Ride and delivery requests will appear here when available
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  mapContainer: {
    flex: 1,
  },
  // NEW: Status Panel Styles from first code
  statusPanel: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceToggle: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 2,
  },
  serviceOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  serviceOptionActive: {
    // backgroundColor applied dynamically
  },
  serviceOptionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusToggle: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    minWidth: 120,
    justifyContent: "center",
  },
  statusToggleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  floatingCardsContainer: {
    position: "absolute",
    top: "62%",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  hideButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  peekIndicator: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  peekText: {
    fontSize: 14,
    fontWeight: "600",
  },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: "700",
  },
  packageDescription: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
  },
  // Carousel Styles
  carouselContainer: {
    marginTop: 8,
    height: 500,
  },
  carouselNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  carouselCounter: {
    fontSize: 14,
    fontWeight: "600",
  },
  carouselContent: {
    paddingHorizontal: CARD_MARGIN,
  },
  rideCard: {
    marginHorizontal: CARD_MARGIN,
    padding: 16,
    borderRadius: 16,
    maxHeight: 500,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.01,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  passengerRating: {
    fontSize: 12,
  },
  rideInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoColumn: {
    alignItems: "center",
    flex: 1,
  },
  fareColumn: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#f0f0f0",
    borderRightColor: "#f0f0f0",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 2,
  },
  fareValue: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  locationSection: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
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
    fontSize: 12,
    flexWrap: "wrap",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  ignoreBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  ignoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptBtnDisabled: {
    opacity: 0.7,
  },
  acceptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noRidesContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
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
        elevation: 8,
      },
    }),
  },
  noRidesText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  noRidesSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  cardScrollView: {
    maxHeight: 300,
    marginBottom: 8,
  },

  // Add to your styles
  testButton: {
    position: "absolute",
    top: 200,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  singleRequestContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    maxHeight: 400,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
