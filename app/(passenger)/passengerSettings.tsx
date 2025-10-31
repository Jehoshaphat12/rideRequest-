import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/lib/firebaseConfig";
import { getUserProfile } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
export default function PassengerProfileScreen() {
  const router = useRouter();
  const { theme, darkMode, toggleDarkMode } = useTheme(); // Get theme from context
  const [userName, setUserName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/"); // Navigate to login screen
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get current user info
  useEffect(() => {
    const getUserDetails = async () => {
      const profile = await getUserProfile();

      if (!profile) return;

      setUserName(profile.userName);
      setUserEmail(profile.email);
      setProfilePic(profile.profilePicture);
    };
    getUserDetails();
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
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
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.text }]}
        >
          Profile & Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
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
            <Text style={[styles.name, { color: theme.text }]}>
              {userName}
            </Text>
            <Text style={[styles.email, { color: theme.muted }]}>
              {userEmail}
            </Text>
            <Text
              style={[styles.vehicle, { color: theme.muted }]}
            >
              Passenger Account
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push("/(passenger)/editProfile")}
          >
            <Ionicons name="create-outline" size={18} color={theme.primaryText} />
            <Text style={[styles.editText, { color: theme.primaryText }]}>Edit</Text>
          </TouchableOpacity>
        </View>

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
            label="Account Info"
            theme={theme}
            onPress={() => router.push("/(passenger)/accountInfo")}
          />
          <OptionRow
            icon="time-outline"
            label="Ride History"
            theme={theme}
            onPress={() => router.push("/rideHistory")}
          />
          <OptionRow
            icon="time-outline"
            label="Delivery History"
            theme={theme}
            onPress={() => router.push("/deliveryHistory")}
          />
          <OptionRow
            icon="card-outline"
            label="Payment Methods"
            theme={theme}
            onPress={() => router.push("/(passenger)/rideRequest")}
          />
          <OptionRow
            icon="help-circle-outline"
            label="Help & Support"
            theme={theme}
            onPress={() => router.push("/(passenger)/help&Support")}
          />
          <OptionRow
            icon="notifications-outline"
            label="Notifications"
            theme={theme}
            onPress={() => router.push("/(passenger)/notifications")}
          />

          {/* Dark Mode Toggle */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowContent}>
              <Ionicons
                name={darkMode ? "moon" : "moon-outline"}
                size={22}
                color={theme.primary}
              />
              <Text
                style={[styles.rowText, { color: theme.text }]}
              >
                Dark Mode
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              thumbColor={darkMode ? theme.primary : "#f4f3f4"}
              trackColor={{ false: "#767577", true: theme.primary + "80" }} // 80 = 50% opacity
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        {/* Additional Settings Section */}
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
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            theme={theme}
            onPress={() => router.push("/")}
          />
          <OptionRow
            icon="language-outline"
            label="Language"
            theme={theme}
            onPress={() => router.push("/")}
          />
          <OptionRow
            icon="information-circle-outline"
            label="About App"
            theme={theme}
            onPress={() => router.push("/")}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: theme.danger },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text
          style={[styles.versionText, { color: theme.muted }]}
        >
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
  theme,
  onPress,
}: {
  icon: string;
  label: string;
  theme: any;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.border }]}
      onPress={onPress}
    >
      <View style={styles.rowContent}>
        <Ionicons name={icon as any} size={22} color={theme.primary} />
        <Text style={[styles.rowText, { color: theme.text }]}>
          {label}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.muted}
      />
    </TouchableOpacity>
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
    paddingTop: 20,
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
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  vehicle: {
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
    flexDirection: "row",
    alignItems: "center",
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
  },
  rowText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
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