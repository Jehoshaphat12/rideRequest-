// contexts/RideRequestListenerContext.tsx
import { db } from '@/lib/firebaseConfig';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface RideRequest {
  id: string;
  riderId: string;
  passengerId: string;
  passengerPhoto: string;
  passengerName: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare?: number;
  estimatedDuration?: string;
  estimatedDistance?: string;
}

interface RideRequestListenerContextType {
  isListening: boolean;
  currentRequests: RideRequest | null;
}

const RideRequestListenerContext = createContext<RideRequestListenerContextType>({
  isListening: false,
  currentRequests: null,
});

export const useRideRequestListener = () => useContext(RideRequestListenerContext);

export const RideRequestListenerProvider: React.FC<{
  children: React.ReactNode;
  riderId: string | null;
}> = ({ children, riderId }) => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [currentRequests, setCurrentRequests] = useState<RideRequest | null>(null);

  useEffect(() => {
    if (!riderId) {
      setIsListening(false);
      return;
    }

    console.log('🚗 Starting ride call listener for rider:', riderId);
    
    const rideQuery = query(
      collection(db, 'rides'),
      where('status', '==', 'pending'),
      where('riderId', '==', riderId) // Make sure your rides have this field
    );

    const unsubscribe = onSnapshot(rideQuery, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const rideData = change.doc.data();
          const rideId = change.doc.id;
          
          console.log('📞 New ride request received:', rideId);
          
          // Get passenger details
          try {
            const passengerDoc = await getDoc(doc(db, 'users', rideData.passengerId));
            const passengerData = passengerDoc.data();
            
            const rideRequest: RideRequest = {
              id: rideId,
              riderId: riderId,
              passengerId: rideData.passengerId,
              passengerPhoto: passengerData?.profilePicture || '',
              passengerName: passengerData?.userName || 'Passenger',
              pickupAddress: rideData.pickup?.address || 'Pickup location',
              destinationAddress: rideData.dropoff?.address || 'Destination',
              estimatedFare: rideData.estimatedFare,
              estimatedDuration: rideData.estimatedDuration,
              estimatedDistance: rideData.estimatedDistance,
            };

            console.log('🎯 Navigating to incoming call with:', rideRequest);

            setCurrentRequests(rideRequest);
            
            // Navigate to incoming call modal
            router.push({
              pathname: "/(rider)/incomingCallScreen",
              params: {
                id: rideRequest.id,
                riderId: rideRequest.riderId,
                passengerPhoto: rideRequest.passengerPhoto,
                passengerName: rideRequest.passengerName,
                pickupAddress: rideRequest.pickupAddress,
                destinationAddress: rideRequest.destinationAddress,
                estimatedFare: rideRequest.estimatedFare?.toString() || '',
                estimatedDuration: rideRequest.estimatedDuration || '',
                estimatedDistance: rideRequest.estimatedDistance || '',
              }
            });
            
          } catch (error) {
            console.error('Error fetching passenger details:', error);
          }
        }
      });
    }, (error) => {
      console.error("Error listening to ride requests: "), error
    });

    setIsListening(true);

    return () => {
      console.log('🚗 Stopping ride call listener');
      unsubscribe();
      setIsListening(false);
      setCurrentRequests(null);
    };
  }, [riderId, router]);

  return (
    <RideRequestListenerContext.Provider value={{ isListening, currentRequests }}>
      {children}
    </RideRequestListenerContext.Provider>
  );
};