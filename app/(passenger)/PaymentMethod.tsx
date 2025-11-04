import { usePayment, type PaymentMethod } from "@/contexts/PaymentContext";
import { useTheme } from "@/contexts/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type PaymentMethodWithSelection = PaymentMethod & {
  isSelected: boolean;
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const { selectedMethod, setPaymentMethod, availableMethods: methods } = usePayment();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodWithSelection[]>([]);

  // Initialize payment methods with selection state
  useEffect(() => {
    const methodsWithSelection: PaymentMethodWithSelection[] = methods.map(method => ({
      ...method,
      isSelected: method.type === selectedMethod
    }));
    setPaymentMethods(methodsWithSelection);
  }, [selectedMethod, methods]);

  const handleMethodSelect = (method: PaymentMethod) => {
    if (!method.isAvailable) {
      Alert.alert(
        'Coming Soon',
        'This payment method will be available soon!',
        [{ text: 'OK' }]
      );
      return;
    }

    setPaymentMethod(method.type);
  };

  const handleAddMomo = () => {
    Alert.alert(
      'Add Mobile Money',
      'This feature will allow you to add your Mobile Money account for seamless payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => console.log('Navigate to MOMO setup') }
      ]
    );
  };

  const getCurrentMethod = () => {
    return paymentMethods.find(method => method.type === selectedMethod) || paymentMethods[0];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header with Back Button */}
      <View style={[styles.navheader, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Current Payment Method Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Payment Method</Text>
          <View style={[styles.currentMethodCard, { backgroundColor: theme.primary + '15' }]}>
            <View style={styles.methodIconContainer}>
              <Ionicons 
                name={getCurrentMethod()?.icon as any} 
                size={24} 
                color={theme.primary} 
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.currentMethodName, { color: theme.text }]}>
                {getCurrentMethod()?.name}
              </Text>
              <Text style={[styles.currentMethodDescription, { color: theme.muted }]}>
                {getCurrentMethod()?.description}
              </Text>
            </View>
            <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>
        </View>

        {/* Available Payment Methods */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Payment Method</Text>
          <Text style={[styles.sectionDescription, { color: theme.muted }]}>
            Select how you want to pay for your rides
          </Text>
          
          {paymentMethods.map((method) => (
            <PaymentMethodOption
              key={method.id}
              method={method}
              isSelected={selectedMethod === method.type}
              onSelect={() => handleMethodSelect(method)}
              theme={theme}
            />
          ))}
        </View>

        {/* MOMO Setup Section */}
        {selectedMethod === 'momo' && (
          <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mobile Money Setup</Text>
            <Text style={[styles.sectionDescription, { color: theme.muted }]}>
              Set up your Mobile Money account for secure payments
            </Text>
            
            <TouchableOpacity 
              style={[styles.setupButton, { backgroundColor: theme.primary }]}
              onPress={handleAddMomo}
            >
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.setupButtonText}>Add Mobile Money Account</Text>
            </TouchableOpacity>
            
            <View style={styles.momoInfo}>
              <Ionicons name="information-circle-outline" size={18} color={theme.muted} />
              <Text style={[styles.momoInfoText, { color: theme.muted }]}>
                You'll need to verify your phone number and set up your MOMO account for payments.
              </Text>
            </View>
          </View>
        )}

        {/* Payment Method Details */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment Details</Text>
          
          <DetailRow 
            icon="shield-checkmark-outline"
            title="Secure Payments"
            description="All payments are encrypted and secure"
            theme={theme}
          />
          
          <DetailRow 
            icon="receipt-outline"
            title="Digital Receipts"
            description="Get instant receipts for all your rides"
            theme={theme}
          />
          
          <DetailRow 
            icon="time-outline"
            title="Instant Processing"
            description="Payments are processed immediately"
            theme={theme}
          />
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: theme.card + '80' }]}>
          <Ionicons name="help-buoy-outline" size={20} color={theme.muted} />
          <Text style={[styles.helpText, { color: theme.muted }]}>
            Need help with payments? Contact our support team for assistance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Payment Method Option Component (keep the same)
function PaymentMethodOption({ 
  method, 
  isSelected, 
  onSelect, 
  theme 
}: { 
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.methodOption,
        { 
          borderBottomColor: theme.border,
          opacity: method.isAvailable ? 1 : 0.6
        }
      ]}
      onPress={onSelect}
      disabled={!method.isAvailable}
    >
      <View style={styles.methodContent}>
        <View style={[styles.methodIcon, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name={method.icon as any} size={22} color={theme.primary} />
        </View>
        <View style={styles.methodText}>
          <Text style={[styles.methodName, { color: theme.text }]}>
            {method.name}
          </Text>
          <Text style={[styles.methodDescription, { color: theme.muted }]}>
            {method.description}
          </Text>
        </View>
        
        {!method.isAvailable && (
          <View style={[styles.comingSoonBadge, { backgroundColor: theme.muted }]}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </View>

      <View style={styles.radioContainer}>
        {isSelected ? (
          <View style={[styles.radioSelected, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
        ) : (
          <View style={[styles.radioUnselected, { borderColor: theme.muted }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// Detail Row Component (keep the same)
function DetailRow({ 
  icon, 
  title, 
  description, 
  theme 
}: { 
  icon: string;
  title: string;
  description: string;
  theme: any;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name={icon as any} size={18} color={theme.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={[styles.detailTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.detailDescription, { color: theme.muted }]}>{description}</Text>
      </View>
    </View>
  );
}

// Keep all your styles the same as before
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
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
  },
  currentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  currentMethodName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  currentMethodDescription: {
    fontSize: 14,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodText: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  momoInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  momoInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
  },
});