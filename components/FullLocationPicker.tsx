import { useTheme } from "@/contexts/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LocationSearchInputs from "./LocationSearchInputs";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pickup: any, destination: any) => void;
  initialPickup?: any;
  initialDestination?: any;
}

export default function FullLocationPicker({
  visible,
  onClose,
  onConfirm,
  initialPickup,
  initialDestination,
}: Props) {
  const { theme } = useTheme();
  const [pickup, setPickup] = useState(initialPickup || null);
  const [destination, setDestination] = useState(initialDestination || null);
  const [activeField, setActiveField] = useState<"pickup" | "destination">("pickup");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK") {
        const location = data.result.geometry.location;
        const address = data.result.formatted_address;

        if (activeField === "pickup") {
          setPickup({ lat: location.lat, lng: location.lng, address });
        } else {
          setDestination({ lat: location.lat, lng: location.lng, address });
        }
      } else {
        Alert.alert("Error", "Could not fetch location details.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to get place details.");
    }
  };

  const handlePredictionSelect = async (prediction: any) => {
  setLoading(true);
  setSelectedPrediction(prediction);
  try {
    await fetchPlaceDetails(prediction.place_id);

    // ✅ Update field's visible text immediately
    if (activeField === "pickup") {
      setPickup((prev: any) => ({
        ...prev,
        address: prediction.description,
      }));
    } else {
      setDestination((prev: any) => ({
        ...prev,
        address: prediction.description,
      }));
    }

    setPredictions([]);
  } finally {
    setLoading(false);
  }
};

  const handleConfirm = () => {
    if (!pickup || !destination) {
      Alert.alert("Missing Info", "Please select both pickup and destination");
      return;
    }
    onConfirm(pickup, destination);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Select Route</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Pickup & Destination Inputs */}
        <View style={[styles.inputsContainer, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={() => setActiveField("pickup")}>
            <LocationSearchInputs
              placeholder="Pickup location"
              iconName="locate-outline"
              iconColor={theme.primary}
              value={pickup?.address}
              onLocationSelect={(loc) => {
                setPickup(loc);
                setPredictions([]);
              }}
              showDropdown={false}
              autoFillCurrentLocation={false}
              isPickup
              onPredictionsChange={(data: any[]) => {
                if (activeField === "pickup") setPredictions(data);
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveField("destination")}>
            <LocationSearchInputs
              placeholder="Destination"
              iconName="flag-outline"
              iconColor={theme.primary}
              value={destination?.address}
              onLocationSelect={(loc) => {
                setDestination(loc);
                setPredictions([]);
              }}
              // showDropdown={false}
              autoFillCurrentLocation={false}
              isPickup
              onPredictionsChange={(data: any[]) => {
                if (activeField === "destination") setPredictions(data);
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Predictions List */}
        <View style={styles.predictionsContainer}>
          {loading ? (
            <ActivityIndicator color={theme.primary} size="large" />
          ) : predictions.length > 0 ? (
            <ScrollView keyboardShouldPersistTaps="always">
              {predictions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.predictionItem,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => handlePredictionSelect(item)}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={theme.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ color: theme.text, flex: 1 }}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noResults}>
              <Text style={{ color: theme.muted }}>
                Start typing to see suggestions...
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[styles.button, { borderColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={{ color: theme.text }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.primaryText} />
            ) : (
              <Text style={{ color: theme.primaryText }}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "600" },
  inputsContainer: { padding: 16, gap: 10 },
  predictionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  noResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  confirmButton: { borderWidth: 0 },
});
