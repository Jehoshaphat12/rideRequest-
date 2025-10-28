// /services/deliveries.ts
import { auth, db } from '@/lib/firebaseConfig';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

export const createDeliveryRequest = async (deliveryData: any) => {
  try {
    const deliveryRef = await addDoc(collection(db, 'deliveries'), {
      ...deliveryData,
      type: 'delivery',
      status: 'pending',
      // estimatedFare: 0, // Will be calculated based on actual route
      // estimatedDuration: '', // Will be calculated
      // estimatedDistance: '', // Will be calculated
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return deliveryRef.id;
  } catch (error) {
    console.error('Error creating delivery request:', error);
    throw error;
  }
};

export const updateDeliveryStatus = async (deliveryId: string, status: string) => {
  try {
    await updateDoc(doc(db, 'deliveries', deliveryId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    throw error;
  }
};

export const assignRiderToDelivery = async (deliveryId: string, riderId: string) => {
  const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");
  try {
        // Get rider details from firestore "users" collection
    const riderDoc = await getDoc(doc(db, "users", user.uid));
    if (!riderDoc.exists()) throw new Error("Rider profile not found");

    const riderData = riderDoc.data();
    
    await updateDoc(doc(db, 'deliveries', deliveryId), {
      status: 'accepted',
      riderId,
      riderInfo: {
        name: riderData?.name || "Rider",
        profilePicture: riderData?.profilePicture || null,
        phone: riderData?.phone || null,
        rating: riderData?.rating || 0,
        totalRides: riderData?.totalRides || 0,
        vehicle: {
          model: riderData?.vehicleModel || "",
          plateNumber: riderData?.vehiclePlate || "",
          color: riderData?.vehicleColor || "",
          type: riderData?.vehicleType || "car",
        },
      },
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning rider to delivery:', error);
    throw error;
  }
};

export const getDeliveryDetails = async (deliveryId: string) => {
  try {
    const deliveryDoc = await getDoc(doc(db, 'deliveries', deliveryId));
    if (deliveryDoc.exists()) {
      return { id: deliveryDoc.id, ...deliveryDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting delivery details:', error);
    throw error;
  }
};