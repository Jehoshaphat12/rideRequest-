// src/utils/locationUtils.ts

import { ServiceRequest } from "../types/serviceRequests";

// Distance calculation function
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get map locations based on current request
export const getMapLocations = (
  filteredRequests: ServiceRequest[],
  currentIndex: number,
  currentLocation: { latitude: number; longitude: number } | null
) => {
  if (filteredRequests.length > 0 && currentIndex < filteredRequests.length) {
    const currentRequest = filteredRequests[currentIndex];
    return {
      pickupLocation: {
        latitude: currentRequest.pickup?.lat || 0,
        longitude: currentRequest.pickup?.lng || 0,
        address: currentRequest.pickup?.address || "Pickup location",
      },
      destinationLocation: {
        latitude: currentRequest.dropoff?.lat || 0,
        longitude: currentRequest.dropoff?.lng || 0,
        address: currentRequest.dropoff?.address || "Destination",
      },
      showRoute: true,
    };
  } else {
    return {
      pickupLocation: currentLocation
        ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: "Your location",
          }
        : {
            latitude: 0,
            longitude: 0,
            address: "Loading...",
          },
      destinationLocation: {
        latitude: 0,
        longitude: 0,
        address: "No destination",
      },
      showRoute: false,
    };
  }
};