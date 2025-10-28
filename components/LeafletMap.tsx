// "use client";

// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import React, { useEffect } from "react";
// import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
// import { MapProps, MarkerData } from "./CrossPlatformMap.types";

// // Fix default Leaflet marker icons
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
//   iconUrl: require("leaflet/dist/images/marker-icon.png"),
//   shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
// });

// function FitBoundsWeb({ pickup, dropoff }: { pickup?: MarkerData; dropoff?: MarkerData }) {
//   const map = useMap();

//   useEffect(() => {
//     if (pickup && dropoff) {
//       map.fitBounds([
//         [pickup.lat, pickup.lng],
//         [dropoff.lat, dropoff.lng],
//       ]);
//     } else if (pickup) {
//       map.setView([pickup.lat, pickup.lng], 15);
//     } else if (dropoff) {
//       map.setView([dropoff.lat, dropoff.lng], 15);
//     }
//   }, [pickup, dropoff, map]);

//   return null;
// }

// export default function LeafletMap({ latitude, longitude, pickup, dropoff, riderLocation }: MapProps) {
//   return (
//     <div style={{ width: "100%", height: 600 }}>
//       <MapContainer
//         center={[latitude, longitude] as [number, number]}
//         zoom={13}
//         style={{ width: "100%", height: "100%" }}
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//         {/* Fit bounds */}
//         <FitBoundsWeb pickup={pickup} dropoff={dropoff} />

//         {/* Current location marker */}
//         <Marker position={[latitude, longitude]}>
//           <Popup>You are here 🚖</Popup>
//         </Marker>

//         {/* Pickup marker */}
//         {pickup && (
//           <Marker position={[pickup.lat, pickup.lng]}>
//             <Popup>{pickup.label ?? "Pickup"}</Popup>
//           </Marker>
//         )}

//         {/* Dropoff marker */}
//         {dropoff && (
//           <Marker position={[dropoff.lat, dropoff.lng]}>
//             <Popup>{dropoff.label ?? "Dropoff"}</Popup>
//           </Marker>
//         )}

//         {/* Rider marker */}
//         {riderLocation && (
//           <Marker position={[riderLocation.lat, riderLocation.lng]}>
//             <Popup>{riderLocation.label ?? "Rider's location"}</Popup>
//           </Marker>
//         )}
//       </MapContainer>
//     </div>
//   );
// }



























// // components/WebMapComponent.tsx
// import Loader from '@/app/Loader';
// import React, { useEffect, useRef, useState } from 'react';
// import { StyleSheet } from 'react-native';

// interface Location {
//   latitude: number;
//   longitude: number;
//   address?: string;
// }

// interface WebMapComponentProps {
//   pickupLocation: Location;
//   destinationLocation: Location;
//   currentLocation?: Location;
//   showRoute?: boolean;
// }

// // Default center location (Accra, Ghana)
// const DEFAULT_CENTER = {
//   lat: 5.6037,
//   lng: -0.1870
// };

// export default React.memo(function WebMapComponent({
//   pickupLocation,
//   destinationLocation,
//   showRoute = true,
// }: WebMapComponentProps) {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const [map, setMap] = useState<any>(null);
//   const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
//   const [isMapLoading, setIsMapLoading] = useState(true);
  
//   // Use refs to track state without causing re-renders
//   const hasInitialized = useRef(false);
//   const markersRef = useRef<any[]>([]);
//   const lastPickupLocation = useRef(pickupLocation);
//   const lastDestinationLocation = useRef(destinationLocation);
//   const userHasInteracted = useRef(false); // Track if user has moved/zoomed the map

//   // Initialize map once on component mount
//   useEffect(() => {
//     const loadGoogleMaps = () => {
//       if (window.google) {
//         initializeMap();
//         return;
//       }

//       const script = document.createElement('script');
//       script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
//       script.async = true;
//       script.defer = true;
//       script.onload = initializeMap;
//       script.onerror = () => {
//         console.error('Failed to load Google Maps');
//         setIsMapLoading(false);
//       };
//       document.head.appendChild(script);
//     };

//     const initializeMap = () => {
//       if (!mapRef.current || !window.google || hasInitialized.current) return;

//       const google = window.google;
      
//       // Always initialize the map with default center
//       const mapInstance = new google.maps.Map(mapRef.current, {
//         zoom: 10,
//         center: DEFAULT_CENTER,
//         mapTypeControl: true,
//         streetViewControl: true,
//         fullscreenControl: true,
//       });

//       // Track user interactions
//       mapInstance.addListener('drag', () => {
//         userHasInteracted.current = true;
//       });
      
//       mapInstance.addListener('zoom_changed', () => {
//         userHasInteracted.current = true;
//       });

//       setMap(mapInstance);
//       hasInitialized.current = true;
//       setIsMapLoading(false);
//     };

//     if (!hasInitialized.current) {
//       loadGoogleMaps();
//     }

//     return () => {
//       // Cleanup directions renderer
//       if (directionsRenderer) {
//         directionsRenderer.setMap(null);
//       }
//       // Cleanup markers
//       markersRef.current.forEach(marker => marker.setMap(null));
//     };
//   }, []);

//   // Update map markers and route only when locations actually change
//   useEffect(() => {
//     if (!map || !window.google) return;

//     const google = window.google;

//     // Check if locations actually changed
//     const pickupChanged = 
//       lastPickupLocation.current.latitude !== pickupLocation.latitude ||
//       lastPickupLocation.current.longitude !== pickupLocation.longitude;
    
//     const destinationChanged = 
//       lastDestinationLocation.current.latitude !== destinationLocation.latitude ||
//       lastDestinationLocation.current.longitude !== destinationLocation.longitude;

//     // If no changes, do nothing
//     if (!pickupChanged && !destinationChanged) return;

//     // Update refs with new locations
//     lastPickupLocation.current = pickupLocation;
//     lastDestinationLocation.current = destinationLocation;

//     // Clear existing markers
//     markersRef.current.forEach(marker => marker.setMap(null));
//     markersRef.current = [];

//     // Clear existing directions
//     if (directionsRenderer) {
//       directionsRenderer.setMap(null);
//       setDirectionsRenderer(null);
//     }

//     const hasPickup = pickupLocation.latitude !== 0 && pickupLocation.longitude !== 0;
//     const hasDestination = destinationLocation.latitude !== 0 && destinationLocation.longitude !== 0;

//     // Add pickup marker if valid
//     if (hasPickup) {
//       const pickupMarker = new google.maps.Marker({
//         position: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
//         map: map,
//         title: 'Pickup Location',
//         label: 'P',
//       });
//       markersRef.current.push(pickupMarker);
//     }

//     // Add destination marker if valid
//     if (hasDestination) {
//       const destinationMarker = new google.maps.Marker({
//         position: { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
//         map: map,
//         title: 'Destination',
//         label: 'D',
//       });
//       markersRef.current.push(destinationMarker);
//     }

//     // Only adjust map view if user hasn't interacted with it
//     if (!userHasInteracted.current) {
//       if (hasPickup && hasDestination) {
//         // Both locations available - fit bounds
//         const bounds = new google.maps.LatLngBounds();
//         bounds.extend({ lat: pickupLocation.latitude, lng: pickupLocation.longitude });
//         bounds.extend({ lat: destinationLocation.latitude, lng: destinationLocation.longitude });
        
//         map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
//       } else if (hasPickup) {
//         // Only pickup available - center on pickup
//         map.setCenter({ lat: pickupLocation.latitude, lng: pickupLocation.longitude });
//         map.setZoom(14);
//       } else if (hasDestination) {
//         // Only destination available - center on destination
//         map.setCenter({ lat: destinationLocation.latitude, lng: destinationLocation.longitude });
//         map.setZoom(14);
//       } else {
//         // No valid locations - show default view
//         map.setCenter(DEFAULT_CENTER);
//         map.setZoom(10);
//       }
//     }

//     // Calculate and show route if both locations are valid and showRoute is true
//     if (showRoute && hasPickup && hasDestination) {
//       const directionsService = new google.maps.DirectionsService();
//       const newDirectionsRenderer = new google.maps.DirectionsRenderer({
//         map: map,
//         suppressMarkers: true,
//         polylineOptions: {
//           strokeColor: '#7500fc',
//           strokeWeight: 5,
//         },
//       });

//       const request = {
//         origin: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
//         destination: { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
//         travelMode: google.maps.TravelMode.DRIVING,
//       };

//       directionsService.route(request, (result: any, status: any) => {
//         if (status === 'OK') {
//           newDirectionsRenderer.setDirections(result);
//           setDirectionsRenderer(newDirectionsRenderer);
//         }
//       });
//     }
//   }, [pickupLocation, destinationLocation, showRoute, map, directionsRenderer]);

//   // Reset user interaction flag when both locations are cleared
//   useEffect(() => {
//     const bothCleared = 
//       pickupLocation.latitude === 0 && pickupLocation.longitude === 0 &&
//       destinationLocation.latitude === 0 && destinationLocation.longitude === 0;
    
//     if (bothCleared) {
//       userHasInteracted.current = false;
//     }
//   }, [pickupLocation, destinationLocation]);

//   return (
//     <Loader msg='Loading map...' />
//   );
// });

// const styles = StyleSheet.create({
//   container: {
//     width: '100%',
//     height: '100%',
//     minHeight: 400,
//     position: 'relative',
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//     minHeight: 400,
//   },
//   hiddenMap: {
//     opacity: 0,
//   },
// });
