// hooks/useLocationTracking.tsx
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number| any;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

interface LocationData {
  coords: LocationCoords;
  timestamp: number;
}

export const useLocationTracking = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        // On web, we can't use Expo Location the same way
        if (Platform.OS === 'web') {
          if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser');
            return;
          }

          // Use browser's geolocation API on web
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isMounted) return;
              
              const locationData: LocationData = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  heading: position.coords.heading,
                  speed: position.coords.speed,
                },
                timestamp: position.timestamp,
              };
              
              setCurrentLocation(locationData);
              setPermissionGranted(true);
            },
            (error) => {
              if (!isMounted) return;
              setLocationError(`Geolocation error: ${error.message}`);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            }
          );

          // Watch position on web
          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              if (!isMounted) return;
              
              const locationData: LocationData = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude,
                  altitudeAccuracy: position.coords.altitudeAccuracy,
                  heading: position.coords.heading,
                  speed: position.coords.speed,
                },
                timestamp: position.timestamp,
              };
              
              setCurrentLocation(locationData);
            },
            (error) => {
              if (!isMounted) return;
              console.error('Geolocation watch error:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
            }
          );

          // Store the watch ID for cleanup
          locationSubscription = {
            remove: () => navigator.geolocation.clearWatch(watchId)
          } as Location.LocationSubscription;

          return;
        }

        // Mobile implementation using Expo Location
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (!isMounted) return;

        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }

        setPermissionGranted(true);

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        if (!isMounted) return;

        setCurrentLocation({
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            altitudeAccuracy: location.coords.altitudeAccuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
          },
          timestamp: location.timestamp,
        });

        // Watch for location updates on mobile
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            if (!isMounted) return;
            
            setCurrentLocation({
              coords: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                altitudeAccuracy: location.coords.altitudeAccuracy,
                heading: location.coords.heading,
                speed: location.coords.speed,
              },
              timestamp: location.timestamp,
            });
          }
        );

      } catch (error: any) {
        if (!isMounted) return;
        console.error('Location tracking error:', error);
        setLocationError(error.message || 'Failed to get location');
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        if (Platform.OS === 'web') {
          // Web cleanup
          locationSubscription.remove();
        } else {
          // Mobile cleanup
          locationSubscription.remove();
        }
      }
    };
  }, []);

  return {
    currentLocation: currentLocation?.coords || null,
    locationError,
    permissionGranted,
  };
};