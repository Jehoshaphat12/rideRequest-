// import { auth, db } from "@/lib/firebaseConfig";
// import { deleteDoc, doc, setDoc } from "firebase/firestore";
// import { useEffect, useRef } from "react";
// import { useLocationTracking } from "./useLocationTracking";

// export const useRiderLocationBroadcast = (
//   rideId: string,
//   isActive: boolean
// ) => {
//   const { currentLocation } = useLocationTracking();
//   const broadcastInterval = useRef<NodeJS.Timeout | any>();

//   useEffect(() => {
//     if (!isActive || !currentLocation || !rideId) return;

//     const riderId = auth.currentUser?.uid;
//     if (!riderId) return;

//     const riderLocationRef = doc(db, 'riderLocations', riderId);

//      console.log('Starting rider location broadcast for ride:', rideId);
      
//       // Start location tracking with higher accuracy for riders
//       // startTracking({
//       //   accuracy: 'high',
//       //   distanceInterval: 10, // Update every 10 meters
//       //   timeInterval: 3000, // Update every 3 seconds
//       // });


//     // Broadcast Location every 5 seconds
//     const broadcastLocation = async () => {
     
//       if(currentLocation) {
//         try {
//           await setDoc(riderLocationRef, {
//             latitude: currentLocation.latitude,
//             longitude: currentLocation.longitude,
//             heading: currentLocation.heading,
//             timestamp: Date.now(),
//             rideId: rideId
//           });
//         } catch (error) {
//           console.error('Error broadcasting location:', error);
//         }
//       }
//     };

//     const cleanupLocation = async (locationRef: any) => {
//       if (broadcastInterval.current) {
//         clearInterval(broadcastInterval.current);
//         broadcastInterval.current = undefined;
//       }
      
//       // stopTracking();
      
//       try {
//         // Remove rider location when ride ends or component unmounts
//         await deleteDoc(locationRef);
//         console.log('Rider location cleaned up');
//       } catch (error) {
//         console.error('Error cleaning up rider location:', error);
//       }
//     };

    
    

//     // Start broadcasting
//     broadcastLocation();
//     broadcastInterval.current = setInterval(broadcastLocation, 5000);

//     return () => {
//       if (broadcastInterval.current) {
//         clearInterval(broadcastInterval.current);
//       }
      
//     };

//   }, [isActive, currentLocation, rideId]);

//   return null
// };
