import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function rideRequestCard() {
  return (
    <>
      {/* Ride Request Card */}
      <View style={styles.requestCard}>
        {/* Passenger Info */}
        <View style={styles.passengerRow}>
          <Image
            source={require("../../assets/images/user.jpg")}
            style={styles.profilePic}
          />
          <View>
            <Text style={styles.passengerName}>Passenger Name</Text>
            <Text style={styles.passengerRating}>⭐ 4.8</Text>
          </View>
        </View>

        {/* Pickup */}
        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color="#7500fc" />
          <Text style={styles.label}>Pickup:</Text>
          <Text style={styles.value}>Accra Mall</Text>
        </View>

        {/* Destination */}
        <View style={styles.row}>
          <Ionicons name="flag-outline" size={20} color="#7500fc" />
          <Text style={styles.label}>Destination:</Text>
          <Text style={styles.value}>Kwame Nkrumah Circle</Text>
        </View>

        {/* Fare */}
        <View style={styles.row}>
          <Ionicons name="cash-outline" size={20} color="#7500fc" />
          <Text style={styles.label}>Fare:</Text>
          <Text style={styles.value}>GHS 45.00</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#28a745" }]}
          >
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#ff3b30" }]}
          >
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  
  requestCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  passengerRating: {
    fontSize: 14,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 4,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: "#444",
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  btn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

