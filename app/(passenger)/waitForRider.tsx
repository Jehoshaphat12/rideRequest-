import { db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function waitForRide({ rideId }: { rideId: string }) {
  const router = useRouter();
  const [ride, setRide] = useState<any | null>(null);
  const [rider, setRider] = useState<any | null>(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rides", rideId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRide(data);
        setStatus(data.status);

        // Fetch rider details if assigned
        if (data.riderId) {
          const riderSnap = await getDoc(doc(db, "riders", data.riderId));
          if (riderSnap.exists()) {
            setRider(riderSnap.data());
          }
        }
      }
    });

    return () => unsub();
  }, [rideId]);

  const cancelRide = async () => {
    await updateDoc(doc(db, "rides", rideId), { status: "cancelled" });
    router.replace("/passengerScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={{ fontSize: 28, color: "#555" }}>🗺 Map Loading...</Text>
      </View>

      {/* PENDING STATE */}
      {status === "pending" && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#7500fc" />
          <Text style={styles.title}>Looking for a Rider...</Text>

          {/* Ride Details */}
          <View style={styles.details}>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Pickup:</Text>
              <Text style={styles.value}>
                {ride.pickup.address ?? "Loading..."}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="flag-outline" size={20} color="#7500fc" />
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.value}>
                {ride.dropoff.address ?? "Loading..."}
              </Text>
            </View>
          </View>

          {/* Cancel Ride Button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelRide}>
            <Text style={styles.cancelText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ACCEPTED STATE */}
      {status === "accepted" && (
        <View style={styles.card}>
          {/* Driver Row */}
          <View style={styles.driverRow}>
            <Image
              source={{
                uri:
                  rider?.profilePicture ??
                  "https://via.placeholder.com/150/cccccc/ffffff?text=Driver",
              }}
              style={styles.driverPic}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.driverName}>
                {rider?.name ?? "Unknown Driver"}
              </Text>
              <Text style={styles.driverRating}>
                ⭐ {rider?.rating ?? "4.5"} ({rider?.ridesCompleted ?? "0"} rides)
              </Text>
            </View>
            <TouchableOpacity onPress={() => alert("Call Driver")}>
              <Ionicons name="call-outline" size={28} color="#7500fc" />
            </TouchableOpacity>
          </View>

          {/* Vehicle Info */}
          <View style={styles.row}>
            <Ionicons name="car-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Vehicle:</Text>
            <Text style={styles.value}>
              {rider?.vehicle?.model ?? "Unknown"} (
              {rider?.vehicle?.color ?? "N/A"})
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="pricetag-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Plate:</Text>
            <Text style={styles.value}>
              {rider?.vehicle?.plateNumber ?? "Not Available"}
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>ETA:</Text>
            <Text style={styles.value}>5 mins</Text>
          </View>

          

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelRide}>
            <Text style={styles.cancelText}>Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 12,
  },
  details: {
    width: "100%",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 16,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverPic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
  },
  driverRating: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  value: {
    fontSize: 16,
    color: "#444",
    flexShrink: 1,
  },
  cancelBtn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7500fc",
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    color: "#7500fc",
    fontSize: 16,
    fontWeight: "600",
  },
});
