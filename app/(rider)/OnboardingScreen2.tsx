import { auth, db } from "@/lib/firebaseConfig";
import { supabase } from "@/lib/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RiderOnboardingScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState<string | any | null>(null);
  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState("");
  const [licenseImage, setLicenseImage] = useState<string | any | null>(null);
  const [loading, setLoading] = useState(false);

  // Upload image to Supabase Storage
 const uploadImage = async (uri: string, path: string, userId: string): Promise<string> => {
  try {
    // Convert URI → Blob (works with expo-image-picker)
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate filename
    const fileExt = uri.split(".").pop()?.split("?")[0] || "jpg";
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${path}/${userId}.${fileExt}`;


     // ✅ Delete old file before uploading (to avoid extension mismatch problems)
    await supabase.storage.from("Ride Request User profiles").remove([filePath]);

    // Upload blob to Supabase Storage
    const { error } = await supabase.storage
      .from("Ride Request User profiles") // ✅ bucket name with no spaces
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data } = supabase.storage
      .from("Ride Request User profiles")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Error uploading to Supabase:", err);
    throw new Error("Failed to upload image");
  }
};

   
  // Save onboarding info
  const handleSubmit = async () => {
    if (!userName || !vehicleModel || !plateNumber || !color) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!licenseImage) {
      Alert.alert("Error", "Please upload your license image");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);

    try {
      
      // Upload images to Firebase Storage
      let profilePicUrl = "";
      let licenseImageUrl = "";

      if (profilePic) {
        profilePicUrl = await uploadImage(profilePic.uri, "profile-pictures", user.uid);
      } 

      licenseImageUrl = await uploadImage(licenseImage.uri, "licenses", user.uid);

      // Save rider data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        userName,
        email: user.email,
        role: "rider",
        profilePicture: profilePicUrl,
        vehicle: {
          model: vehicleModel,
          plateNumber: plateNumber.toUpperCase(), // Standardize plate number
          color: color.toUpperCase(),
        },
        licenseImage: licenseImageUrl,
        onboardingStatus: "pending", // pending, approved, rejected
        isOnline: false,
        rating: 0,
        totalRides: 0,
        // createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert(
        "Success", 
        "Your information has been submitted for review. You'll be notified once approved.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(rider)/riderHome")
          }
        ]
      );
      router.replace("/(rider)/riderHome")

    } catch (error: any) {
      console.error("Error saving rider data:", error);
      Alert.alert("Error", error.message || "Failed to save information");
    } finally {
      setLoading(false);
    }
  };

  // Pick image from gallery with better error handling
  const pickImage = async (setImage: any) => {
    try {
      // Request permissions with better handling
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required", 
          "Please allow access to your photos to upload images. You can enable this in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Open Settings", 
              onPress: () => Linking.openSettings() 
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Slightly lower quality for faster uploads
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Check file size (optional)
        if (selectedImage.fileSize && selectedImage.fileSize > 10 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select an image smaller than 10MB");
          return;
        }
        
        setImage(selectedImage);
        
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      alert("error signing out: " + error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Rider Onboarding</Text>
          <Text style={styles.subtitle}>Complete your profile to start Riding</Text>

          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  profilePic
                    ? { uri: profilePic.uri }
                    : require("../../assets/images/defaultUserImg2.png")
                }
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => pickImage(setProfilePic)}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.imageLabel}>Profile Picture</Text>
          </View>

          {/* Form Fields */}
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor={"#666"}
            value={userName}
            onChangeText={setUserName}
          />

          <TextInput
            style={styles.input}
            placeholder="Vehicle Model (e.g. Toyota Corolla) *"
            placeholderTextColor={"#666"}
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />

          <TextInput
            style={styles.input}
            placeholder="Plate Number *"
            placeholderTextColor={"#666"}
            value={plateNumber}
            onChangeText={setPlateNumber}
            autoCapitalize="characters"
          />

          <TextInput
            style={styles.input}
            placeholder="Vehicle Color *"
            placeholderTextColor={"#666"}
            value={color}
            onChangeText={setColor}
          />

          {/* License Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Driver's License *</Text>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage(setLicenseImage)}
            >
              <Ionicons name="document-attach" size={20} color="#7500fc" />
              <Text style={styles.uploadButtonText}>
                {licenseImage ? "Change License Image" : "Upload License"}
              </Text>
            </TouchableOpacity>
            
            {licenseImage && (
              <Image 
                source={{ uri: licenseImage.uri }} 
                style={styles.licensePreview} 
              />
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit for Review</Text>
            )}
          </TouchableOpacity>
          {/* Logout button */}
          <TouchableOpacity 
            style={[styles.logout]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
              <Ionicons name="exit-outline" size={23} color={"red"}/>
              <Text style={{color: "red", fontSize: 16}}>Logout</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            * Your information will be reviewed before you can start accepting rides.
            This usually takes 1-2 business days.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 8,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 25,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#7500fc",
  },
  changeImageButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#7500fc",
    borderRadius: 20,
    padding: 6,
  },
  imageLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  uploadSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  uploadButtonText: {
    color: "#7500fc",
    fontWeight: "600",
    fontSize: 16,
  },
  licensePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  submitButton: {
    backgroundColor: "#7500fc",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  note: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  logout: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 12,
    marginBottom: 13,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    padding: 10,
  }
});