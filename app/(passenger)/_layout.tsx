// // app/(rider)/_layout.tsx
// import CustomDrawerContent from "@/components/CustomDrawerContent";
// import { useTheme } from "@/contexts/ThemeContext";
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
//       </Drawer>
//     </GestureHandlerRootView>
//   );
// }
