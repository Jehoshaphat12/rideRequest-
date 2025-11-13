import { auth } from "@/lib/firebaseConfig";
import { getUserProfile } from "@/services/users";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";



export default function Index() {
  const router = useRouter();

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const profile = await getUserProfile()
      if(!user) return router.replace('/welcomeScreen')
      if (user) {
        
        // You can later replace this with a role check if needed
        if(profile?.role === "rider") {

          router.replace("/(rider)/riderHome");
        } else if(profile?.role === "passenger") {
          router.replace("/(passenger)/passengerWelcomeScreen")
        }
      } else {
        router.replace("/welcomeScreen");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#7500fc" />
    </View>
  );
}
