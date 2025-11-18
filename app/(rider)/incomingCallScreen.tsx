// app/(rider)/incoming-call.tsx
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { auth, db } from "@/lib/firebaseConfig";
import { addNotification } from "@/services/notifications";
import { acceptRide, updateRiderLocation } from "@/services/rides";
// import { hasIgnoredRide } from "@/services/ridesCallService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

type RideRequest = {
  id: string;
  riderId: string;
  passengerPhoto: string;
  passengerName: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare?: number;
  estimatedDuration?: string;
  estimatedDistance?: string;
  requestType: string;
};

// 🆕 helper functions for ignoring
const markRideAsIgnored = async (rideId: string) => {
  try {
    const ignored = JSON.parse(await AsyncStorage.getItem("ignoredRides") || "[]");
    if (!ignored.includes(rideId)) {
      ignored.push(rideId);
      await AsyncStorage.setItem("ignoredRides", JSON.stringify(ignored));
    }
  } catch (error) {
    console.error("Error saving ignored ride:", error);
  }
};

const hasIgnoredRide = async (rideId: string): Promise<boolean> => {
  try {
    const ignored = JSON.parse(await AsyncStorage.getItem("ignoredRides") || "[]");
    return ignored.includes(rideId);
  } catch (error) {
    console.error("Error checking ignored ride:", error);
    return false;
  }
};

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { location } = useCurrentLocation();

  const request: RideRequest = {
    id: params.id as string,
    riderId: params.riderId as string,
    passengerPhoto: params.passengerPhoto as string,
    passengerName: params.passengerName as string,
    pickupAddress: params.pickupAddress as string,
    destinationAddress: params.destinationAddress as string,
    estimatedFare: params.estimatedFare ? parseFloat(params.estimatedFare as string) : undefined,
    estimatedDuration: params.estimatedDuration as string,
    estimatedDistance: params.estimatedDistance as string,
    requestType: params.requestType as string,
  };

  const [sound, setSound] = useState<Audio.Sound>();
  const [timeLeft, setTimeLeft] = useState(30);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkIfIgnoredAndStart = async () => {
      if (!request.id) {
        router.dismiss();
        return;
      }

      const ignored = await hasIgnoredRide(request.id);
      if (ignored) {
        console.log("⏭ Request previously ignored, skipping ringtone...");
        router.back();
        return;
      }

      // Not ignored → ring and vibrate
      startRinging();
      startVibration();
      startPulseAnimation();
      // startTimer();
    };

    checkIfIgnoredAndStart();

    return () => {
      stopRinging();
      stopVibration();
    };
  }, []);


  console.log("🎯 Parsed request:", request);

  // const [sound, setSound] = useState<Audio.Sound>();
  // const [timeLeft, setTimeLeft] = useState(30);
  // const scaleAnim = useRef(new Animated.Value(1)).current;
  // const pulseAnim = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   if (!request.id) {
  //     router.dismiss(); // Close if no valid request
  //     return;
  //   }

  //   startRinging();
  //   startVibration();
  //   startPulseAnimation();
  //   startTimer();

  //   const timer = setInterval(() => {
  //     setTimeLeft((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(timer);
  //         handleAutoReject();
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => {
  //     console.log("🧹 Cleaning up incoming call...");
  //     stopRinging();
  //     stopVibration();
  //   };
  // }, []);

  const startRinging = async () => {
    try {
      const { sound: ringtone } = await Audio.Sound.createAsync(
        require("@/assets/sounds/incoming_call.mp3"),
        { shouldPlay: true, isLooping: true }
      );
      setSound(ringtone);
    } catch (error) {
      console.log("Error playing ringtone:", error);
    }
  };

  const stopRinging = async () => {
    console.log("🔇 Stopping ringtone...");
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(undefined); // 🆕 Clear the sound reference
      }
    } catch (error) {
      console.log("Error stopping ringtone:", error);
    } finally {
      setSound(undefined);
    }
  };

  const startVibration = () => {
    if (Platform.OS === "android") {
      Vibration.vibrate([1000, 1000], true);
    }
  };

  const stopVibration = () => {
    Vibration.cancel();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  // const startTimer = () => {
  //   const timer = setInterval(() => {
  //     setTimeLeft((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(timer);
  //         handleAutoReject();
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // };

  // const handleAutoReject = async () => {
  //   await stopRinging();
  //   stopVibration();

  //   // 🆕 Mark as ignored locally instead of updating Firestore
  //   await markRideAsIgnored(request.id);


  //   const targetCollection =
  //     request.requestType === "delivery" ? "deliveries" : "rides";

  //   // try {
  //   //   const riderId = auth.currentUser?.uid;
  //   //   if (!riderId) throw new Error("No rider logged in");

  //   //   await setDoc(
  //   //     doc(db, `${targetCollection}/${request.id}/responses/${riderId}`),
  //   //     {
  //   //       riderId,
  //   //       status: "ignored",
  //   //       timestamp: serverTimestamp(),
  //   //       reason: "timeout",
  //   //     }
  //   //   );
  //   // } catch (error) {
  //   //   console.error("Error auto-rejecting request:", error);
  //   // } finally {
  //   //   router.dismissTo("/(rider)/riderHome");
  //   // }
  //     router.dismissTo("/(rider)/riderHome");
  // };

  

  const handleAccept = async () => {
    console.log("✅ Accepting request...", request.id, request.requestType);

    await stopRinging();
    stopVibration();

    try {
      const riderId = auth.currentUser?.uid;
      if (!riderId) {
        throw new Error("No rider logged in");
      }

      if (request.requestType === "ride") {
        console.log("🚗 Accepting ride...");
        await acceptRide(request.id);
        await setDoc(doc(db, `rides/${request.id}/responses/${riderId}`), {
          riderId,
          status: "accepted",
          timestamp: serverTimestamp(),
        });

        if (location) {
          await updateRiderLocation(
            request.id,
            location.coords.latitude,
            location.coords.longitude
          );
        }

        await addNotification(
          riderId, // ✅ Use current user's ID, not from params
          "ride_accepted",
          "Ride Accepted ✅",
          "You are now assigned to a passenger",
          request.id // ✅ Use request.id, not params.id
        );

        Alert.alert("Ride Accepted", "You'e accepted the ride request! 🚗");

        // ✅ Dismiss modal first, then navigate
        router.dismiss();
        router.replace({
          pathname: "/(rider)/riderRideProgress",
          params: { rideId: request.id },
        });
      } else if (request.requestType === "delivery") {
        console.log("📦 Accepting delivery...");
        await updateDoc(doc(db, "deliveries", request.id), {
          status: "accepted",
          riderId: riderId, // ✅ Use current user's ID
          acceptedAt: serverTimestamp(),
        });
        await setDoc(doc(db, `deliveries/${request.id}/responses/${riderId}`), {
          riderId,
          status: "accepted",
          timestamp: serverTimestamp(),
        });

        await addNotification(
          riderId, // ✅ Use current user's ID
          "delivery_accepted",
          "Delivery Accepted ✅",
          "You are now assigned to a delivery",
          request.id // ✅ Use request.id
        );

        Alert.alert(
          "Delivery Accepted",
          "You've accepted the delivery request! 📦"
        );

        // ✅ Dismiss modal first, then navigate
        router.dismiss();
        router.replace({
          pathname: "/(rider)/deliveryProgress",
          params: { deliveryId: request.id },
        });

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        throw new Error("Unknown request type");
      }
    } catch (error: any) {
      console.error("Error accepting service:", error);
      Alert.alert("Error", error.message || "Failed to accept request");

      // ✅ Still dismiss on error to avoid stuck modal
      router.dismissTo("/(rider)/riderHome");
    }
  };

  const handleReject = async () => {
    await stopRinging();
    stopVibration();

    await markRideAsIgnored(request.id);

    // try {
    //   const riderId = auth.currentUser?.uid;
    //   if (!riderId) throw new Error("No rider logged in");

    //   const targetCollection =
    //     request.requestType === "delivery" ? "deliveries" : "rides";
    //   // Store this rider’s rejection under the rideResponses subcollection
    //   await setDoc(
    //     doc(db, `${targetCollection}/${request.id}/responses/${riderId}`),
    //     {
    //       riderId,
    //       status: "rejected",
    //       timestamp: serverTimestamp(),
    //       reason: "manual",
    //     }
    //   );

    //   await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // } catch (error) {
    //   console.error("Error rejecting ride:", error);
    // } finally {
    //   router.dismissTo("/(rider)/riderHome");
    // }
      router.dismissTo("/(rider)/riderHome");
  };

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background with pulse effect */}
      <Animated.View
        style={[
          styles.pulseBackground,
          {
            opacity: pulseOpacity,
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.5],
                }),
              },
            ],
          },
        ]}
      />

      <View style={styles.content}>
        <Text style={styles.title}>
          {request.requestType === "ride"
            ? "Incoming Ride Request"
            : "Incoming Delivery Request"}
        </Text>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={{
              uri: request.passengerPhoto || "https://via.placeholder.com/100",
            }}
            style={styles.avatar}
            defaultSource={require("@/assets/images/defaultUserImg.png")}
          />
        </Animated.View>

        <Text style={styles.name}>{request.passengerName}</Text>
        <Text style={styles.subtitle}>
          {request.requestType === "ride"
            ? "is requesting a ride"
            : "is requesting a delivery"}
        </Text>

        <View style={styles.rideInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={2}>
              {request.pickupAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={2}>
              {request.destinationAddress}
            </Text>
          </View>

          {request.estimatedFare && (
            <View style={styles.fareContainer}>
              <Text style={styles.fareText}>
                GHC {request.estimatedFare.toFixed(2)}
              </Text>
              <Text style={styles.fareLabel}>Estimated Fare</Text>
            </View>
          )}
        </View>

        <Text style={styles.timer}>{timeLeft}s</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={handleReject}
          >
            <View style={styles.btnInner}>
              <Ionicons name="close" size={32} color="#fff" />
            </View>
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={handleAccept}
          >
            <View style={styles.btnInner}>
              <Ionicons name="checkmark" size={32} color="#fff" />
            </View>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1117",
  },
  pulseBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#7500fc",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#7500fc",
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 30,
  },
  rideInfo: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  fareContainer: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  fareText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  fareLabel: {
    color: "#ccc",
    fontSize: 12,
  },
  timer: {
    color: "#ff6b6b",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 40,
  },
  buttons: {
    flexDirection: "row",
    gap: 40,
  },
  btn: {
    alignItems: "center",
  },
  btnInner: {
    width: 70,
    // height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: 8,
  },
  acceptBtn: {
    borderRadius: 15,
    backgroundColor: "#22c55e",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    // gap: 8,
  },
  rejectBtn: {
    borderRadius: 15,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    // gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
