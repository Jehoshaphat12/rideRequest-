// import polyline from "@mapbox/polyline";
// import React, { useEffect, useState } from "react";
// import { Dimensions, StyleSheet, Text, View } from "react-native";
// import MapView, { Marker, Polyline } from "react-native-maps";

// export default function MockTrackingScreen() {
//   const passengerPickup = {
//     latitude: 5.560014,
//     longitude: -0.205744,
//   };

//   const [riderPosition, setRiderPosition] = useState({
//     latitude: 5.565,
//     longitude: -0.21,
//   });

//   const [routeCoords, setRouteCoords] = useState<any[]>([]);
//   const [eta, setEta] = useState<string | null>(null);
//   const [distance, setDistance] = useState<string | null>(null);

//   // Mock Rider movement
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setRiderPosition((prev) => ({
//         latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
//         longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
//       }));
//     }, 3000);

//     return () => clearInterval(interval);
//   }, []);

//   // Fetch driving directions
//   useEffect(() => {
//     const fetchRoute = async () => {
//       try {
//         /**
//          * 🔑 REAL API CALL (Enable once you have Google Maps API key)
//          *
//          * const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${riderPosition.latitude},${riderPosition.longitude}&destination=${passengerPickup.latitude},${passengerPickup.longitude}&key=YOUR_API_KEY`;
//          * const response = await fetch(url);
//          * const data = await response.json();
//          * if (data.routes.length) {
//          *   const points = polyline.decode(data.routes[0].overview_polyline.points);
//          *   const coords = points.map((point) => ({
//          *     latitude: point[0],
//          *     longitude: point[1],
//          *   }));
//          *   setRouteCoords(coords);
//          *
//          *   // ETA & Distance
//          *   const leg = data.routes[0].legs[0];
//          *   setEta(leg.duration.text); // e.g. "5 mins"
//          *   setDistance(leg.distance.text); // e.g. "2.3 km"
//          * }
//          */

//         // MOCK: Pretend this came from Google API
//         const mockEncodedPolyline = "}_seA`mocMk@fDqAdHw@`D";
//         const points = polyline.decode(mockEncodedPolyline);
//         const coords = points.map((point: any) => ({
//           latitude: point[0],
//           longitude: point[1],
//         }));
//         setRouteCoords(coords);

//         // Mock ETA + Distance
//         setEta("5 mins");
//         setDistance("2.3 km");

//       } catch (error) {
//         console.error("Error fetching route:", error);
//       }
//     };

//     fetchRoute();
//   }, [riderPosition]);

//   return (
//     <View style={styles.container}>
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: passengerPickup.latitude,
//           longitude: passengerPickup.longitude,
//           latitudeDelta: 0.02,
//           longitudeDelta: 0.02,
//         }}
//       >
//         {/* Passenger Marker */}
//         <Marker
//           coordinate={passengerPickup}
//           pinColor="green"
//           title="Passenger Pickup"
//         />

//         {/* Rider Marker */}
//         <Marker
//           coordinate={riderPosition}
//           pinColor="blue"
//           title="Rider"
//         />

//         {/* Route Polyline */}
//         {routeCoords.length > 0 && (
//           <Polyline
//             coordinates={routeCoords}
//             strokeColor="#7500fc"
//             strokeWidth={4}
//           />
//         )}
//       </MapView>

//       {/* ETA + Distance Overlay */}
//       {eta && distance && (
//         <View style={styles.infoBox}>
//           <Text style={styles.infoText}>
//             🚗 Rider arriving in {eta} ({distance} away)
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: {
//     width: Dimensions.get("window").width,
//     height: Dimensions.get("window").height,
//   },
//   infoBox: {
//     position: "absolute",
//     bottom: 40,
//     left: 20,
//     right: 20,
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 10,
//     elevation: 4,
//   },
//   infoText: {
//     fontSize: 16,
//     fontWeight: "500",
//     textAlign: "center",
//   },
// });
