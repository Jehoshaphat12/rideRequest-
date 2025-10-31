import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/lib/firebaseConfig";
import { getUserProfile } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RiderProfileScreen() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme(); // Get theme from context
  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [userEmail, setUserEmail] = useState("")
  const [userContact, setUserContact] = useState("")
  const [userRole, setUserRole] = useState("")
  const [vehicleDetails, setVehicleDetails] = useState({
    model: "",
    plateNumber: "",
  });

  useEffect(() => {
    const getUserDetails = async () => {
      const profile = await getUserProfile();

      if (!profile) return;

      setUserName(profile.userName);
      setProfilePic(profile.profilePicture);
      setVehicleDetails(profile.vehicle);
      setUserEmail(profile.email)
      setUserContact(profile.phone)
      setUserRole(profile.role)
    };
    getUserDetails();
  }, []);

  // Logout rider function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header with Back Button */}
      <View
        style={[
          styles.navheader,
          {
            borderBottomColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(passenger)/passengerWelcomeScreen")}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Account Info.
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Image
            source={
              profilePic
                ? { uri: profilePic }
                : require("../../assets/images/defaultUserImg.png")
            }
            style={styles.profilePic}
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <Text style={[styles.name, { color: theme.text }]}>{userName}</Text>
            <Text style={[styles.vehicle, { color: theme.muted }]}>
              {vehicleDetails.model} • {vehicleDetails.plateNumber}
            </Text>
            <Text style={[styles.role, { color: theme.muted }]}>
              Rider Account
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/(rider)/editProfile")}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={theme.primaryText}
            />
            <Text style={[styles.editText, { color: theme.primaryText }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* Settings Options */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <OptionRow
            icon="person-outline"
            label="UserName"
            theme={theme}
            value={userName}
          />
          <OptionRow
            icon="at-outline"
            label="Email"
            value={userEmail}
            theme={theme}
          />
          <OptionRow
            icon="call-outline"
            label="Contact"
            value={userContact}
            theme={theme}
          />
          <OptionRow
            icon="bookmark-outline"
            label="Account Type"
            value={userRole === "rider" ? "Rider" : "Passenger"}
            theme={theme}
          />
          
        </View>

       
        {/* Edit Account Info Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/(passenger)/editProfile")}
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Edit Account</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.versionText, { color: theme.muted }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable row component
function OptionRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: any;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.rowContent}>
        <Ionicons name={icon} size={22} color={theme.primary} />
        <Text style={[styles.rowText, { color: theme.text }]}>{label}</Text>
      </View>
      <Text style={[styles.rowTextValue, { color: theme.muted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  navheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 45,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#eee",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  vehicle: {
    fontSize: 13,
  },
  role: {
    fontSize: 13,
    fontStyle: "italic",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  editText: {
    marginLeft: 4,
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  row: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingBottom: 8,
  },
  rowText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  rowTextValue: {
    fontSize: 15,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
