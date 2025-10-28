import { useTheme } from "@/contexts/ThemeContext";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { auth, db } from "@/lib/firebaseConfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { theme, darkMode } = useTheme(); // Get theme from context
  const notifications = useUserNotifications();
  const router = useRouter();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  // Animate when dropdownVisible changes
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: dropdownVisible ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [dropdownVisible]);

  const handleDeleteAll = async () => {
    if (!auth.currentUser) return;
    if(Platform.OS !== "web") {

    
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setDropdownVisible(false),
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              // Get all notification documents
              const notificationsRef = collection(
                db,
                "users",
                auth.currentUser!.uid,
                "notifications"
              );
              
              const querySnapshot = await getDocs(notificationsRef);
              
              // Delete each notification document individually
              const deletePromises = querySnapshot.docs.map((doc) => 
                deleteDoc(doc.ref)
              );
              
              await Promise.all(deletePromises);

              if (Platform.OS === "web") {
                alert("All notifications deleted ✅");
              } else {
                Alert.alert("Success", "All notifications deleted ✅");
              }
              
              setDropdownVisible(false);
            } catch (error) {
              console.error("Error deleting notifications: ", error);
              if (Platform.OS === "web") {
                alert("Error deleting notifications. Please try again.");
              } else {
                Alert.alert("Error", "Failed to delete notifications. Please try again.");
              }
            }
          },
        },
      ]
    );
    } 
  };

  // Dropdown slide + fade animation
  const dropdownStyle = {
    opacity: slideAnim,
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0], // starts slightly above, then slides down
        }),
      },
    ],
  };

  const handleMarkedAsRead = async (notifId: string) => {
    if (!auth.currentUser) return;
    const notifRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "notifications",
      notifId
    );
    await updateDoc(notifRef, { read: true });
  };

  if (!notifications || notifications.length === 0) {
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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Notifications
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={theme.muted}
          />
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.muted }]}>
            Your notifications will appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Overlay to detect outside tap */}
      {dropdownVisible && (
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

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
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notifications ({notifications.length})
        </Text>

        {/* Dropdown Menu */}
        <TouchableOpacity onPress={() => setDropdownVisible((prev) => !prev)}>
          <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
        </TouchableOpacity>

        {/* Custom Dropdown */}
        {dropdownVisible && (
          <Animated.View 
            style={[
              styles.dropdownMenu, 
              { backgroundColor: theme.card, borderColor: theme.border },
              dropdownStyle
            ]}
          >
            <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteAll}>
              <Ionicons name="trash" size={18} color={theme.danger || "red"} />
              <Text style={[styles.dropdownText, { color: theme.danger || "red" }]}>
                Clear All Notifications
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => {
              handleMarkedAsRead(item.id);
            }}
          >
            <View style={styles.notificationHeader}>
              <Ionicons
                name={getNotificationIcon(item.type)}
                size={20}
                color={getNotificationColor(item.type, theme)}
              />
              <Text style={[styles.title, { color: theme.text }]}>
                {item.title}
              </Text>
            </View>
            <Text style={[styles.body, { color: theme.muted }]}>
              {item.body}
            </Text>
            <Text style={[styles.date, { color: theme.muted }]}>
              {item.createdAt?.toDate().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// Helper function to get appropriate icon based on notification type
const getNotificationIcon = (type?: string) => {
  switch (type) {
    case "ride_accepted":
      return "car-sport";
    case "ride_completed":
      return "checkmark-circle";
    case "payment":
      return "card";
    case "promotion":
      return "gift";
    case "system":
      return "information-circle";
    default:
      return "notifications";
  }
};

// Helper function to get appropriate color based on notification type
const getNotificationColor = (type: string, theme: any) => {
  switch (type) {
    case "ride_accepted":
      return theme.success;
    case "ride_completed":
      return theme.primary;
    case "payment":
      return theme.info;
    case "promotion":
      return theme.warning;
    case "system":
      return theme.muted;
    default:
      return theme.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  navheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 20,
    borderBottomWidth: 1,
    position: "relative", // Important for dropdown positioning
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  body: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    marginTop: 8,
  },
  dropdownMenu: {
    position: "absolute",
    top: 60,
    right: 16,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "transparent", // invisible but still catches taps
    zIndex: 50,
  },
});