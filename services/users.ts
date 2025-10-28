// services/user.ts
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export const getUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;
};

export const getRiderDetails = async (riderId: any) => {
  const ref = doc(db, "users", riderId);
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;
}
