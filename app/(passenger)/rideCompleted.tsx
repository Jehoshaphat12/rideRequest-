import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/lib/firebaseConfig";
import { formatFare } from "@/services/fareService";
import { addNotification } from "@/services/notifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Ride {
  id: string;
  pickup: any;
  dropoff: any;
  status: string;
  createdAt: any;
  completedAt: any;
  estimatedFare?: number;
  finalFare?: number;
  estimatedDuration?: string;
  estimatedDistance?: string;
  passengerId: string;
  riderId?: string;
  riderInfo?: {
    name?: string;
    profilePicture?: string;
    rating?: number;
    totalRides?: number;
    vehicle?: {
      model?: string;
      color?: string;
      plateNumber?: string;
    };
  };
  passengerRating?: number;
  passengerFeedback?: string;
}

export default function RideCompletedScreen() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ride, setRide] = useState<Ride | null>(null);
  const [rider, setRider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, darkMode } = useTheme();
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;

  useEffect(() => {
    if (!rideId) {
      Alert.alert("Error", "Ride ID not provided");
      router.back();
      return;
    }

    const fetchRideData = async () => {
      try {
        const rideDoc = await getDoc(doc(db, "rides", rideId));
        if (rideDoc.exists()) {
          const rideData = rideDoc.data() as Ride;
          setRide(rideData);

          // Check if already rated
          if (rideData.passengerRating) {
            setRating(rideData.passengerRating);
            setFeedback(rideData.passengerFeedback || "");
            setHasRated(true);
          }

          // Fetch rider details if not already in ride data
          if (rideData.riderId && !rideData.riderInfo) {
            const riderDoc = await getDoc(doc(db, "users", rideData.riderId));
            if (riderDoc.exists()) {
              setRider(riderDoc.data());
            }
          }
        } else {
          Alert.alert("Error", "Ride not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching ride data:", error);
        Alert.alert("Error", "Failed to load ride details");
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [rideId]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert("Please Rate", "Please select a star rating before submitting");
      return;
    }

    if (!rideId || !ride?.riderId) {
      Alert.alert("Error", "Cannot submit rating - missing ride information");
      return;
    }

    setSubmitting(true);
    try {
      // Update ride with rating and feedback
      await updateDoc(doc(db, "rides", rideId), {
        passengerRating: rating,
        passengerFeedback: feedback,
        ratedAt: serverTimestamp(),
      });

      // Update rider's overall rating
      const riderData = ride.riderInfo || rider;
      if (riderData) {
        const currentRating = riderData.rating || 0;
        const totalRatings = riderData.totalRatings || 0;
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

        await updateDoc(doc(db, "users", ride.riderId!), {
          rating: parseFloat(newRating.toFixed(1)),
          totalRatings: newTotalRatings,
          updatedAt: serverTimestamp(),
        });
      }

      // Create notification for rider about the rating
      const passengerName = "You"; // Since it's the passenger's own ride
      await addNotification(
        ride.riderId!,
        "new_rating",
        "New Rating Received ⭐",
        `${passengerName} rated you ${rating} stars${feedback ? `\nComment: "${feedback}"` : ""}`,
        rideId
      );

      setHasRated(true);

      if (Platform.OS === "web") {
        alert("Thank You! Your rating has been submitted successfully");
        router.replace("/(passenger)/passengerWelcomeScreen");
        return;
      }

      Alert.alert(
        "Thank You!", 
        "Your rating has been submitted successfully.",
        [{ text: "OK", onPress: () => router.replace("/(passenger)/passengerScreen") }]
      );

    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp?.toDate) return "Date not available";
    
    try {
      return timestamp.toDate().toLocaleDateString("en-US", {
        weekday: 'short',
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getRatingMessage = (rating: number) => {
    const messages: { [key: number]: string } = {
      1: "Poor - We're sorry to hear that",
      2: "Fair - We'll work to improve",
      3: "Good - Thanks for your feedback",
      4: "Great - We're glad you enjoyed it",
      5: "Excellent - Outstanding service!"
    };
    return messages[rating] || "How was your experience?";
  };

  const getAddressText = (address: any): string => {
    if (!address) return "Location not specified";
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      if (address.address) return address.address;
      if (address.formattedAddress) return address.formattedAddress;
      if (address.street && address.city) return `${address.street}, ${address.city}`;
      if (address.name) return address.name;
      
      return "Location details available";
    }
    
    return "Location not specified";
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading ride summary...
        </Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Ride not found
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

  const fare = ride.finalFare || ride.estimatedFare || 0;
  const duration = ride.estimatedDuration ? parseInt(ride.estimatedDuration) : 0;
  const riderData = ride.riderInfo || rider;

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
            Ride Completed 🎉
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Thank you for riding with us! We hope you had a great experience.
          </Text>
        </View>

        {/* Trip Summary Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Trip Summary
          </Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={24} color={theme.success} />
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                Fare
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
                {ride.estimatedDistance || "N/A"}
              </Text>
            </View>
          </View>

          {/* Detailed Breakdown */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={theme.muted} />
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Pickup:
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {getAddressText(ride.pickup)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="flag-outline" size={18} color={theme.muted} />
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Destination:
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {getAddressText(ride.dropoff)}
              </Text>
            </View>

            {ride.completedAt && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={18} color={theme.muted} />
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  Completed:
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {formatDate(ride.completedAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Driver Info Card */}
        <View style={[styles.driverCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Your Driver
          </Text>
          
          <View style={styles.driverInfoRow}>
            <Image
              source={
                riderData?.profilePicture
                  ? { uri: riderData.profilePicture }
                  : require("../../assets/images/defaultUserImg.png")
              }
              style={styles.driverImage}
              contentFit="cover"
            />
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: theme.text }]}>
                {riderData?.name || "Driver"}
              </Text>
              <Text style={[styles.driverRating, { color: theme.muted }]}>
                ⭐ {riderData?.rating?.toFixed(1) || "4.8"} ({riderData?.totalRides || "0"} rides)
              </Text>
              {riderData?.vehicle && (
                <Text style={[styles.vehicleInfo, { color: theme.muted }]}>
                  {riderData.vehicle.model} • {riderData.vehicle.color} • {riderData.vehicle.plateNumber}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Rating Section - Only show if not already rated */}
        {!hasRated && (
          <View style={[styles.ratingCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.ratingTitle, { color: theme.text }]}>
              Rate Your Driver
            </Text>
            <Text style={[styles.ratingSubtitle, { color: theme.muted }]}>
              How was your experience with {riderData?.name || "your driver"}?
            </Text>
            
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  disabled={submitting}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color="#f5c518"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.ratingMessage, { color: theme.primary }]}>
              {getRatingMessage(rating)}
            </Text>

            <TextInput
              style={[
                styles.feedbackInput, 
                { 
                  borderColor: theme.border, 
                  color: theme.text,
                  backgroundColor: theme.background
                }
              ]}
              placeholder="Leave a comment (optional)..."
              placeholderTextColor={theme.muted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.primary },
                (rating === 0 || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitRating}
              disabled={rating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Submit Rating
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.skipButton, { borderColor: theme.border }]}
              onPress={() => router.replace("/(passenger)/passengerWelcomeScreen")}
              disabled={submitting}
            >
              <Text style={[styles.skipText, { color: theme.muted }]}>
                Skip Rating
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Already Rated Message */}
        {hasRated && (
          <View style={[styles.ratedCard, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme.success} />
            <Text style={[styles.ratedTitle, { color: theme.text }]}>
              Rating Submitted
            </Text>
            <Text style={[styles.ratedSubtitle, { color: theme.muted }]}>
              Thank you for your feedback! Your {rating}-star rating helps improve our service.
            </Text>
            {feedback && (
              <View style={styles.feedbackDisplay}>
                <Text style={[styles.feedbackLabel, { color: theme.muted }]}>
                  Your comment:
                </Text>
                <Text style={[styles.feedbackText, { color: theme.text }]}>
                  "{feedback}"
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.replace("/(passenger)/rideRequest")}
          >
            <Ionicons name="home-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={() => router.push("/(passenger)/rideHistory")}
          >
            <Ionicons name="list-outline" size={20} color={theme.primary} />
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              View Ride History
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
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  driverCard: {
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
  driverInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 12,
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
  ratingMessage: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  feedbackInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    marginBottom: 20,
    fontSize: 16,
    textAlignVertical: "top",
  },
  submitButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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
  ratedCard: {
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
  ratedTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  ratedSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  feedbackDisplay: {
    width: "100%",
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
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