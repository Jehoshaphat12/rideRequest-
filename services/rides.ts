import { auth, db } from "@/lib/firebaseConfig";
// import admin from "firebase-admin";
import {
  addDoc,
  // collection,
  collection as collectionRef,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from "geofire-common";
import { addNotification } from "./notifications";
import { sendPushNotification } from "./NotificationService";
// admin.initializeApp();

type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
};

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

    const rideRef = await addDoc(collectionRef(db, "rides"), {
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

    const pickupLat = rideData.pickup?.lat ?? rideData.pickup?.lat;
    const pickupLng = rideData.pickup?.lng ?? rideData.pickup?.lng;

   
    notifyNearbyRiders(pickupLat, pickupLng, rideRef.id)
        .then((result) => {
          console.log("notifyNearbyRiders result: ", result);
        })
        .catch((error) => {
          console.error("Error notifying nearby riders: ", error);
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

/**
 * Find riders within radius (km) of a center point.
 * Returns array of rider docs { id, data } where data includes coords, expoPushToken, isOnline, isAvailable
 */
export async function getNearbyRiders(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 3
) {
  const center = [centerLat, centerLng];
  const radiusInMeters = radiusKm * 1000;
  const bounds = geohashQueryBounds(center as any, radiusInMeters);

  const promises = bounds.map(([start, end]) => {
    // Note: `users` collection holds riders (role === 'rider') in your project
    // We'll query geohash between start and end and filter client-side by real distance and flags
    const q = query(
      collectionRef(db, "users"),
      where("geohash", ">=", start),
      where("geohash", "<=", end),
      where("role", "==", "rider") // assuming you tag riders with role === 'rider'
    );
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);

  const matchingRiders: Array<{ id: string; data: any; distance: number }> = [];

  for (const snap of snapshots) {
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data?.coords || !data.coords.latitude || !data.coords.longitude)
        return;
      // compute exact distance (meters)
      const distMeters = distanceBetween(center as any, [
        data.coords.latitude,
        data.coords.longitude,
      ]);
      if (distMeters <= radiusInMeters) {
        matchingRiders.push({ id: docSnap.id, data, distance: distMeters });
      }
    });
  }

  // Remove duplicates by id (because multiple bounds queries can return same doc)
  const unique = new Map<string, { id: string; data: any; distance: number }>();
  for (const r of matchingRiders) {
    if (!unique.has(r.id) || unique.get(r.id)!.distance > r.distance) {
      unique.set(r.id, r);
    }
  }

  return Array.from(unique.values());
}

/**
 * Notify nearby riders via your existing addNotification() helper.
 * Only notifies riders that are online and available and have an expoPushToken.
 */
export async function notifyNearbyRiders(
  centerLat: number,
  centerLng: number,
  rideId: string,
  radiusKm: number = 3
) {
  const riders = await getNearbyRiders(centerLat, centerLng, radiusKm);

  let notifiedCount = 0;
  for (const r of riders) {
    const riderData = r.data;
    if (!riderData.isOnline || !riderData.isAvailable) continue;
    if (!riderData.expoPushToken) continue;

    // Send actual push notification
    await sendPushNotification(riderData.expoPushToken, 
      "New Ride Request 🚖",
      "A passenger nearby needs a ride",
      { 
        rideId, 
        screen: "/(rider)/incomingCallScreen" 
      }
    );

    // Add Firestore notification and send push
    await addNotification(
      r.id,
      "ride_request",
      "New Ride Request 🚖",
      "A passenger nearby needs a ride",
      rideId,
      "/(rider)/incomingCallScreen" // screen to navigate to on tap
    );
    notifiedCount++;
  }

  return { notifiedCount, totalFound: riders.length, riders };
}

// Enhanced updateRiderLocation function
export async function updateRiderLocation(
  rideId: string,
  lat: number,
  lng: number
) {
  try {
    // 1) update ride doc (existing)
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, {
      riderLocation: {
        lat,
        lng,
        updatedAt: serverTimestamp(),
      },
    });

    // 2) also update rider's own user doc with coords + geohash + availability
    // Get current rider uid
    const rider = auth.currentUser;
    if (!rider) {
      // no logged-in rider — skip user doc update
      return;
    }

    const riderRef = doc(db, "users", rider.uid);
    const gh = geohashForLocation([lat, lng]);

    await setDoc(
      riderRef,
      {
        coords: { latitude: lat, longitude: lng },
        geohash: gh,
        isOnline: true,
        isAvailable: true,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating rider location:", error);
    throw new Error("Failed to update location.");
  }
}

// New function to update ride status
export async function updateRideStatus(
  rideId: string,
  status: string,
  additionalData?: any
) {
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
      Object.keys(additionalData).forEach((key) => {
        if (
          key !== "cancelledBy" &&
          key !== "cancellationReason" &&
          key !== "finalFare"
        ) {
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
export async function cancelRide(
  rideId: string,
  cancelledBy: string,
  reason?: string
) {
  try {
    await updateRideStatus(rideId, "cancelled", {
      cancelledBy,
      cancellationReason: reason || "No reason provided",
    });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    throw new Error("Failed to cancel ride.");
  }
}

// export const notifyRidersOnNewRequest = functions.firestore
//   .onDocumentCreated('rides/{rideId}', async (event) => {
//     const ride = event.data?.data();
//     if (!ride) return;

//     const ridersSnap = await admin.firestore().collection("users").where("role", "==", "rider").get();

//     for (const doc of ridersSnap.docs) {
//       const rider = doc.data();
//       if (rider.expoPushToken) {
//         await sendPushNotification(
//           rider.expoPushToken,
//           "🚖 New Ride Request",
//           "A passenger nearby needs a ride!",
//           { rideId: ride.id }
//         );
//       }
//     }
//   });
