import { auth, db } from "@/lib/firebaseConfig";
import admin from "firebase-admin";
import * as functions from "firebase-functions";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { sendPushNotification } from "./sendPushNotification";

admin.initializeApp();

type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
}

interface RideRequestData {
  pickup: LocationPoint;
  dropoff: LocationPoint;
  passengerId: string;
  estimatedFare?: number;
  estimatedDistance?: string;
  estimatedDuration?: string;
  paymentMethod?: string;
}

export async function requestRide(rideData: RideRequestData) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  try {
    // Get passenger details from firestore "users" collection
    const passengerDoc = await getDoc(doc(db, "users", user.uid));
    const passengerData = passengerDoc.exists() ? passengerDoc.data() : null;

    const rideRef = await addDoc(collection(db, "rides"), {
      // Basic ride info
      passengerId: user.uid,
      pickup: rideData.pickup,
      dropoff: rideData.dropoff,
      status: "pending",
      
      // Passenger information
      passengerInfo: {
        name: passengerData?.name || "Passenger",
        profilePicture: passengerData?.profilePicture || null,
        phone: passengerData?.phone || null,
        rating: passengerData?.rating || 0,
        totalRides: passengerData?.totalRides || 0,
      },
      
      // Ride details and pricing
      estimatedFare: rideData.estimatedFare || null,
      estimatedDistance: rideData.estimatedDistance || null,
      estimatedDuration: rideData.estimatedDuration || null,
      finalFare: null, // Will be set when ride is completed
      paymentMethod: rideData.paymentMethod || "cash", // Default to cash
      
      // Rider info (will be populated when ride is accepted)
      riderId: null,
      riderInfo: null,
      
      // Timestamps
      createdAt: serverTimestamp(),
      acceptedAt: null,
      pickedUpAt: null,
      completedAt: null,
      
      // Location tracking
      riderLocation: null,
      currentLocation: null,
      
      // Additional fields for better ride management
      routePolyline: null, // You can store the encoded polyline here if needed
      cancellationReason: null,
      cancelledBy: null,
      cancelledAt: null,
      
      // Ratings and feedback
      passengerRating: null,
      passengerFeedback: null,
      riderRating: null,
      riderFeedback: null,
    });

    return rideRef.id;
    
  } catch (error) {
    console.error("Error creating ride request:", error);
    throw new Error("Failed to request ride. Please try again.");
  }
}

// Keep your existing functions but update acceptRide for better data structure
export async function acceptRide(rideId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  try {
    // Get rider details from firestore "users" collection
    const riderDoc = await getDoc(doc(db, "users", user.uid));
    if (!riderDoc.exists()) throw new Error("Rider profile not found");

    const riderData = riderDoc.data();

    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, {
      status: "accepted",
      riderId: user.uid,
      riderInfo: {
        userName: riderData?.userName || "Rider",
        profilePicture: riderData?.profilePicture || null,
        phone: riderData?.phone || null,
        rating: riderData?.rating || 0,
        totalRides: riderData?.totalRides || 0,
        vehicle: {
          model: riderData?.vehicleModel || "",
          plateNumber: riderData?.vehiclePlate || "",
          color: riderData?.vehicleColor || "",
          type: riderData?.vehicleType || "car",
        },
      },
      acceptedAt: serverTimestamp(),
    });

    
  } catch (error) {
    console.error("Error accepting ride:", error);
    throw new Error("Failed to accept ride. Please try again.");
  }
}

// Enhanced updateRiderLocation function
export async function updateRiderLocation(rideId: string, lat: number, lng: number) {
  try {
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, {
      riderLocation: {
        lat, 
        lng,
        updatedAt: serverTimestamp()
      }
    });
  } catch (error) {
    console.error("Error updating rider location:", error);
    throw new Error("Failed to update location.");
  }
}

// New function to update ride status
export async function updateRideStatus(rideId: string, status: string, additionalData?: any) {
  try {
    const rideRef = doc(db, "rides", rideId);
    const updateData: any = {
      status: status,
    };

    // Add timestamp based on status
    switch (status) {
      case "accepted":
        updateData.acceptedAt = serverTimestamp();
        break;
      case "arrived":
      case "picked_up":
        updateData.pickedUpAt = serverTimestamp();
        break;
      case "completed":
        updateData.completedAt = serverTimestamp();
        if (additionalData?.finalFare) {
          updateData.finalFare = additionalData.finalFare;
        }
        break;
      case "cancelled":
        updateData.cancelledAt = serverTimestamp();
        if (additionalData?.cancelledBy) {
          updateData.cancelledBy = additionalData.cancelledBy;
        }
        if (additionalData?.cancellationReason) {
          updateData.cancellationReason = additionalData.cancellationReason;
        }
        break;
    }

    // Add any additional data
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (key !== 'cancelledBy' && key !== 'cancellationReason' && key !== 'finalFare') {
          updateData[key] = additionalData[key];
        }
      });
    }

    await updateDoc(rideRef, updateData);
    
  } catch (error) {
    console.error("Error updating ride status:", error);
    throw new Error(`Failed to update ride status to ${status}`);
  }
}

// Function to complete ride with final fare
export async function completeRide(rideId: string, finalFare: number) {
  try {
    await updateRideStatus(rideId, "completed", { finalFare });
  } catch (error) {
    console.error("Error completing ride:", error);
    throw new Error("Failed to complete ride.");
  }
}

// Function to cancel ride
export async function cancelRide(rideId: string, cancelledBy: string, reason?: string) {
  try {
    await updateRideStatus(rideId, "cancelled", {
      cancelledBy,
      cancellationReason: reason || "No reason provided"
    });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    throw new Error("Failed to cancel ride.");
  }
}



export const notifyRidersOnNewRequest = functions.firestore
  .document("rides/{rideId}")
  .onCreate(async (snap) => {
    const ride = snap.data();
    if (!ride) return;

    const ridersSnap = await admin.firestore().collection("users").where("role", "==", "rider").get();

    for (const doc of ridersSnap.docs) {
      const rider = doc.data();
      if (rider.expoPushToken) {
        await sendPushNotification(
          rider.expoPushToken,
          "🚖 New Ride Request",
          "A passenger nearby needs a ride!",
          { rideId: snap.id }
        );
      }
    }
  });