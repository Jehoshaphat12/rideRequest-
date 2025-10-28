import { db } from "@/lib/firebaseConfig";
import { notifyDriverArrived, notifyRideAccepted, notifyRideCompleted, showNotification } from "@/services/NotificationService";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useRideListener(rideId: string) {
    const [rideData, setRideData] = useState<any>(null)

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "rides", rideId), (docSnap) => {
            if(docSnap.exists()) {
                const newRideData = docSnap.data()
                setRideData(newRideData)

                // Use the new data directly from the snapshot, not the state
                switch(newRideData.status) {
                    case "accepted":
                        notifyRideAccepted()
                        break
                    case "on-trip":
                        notifyDriverArrived()
                        break
                    case "completed":
                        notifyRideCompleted()
                        break
                    default:
                        break
                }
            }
        })

        return () => unsub()
    }, [rideId])

    return rideData
}

export function listenToRideUpdates(rideId: string, role: "passenger" | "rider") {
    const rideRef = doc(db, "rides", rideId)

    return onSnapshot(rideRef, (snap) => {
        if(!snap.exists()) return

        const ride = snap.data()

        if(role === "passenger") {
            if(ride.status === "accepted") {
                showNotification("Ride Accepted 🚖", "A rider is on the way!");
            }
            if (ride.status === "arrived") {
                showNotification("Rider Arrived 📍", "Your driver has arrived at pickup.");
            }
            if (ride.status === "completed") {
                showNotification("Ride Completed ✅", "Thanks for riding with us!");
            }
        }

        if (role === "rider") {
            if (ride.status === "pending") {
                showNotification("New Ride Request 🎉", "A passenger has requested a ride.");
            }
            if (ride.status === "cancelled") {
                showNotification("Ride Cancelled ❌", "The passenger cancelled the ride.");
            }
        }
    })
}