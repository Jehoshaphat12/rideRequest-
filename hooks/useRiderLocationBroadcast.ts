import { auth, rtdb } from "@/lib/firebaseConfig";
import { onDisconnect, ref, set } from "firebase/database";
import { useEffect, useRef } from "react";
import { useLocationTracking } from "./useLocationTracking";

export const useRiderLocationBroadcast = (
  rideId: string,
  isActive: boolean
) => {
  const { currentLocation } = useLocationTracking();
  const broadcastInterval = useRef<NodeJS.Timeout | any>();

  useEffect(() => {
    if (!isActive || !currentLocation || !rideId) return;

    const riderId = auth.currentUser?.uid;
    if (!riderId) return;

    const riderLocationRef = ref(rtdb, `riderLocations/${riderId}`);

    // Broadcast Location every 5 seconds
    const broadcastLocation = () => {
      if (currentLocation) {
        set(riderLocationRef, {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          heading: currentLocation.heading,
          timestamp: Date.now(),
          rideId: rideId,
        }).catch((error) => {
          console.error("Error broadcasting location:", error);
        });
      }
    };
    
    // Clear location when rider goes offline
    onDisconnect(riderLocationRef).remove();

    // Start broadcasting
    broadcastLocation();
    broadcastInterval.current = setInterval(broadcastLocation, 5000);

    return () => {
      if (broadcastInterval.current) {
        clearInterval(broadcastInterval.current);
      }
      // Optionally clear location when component unmounts
      set(riderLocationRef, null);
    };

  }, [isActive, currentLocation, rideId]);
};
