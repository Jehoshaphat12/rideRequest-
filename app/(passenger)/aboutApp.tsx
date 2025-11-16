import { useTheme } from "@/contexts/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutAppScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const handleContactSupport = () => {
    router.push("/(passenger)/help&Support");
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>About the App</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* App Header Section */}
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.appIconContainer}>
            <View style={[styles.appIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="car-sport" size={40} color="#fff" />
            </View>
          </View>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: theme.text }]}>RideX</Text>
            <Text style={[styles.appTagline, { color: theme.muted }]}>Your reliable ride-hailing partner</Text>
            <Text style={[styles.version, { color: theme.primary }]}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About RideX</Text>
          <Text style={[styles.description, { color: theme.text }]}>
            RideX is a modern, user-friendly ride-hailing application designed to connect passengers 
            with reliable drivers in their area. Our mission is to provide safe, affordable, and convenient 
            transportation solutions for everyone.
          </Text>
        </View>

        {/* Features Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Features</Text>
          
          <FeatureRow 
            icon="navigate" 
            title="Real-time Ride Booking"
            description="Instantly book rides with nearby drivers"
            theme={theme}
          />
          
          <FeatureRow 
            icon="map" 
            title="Live Tracking"
            description="Track your driver in real-time"
            theme={theme}
          />
          
          <FeatureRow 
            icon="shield-checkmark" 
            title="Safe & Secure"
            description="Verified drivers and emergency features"
            theme={theme}
          />
          
          <FeatureRow 
            icon="card" 
            title="Multiple Payment Options"
            description="Cash, card, and digital wallet support"
            theme={theme}
          />
          
          <FeatureRow 
            icon="star" 
            title="Rating System"
            description="Rate your experience after each ride"
            theme={theme}
          />
        </View>

        {/* Links Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Legal & Support</Text>
          
          <OptionRow
            icon="document-text-outline"
            label="Terms of Service"
            theme={theme}
            onPress={() => handleOpenLink('https://yourapp.com/terms')}
          />
          
          <OptionRow
            icon="lock-closed-outline"
            label="Privacy Policy"
            theme={theme}
            onPress={() => handleOpenLink('https://yourapp.com/privacy')}
          />
          
          <OptionRow
            icon="help-buoy-outline"
            label="Help & Support"
            theme={theme}
            onPress={handleContactSupport}
          />
          
          <OptionRow
            icon="mail-outline"
            label="Contact Us"
            theme={theme}
            onPress={() => handleOpenLink('mailto:support@rideexpress.com')}
          />
        </View>

        {/* Company Info */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Company</Text>
          <Text style={[styles.companyInfo, { color: theme.text }]}>
            RideX Technologies Inc.{"\n"}
            Building the future of transportation
          </Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleOpenLink('https://twitter.com/rideexpress')}
            >
              <Ionicons name="logo-twitter" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleOpenLink('https://facebook.com/rideexpress')}
            >
              <Ionicons name="logo-facebook" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleOpenLink('https://instagram.com/rideexpress')}
            >
              <Ionicons name="logo-instagram" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleOpenLink('https://linkedin.com/company/rideexpress')}
            >
              <Ionicons name="logo-linkedin" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: theme.muted }]}>
          © 2025 RideX. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Feature Row Component
function FeatureRow({ icon, title, description, theme }: { 
  icon: string; 
  title: string; 
  description: string; 
  theme: any;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name={icon as any} size={20} color={theme.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: theme.muted }]}>{description}</Text>
      </View>
    </View>
  );
}

// Reusable Option Row Component (same as in your profile)
function OptionRow({ icon, label, theme, onPress }: {
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
        <Text style={[styles.rowText, { color: theme.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.muted} />
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
  appIconContainer: {
    marginRight: 16,
  },
  appIcon: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    marginBottom: 8,
  },
  version: {
    fontSize: 13,
    fontWeight: "600",
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
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  companyInfo: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  socialButton: {
    padding: 12,
    marginHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  copyright: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
});