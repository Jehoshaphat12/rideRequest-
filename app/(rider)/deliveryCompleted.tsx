import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { addNotification } from "@/services/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeliveryCompletedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme();
  const deliveryId = Array.isArray(params.deliveryId) ? params.deliveryId[0] : params.deliveryId;

  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!deliveryId) {
      Alert.alert("Error", "Delivery ID not provided");
      router.back();
      return;
    }

    const fetchDeliveryData = async () => {
      try {
        const deliveryDoc = await getDoc(doc(db, "deliveries", deliveryId));
        if (deliveryDoc.exists()) {
          const deliveryData = deliveryDoc.data();
          setDelivery(deliveryData);
          
          // Add notification for completed delivery
          await addNotification(
            deliveryData.riderId,
            "delivery_completed",
            "Delivery Completed Successfully 🎉",
            `You earned ${formatFare(deliveryData.finalFare || deliveryData.estimatedFare || 0)}`,
            deliveryId
          );
        } else {
          Alert.alert("Error", "Delivery not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching delivery data:", error);
        Alert.alert("Error", "Failed to load delivery details");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryData();
  }, [deliveryId]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert("Please Rate", "Please select a star rating before submitting");
      return;
    }

    if (!deliveryId || !delivery?.customerId) {
      Alert.alert("Error", "Cannot submit rating - missing delivery information");
      return;
    }

    setSubmittingRating(true);
    try {
      // Update delivery with rating
      // You'll need to implement this in your deliveries service
      // await updateDeliveryRating(deliveryId, rating, "rider");
      
      Alert.alert(
        "Thank You!", 
        "Your rating has been submitted successfully.",
        [{ text: "OK", onPress: () => router.replace("/(rider)/riderHome") }]
      );
    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getPackageSizeIcon = (size?: string) => {
    switch (size) {
      case "small":
        return "cube-outline";
      case "medium":
        return "cube";
      case "large":
        return "cube-sharp";
      default:
        return "cube-outline";
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading delivery summary...
        </Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Delivery not found
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fare = delivery.finalFare || delivery.estimatedFare || 0;
  const duration = delivery.estimatedDuration ? parseInt(delivery.estimatedDuration) : 25;
  const distance = delivery.estimatedDistance || "8.4 km";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Section */}
        <View style={styles.successSection}>
          <Image
            source={require("../../assets/images/confirm.png")}
            style={styles.successImage}
            resizeMode="contain"
          />
          
          <Text style={[styles.title, { color: theme.text }]}>
            Delivery Completed 🎉
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Great job! The package has been delivered successfully.
          </Text>
        </View>

        {/* Delivery Summary Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Delivery Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={24} color={theme.success} />
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                Earnings
              </Text>
              <Text style={[styles.summaryValue, { color: theme.success }]}>
                {formatFare(fare)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={24} color={theme.primary} />
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                Duration
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {formatDuration(duration)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="trending-up-outline" size={24} color={theme.primary} />
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                Distance
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {distance}
              </Text>
            </View>
          </View>

          {/* Package Details */}
          {delivery.packageDetails && (
            <View style={styles.packageSection}>
              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
                Package Details
              </Text>
              
              <View style={styles.packageInfo}>
                <View style={styles.packageRow}>
                  <Ionicons 
                    name={getPackageSizeIcon(delivery.packageDetails.size)} 
                    size={18} 
                    color={theme.primary} 
                  />
                  <Text style={[styles.packageLabel, { color: theme.muted }]}>
                    Size:
                  </Text>
                  <Text style={[styles.packageValue, { color: theme.text }]}>
                    {delivery.packageDetails.size ? 
                      delivery.packageDetails.size.charAt(0).toUpperCase() + delivery.packageDetails.size.slice(1) 
                      : "Not specified"
                    }
                  </Text>
                </View>

                {delivery.packageDetails.weight && (
                  <View style={styles.packageRow}>
                    <Ionicons name="barbell-outline" size={18} color={theme.primary} />
                    <Text style={[styles.packageLabel, { color: theme.muted }]}>
                      Weight:
                    </Text>
                    <Text style={[styles.packageValue, { color: theme.text }]}>
                      {delivery.packageDetails.weight} kg
                    </Text>
                  </View>
                )}

                {delivery.packageDetails.fragile && (
                  <View style={styles.packageRow}>
                    <Ionicons name="warning-outline" size={18} color={theme.warning} />
                    <Text style={[styles.packageLabel, { color: theme.muted }]}>
                      Type:
                    </Text>
                    <Text style={[styles.packageValue, { color: theme.warning }]}>
                      Fragile
                    </Text>
                  </View>
                )}

                {delivery.urgent && (
                  <View style={styles.packageRow}>
                    <Ionicons name="flash-outline" size={18} color={theme.warning} />
                    <Text style={[styles.packageLabel, { color: theme.muted }]}>
                      Priority:
                    </Text>
                    <Text style={[styles.packageValue, { color: theme.warning }]}>
                      Urgent Delivery
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Delivery Locations */}
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
              Delivery Route
            </Text>

            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={18} color={theme.muted} />
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Pickup:
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {delivery.pickup?.address || "Pickup location"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="home-outline" size={18} color={theme.muted} />
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Delivery:
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {delivery.dropoff?.address || "Delivery location"}
              </Text>
            </View>

            {delivery.dropoffContact?.name && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color={theme.muted} />
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  Recipient:
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {delivery.dropoffContact.name}
                </Text>
              </View>
            )}

            {delivery.completedAt && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color={theme.muted} />
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  Completed:
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {new Date(delivery.completedAt.toDate()).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Package Description */}
          {delivery.packageDetails?.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionSubtitle, { color: theme.text }]}>
                Package Description
              </Text>
              <Text style={[styles.descriptionText, { color: theme.muted }]}>
                {delivery.packageDetails.description}
              </Text>
            </View>
          )}
        </View>

        {/* Customer Rating Section */}
        <View style={[styles.ratingCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.ratingTitle, { color: theme.text }]}>
            Rate This Delivery
          </Text>
          <Text style={[styles.ratingSubtitle, { color: theme.muted }]}>
            How was your experience with this delivery?
          </Text>
          
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                disabled={submittingRating}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={32}
                  color="#f5c518"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.ratingHint, { color: theme.muted }]}>
            {rating === 0 ? "Tap a star to rate" : `You rated ${rating} star${rating !== 1 ? 's' : ''}`}
          </Text>

          <TouchableOpacity
            style={[
              styles.ratingButton,
              { backgroundColor: theme.primary },
              (rating === 0 || submittingRating) && styles.ratingButtonDisabled,
            ]}
            onPress={handleSubmitRating}
            disabled={rating === 0 || submittingRating}
          >
            {submittingRating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ratingButtonText}>
                Submit Rating
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.skipButton, { borderColor: theme.border }]}
            onPress={() => router.replace("/(rider)/riderHome")}
            disabled={submittingRating}
          >
            <Text style={[styles.skipText, { color: theme.muted }]}>
              Skip Rating
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.replace("/(rider)/riderHome")}
          >
            <Ionicons name="home-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={() => router.push("/(rider)/deliveryHistory")}
          >
            <Ionicons name="list-outline" size={20} color={theme.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              View Delivery History
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "600",
  },
  successSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  successImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  packageSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  packageInfo: {
    gap: 8,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageLabel: {
    fontSize: 14,
    fontWeight: "500",
    minWidth: 60,
  },
  packageValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  detailsSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontWeight: "600",
    fontSize: 14,
    minWidth: 70,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  ratingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  ratingSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  starContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  ratingHint: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  ratingButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  ratingButtonDisabled: {
    opacity: 0.6,
  },
  ratingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});