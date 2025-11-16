import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/lib/firebaseConfig";
import { addNotification } from "@/services/notifications";
import { acceptRide } from "@/services/rides";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../Loader";

export default function IncomingRideScreen() {
  const { theme, darkMode } = useTheme(); // Get theme from context
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for pending rides
    const q = query(collection(db, "rides"), where("status", "==", "pending"));

    const unsub = onSnapshot(q, (snap) => {
      const rides: any[] = [];
      snap.forEach((doc) => rides.push({ id: doc.id, ...doc.data() }));
      setRequests(rides);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAcceptRide = async (rideId: string) => {
    const user = auth.currentUser
    if (!user) return;
    try {
      // const rideRef = doc(db, "rides", rideId);
      // await updateDoc(rideRef, {
      //   status: "accepted",
      //   riderId: auth.currentUser.uid,
      // });
      await acceptRide(rideId);
      await addNotification(
        user.uid,
        "ride_accepted",
        "Ride Accepted ✅",
        "You are now assigned to a passenger",
        rideId
      );

      // Navigate to ride progress screen after accepting
      router.push({
        pathname: "/(rider)/riderRideProgress",
        params: { rideId },
      });
    } catch (err) {
      console.error("Error accepting ride:", err);
    }
  };

  // // Helper function to safely extract address text
  // const getAddressText = (address: any): string => {
  //   if (!address) return "Location not specified";

  //   // If address is a string, return it directly
  //   if (typeof address === 'string') return address;

  //   // If address is an object, try to extract meaningful text
  //   if (typeof address === 'object') {
  //     if (address.address) return address.address;
  //     if (address.formattedAddress) return address.formattedAddress;
  //     if (address.street && address.city) return `${address.street}, ${address.city}`;
  //     if (address.name) return address.name;

  //     // If it's a complex object, stringify it (fallback)
  //     return "Location details available";
  //   }

  //   return "Location not specified";
  // };

  if (loading) {
    return <Loader msg="Request Loading..." />;
  }

  if (requests.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        {/* Header with Back Button */}
        <View
          style={[
            styles.navheader,
            {
              borderBottomColor: theme.border,
              backgroundColor: theme.card,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(rider)/riderHome")}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ride Requests
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color={theme.muted} />
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            No ride requests right now 🚘
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.muted }]}>
            New ride requests will appear here
          </Text>
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

      {/* Header with Back Button */}
      <View
        style={[
          styles.navheader,
          {
            borderBottomColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ride Requests ({requests.length})
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={theme.primary}
              />
              <Text style={[styles.passengerText, { color: theme.text }]}>
                Passenger Request
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.primary}
              />
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

            <View style={styles.detailRow}>
              <Ionicons name="flag-outline" size={20} color={theme.primary} />
              <Text style={[styles.label, { color: theme.muted }]}>
                Destination:
              </Text>
              <Text
                style={[styles.value, { color: theme.text }]}
                numberOfLines={2}
              >
                {item.dropoff.address}
              </Text>
            </View>

            {item.fare && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.muted }]}>
                  Fare:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  GHS{" "}
                  {typeof item.fare === "number"
                    ? item.fare.toFixed(2)
                    : item.fare}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => handleAcceptRide(item.id)}
            >
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>
                Accept Ride
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  navheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
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
    color: "#666",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  passengerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
