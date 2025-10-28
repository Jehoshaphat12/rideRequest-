// app/(auth)/layout.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function AuthLayout() {
  const { darkMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false, // no header for auth screens
        }}
      />
    </View>
  );
}
