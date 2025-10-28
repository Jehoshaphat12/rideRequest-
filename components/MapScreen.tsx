// import { getEstimatedFare } from "@/services/fare";
// import { Autocomplete, GoogleMap, LoadScript, Marker as WebMarker } from "@react-google-maps/api";
// import React, { useEffect, useState } from "react";
// import { Platform, StyleSheet, Text, View } from "react-native";
// import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
// import MapView, { Marker } from "react-native-maps";

// const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE";

// export default function MapsScreen() {
//   const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [fareEstimate, setFareEstimate] = useState<null | { distanceText: string; durationText: string; price: number }>(null);

//   const defaultRegion = {
//     latitude: 5.6037, // Accra default
//     longitude: -0.1870,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   };

//   useEffect(() => {
//     if(pickupCoords && destinationCoords) {
//         getEstimatedFare(
//             {lat: pickupCoords.latitude, lng: pickupCoords.longitude},
//             {lat: destinationCoords.latitude, lng: destinationCoords.longitude},
//             GOOGLE_MAPS_API_KEY
//         ).then((fare: any) => {
//             if(fare) setFareEstimate(fare)
//         })
//     }
//   }, [pickupCoords, destinationCoords])

//   return (
//     <View style={styles.container}>
//       {/* ========== MOBILE ========== */}
//       {Platform.OS !== "web" && (
//         <>
//           {/* Pickup Input */}
//           <GooglePlacesAutocomplete
//             placeholder="Enter Pickup"
//             fetchDetails={true}
//             onPress={(data, details = null) => {
//               if (details?.geometry?.location) {
//                 setPickupCoords({
//                   latitude: details.geometry.location.lat,
//                   longitude: details.geometry.location.lng,
//                 });
//               }
//             }}
//             query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
//             styles={{ container: styles.autoComplete }}
//           />

//           {/* Destination Input */}
//           <GooglePlacesAutocomplete
//             placeholder="Enter Destination"
//             fetchDetails={true}
//             onPress={(data, details = null) => {
//               if (details?.geometry?.location) {
//                 setDestinationCoords({
//                   latitude: details.geometry.location.lat,
//                   longitude: details.geometry.location.lng,
//                 });
//               }
//             }}
//             query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
//             styles={{ container: styles.autoComplete }}
//           />

//           <MapView
//             style={styles.map}
//             initialRegion={defaultRegion}
//             region={
//               pickupCoords
//                 ? { ...pickupCoords, latitudeDelta: 0.05, longitudeDelta: 0.05 }
//                 : defaultRegion
//             }
//           >
//             {pickupCoords && <Marker coordinate={pickupCoords} title="Pickup" />}
//             {destinationCoords && <Marker coordinate={destinationCoords} title="Destination" />}
//           </MapView>
//         </>
//       )}

//       {/* ========== WEB ========== */}
//       {Platform.OS === "web" && (
//         <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
//           <GoogleMap
//             mapContainerStyle={{ width: "100%", height: "100%" }}
//             center={pickupCoords || defaultRegion}
//             zoom={12}
//           >
//             {/* Pickup Autocomplete */}
//             <Autocomplete
//               onPlaceChanged={() => {
//                 const place = (window as any).google?.maps?.places?.AutocompleteService;
//                 console.log("Place:", place);
//               }}
//             >
//               <input type="text" placeholder="Enter Pickup" style={styles.webInput} />
//             </Autocomplete>

//             {/* Destination Autocomplete */}
//             <Autocomplete>
//               <input type="text" placeholder="Enter Destination" style={styles.webInput} />
//             </Autocomplete>

//             {pickupCoords && <WebMarker position={{ lat: pickupCoords.latitude, lng: pickupCoords.longitude }} />}
//             {destinationCoords && <WebMarker position={{ lat: destinationCoords.latitude, lng: destinationCoords.longitude }} />}
//           </GoogleMap>
//         </LoadScript>
//       )}
//       {fareEstimate && (
//   <View style={styles.fareBox}>
//     <Text>Distance: {fareEstimate.distanceText}</Text>
//     <Text>Duration: {fareEstimate.durationText}</Text>
//     <Text>Estimated Fare: GHS {fareEstimate.price}</Text>
//   </View>
// )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   autoComplete: {
//     position: "absolute",
//     top: 20,
//     width: "90%",
//     alignSelf: "center",
//     zIndex: 1,
//   },
//   map: { flex: 1 },
//   webInput: {
//     width: 300,
//     padding: 8,
//     margin: 5,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: "#ccc"
//   },
//   fareBox: {
//   position: "absolute",
//   bottom: 20,
//   left: 20,
//   right: 20,
//   backgroundColor: "white",
//   padding: 12,
//   borderRadius: 10,
//   elevation: 4,
// }
// });

