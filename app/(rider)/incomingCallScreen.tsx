// /screens/IncomingCallScreen.tsx
import { db } from "@/lib/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

type RideRequest = {
  riderId: string;
  passengerPhoto: string;
  passengerName: string;
  pickupAddress: string;
  destinationAddress: string;
};

type RootStackParamList = {
  IncomingCallScreen: { request: RideRequest };
  RideInProgressScreen: { request: RideRequest };
};

type IncomingCallScreenProps = {
  route: RouteProp<RootStackParamList, "IncomingCallScreen">;
  navigation: StackNavigationProp<RootStackParamList, "IncomingCallScreen">;
};

export default function IncomingCallScreen({ route, navigation }: IncomingCallScreenProps) {
  const { request } = route.params;

  const handleAccept = async () => {
    await updateDoc(doc(db, "rideRequests", request.riderId), {
      status: "accepted",
    });
    navigation.replace("RideInProgressScreen", { request });
  };

  const handleReject = async () => {
    await updateDoc(doc(db, "rideRequests", request.riderId), {
      status: "rejected",
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incoming Ride Request</Text>
      <Image
        source={{ uri: request.passengerPhoto }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{request.passengerName}</Text>
      <Text style={styles.location}>
        {request.pickupAddress} → {request.destinationAddress}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.reject]} onPress={handleReject}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.accept]} onPress={handleAccept}>
          <Ionicons name="checkmark" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D1117" },
  title: { color: "#fff", fontSize: 20, marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  name: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 8 },
  location: { color: "#ccc", textAlign: "center", paddingHorizontal: 20 },
  buttons: { flexDirection: "row", marginTop: 40, gap: 40 },
  btn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  accept: { backgroundColor: "green" },
  reject: { backgroundColor: "red" },
});
