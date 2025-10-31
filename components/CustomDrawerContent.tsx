import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { darkMode, theme } = useTheme();
  const { top, bottom } = useSafeAreaInsets();

  // Get the current active route
  const currentRoute = props.state?.routes[props.state?.index]?.name;

  // Custom icon size
  const iconSize = 20; // Change this value to adjust icon size

  // Logout function
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(props.auth);
          } catch (error) {
            Alert.alert("Error", "Unable to logout, Please try again later.");
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 0,
        backgroundColor: theme.background,
      }}
    >
      <View
        style={[
          styles.drawerHeader,
          { backgroundColor: theme.primary, paddingTop: 30 + top },
        ]}
      >
        <View style={[styles.profileContainer]}>
          <Image
            source={
              props.profilePic
                ? { uri: props.profilePic }
                : require("..//assets/images/defaultUserImg.png")
            }
            style={{
              width: 90,
              height: 90,
              borderRadius: 40,
              borderWidth: 3,
              borderColor: "#f9f9f9",
            }}
          />
          <View>
            <Text style={styles.userName}>
              {props.userName || "Guest User"}
            </Text>
            <Text style={styles.userRole}>
              {props.userRole === "rider" ? "Rider" : "Passenger"}
            </Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          backgroundColor: theme.background,
          paddingHorizontal: 0,
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.background,
            paddingTop: 10,
            borderRadius: 40,
            width: "100%",
          }}
        >
          <DrawerItem
            label="Home"
            onPress={() => router.push("/(rider)/riderHome")}
            icon={({ color }) => (
              <Ionicons
                name={currentRoute === "riderHome" ? "home" : "home-outline"}
                size={iconSize}
                color={currentRoute === "riderHome" ? "#ffffff" : color}
              />
            )}
            style={[
              styles.drawerItem,
              currentRoute === "riderHome" && styles.activeDrawerItem,
            ]}
            labelStyle={[
              styles.drawerLabel,
              { marginLeft: 1 },
              currentRoute === "riderHome" && styles.activeDrawerLabel,
            ]}
          />
          <DrawerItem
            label="Requested Rides"
            onPress={() => router.push("/(rider)/requestedRide")}
            icon={({ color }) => (
              <Ionicons
                name={
                  currentRoute === "requestedRide"
                    ? "car-sport"
                    : "car-sport-outline"
                }
                size={iconSize}
                color={currentRoute === "requestedRide" ? "#ffffff" : color}
              />
            )}
            style={[
              styles.drawerItem,
              currentRoute === "requestedRide" && styles.activeDrawerItem,
            ]}
            labelStyle={[
              styles.drawerLabel,
              { marginLeft: 1 },
              currentRoute === "requestedRide" && styles.activeDrawerLabel,
            ]}
          />

          <DrawerItem
            label="My Profile"
            onPress={() => router.push("/(rider)/accountInfo")}
            icon={({ color }) => (
              <Ionicons
                name={
                  currentRoute === "accountInfo" ? "person" : "person-outline"
                }
                size={iconSize}
                color={currentRoute === "accountInfo" ? "#ffffff" : color}
              />
            )}
            style={[
              styles.drawerItem,
              currentRoute === "accountInfo" && styles.activeDrawerItem,
            ]}
            labelStyle={[
              styles.drawerLabel,
              { marginLeft: 1 },
              currentRoute === "accountInfo" && styles.activeDrawerLabel,
            ]}
          />

          <DrawerItem
            label="Ride History"
            onPress={() => router.push("/(rider)/rideHistory")}
            icon={({ color }) => (
              <Ionicons
                name={currentRoute === "rideHistory" ? "time" : "time-outline"}
                size={iconSize}
                color={currentRoute === "rideHistory" ? "#ffffff" : color}
              />
            )}
            style={[
              styles.drawerItem,
              currentRoute === "rideHistory" && styles.activeDrawerItem,
            ]}
            labelStyle={[
              styles.drawerLabel,
              { marginLeft: 1 },
              currentRoute === "rideHistory" && styles.activeDrawerLabel,
            ]}
          />
          <DrawerItem
            label="Delivery History"
            onPress={() => router.push("/(rider)/deliveryHistory")}
            icon={({ color }) => (
              <Ionicons
                name={
                  currentRoute === "deliveryHistory" ? "time" : "time-outline"
                }
                size={iconSize}
                color={currentRoute === "deliveryHistory" ? "#ffffff" : color}
              />
            )}
            style={[
              styles.drawerItem,
              currentRoute === "deliveryHistory" && styles.activeDrawerItem,
            ]}
            labelStyle={[
              styles.drawerLabel,
              { marginLeft: 1 },
              currentRoute === "deliveryHistory" && styles.activeDrawerLabel,
            ]}
          />

          <DrawerItem
            label="Settings"
            onPress={() => router.push("/(rider)/riderProfileSettings")}
            icon={({ color }) => (
              <Ionicons
                name={
                  currentRoute === "riderProfileSettings"
                    ? "settings"
                    : "settings-outline"
                }
                size={iconSize}
                color={
                  currentRoute === "riderProfileSettings" ? "#ffffff" : color
                }
              />
            )}
            style={[
              styles.drawerItem,
              currentRoute === "riderProfileSettings" &&
                styles.activeDrawerItem,
            ]}
            labelStyle={[
              styles.drawerLabel,
              { marginLeft: 1 },
              currentRoute === "riderProfileSettings" &&
                styles.activeDrawerLabel,
            ]}
          />
        </View>
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + bottom }]}>
        <View style={{ marginBottom: 15 }}>
          <DrawerItem
            label="Logout"
            onPress={() => {
              // Add your logout logic here
              handleLogout()
            }}
            icon={({ color }) => (
              <Ionicons name="log-out-outline" size={iconSize} color={color} />
            )}
            style={styles.drawerItem}
            labelStyle={[styles.drawerLabel, { marginLeft: 1 }]}
          />
        </View>
        <Text style={[styles.versionText, { color: theme.muted }]}>
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomRightRadius: 40,
  },
  profileContainer: {
    gap: 15,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: "column",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f9f9f9",
    textAlign: "center",
  },
  userRole: {
    fontSize: 12,
    fontWeight: "regular",
    color: "#f9f9f9",
    fontStyle: "italic",
    textAlign: "center",
  },
  drawerItem: {
    borderRadius: 12,

    marginHorizontal: 3,
    marginVertical: 2,
  },
  activeDrawerItem: {
    backgroundColor: "#7500fc", // Your active color
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: -8,
  },
  activeDrawerLabel: {
    color: "#ffffff", // White text for active items
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  versionText: {
    fontSize: 14,
    textAlign: "center",
  },
});
