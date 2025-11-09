import { useTheme } from "@/contexts/ThemeContext";
import { formatFare } from "@/services/fareService";
import { calculateDistance } from "@/utils/LocationUtiles";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type LocationPoint = {
  lat: number;
  lng: number;
  address: string;
};

type ServiceRequest = {
  id: string;
  type: "ride" | "delivery";
  pickup: LocationPoint;
  dropoff: LocationPoint;
  estimatedFare?: number;
  estimatedDistance?: string;
  estimatedDuration?: string;
  createdAt: any;
  receivedAt: string;
  passengerInfo?: {
    name: string;
    profilePicture?: string;
    rating?: number;
    totalRides?: number;
  };
  packageDetails?: {
    size: string;
    description?: string;
    fragile?: boolean;
  };
  urgent?: boolean;
};

type RideDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
};

export default function RideDetailsModal({
  visible,
  onClose,
  request,
  currentLocation,
}: RideDetailsModalProps) {
  const { theme, darkMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!request) return null;

  const distance = currentLocation
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        request.pickup.lat,
        request.pickup.lng
      )
    : 0;

  const getRequestTime = () => {
    try {
      if (request.createdAt?.toDate) {
        return request.createdAt.toDate().toLocaleTimeString();
      } else if (request.createdAt?.seconds) {
        return new Date(request.createdAt.seconds * 1000).toLocaleTimeString();
      }
      return "Unknown time";
    } catch (error) {
      return "Unknown time";
    }
  };

  const renderRideDetails = () => (
    <>
      {/* Passenger Info */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Passenger Information
        </Text>
        <View style={styles.passengerSection}>
          <Image
            source={
              request.passengerInfo?.profilePicture
                ? { uri: request.passengerInfo.profilePicture }
                : require("@/assets/images/defaultUserImg.png")
            }
            style={styles.passengerAvatar}
            contentFit="cover"
          />
          <View style={styles.passengerInfo}>
            <Text style={[styles.passengerName, { color: theme.text }]}>
              {request.passengerInfo?.name || "Passenger"}
            </Text>
            <View style={styles.ratingSection}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.muted }]}>
                {request.passengerInfo?.rating || "New"} •{" "}
                {request.passengerInfo?.totalRides || 0} rides
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ride Information */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Ride Information
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {request.estimatedDuration || "Calculating..."}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>
              Duration
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {request.estimatedFare
                ? formatFare(request.estimatedFare)
                : "Calculating..."}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>
              Estimated Fare
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="trending-up-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {request.estimatedDistance || "Calculating..."}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>
              Distance
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderDeliveryDetails = () => (
    <>
      {/* Package Information */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Package Details
        </Text>
        <View style={styles.packageInfo}>
          <View style={styles.packageSize}>
            <Ionicons name="cube-outline" size={20} color={theme.primary} />
            <Text style={[styles.packageSizeText, { color: theme.text }]}>
              {request.packageDetails?.size || "Medium"}
            </Text>
          </View>
          
          {request.packageDetails?.fragile && (
            <View style={[styles.fragileBadge, { backgroundColor: theme.warning }]}>
              <Ionicons name="warning-outline" size={14} color="#fff" />
              <Text style={styles.fragileText}>Fragile</Text>
            </View>
          )}
        </View>

        {request.packageDetails?.description && (
          <View style={styles.descriptionBox}>
            <Text style={[styles.descriptionText, { color: theme.muted }]}>
              {request.packageDetails.description}
            </Text>
          </View>
        )}
      </View>

      {/* Delivery Information */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Delivery Information
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {request.estimatedDuration || "Calculating..."}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>
              Estimated Time
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {request.estimatedFare
                ? formatFare(request.estimatedFare)
                : "Calculating..."}
            </Text>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>
              Delivery Fee
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
        translucent={true}
      />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: theme.background },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <View style={styles.serviceBadge}>
                <Ionicons
                  name={request.type === "ride" ? "car-sport" : "cube"}
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.serviceTitle, { color: theme.text }]}>
                  {request.type === "ride" ? "Ride Request" : "Delivery Request"}
                </Text>
              </View>
              
              {request.urgent && (
                <View style={[styles.urgentBadge, { backgroundColor: theme.warning }]}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Distance & Time */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.distanceTimeRow}>
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate-outline" size={16} color={theme.primary} />
                  <Text style={[styles.distanceText, { color: theme.primary }]}>
                    {distance.toFixed(1)} km away
                  </Text>
                </View>
                
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={14} color={theme.muted} />
                  <Text style={[styles.timeText, { color: theme.muted }]}>
                    Requested at {getRequestTime()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Locations */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Locations
              </Text>
              
              <View style={styles.locationSection}>
                {/* Pickup */}
                <View style={styles.locationRow}>
                  <View style={[styles.locationIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="location-outline" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={[styles.locationLabel, { color: theme.muted }]}>
                      Pickup Location
                    </Text>
                    <Text style={[styles.locationAddress, { color: theme.text }]}>
                      {request.pickup?.address || "Pickup location"}
                    </Text>
                  </View>
                </View>

                {/* Destination */}
                <View style={styles.locationRow}>
                  <View style={[styles.locationIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons 
                      name={request.type === "ride" ? "flag-outline" : "home-outline"} 
                      size={20} 
                      color={theme.primary} 
                    />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text style={[styles.locationLabel, { color: theme.muted }]}>
                      {request.type === "ride" ? "Destination" : "Delivery Address"}
                    </Text>
                    <Text style={[styles.locationAddress, { color: theme.text }]}>
                      {request.dropoff?.address || "Destination"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Type-specific details */}
            {request.type === "ride" ? renderRideDetails() : renderDeliveryDetails()}

            {/* Additional Info */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Additional Information
              </Text>
              <View style={styles.additionalInfo}>
                <Ionicons name="information-circle-outline" size={16} color={theme.muted} />
                <Text style={[styles.additionalInfoText, { color: theme.muted }]}>
                  {request.type === "ride" 
                    ? "Accept this ride to start navigating to the pickup location."
                    : "Handle this package with care and deliver to the specified address."
                  }
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  distanceTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  locationSection: {
    gap: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 18,
  },
  passengerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passengerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  packageInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  packageSize: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageSizeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  fragileBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  fragileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  descriptionBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 18,
  },
  additionalInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  additionalInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
});