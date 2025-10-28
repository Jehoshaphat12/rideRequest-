import { updateRiderLocation } from "@/services/rides";
import * as Location from "expo-location";
import { useEffect } from "react";

export default function RiderLocationUpdater({ rideId }: { rideId: string }) {
  useEffect(() => {
    let locationSub: Location.LocationSubscription;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // update every 10 meters
        },
        (loc) => {
          updateRiderLocation(
            rideId,
            loc.coords.latitude,
            loc.coords.longitude
          );
        }
      );
    })();

    return () => {
      if (locationSub) locationSub.remove();
    };
  }, [rideId]);

  return null; // It runs in background, no UI needed
}
