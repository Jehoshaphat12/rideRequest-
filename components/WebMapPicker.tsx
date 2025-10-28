// components/WebMapPicker.tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface WebMapPickerProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation: any;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function WebMapPicker({
  selectedLocation,
  onLocationSelect,
  initialLocation,
  searchQuery,
  onSearchQueryChange,
}: WebMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      const google = window.google;
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: initialLocation ? {
          lat: initialLocation.latitude,
          lng: initialLocation.longitude,
        } : { lat: 0, lng: 0 },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // Add click listener to map
      mapInstance.addListener('click', (event: any) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        onLocationSelect(location);
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            onSearchQueryChange(results[0].formatted_address);
          }
        });
      });

      setMap(mapInstance);
    };

    if (mapRef.current) {
      loadGoogleMaps();
    }

    return () => {
      // Cleanup
      if (marker) {
        marker.setMap(null);
      }
    };
  }, []);

  // Update marker when selected location changes
  useEffect(() => {
    if (map && selectedLocation && window.google) {
      const google = window.google;
      
      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Add new marker
      const newMarker = new google.maps.Marker({
        position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        map: map,
        title: 'Selected Location',
        draggable: true,
      });

      // Update location when marker is dragged
      newMarker.addListener('dragend', (event: any) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        onLocationSelect(location);
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            onSearchQueryChange(results[0].formatted_address);
          }
        });
      });

      setMarker(newMarker);
      
      // Center map on selected location
      map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
  }, [map, selectedLocation]);

  return <View ref={mapRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
});