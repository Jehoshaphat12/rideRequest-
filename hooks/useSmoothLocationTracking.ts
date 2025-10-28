// hooks/useSmoothLocationTracking.ts
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const useSmoothLocationTracking = (updateInterval = 10000) => {
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [smoothedLocation, setSmoothedLocation] = useState<LocationPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const locationBuffer = useRef<LocationPoint[]>([]);
  const isTracking = useRef(false);

  useEffect(() => {
    let watchId: any = null;
    let intervalId: NodeJS.Timeout | any;

    const startLocationTracking = async () => {
      try {
        // Request permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        // Get initial position
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const initialPoint: any = {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          accuracy: initialLocation.coords.accuracy,
        };

        setCurrentLocation(initialPoint);
        setSmoothedLocation(initialPoint);
        locationBuffer.current = [initialPoint];

        // Start watching position
        watchId = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: updateInterval,
            distanceInterval: 5, // Update every 5 meters
          },
          (location) => {
            const newLocation: any = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
            };

            // Update current location immediately for backend
            setCurrentLocation(newLocation);

            // Add to buffer for smoothing
            locationBuffer.current.push(newLocation);
            
            // Keep only last 5 locations in buffer
            if (locationBuffer.current.length > 5) {
              locationBuffer.current.shift();
            }
          }
        );

        // Smoothing interval - update UI less frequently
        intervalId = setInterval(() => {
          if (locationBuffer.current.length > 0) {
            // Calculate weighted average (recent locations have more weight)
            const weights = locationBuffer.current.map((_, index) => 
              Math.pow(0.8, locationBuffer.current.length - 1 - index)
            );
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

            const avgLat = locationBuffer.current.reduce((sum, loc, index) => 
              sum + (loc.latitude * weights[index]), 0
            ) / totalWeight;

            const avgLng = locationBuffer.current.reduce((sum, loc, index) => 
              sum + (loc.longitude * weights[index]), 0
            ) / totalWeight;

            setSmoothedLocation({
              latitude: avgLat,
              longitude: avgLng,
              accuracy: locationBuffer.current[locationBuffer.current.length - 1].accuracy,
            });
          }
        }, 10000); // Update smoothed location every 10 seconds

        isTracking.current = true;

      } catch (err) {
        console.error('Error starting location tracking:', err);
        setError('Failed to start location tracking');
      }
    };

    startLocationTracking();

    // Cleanup function
    return () => {
      if (watchId) {
        watchId.remove();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      isTracking.current = false;
    };
  }, [updateInterval]);

  return {
    currentLocation,    // Raw location - updates frequently (for backend)
    smoothedLocation,   // Smoothed location - updates smoothly (for UI)
    error,
    isTracking: isTracking.current,
  };
};