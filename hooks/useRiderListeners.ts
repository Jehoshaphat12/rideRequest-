import { db } from "@/lib/firebaseConfig";
import { notifyNewRideRequest, notifyPassengerCancelled } from "@/services/NotificationService";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export function listenForRideRequests(riderId: string) {
  const q = query(
    collection(db, "rides"),
    where("status", "in", ["pending", "cancelled"]) // listen for both
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      const ride = change.doc.data();

      if (change.type === "added" && ride.status === "pending") {
        // Notify rider: new ride available
        notifyNewRideRequest();
      }

      if (change.type === "modified" && ride.status === "cancelled") {
        // Notify rider if they were assigned
        if (ride.riderId === riderId) {
          notifyPassengerCancelled();
        }
      }
    });
  });

  return unsubscribe;
}
