// app/_layout.tsx
import SplashScreen from "@/components/SplashScreen";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { RideRequestListenerProvider } from "@/contexts/RideRequestListenerContext";
import { listenToAuthChanges } from "@/services/authListener";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { getUserProfile } from "@/services/users";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen1 from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import Loader from "./Loader";




function RootLayoutContent() {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);

  const hasHiddenSplash = useRef(false);

  const [riderId, setRiderId] = useState<string | null>(null);

  // Use a ref to track the current navigation "ticket"
  const navigationTicketRef = useRef(0);
  const authListenerInitialized = useRef(false);

  const checkProfileAndNavigate = async (
    user: any,
    role: string | null,
    ticket: number
  ) => {
    // Only proceed if this is the most recent navigation request
    if (ticket !== navigationTicketRef.current) {
      console.log("Cancelling stale navigation request");
      return;
    }



    try {
      if (!user || !role) {
        router.replace("/");
        setRiderId(null);
        return;
      }

      const profile = await getUserProfile();
      if (!profile) {
        console.error("No profile found for authenticated user");
        setRiderId(null);
        router.replace("/");
        return;
      }

      let targetRoute = "/";

      if (profile.role === "rider") {
        // 🆕 Save riderId to enable listener later
        setRiderId(profile.uid || user.uid);

        if (profile.onboardingStatus === "pending") {
          targetRoute = "/(rider)/waitingScreen";
        } else if (profile.onboardingStatus === "incomplete") {
          targetRoute = "/(rider)/OnboardingScreen2";
        } else if (profile.onboardingStatus === "approved") {
          targetRoute = "/(rider)/riderHome";
        }
      } else if (profile.role === "passenger") {
        setRiderId(null);
        targetRoute = "/(passenger)/passengerWelcomeScreen";
      }

      // Check ticket again right before navigating
      if (ticket === navigationTicketRef.current) {
        router.replace(targetRoute as any);
      }
    } catch (err) {
      console.error("Error checking profile:", err);
      // Check ticket again right before navigating
      if (ticket === navigationTicketRef.current) {
        setRiderId(null);
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    if (authListenerInitialized.current) return;
    authListenerInitialized.current = true;

    const timeoutId = setTimeout(() => {
      if (checkingAuth) {
        console.warn("Auth check timeout - proceeding without authentication");
        setCheckingAuth(false);
        setInitialAuthCheck(true);
        // Increment the ticket for the timeout navigation
        navigationTicketRef.current++;
        router.replace("/");
      }
    }, 10000);

    const unsubscribe = listenToAuthChanges(async (user, role) => {
      clearTimeout(timeoutId);

      setCheckingAuth(false);
      setInitialAuthCheck(true);

      // Increment the ticket and get the new value for THIS auth change
      navigationTicketRef.current++;
      const currentTicket = navigationTicketRef.current;

      // Introduce a small delay to batch rapid successive changes
      // This is a form of debouncing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check if we are still the most recent ticket after the delay
      if (currentTicket !== navigationTicketRef.current) {
        return; // A newer auth change happened, abort.
      }

      if (!user) {
        setRiderId(null);
        router.replace("/");
        return;
      }

      await checkProfileAndNavigate(user, role, currentTicket);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      authListenerInitialized.current = false;
    };
  }, []);

  useEffect(() => {
  async function initPush() {
    const token = await registerForPushNotificationsAsync();
    console.log("Expo Push Token:", token);
  }

  initPush();
}, []);

  useEffect(() => {
  async function setupNotifications() {
    // 1. Android notification channel
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    // 2. Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { rideId, screen } = response.notification.request.content.data;

        if (!screen) return; // if no screen specified, do nothing
        if (rideId) {
          router.push({
            pathname: screen as any,
            params: { id: rideId.toString() },
          });
        } else if (screen) {
          router.push({ pathname: screen as any });
        }
      }
    );

    return () => subscription.remove();
  }

  setupNotifications();
}, []);

  if (checkingAuth && !initialAuthCheck) {
    return <Loader msg="Loading..." />;
  }

  return (
    <RideRequestListenerProvider riderId={riderId!}>
      <View style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
        <StatusBar style={darkMode ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </RideRequestListenerProvider>
  );
}

// preventAutoHideAsync().catch(() => {}); // Prevent Expo's splash screen from auto-hiding
SplashScreen1.preventAutoHideAsync()

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true); // 🆕 Splash screen state

  useEffect(() => {
    // Hide Expo splash as soon as your app is ready (or after your custom one)
    const hideSplash =  async () => {

      await SplashScreen1.hideAsync();
    }

    hideSplash()
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 4000);
  });
  if (showSplash) {
    return <SplashScreen />;

    

  }
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PaymentProvider>
          <RootLayoutContent />
          <Toast />
        </PaymentProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
