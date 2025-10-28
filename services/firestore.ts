import { db } from "@/lib/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";



export const getUser = async (userId: string) => {
    const userDoc = await getDoc(doc(db, "users", userId))
    return userDoc.exists() ? userDoc.data() : null
}

// ----------------- RIDES ------------------------
export const createRide = async (data: any) => {
    const rideRef = await addDoc(collection(db, "rides"), {
        ...data,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    })
    return rideRef.id
}

export const updatedRide = async (rideId: string, data: any) => {
    await updateDoc(doc(db, "rides", rideId), {
        ...data,
        updatedAt: serverTimestamp()
    })
}