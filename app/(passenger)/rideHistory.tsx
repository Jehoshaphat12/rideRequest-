import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 30 minutes in milliseconds
const RIDE_EXPIRY_TIME = 60 * 60 * 1000;

type Ride = {
  id: string;
  pickup: any;
  dropoff: any;
  status: string;
  createdAt: any;
  fare?: number;
  estimatedFare?: number;
  passengerInfo?: {
    name?: string;
    profilePicture?: string;
  };
};

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme, darkMode } = useTheme();

  useEffect(() => {
    const passengerId = auth.currentUser?.uid;
    if (!passengerId) {
      setError("User not logged in");
      setLoading(false);
      return;
    }


    const q = query(
      collection(db, "rides"),
      where("passengerId", "==", passengerId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const fetchRides: Ride[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              pickup: data.pickup,
              dropoff: data.dropoff,
              status: data.status,
              createdAt: data.createdAt,
              fare: data.fare || data.estimatedFare,
              estimatedFare: data.estimatedFare,
              riderId: data.riderInfo,
            };
          });

          setRides(fetchRides);
          setError(null);
        } catch (err) {
          console.error("Error processing rides:", err);
          setError("Error loading rides");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
        setError("Failed to load ride history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isRideExpired = (ride: Ride): boolean => {
    if (!ride.createdAt) return false; // Don't mark completed rides as expired

    // Only check pending/accepted rides for expiry
    if (
      ride.status !== "pending" &&
      ride.status !== "accepted" &&
      ride.status !== "arrived"
    ) {
      return false;
    }

    const rideTime = ride.createdAt.toDate().getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - rideTime;

    return timeDifference > RIDE_EXPIRY_TIME;
  };

  const getTimeSinceCreation = (ride: Ride): string => {
    if (!ride.createdAt) return "Unknown time";

    const rideTime = ride.createdAt.toDate().getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - rideTime;
    const minutes = Math.floor(timeDifference / (1000 * 60));

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  };

  const handleRidePress = (ride: Ride) => {
    if (isRideExpired(ride)) {
      Alert.alert(
        "Ride Expired",
        "This ride request has expired (more than 30 minutes old).",
        [{ text: "OK" }]
      );
      return;
    }

    // Navigate based on ride status
    if (ride.status === "pending") {
      router.push({
        pathname: "/(passenger)/waitForRide",
        params: { rideId: ride.id },
      });
    } else if (ride.status === "accepted") {
      // Navigate to active ride screen
      router.push({
        pathname: "/(passenger)/rideProgress",
        params: { rideId: ride.id },
      });
    } else if (ride.status === "arrived") {
      // Navigate to active ride screen
      router.push({
        pathname: "/(passenger)/rideProgress",
        params: { rideId: ride.id },
      });
    } else if (ride.status === "picked_up") {
      // Navigate to active ride screen
      router.push({
        pathname: "/(passenger)/rideProgress",
        params: { rideId: ride.id },
      });
    } else if (ride.status === "completed") {
      // Navigate to ride completion details
      router.push({
        pathname: "/(passenger)/rideCompleted",
        params: { rideId: ride.id },
      });
    }
  };

  const getStatusColor = (ride: Ride) => {
    if (isRideExpired(ride)) return theme.danger;

    switch (ride.status) {
      case "completed":
        return theme.success;
      case "accepted":
        return theme.primary;
      case "pending":
        return theme.warning;
      case "cancelled":
        return theme.danger;
      default:
        return theme.muted;
    }
  };

  const getStatusText = (ride: Ride) => {
    if (isRideExpired(ride)) return "EXPIRED";
    return ride.status.toUpperCase();
  };

  // Helper function to safely extract address text
  const getAddressText = (address: any): string => {
    if (!address) return "Location not specified";

    if (typeof address === "string") return address;

    if (typeof address === "object") {
      if (address.address) return address.address;
      if (address.formattedAddress) return address.formattedAddress;
      if (address.street && address.city)
        return `${address.street}, ${address.city}`;
      if (address.name) return address.name;

      return "Location details available";
    }

    return "Location not specified";
  };

  // Helper function to format date safely
  const formatDate = (timestamp: any): string => {
    if (!timestamp?.toDate) return "Date not available";

    try {
      return timestamp.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderTrip = ({ item }: { item: Ride }) => {
    const expired = isRideExpired(item);
    const timeAgo = getTimeSinceCreation(item);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card },
          expired && styles.expiredCard,
        ]}
        onPress={() => handleRidePress(item)}
      >
        {/* Status and Time Row */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item) + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
              {getStatusText(item)}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: theme.muted }]}>
            {timeAgo}
          </Text>
        </View>

        {/* Passenger Info (if available) */}
        {item.passengerInfo?.name && (
          <View style={styles.passengerRow}>
            <Ionicons name="person-outline" size={16} color={theme.primary} />
            <Text style={[styles.passengerText, { color: theme.text }]}>
              {item.passengerInfo.name}
            </Text>
          </View>
        )}

        {/* Locations */}
        <View style={styles.locationSection}>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.label, { color: theme.text }]}
              numberOfLines={2}
            >
              {getAddressText(item.pickup)}
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="flag-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.label, { color: theme.text }]}
              numberOfLines={2}
            >
              {getAddressText(item.dropoff)}
            </Text>
          </View>
        </View>

        {/* Fare and Date */}
        <View style={[styles.footerRow, { borderColor: theme.border }]}>
          <Text style={[styles.fare, { color: theme.text }]}>
            {formatFare(item.fare || item.estimatedFare || 0)}
          </Text>
          <Text style={[styles.date, { color: theme.muted }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {/* Expired Message */}
        {expired && (
          <View style={styles.expiredMessage}>
            <Ionicons name="time-outline" size={14} color={theme.danger} />
            <Text style={[styles.expiredText, { color: theme.danger }]}>
              This ride request has expired
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ride History
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading your rides...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ride History
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.danger}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
          >
            <Text
              style={[styles.retryButtonText, { color: theme.primaryText }]}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ride History ({rides.length})
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Your Trips</Text>

        {rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              No ride history yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.muted }]}>
              Your completed rides will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={renderTrip}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 20,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  expiredCard: {
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 12,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  passengerText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  locationSection: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    flexWrap: "wrap",
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  fare: {
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
  },
  expiredMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#ff3b3020",
    gap: 6,
  },
  expiredText: {
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
