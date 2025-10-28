// app/(rider)/WaitingScreen.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/lib/firebaseConfig";
import { getUserProfile } from "@/services/users";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Loader from "../Loader";

export default function WaitingScreen() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profile = await getUserProfile();

        if (!profile) return; // safety check

        if (profile.onboardingStatus === "incomplete") {
          router.replace("/(rider)/OnboardingScreen2");
        } else if (profile.onboardingStatus === "approved") {
          router.replace("/(rider)/riderHome");
        } else {
          // still pending → stay on WaitingScreen
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
        setLoading(false);
      }
    };

    checkProfile();
  }, [router]);

  if (loading) {
    // show spinner while fetching profile
    return (
      <Loader msg="Checking Onboarding status"/>
    );
  }

   // Logout function
    const handleLogout = async () => {
      try {
        await signOut(auth);
        // Navigate the user to the login screen or another appropriate screen
        // using your navigation library (e.g., React Navigation)
      } catch (error) {
        console.error("Error signing out:", error);
      }
    };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
    >
      <View style={{width: 500, height: "auto"}}>
      <LottieView
        source={require('../../splashScreenAnimations/ProfileScanning.json')}
        autoPlay
        resizeMode="contain"
        loop
        style={[styles.animation, {width: 20, height: 20}]}
      />

      </View>
      {/* <ActivityIndicator size="large" color={darkMode ? "#fff" : "#7500fc"} /> */}
      <Text style={[styles.title, { color: darkMode ? "#fff" : "#000" }]}>
        Your profile is under review
      </Text>
      <Text style={[styles.subtitle, { color: darkMode ? "#ccc" : "#555" }]}>
        Please wait while we verify your details.{"\n"}
        You will be notified once your account is approved.
      </Text>
      {/* Rider info / shortcuts */}
              <View style={styles.infoSection}>
                <TouchableOpacity onPress={handleLogout} style={styles.historyButton}>
                  <Text style={styles.historyButtonText}>logout</Text>
                </TouchableOpacity>
              </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  infoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    width: "50%",
    marginVertical: 16,
  },
  historyButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7500fc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 16,
    color: "#7500fc",
    fontWeight: "600",
  },
  animation: {
    width: 30,
    height: 30,
    overflow: "hidden",
  },
});
