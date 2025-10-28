// /app/(customer)/requestDelivery.tsx
import LocationPicker from '@/components/LocationPicker';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { auth } from '@/lib/firebaseConfig';
import { createDeliveryRequest } from '@/services/delivery';
import { calculateDeliveryFare, calculateRouteDetails } from '@/services/fareService';
import { reverseGeocode } from '@/services/geocodingService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SelectedLocation {
  address: string;
  lat: number;
  lng: number;
}

export default function RequestDeliveryScreen() {
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const { location: currentLocation } = useCurrentLocation();
  
  const [loading, setLoading] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);
  const [packageSize, setPackageSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [urgent, setUrgent] = useState(false);
  const [fragile, setFragile] = useState(false);
  
  // Location picker states
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState<'pickup' | 'dropoff'>('pickup');
  
  // Form state
  const [form, setForm] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    recipientName: '',
    recipientPhone: '',
    packageDescription: '',
    instructions: '',
    weight: '',
  });

  const [locations, setLocations] = useState<{
    pickup: SelectedLocation | null;
    dropoff: SelectedLocation | null;
  }>({
    pickup: null,
    dropoff: null
  });

  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);

  // Open location picker
  const openLocationPicker = (type: 'pickup' | 'dropoff') => {
    setLocationPickerType(type);
    setLocationPickerVisible(true);
  };

  // Handle location selection
  const handleLocationSelect = (location: SelectedLocation) => {
    if (locationPickerType === 'pickup') {
      setForm(prev => ({ ...prev, pickupAddress: location.address }));
      setLocations(prev => ({ ...prev, pickup: location }));
    } else {
      setForm(prev => ({ ...prev, dropoffAddress: location.address }));
      setLocations(prev => ({ ...prev, dropoff: location }));
    }
    setEstimatedFare(null); // Reset fare when locations change
  };

  // Use current location for pickup
  const useCurrentLocationForPickup = async () => {
    if (!currentLocation) {
      Alert.alert('Location Error', 'Unable to get your current location');
      return;
    }

    try {
      const address = await reverseGeocode(
        currentLocation.coords.latitude, 
        currentLocation.coords.longitude
      );
      
      setForm(prev => ({ ...prev, pickupAddress: address }));
      setLocations(prev => ({
        ...prev,
        pickup: {
          address,
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude
        }
      }));
      setEstimatedFare(null);
    } catch (error) {
      Alert.alert('Error', 'Could not get address for your current location');
    }
  };

  const handleEstimateFare = async () => {
    if (!locations.pickup || !locations.dropoff) {
      Alert.alert('Error', 'Please select both pickup and delivery locations');
      return;
    }

    setCalculatingFare(true);
    try {
      const route = await calculateRouteDetails(
        { lat: locations.pickup.lat, lng: locations.pickup.lng },
        { lat: locations.dropoff.lat, lng: locations.dropoff.lng }
      );

      const fare = calculateDeliveryFare(
        route.distance,
        route.duration,
        packageSize,
        { urgent, fragile }
      );
      
      setEstimatedFare(fare.totalFare);
      
    } catch (error: any) {
      console.error('Error estimating fare:', error);
      Alert.alert('Error', error.message || 'Failed to estimate delivery fare');
    } finally {
      setCalculatingFare(false);
    }
  };

  const handleRequestDelivery = async () => {
    // Enhanced validation
    if (!locations.pickup || !locations.dropoff) {
      Alert.alert('Error', 'Please select both pickup and delivery locations');
      return;
    }

    if (!form.recipientName.trim() || !form.recipientPhone.trim()) {
      Alert.alert('Error', 'Please enter recipient name and phone number');
      return;
    }

    if (!estimatedFare) {
      Alert.alert('Error', 'Please estimate fare first');
      return;
    }

    // Phone number validation
    const phoneRegex = /^(\+233|0)[235]\d{8}$/;
    if (!phoneRegex.test(form.recipientPhone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid Ghanaian phone number');
      return;
    }

    setLoading(true);
    try {
      const customerId = auth.currentUser?.uid;
      if (!customerId) throw new Error('Please log in to request delivery');

      const deliveryData = {
        customerId,
        pickup: {
          address: locations.pickup.address,
          lat: locations.pickup.lat,
          lng: locations.pickup.lng,
          contact: {
            name: 'Customer', // Would come from user profile
            phone: 'Customer Phone', // Would come from user profile
          },
        },
        dropoff: {
          address: locations.dropoff.address,
          lat: locations.dropoff.lat,
          lng: locations.dropoff.lng,
          contact: {
            name: form.recipientName.trim(),
            phone: form.recipientPhone.trim(),
          },
        },
        packageDetails: {
          size: packageSize,
          description: form.packageDescription.trim(),
          fragile,
          weight: form.weight ? parseFloat(form.weight) : undefined,
        },
        urgent,
        instructions: form.instructions.trim(),
        estimatedFare,
        status: 'pending',
        createdAt: new Date(),
      };

      const deliveryId = await createDeliveryRequest(deliveryData);
      
      Alert.alert(
        'Delivery Requested!', 
        `Your delivery has been scheduled. Estimated fee: GHS ${estimatedFare.toFixed(2)}\n\nRiders in your area will be notified.`,
        [{ 
          text: 'Track Delivery', 
          onPress: () => router.push(`/(passenger)/deliveryTracking?deliveryId=${deliveryId}`) 
        }]
      );
      
      // Reset form
      setForm({
        pickupAddress: '',
        dropoffAddress: '',
        recipientName: '',
        recipientPhone: '',
        packageDescription: '',
        instructions: '',
        weight: '',
      });
      setLocations({ pickup: null, dropoff: null });
      setEstimatedFare(null);
      
    } catch (error: any) {
      console.error('Error requesting delivery:', error);
      Alert.alert('Error', error.message || 'Failed to request delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canRequestDelivery = locations.pickup && locations.dropoff && 
                            form.recipientName.trim() && 
                            form.recipientPhone.trim() && 
                            estimatedFare;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
                  Request Delivery
                </Text>
                <View style={styles.headerSpacer} />
              </View>
        
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Request Delivery</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Professional package delivery service
          </Text>
        </View>

        {/* Location Selection */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Delivery Locations
          </Text>
          
          {/* Pickup Location */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Text style={[styles.label, { color: theme.text }]}>Pickup Location *</Text>
              <TouchableOpacity onPress={useCurrentLocationForPickup}>
                <Text style={[styles.useCurrentText, { color: theme.primary }]}>
                  Use Current Location
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.locationInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border 
              }]}
              onPress={() => openLocationPicker('pickup')}
            >
              <Ionicons name="business-outline" size={20} color={theme.primary} />
              <Text style={[
                styles.locationText, 
                { color: form.pickupAddress ? theme.text : theme.muted }
              ]}>
                {form.pickupAddress || 'Select pickup location...'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Dropoff Location */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Delivery Location *</Text>
            <TouchableOpacity
              style={[styles.locationInput, { 
                backgroundColor: theme.background, 
                borderColor: theme.border 
              }]}
              onPress={() => openLocationPicker('dropoff')}
            >
              <Ionicons name="home-outline" size={20} color={theme.primary} />
              <Text style={[
                styles.locationText, 
                { color: form.dropoffAddress ? theme.text : theme.muted }
              ]}>
                {form.dropoffAddress || 'Select delivery location...'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Package Size Selection */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Package Size</Text>
          <View style={styles.sizeOptions}>
            {(['small', 'medium', 'large'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeOption,
                  { borderColor: theme.border },
                  packageSize === size && [styles.sizeOptionSelected, { backgroundColor: theme.primary }]
                ]}
                onPress={() => setPackageSize(size)}
              >
                <Ionicons 
                  name="cube-outline" 
                  size={24} 
                  color={packageSize === size ? theme.primaryText : theme.text} 
                />
                <Text style={[
                  styles.sizeText,
                  { color: packageSize === size ? theme.primaryText : theme.text }
                ]}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Options */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Options</Text>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setUrgent(!urgent)}
          >
            <Ionicons 
              name={urgent ? "flash" : "flash-outline"} 
              size={24} 
              color={urgent ? theme.warning : theme.text} 
            />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Urgent Delivery</Text>
              <Text style={[styles.optionSubtitle, { color: theme.muted }]}>
                Faster delivery for an additional fee
              </Text>
            </View>
            <Ionicons 
              name={urgent ? "checkbox" : "square-outline"} 
              size={24} 
              color={urgent ? theme.primary : theme.border} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setFragile(!fragile)}
          >
            <Ionicons 
              name={fragile ? "warning" : "warning-outline"} 
              size={24} 
              color={fragile ? theme.warning : theme.text} 
            />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Fragile Items</Text>
              <Text style={[styles.optionSubtitle, { color: theme.muted }]}>
                Extra care for delicate items
              </Text>
            </View>
            <Ionicons 
              name={fragile ? "checkbox" : "square-outline"} 
              size={24} 
              color={fragile ? theme.primary : theme.border} 
            />
          </TouchableOpacity>
        </View>

        {/* Delivery Details */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Recipient Name *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background, 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              placeholder="Who will receive the package"
              placeholderTextColor={theme.muted}
              value={form.recipientName}
              onChangeText={(text) => setForm(prev => ({ ...prev, recipientName: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Recipient Phone *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background, 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              placeholder="Recipient's phone number"
              placeholderTextColor={theme.muted}
              value={form.recipientPhone}
              onChangeText={(text) => setForm(prev => ({ ...prev, recipientPhone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Package Description</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background, 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              placeholder="What's in the package"
              placeholderTextColor={theme.muted}
              value={form.packageDescription}
              onChangeText={(text) => setForm(prev => ({ ...prev, packageDescription: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background, 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              placeholder="Package weight in kilograms"
              placeholderTextColor={theme.muted}
              value={form.weight}
              onChangeText={(text) => setForm(prev => ({ ...prev, weight: text }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Special Instructions</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.background, 
                color: theme.text, 
                borderColor: theme.border 
              }]}
              placeholder="Any special instructions for the rider"
              placeholderTextColor={theme.muted}
              value={form.instructions}
              onChangeText={(text) => setForm(prev => ({ ...prev, instructions: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Fare Estimate */}
        {estimatedFare && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Estimated Fare</Text>
            <View style={styles.fareContainer}>
              <Text style={[styles.fareAmount, { color: theme.primary }]}>
                GHS {estimatedFare.toFixed(2)}
              </Text>
              <Text style={[styles.fareNote, { color: theme.muted }]}>
                Final fare may vary based on actual route
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.estimateButton, 
              { backgroundColor: theme.card, borderColor: theme.primary },
              (!locations.pickup || !locations.dropoff) && { opacity: 0.6 }
            ]}
            onPress={handleEstimateFare}
            disabled={calculatingFare || !locations.pickup || !locations.dropoff}
          >
            <Text style={[styles.estimateButtonText, { color: theme.primary }]}>
              {calculatingFare ? 'Calculating...' : 'Estimate Fare'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.requestButton, 
              { backgroundColor: theme.primary },
              (!canRequestDelivery || loading) && { opacity: 0.6 }
            ]}
            onPress={handleRequestDelivery}
            disabled={!canRequestDelivery || loading}
          >
            <Text style={[styles.requestButtonText, { color: theme.primaryText }]}>
              {loading ? 'Requesting...' : 'Request Delivery'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location Picker Modal */}
        <LocationPicker
          visible={locationPickerVisible}
          onClose={() => setLocationPickerVisible(false)}
          onLocationSelect={handleLocationSelect}
          initialAddress={locationPickerType === 'pickup' ? form.pickupAddress : form.dropoffAddress}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  useCurrentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sizeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  sizeOptionSelected: {
    // backgroundColor set dynamically
  },
  sizeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  fareContainer: {
    alignItems: 'center',
    padding: 16,
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  fareNote: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionContainer: {
    gap: 12,
    marginBottom: 24,
  },
  estimateButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  estimateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});