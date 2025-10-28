// import React, { useEffect, useRef } from "react";
// import { View } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import { MapProps } from "./CrossPlatformMap.types";

// export default function CrossPlatformMap({ latitude, longitude, pickup, dropoff, riderLocation }: MapProps) {
//   const mapRef = useRef<MapView>(null);

//   useEffect(() => {
//     if (!mapRef.current) return;

//     if (pickup && dropoff) {
//       mapRef.current.fitToCoordinates(
//         [
//           { latitude: pickup.lat, longitude: pickup.lng },
//           { latitude: dropoff.lat, longitude: dropoff.lng },
//         ],
//         { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
//       );
//     } else if (pickup) {
//       mapRef.current.animateCamera({
//         center: { latitude: pickup.lat, longitude: pickup.lng },
//         zoom: 15,
//       });
//     } else if (dropoff) {
//       mapRef.current.animateCamera({
//         center: { latitude: dropoff.lat, longitude: dropoff.lng },
//         zoom: 15,
//       });
//     }
//   }, [pickup, dropoff]);

//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         style={{ flex: 1 }}
//         initialRegion={{
//           latitude,
//           longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         }}
//       >
//         <Marker coordinate={{ latitude, longitude }} title="You are here 🚖" pinColor="violet" />

//         {pickup && (
//           <Marker
//             coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
//             title={pickup.label ?? "Pickup"}
//             pinColor="violet"
//           />
//         )}

//         {dropoff && (
//           <Marker
//             coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
//             title={dropoff.label ?? "Dropoff"}
//             pinColor="red"
//           />
//         )}

//         {riderLocation && (
//           <Marker
//             coordinate={{ latitude: riderLocation.lat, longitude: riderLocation.lng }}
//             title={riderLocation.label ?? "Rider's location"}
//             pinColor="red"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// }
