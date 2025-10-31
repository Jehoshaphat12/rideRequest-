// app/(rider)/riderStack.tsx
import { Stack } from "expo-router";

export default function RiderStack() {
  return (
    <Stack>
      <Stack.Screen
        name="riderHome"
        options={{
          headerShown: true,
          title: "Home",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="waitingScreen" />
      <Stack.Screen name="OnboardingScreen2" />
      <Stack.Screen name="riderRideProgress" />

      {/* Incoming call as a modal */}
      <Stack.Screen
        name="incomingCallScreen"
        options={{
          headerShown: false,
          presentation: "modal",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}