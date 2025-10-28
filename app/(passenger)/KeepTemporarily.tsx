// {ride ? (
//           <MapView
//             style={styles.map}
//             // provider={provider === "google" ? PROVIDER_GOOGLE : undefined}
//             initialRegion={{
//               latitude: ride.pickup.lat,
//               longitude: ride.pick.lng,
//               latitudeDelta: 0.02,
//               longitudeDelta: 0.02,
//             }}
//             showsUserLocation={true}
//           >
//             {/* Passenger pickup marker */}
//             <Marker
//               coordinate={{
//                 latitude: ride.pickup.lat,
//                 longitude: ride.pickup.lng,
//               }}
//               title="Pickup Location"
//               pinColor="voilet"
//             />

//             {/* Destination marker */}
//             <Marker
//               coordinate={{
//                 latitude: ride.dropoff.lat,
//                 longitude: ride.dropoff.lng,
//               }}
//               title="Destination"
//               pinColor="red"
//             />

//             {/* Rider Live location */}
//             {rideLocation.rider && (
//               <Marker
//                 coordinate={{
//                   latitude: ride.riderLocation.lat,
//                   longitude: ride.rider.riderLocation.lng,
//                 }}
//                 title="Rider Location"
//                 pinColor="green"
//               />
//             )}
//           </MapView>
//         ) : (
//           <Loader msg="Loading ride data..." />
//         )}



