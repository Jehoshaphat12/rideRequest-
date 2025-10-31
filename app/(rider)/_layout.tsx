// // app/(rider)/_layout.tsx
// import CustomDrawerContent from "@/components/CustomDrawerContent";
// import { useTheme } from "@/contexts/ThemeContext";
// import { auth } from "@/lib/firebaseConfig";
// import { getUserProfile } from "@/services/users";
// import { Drawer } from "expo-router/drawer";
// import { useEffect, useState } from "react";
// import { GestureHandlerRootView } from "react-native-gesture-handler";

// export default function RiderLayout() {
//   const { darkMode, theme } = useTheme();
//   const [profilePic, setProfilePic] = useState("");
//   const [userName, setUserName] = useState("");
//   const [userRole, setUserRole] = useState("");

//   // Check profile on mount
//   const user = auth.currentUser
//   useEffect(() => {
//     const getUserDetails = async () => {
//       try {
//         const profile = await getUserProfile();
//         if (!profile) return;

//         setProfilePic(profile.profilePicture);
//         setUserName(profile.userName);
//         setUserRole(profile.role);
//       } catch (err) {
//         console.error("Error checking profile:", err);
//       }
//     };

//     getUserDetails();
//   }, []);
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Drawer
//         drawerContent={(props) => (
//           <CustomDrawerContent
//             {...props}
//             profilePic={profilePic}
//             userName={userName}
//             userRole={userRole}
//             auth={auth}
//           />
//         )}
//         screenOptions={{
//           headerShown: false, // Show header for each screen
//           drawerHideStatusBarOnOpen: true,
//           drawerStyle: {
//             backgroundColor: theme.background,
//             width: 280,
//             paddingHorizontal: 0,
//             paddingVertical: 0, // Remove vertical padding
//             margin: 0,
//             elevation: 0, // removes Android shadow gap
//             shadowColor: "transparent", // removes iOS shadow gap
//           },
//           drawerContentContainerStyle: {
//             paddingHorizontal: 0,
//           },
//           drawerItemStyle: {
//             paddingHorizontal: 0,
//           },
//           drawerActiveTintColor: "#7500fcff",
//           drawerInactiveTintColor: "#333",
//         }}
//       >
//         {/* Add other screens as needed */}

//         <Drawer.Screen
//           name="riderStack"
//           options={{
//             drawerLabel: "Home",
//             title: "Home",
//             drawerIcon: ({ size, color }) => (
//               <Ionicons name="home-outline" size={size} color={color} />
//             ),
//           }}
//         />
//       </Drawer>
//     </GestureHandlerRootView>
//   );
// }















// app/(rider)/riderStack.tsx
import { Stack } from "expo-router";

export default function RiderStack() {
  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="riderHome"
        options={{
          headerShown: false,
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
