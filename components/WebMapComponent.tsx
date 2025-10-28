import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface WebMapComponentProps {
  pickupLocation?: Location;
  destinationLocation?: Location;
  currentLocation?: Location;
  showRoute?: boolean;
}

export default React.memo(function WebMapComponent({
  pickupLocation,
  destinationLocation,
  currentLocation,
  showRoute = true,
}: WebMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const hasInitialized = useRef(false);

  // Default to Accra if location not available
  const defaultCenter = currentLocation
    ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
    : { lat: 5.6037, lng: -0.1870 }; // Accra

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google || hasInitialized.current) return;

      const google = window.google;
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);
      hasInitialized.current = true;
    };

    if (!hasInitialized.current) loadGoogleMaps();

    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, []);

  // Update map whenever pickup or destination changes
  useEffect(() => {
    if (!map || !window.google) return;

    const google = window.google;
    const markers: any[] = [];

    // Clear previous directions if any
    if (directionsRenderer) directionsRenderer.setMap(null);

    const bounds = new google.maps.LatLngBounds();

    // Add pickup marker
    if (pickupLocation && pickupLocation.latitude && pickupLocation.longitude) {
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
        map,
        title: 'Pickup Location',
        label: 'P',
      });
      markers.push(pickupMarker);
      bounds.extend(pickupMarker.getPosition());
    }

    // Add destination marker
    if (destinationLocation && destinationLocation.latitude && destinationLocation.longitude) {
      const destMarker = new google.maps.Marker({
        position: { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
        map,
        title: 'Destination',
        label: 'D',
      });
      markers.push(destMarker);
      bounds.extend(destMarker.getPosition());
    }

    // If we have both, draw route
    if (
      showRoute &&
      pickupLocation?.latitude &&
      destinationLocation?.latitude
    ) {
      const directionsService = new google.maps.DirectionsService();
      const newDirectionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#7500fc',
          strokeWeight: 5,
        },
      });

      const request = {
        origin: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
        destination: { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          newDirectionsRenderer.setDirections(result);
        }
      });

      setDirectionsRenderer(newDirectionsRenderer);
    }

    // Adjust map bounds
    if (markers.length > 0) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    } else {
      // If no pickup/destination, center on user or default
      map.setCenter(defaultCenter);
      map.setZoom(13);
    }
  }, [pickupLocation, destinationLocation, showRoute, map]);

  return <View ref={mapRef} style={styles.map} />;
});

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
});
