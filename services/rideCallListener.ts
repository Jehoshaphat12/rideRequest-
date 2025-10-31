// services/rideCallListener.ts
import { db } from '@/lib/firebaseConfig';
import * as Notifications from 'expo-notifications';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';

// Configure notifications for iOS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const startRideCallListener = (navigation: any, riderId: string) => {
  console.log('🚗 Starting ride call listener for rider:', riderId);
  
  const rideQuery = query(
    collection(db, 'rides'),
    where('status', '==', 'pending'),
    where('riderId', '==', riderId)
  );

  const unsubscribe = onSnapshot(rideQuery, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const rideData = change.doc.data();
        const rideId = change.doc.id;
        
        console.log('📞 New ride request received:', rideId);
        
        // Get passenger details
        const passengerDoc = await getDoc(doc(db, 'users', rideData.passengerId));
        const passengerData = passengerDoc.data();
        
        const rideRequest = {
          id: rideId,
          riderId: riderId,
          passengerPhoto: passengerData?.profilePicture || '',
          passengerName: passengerData?.userName || 'Passenger',
          pickupAddress: rideData.pickup?.address || 'Pickup location',
          destinationAddress: rideData.dropoff?.address || 'Destination',
          estimatedFare: rideData.estimatedFare,
          estimatedDuration: rideData.estimatedDuration,
          estimatedDistance: rideData.estimatedDistance,
        };

        // Show incoming call screen
        navigation.navigate('IncomingCall', { request: rideRequest });
        
        // Also show push notification
        await showRideNotification(rideRequest);
      }
    });
  });

  return unsubscribe;
};

const showRideNotification = async (request: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 New Ride Request',
        body: `${request.passengerName} is requesting a ride`,
        data: { request },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Error showing notification:', error);
  }
};

export const stopRideCallListener = (unsubscribe: () => void) => {
  unsubscribe();
  console.log('🚗 Ride call listener stopped');
};