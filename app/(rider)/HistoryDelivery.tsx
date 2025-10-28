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
const DELIVERY_EXPIRY_TIME = 30 * 60 * 1000;

type Delivery = {
  id: string;
  pickup: any;
  dropoff: any;
  status: string;
  createdAt: any;
  estimatedFare?: number;
  packageDetails?: {
    size?: string;
    description?: string;
    fragile?: boolean;
    weight?: number;
  };
  dropoffContact?: {
    name?: string;
    phone?: string;
  };
  urgent?: boolean;
};

export default function DeliveryHistoryScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme, darkMode } = useTheme();

  useEffect(() => {
    const riderId = auth.currentUser?.uid;
    if (!riderId) {
      setError("User not logged in");
      setLoading(false);
      return;
    }


    const q = query(
      collection(db, "deliveries"),
      where("riderId", "==", riderId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const fetchedDeliveries: Delivery[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              pickup: data.pickup,
              dropoff: data.dropoff,
              status: data.status,
              createdAt: data.createdAt,
              estimatedFare: data.estimatedFare,
              packageDetails: data.packageDetails,
              dropoffContact: data.dropoff?.contact,
              urgent: data.urgent,
            };
          });

          setDeliveries(fetchedDeliveries);
          setError(null);
        } catch (err) {
          console.error("Error processing deliveries:", err);
          setError("Error loading deliveries");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
        setError("Failed to load delivery history");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isDeliveryExpired = (delivery: Delivery): boolean => {
    if (!delivery.createdAt) return false;

    // Only check pending/accepted deliveries for expiry
    if (
      delivery.status !== "pending" &&
      delivery.status !== "accepted"
    ) {
      return false;
    }

    const deliveryTime = delivery.createdAt.toDate().getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - deliveryTime;

    return timeDifference > DELIVERY_EXPIRY_TIME;
  };

  const getTimeSinceCreation = (delivery: Delivery): string => {
    if (!delivery.createdAt) return "Unknown time";

    const deliveryTime = delivery.createdAt.toDate().getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - deliveryTime;
    const minutes = Math.floor(timeDifference / (1000 * 60));

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  };

  const handleDeliveryPress = (delivery: Delivery) => {
    if (isDeliveryExpired(delivery)) {
      Alert.alert(
        "Delivery Expired",
        "This delivery request has expired (more than 30 minutes old).",
        [{ text: "OK" }]
      );
      return;
    }

    // Navigate based on delivery status
    if (delivery.status === "pending") {
      Alert.alert(
        "Delivery Request",
        `You have a pending delivery request from ${
          delivery.pickup?.address || "pickup location"
        } to ${delivery.dropoff?.address || "delivery location"}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View Details",
            onPress: () => {
              router.push({
                pathname: "/(rider)/deliveryProgress",
                params: { deliveryId: delivery.id },
              });
            },
          },
        ]
      );
    } else if (delivery.status === "accepted") {
      router.push({
        pathname: "/(rider)/deliveryProgress",
        params: { deliveryId: delivery.id },
      });
    } else if (delivery.status === "picked_up") {
      router.push({
        pathname: "/(rider)/deliveryProgress",
        params: { deliveryId: delivery.id },
      });
    } else if (delivery.status === "completed") {
      router.push({
        pathname: "/(rider)/deliveryCompleted",
        params: { deliveryId: delivery.id },
      });
    } else if (delivery.status === "cancelled") {
      Alert.alert(
        "Delivery Cancelled",
        "This delivery was cancelled.",
        [{ text: "OK" }]
      );
    }
  };

  const getStatusColor = (delivery: Delivery) => {
    if (isDeliveryExpired(delivery)) return theme.danger;

    switch (delivery.status) {
      case "completed":
        return theme.success;
      case "accepted":
        return theme.primary;
      case "picked_up":
        return theme.warning;
      case "pending":
        return theme.warning;
      case "cancelled":
        return theme.danger;
      default:
        return theme.muted;
    }
  };

  const getStatusText = (delivery: Delivery) => {
    if (isDeliveryExpired(delivery)) return "EXPIRED";
    
    switch (delivery.status) {
      case "picked_up":
        return "IN TRANSIT";
      default:
        return delivery.status.toUpperCase();
    }
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

  const getPackageSizeIcon = (size?: string) => {
    switch (size) {
      case "small":
        return "cube-outline";
      case "medium":
        return "cube";
      case "large":
        return "cube-sharp";
      default:
        return "cube-outline";
    }
  };

  const renderDelivery = ({ item }: { item: Delivery }) => {
    const expired = isDeliveryExpired(item);
    const timeAgo = getTimeSinceCreation(item);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.card },
          expired && styles.expiredCard,
        ]}
        onPress={() => handleDeliveryPress(item)}
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

        {/* Recipient Info */}
        {item.dropoffContact?.name && (
          <View style={styles.recipientRow}>
            <Ionicons name="person-outline" size={16} color={theme.primary} />
            <Text style={[styles.recipientText, { color: theme.text }]}>
              Deliver to: {item.dropoffContact.name}
            </Text>
            {item.urgent && (
              <View style={[styles.urgentBadge, { backgroundColor: theme.warning }]}>
                <Ionicons name="flash" size={12} color={theme.primaryText} />
                <Text style={[styles.urgentText, { color: theme.primaryText }]}>
                  URGENT
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Package Details */}
        {item.packageDetails && (
          <View style={styles.packageRow}>
            <Ionicons 
              name={getPackageSizeIcon(item.packageDetails.size)} 
              size={16} 
              color={theme.primary} 
            />
            <Text style={[styles.packageText, { color: theme.text }]}>
              {item.packageDetails.size ? `${item.packageDetails.size.charAt(0).toUpperCase() + item.packageDetails.size.slice(1)} package` : "Package"}
              {item.packageDetails.fragile && " • Fragile"}
              {item.packageDetails.weight && ` • ${item.packageDetails.weight}kg`}
            </Text>
          </View>
        )}

        {/* Locations */}
        <View style={styles.locationSection}>
          <View style={styles.row}>
            <Ionicons name="business-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.label, { color: theme.text }]}
              numberOfLines={2}
            >
              {getAddressText(item.pickup)}
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="home-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.label, { color: theme.text }]}
              numberOfLines={2}
            >
              {getAddressText(item.dropoff)}
            </Text>
          </View>
        </View>

        {/* Package Description */}
        {item.packageDetails?.description && (
          <View style={styles.descriptionRow}>
            <Text style={[styles.descriptionText, { color: theme.muted }]}>
              📝 {item.packageDetails.description}
            </Text>
          </View>
        )}

        {/* Fare and Date */}
        <View style={styles.footerRow}>
          <Text style={[styles.fare, { color: theme.text }]}>
            {formatFare(item.estimatedFare || 0)}
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
              This delivery request has expired
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
            Delivery History
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading your deliveries...
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
            Delivery History
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
          Delivery History ({deliveries.length})
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Your Deliveries</Text>

        {deliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              No delivery history yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.muted }]}>
              Your completed deliveries will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={deliveries}
            keyExtractor={(item) => item.id}
            renderItem={renderDelivery}
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
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  recipientText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: "700",
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  packageText: {
    fontSize: 14,
    flex: 1,
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
  descriptionRow: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 6,
  },
  descriptionText: {
    fontSize: 12,
    fontStyle: "italic",
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