// /contexts/RideRequestListenerContext.tsx
import { db } from "@/lib/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

type RideRequest = any;

interface RideRequestListenerContextType {
  incomingRequest: RideRequest | null;
  setIncomingRequest: React.Dispatch<React.SetStateAction<RideRequest | null>>;
}

const RideRequestListenerContext = createContext<RideRequestListenerContextType | null>(null);

export const RideRequestListenerProvider: React.FC<{ children: React.ReactNode; riderId?: string }> = ({ children, riderId }) => {
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (!riderId) return;
    const unsubscribe = onSnapshot(
      doc(db, "rideRequests", riderId),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.status === "pending") {
            setIncomingRequest(data);

            // Play ringtone
            const { sound } = await Audio.Sound.createAsync(
              require("@/assets/sounds/incoming_call.mp3")
            );
            await sound.playAsync();

            // Show call screen
            (navigation as any).navigate("IncomingCallScreen", { request: data });
          }
        }
      }
    );

    return () => unsubscribe();
  }, [riderId]);

  return (
    <RideRequestListenerContext.Provider value={{ incomingRequest, setIncomingRequest }}>
      {children}
    </RideRequestListenerContext.Provider>
  );
};

export const useRideRequestListener = () => {
  const context = useContext(RideRequestListenerContext);
  if (!context) {
    throw new Error("useRideRequestListener must be used within RideRequestListenerProvider");
  }
  return context;
};
