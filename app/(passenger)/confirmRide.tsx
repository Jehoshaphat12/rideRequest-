import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConfirmRideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          paddingHorizontal: 24,
          paddingTop: 64,
          backgroundColor: "#d5caffff",
        }}
      >
        {/* Confirm Ride Image */}
        <Image
          source={require("../../assets/images/confirm.png")}
          style={{width: 200, height: 200, alignSelf: "center", marginBottom: 24}}
          resizeMode="contain"
        />

        <Text style={styles.title}>Confirm Your Ride</Text>

        {/* Ride Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.value}>Accra Mall, Tetteh Quarshie</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="flag-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Destination:</Text>
            <Text style={styles.value}>Kwame Nkrumah Circle</Text>
          </View>

          {/* <View style={styles.row}>
            <Ionicons name="cash-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Estimated Fare:</Text>
            <Text style={styles.value}>GHS 45.00</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="card-outline" size={20} color="#7500fc" />
            <Text style={styles.label}>Payment:</Text>
            <Text style={styles.value}>Cash</Text>
          </View> */}
          {/* Confirm Button */}
        <TouchableOpacity
          style={{...styles.btn, marginTop: 24}}
          onPress={() => router.push("./waitForRide")}
        >
          <Text style={styles.btnText}>Confirm Ride</Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: "#7500fc" }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        </View>

        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 24,
    gap: 12,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#444",
    flexShrink: 1,
  },
  btn: {
    backgroundColor: "#7500fc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  cancelText: {
    textAlign: "center",
    color: "#7500fc",
    fontSize: 18,
    fontWeight: "600",
  },
});
