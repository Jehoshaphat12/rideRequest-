// // app/(rider)/riderStack.tsx
// import { Stack } from "expo-router";

// export default function RiderStack() {
//   return (
//     <Stack>
//       <Stack.Screen
//         name="riderHome"
//         options={{
//           headerShown: true,
//           title: "Home",
//           gestureEnabled: false,
//         }}
//       />
//       <Stack.Screen name="waitingScreen" />
//       <Stack.Screen name="OnboardingScreen2" />
//       <Stack.Screen name="riderRideProgress" />

//       {/* Incoming call as a modal */}
//       <Stack.Screen
//         name="incomingCallScreen"
//         options={{
//           headerShown: false,
//           presentation: "modal",
//           gestureEnabled: false,
//         }}
//       />
//     </Stack>
//   );
// }

























// =====================================================================
// ===================================================================================








// import { useTheme } from "@/contexts/ThemeContext";
// import { auth, db } from "@/lib/firebaseConfig";
// import { supabase } from "@/lib/supabase";
// import { getUserProfile } from "@/services/users";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import { doc, serverTimestamp, setDoc } from "firebase/firestore";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Linking,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function EditProfileScreen() {
//   const { theme, darkMode, toggleDarkMode } = useTheme();
//   const user = auth.currentUser;
//   const router = useRouter();
//   const [userName, setUserName] = useState(user?.displayName || "");
//   const [userEmail, setUserEmail] = useState(user?.email || "")
//   const [userContact, setUserContact] = useState(user?.phoneNumber || "")
//   const [profilePic, setProfilePic] = useState<string | any | null>(
//     user?.photoURL || ""
//   );
//   const [loading, setLoading] = useState(false);

//   //   get current user info to prefill form
//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       const profile = await getUserProfile();

//       if (!profile) return;

//       setUserName(profile.userName || "");
//       setProfilePic(profile.profilePicture || "");
//       setUserEmail(profile.email || "")
//       setUserContact(profile.phone || "")
//     };
//     fetchUserProfile();
//   }, []);

//   const uploadImage = async (
//   uri: string,
//   path: string,
//   userId: string
// ): Promise<string> => {
//   try {
//     // Generate filename and path
//     const fileExt = uri.split(".").pop()?.split("?")[0] || "jpg";
//     const filePath = `${path}/${userId}.${fileExt}`;
    
//     const BUCKET_NAME = "Ride Request User profiles";

//     // Get the actual file data
//     const response = await fetch(uri);
//     const imageData = await response.arrayBuffer();

//     // Upload directly to Supabase Storage
//     const { data: uploadData, error: uploadError } = await supabase.storage
//       .from(BUCKET_NAME)
//       .upload(filePath, imageData, {
//         contentType: `image/${fileExt}`,
//         upsert: true,
//       });

//     if (uploadError) {
//       console.error('Upload error:', uploadError);
//       throw new Error(`Failed to upload image: ${uploadError.message}`);
//     }

//     // Get public URL
//     const { data } = supabase.storage
//       .from(BUCKET_NAME)
//       .getPublicUrl(filePath);

//     if (!data.publicUrl) {
//       throw new Error('Failed to get public URL');
//     }

//     return data.publicUrl;
//   } catch (error: any) {
//     console.error('Image upload error:', error);
//     throw new Error(error.message || "Failed to upload image");
//   }
// };
//   //   Save Profile Editing
//   const handleSubmit = async () => {
//     if (!userName) {
//       Alert.alert("Error", "Please fill in all required field");
//       return;
//     }

//     if (!user) {
//       Alert.alert("Error", "User not authenticated");
//       return;
//     }

//     setLoading(true);

//     try {
//       // Upload images to supabase storage
//       let profilePicUrl = "";

//       if (profilePic) {
//         if (profilePic.uri) {
//           profilePicUrl = await uploadImage(
//             profilePic.uri,
//             "profile-pictures",
//             user.uid
//           );

//         } else {
//           profilePicUrl = profilePic;
//         }
//       }
//       await setDoc(
//         doc(db, "users", user.uid),
//         {
//           uid: user.uid,
//           userName,
//           email: userEmail,
//           phone: userContact,
//           profilePicture: profilePicUrl,
//           EditedDate: serverTimestamp(),
//         },
//         { merge: true }
//       );

//       Alert.alert("Success", "Your profile has been updated", [
//         {
//           text: "OK",
//           onPress: () => router.back(),
//         },
//       ]);
//     } catch (error: any) {
//       Alert.alert("Error", error.message || "Failed to save information");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const pickImage = async (setImage: any) => {
//     try {
//       // Request permission with better handling
//       const { status } =
//         await ImagePicker.requestMediaLibraryPermissionsAsync();

//       if (status !== "granted") {
//         Alert.alert(
//           "Permission Required",
//           "Please allow access to your photos to upload images. You can enable this in device settings",
//           [
//             { text: "Cancel", style: "cancel" },
//             {
//               text: "Open Settings",
//               onPress: () => Linking.openSettings(),
//             },
//           ]
//         );
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 4],
//         quality: 0.7, //Slightly lower quality for faster uploads
//         allowsMultipleSelection: false,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const selectedImage = result.assets[0];

//         // Check file size (Optional)
//         if (
//           selectedImage.fileSize &&
//           selectedImage.fileSize > 10 * 1024 * 1024
//         ) {
//           Alert.alert(
//             "File too large",
//             "Please select an image smaller than 10MB"
//           );
//           return;
//         }

//         setImage(selectedImage);
//       }
//     } catch (error) {
//       console.error("Error picking image: ", error);
//       Alert.alert("Error", "Failed to select image. Please try again.");
//     }
//   };

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: theme.background }]}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.keyboardAvoid}
//       >
//         {/* Header with Back Button */}
//         <View
//           style={[
//             styles.navheader,
//             {
//               borderBottomColor: theme.border,
//               backgroundColor: theme.card,
//             },
//           ]}
//         >
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => router.back()}
//           >
//             <Ionicons name="arrow-back" size={24} color={theme.text} />
//           </TouchableOpacity>
//           <Text style={[styles.headerTitle, { color: theme.text }]}>
//             Edit Profile
//           </Text>
//           <View style={styles.headerSpacer} />
//         </View>
//         <ScrollView
//           contentContainerStyle={styles.scrollContainer}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={styles.profileSection}>
//             <View style={styles.profileImageContainer}>
//               <Image
//                 source={
//                   profilePic
//                     ? { uri: profilePic.uri || profilePic }
//                     : require("../../assets/images/defaultUserImg2.png")
//                 }
//                 style={styles.profileImage}
//               />
//               <TouchableOpacity
//                 style={styles.changeImageButton}
//                 onPress={() => pickImage(setProfilePic)}
//               >
//                 <Ionicons name="camera" size={20} color="#fff" />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.imageLabel}>Profile Picture</Text>
//           </View>

//           {/* Form Fields */}
//           <TextInput
//             style={[
//               styles.input,
//               {
//                 backgroundColor: theme.card,
//                 color: theme.text,
//                 borderColor: theme.border,
//               },
//             ]}
//             placeholder="Username"
//             placeholderTextColor={"#666"}
//             value={userName}
//             onChangeText={setUserName}
//           />
//           <TextInput
//             style={[
//               styles.input,
//               {
//                 backgroundColor: theme.card,
//                 color: theme.text,
//                 borderColor: theme.border,
//               },
//             ]}
//             placeholder="Email"
//             placeholderTextColor={"#666"}
//             value={userEmail}
//             onChangeText={setUserEmail}
//           />
//           <TextInput
//             style={[
//               styles.input,
//               {
//                 backgroundColor: theme.card,
//                 color: theme.text,
//                 borderColor: theme.border,
//               },
//             ]}
//             placeholder="Contact"
//             placeholderTextColor={"#666"}
//             value={userContact}
//             onChangeText={setUserContact}
//           />

//           {/* Submit Button */}
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               loading && styles.submitButtonDisabled,
//               { backgroundColor: theme.primary },
//             ]}
//             onPress={handleSubmit}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.submitButtonText}>Save</Text>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContainer: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   navheader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 15,
//     paddingTop: 20,
//     borderBottomWidth: 1,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   headerSpacer: {
//     width: 40,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     borderWidth: 1,
//   },
//   profileSection: {
//     alignItems: "center",
//     marginBottom: 25,
//   },
//   profileImageContainer: {
//     position: "relative",
//     marginBottom: 15,
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     borderWidth: 2,
//     borderColor: "#7500fc",
//   },
//   changeImageButton: {
//     position: "absolute",
//     right: 0,
//     bottom: 0,
//     backgroundColor: "#7500fc",
//     borderRadius: 20,
//     padding: 6,
//   },
//   imageLabel: {
//     fontSize: 14,
//     color: "#666",
//     fontWeight: "500",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     fontSize: 16,
//     backgroundColor: "#f8f9fa",
//   },
//   submitButton: {
//     backgroundColor: "#7500fc",
//     padding: 18,
//     borderRadius: 12,
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   submitButtonDisabled: {
//     opacity: 0.7,
//   },
//   submitButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 18,
//   },
// });
