import { useTheme } from "@/contexts/ThemeContext";
import { getUserProfile } from "@/services/users";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const rideImage = require("../../assets/images/ride.png");
const deliveryImage = require("../../assets/images/delivery.png");

export default function WelcomeScreen() {
  const [profilePic, setProfilePic] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, darkMode } = useTheme();
  const router = useRouter();

  const getProfileData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return;
      setProfilePic(profile.profilePicture);
      setUserName(profile.userName);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // Get user's Profile Picture
  useEffect(() => {
    const loadProfile = async () => {
      await getProfileData();
      setLoading(false);
    };
    loadProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await getProfileData();
    setRefreshing(false);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleServicePress = (route: string) => {
    // You can add haptic feedback here if you install expo-haptics
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          barStyle={darkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
            />
            <Text style={[styles.headerText, { color: theme.text }]}>
              RideX
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconWrapper, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(passenger)/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconWrapper, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(passenger)/passengerSettings")}
            >
              <Image
                source={
                  profilePic
                    ? { uri: profilePic, cache: 'reload' }
                    : require("../../assets/images/defaultUserImg.png")
                }
                style={styles.profilePic}
                contentFit="cover"
                onError={() => setProfilePic("")}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greetings Section */}
        <View
          style={[
            styles.greetingsContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <Text style={[styles.greetingsText, { color: theme.text }]}>
            {getTimeBasedGreeting()}
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {userName}
          </Text>
          <Text style={[styles.question, { color: theme.text }]}>
            What would you like to do today?
          </Text>
        </View>

        {/* Services Section */}
        <View style={[styles.servicesContainer, { borderColor: theme.border }]}>
          {/* Ride Service Card */}
          <TouchableOpacity
            style={[
              styles.service,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => handleServicePress("/(passenger)/rideRequest")}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceTextContainer}>
                  <Ionicons name="car-sport" size={32} color={theme.primary} />
                  <Text style={[styles.serviceText, { color: theme.text }]}>
                    Request a ride
                  </Text>
                  <Text
                    style={[styles.serviceDescription, { color: theme.muted }]}
                  >
                    Get where you need to go quickly and safely
                  </Text>
                </View>
                <View
                  style={[
                    styles.serviceButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={24}
                    color={theme.primaryText}
                  />
                </View>
              </View>
              <Image
                source={rideImage}
                style={styles.backgroundImage}
                contentFit="contain"
              />
            </View>
          </TouchableOpacity>

          {/* Delivery Service Card */}
          <TouchableOpacity
            style={[
              styles.service,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => handleServicePress("/(passenger)/requestDelivery")}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceTextContainer}>
                  <Ionicons name="cube" size={32} color={theme.primary} />
                  <Text style={[styles.serviceText, { color: theme.text }]}>
                    Deliver or receive a package
                  </Text>
                  <Text
                    style={[styles.serviceDescription, { color: theme.muted }]}
                  >
                    Send or receive items across town
                  </Text>
                </View>
                <View
                  style={[
                    styles.serviceButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={24}
                    color={theme.primaryText}
                  />
                </View>
              </View>
              <Image
                source={deliveryImage}
                style={styles.backgroundImage}
                contentFit="contain"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Section */}
        <View style={[styles.quickActions, { borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(passenger)/rideHistory")}
            >
              <Ionicons name="time-outline" size={24} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Ride History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => router.push("/(passenger)/deliveryHistory")}
            >
              <Ionicons name="cube-outline" size={24} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Delivery History
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 35,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 20 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  greetingsContainer: {
    borderRadius: 20,
    padding: 20,
    paddingTop: 25,
    flexDirection: "column",
  },
  greetingsText: {
    fontSize: 20,
    padding: 0,
  },
  userName: {
    padding: 0,
    fontSize: 28,
    fontWeight: "600",
  },
  question: {
    paddingTop: 25,
    fontSize: 16,
  },
  servicesContainer: {
    padding: 15,
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 20,
    gap: 10,
  },
  service: {
    height: 300,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
  },
  serviceContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  serviceText: {
    fontSize: 25,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginTop: 8,
    maxWidth: "80%",
    lineHeight: 18,
  },
  serviceButton: {
    padding: 15,
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  backgroundImage: {
    width: "100%",
    height: 120,
    alignSelf: "center",
    marginTop: 10,
  },
  quickActions: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
