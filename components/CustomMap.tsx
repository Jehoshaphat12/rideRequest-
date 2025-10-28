// // import { Dimensions, StyleSheet, View } from "react-native"
// // import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"

// // type Props = {
// //     latitude: number
// //     longitude: number
// //     provider?: "osm" | "google"
// // }

// // export default function CustomMap({latitude, longitude, provider = "osm"}: Props) {
// //     return (
// //         <View style={styles.container}>
// //             <MapView style={styles.map}
// //             provider={provider === "google" ? PROVIDER_GOOGLE : undefined}
// //             initialRegion={{
// //                 latitude,
// //                 longitude,
// //                 latitudeDelta: 0.01,
// //                 longitudeDelta: 0.01,
// //             }}
// //             showsUserLocation={true}
// //             >
// //                 <Marker coordinate={{latitude, longitude}} title="You are here" pinColor="blue"/>
// //             </MapView>
// //         </View>
// //     )
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1 },
// //   map: {
// //     width: Dimensions.get("window").width,
// //     height: Dimensions.get("window").height,
// //   },
// // });

// // components/MapScreen.tsx
// import Loader from '@/app/Loader';
// import { useTheme } from '@/contexts/ThemeContext';
// import { useCurrentLocation } from '@/hooks/useCurrentLocation';
// import React, { useEffect, useRef, useState } from 'react';
// import { StyleSheet, View } from 'react-native';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';

// interface MapScreenProps {
//   pickup?: { lat: number; lng: number; address: string } | null;
//   destination?: { lat: number; lng: number; address: string } | null;
// }

// export default function MapScreen({ pickup, destination }: MapScreenProps) {
//   const { theme } = useTheme();
//   const { location } = useCurrentLocation();
//   const mapRef = useRef<MapView>(null);
//   const [region, setRegion] = useState<Region | undefined>();
//   const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([])

//   // Set initial region based on current location
//   useEffect(() => {
//     if (location) {
//       const initialRegion: Region = {
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       };
//       setRegion(initialRegion);
//     }
//   }, [location]);

//   // Fit map to show all markers when pickup/destination changes
//   useEffect(() => {
//     if (mapRef.current && (pickup || destination || location)) {
//       const coordinates = [];
//       calculateRoute()
      
//       if (pickup) {
//         coordinates.push({
//           latitude: pickup.lat,
//           longitude: pickup.lng,
//         });
//       }
      
//       if (destination) {
//         coordinates.push({
//           latitude: destination.lat,
//           longitude: destination.lng,
//         });
//       }
      
//       if (location && (!pickup && !destination)) {
//         coordinates.push({
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         });
//       }

//       if (coordinates.length > 0) {
//         mapRef.current.fitToCoordinates(coordinates, {
//           edgePadding: { top: 50, right: 50, bottom: 300, left: 50 }, // Extra bottom padding for input area
//           animated: true,
//         });
//       }
//     } else {
//         setRouteCoordinates([])
//     }
//   }, [pickup, destination, location]);

//   const calculateRoute = async () => {
//     // Simple straight line for demo - replace with Google Directions API
//     if (pickup && destination) {
//       setRouteCoordinates([
//         { latitude: pickup.lat, longitude: pickup.lng },
//         { latitude: destination.lat, longitude: destination.lng },
//       ]);
//     }
//   }

//   if (!location) {
//     return (
//       <Loader msg='Loading...' />
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         provider={PROVIDER_GOOGLE}
//         region={region}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//         showsCompass={true}
//         toolbarEnabled={true}
//       >

//         {/* Route Polyline */}
//         {routeCoordinates.length > 0 && (
//           <Polyline
//             coordinates={routeCoordinates}
//             strokeColor="#7500fc"
//             strokeWidth={4}
//           />
//         )}
//         {/* Pickup Marker */}
//         {pickup && (
//           <Marker
//             coordinate={{
//               latitude: pickup.lat,
//               longitude: pickup.lng,
//             }}
//             title="Pickup Location"
//             description={pickup.address}
//             pinColor="green"
//           />
//         )}

//         {/* Destination Marker */}
//         {destination && (
//           <Marker
//             coordinate={{
//               latitude: destination.lat,
//               longitude: destination.lng,
//             }}
//             title="Destination"
//             description={destination.address}
//             pinColor="red"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });
