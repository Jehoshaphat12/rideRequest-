import { useTheme } from "@/contexts/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpSupportScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleContactSupport = () => {
    Linking.openURL("tel:+1234567890").catch(() => {
      Alert.alert("Error", "Could not open phone app");
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@riderequest.com").catch(() => {
      Alert.alert("Error", "Could not open email app");
    });
  };

  const handleVisitWebsite = () => {
    Linking.openURL("https://riderequest.com/help").catch(() => {
      Alert.alert("Error", "Could not open website");
    });
  };

  const faqSections = [
    {
      id: "account",
      title: "Account & Profile",
      icon: "person-outline",
      questions: [
        {
          question: "How do I update my profile information?",
          answer: "Go to Settings → Edit Profile to update your personal information, profile picture, and vehicle details."
        },
        {
          question: "I forgot my password. What should I do?",
          answer: "On the login screen, tap 'Forgot Password' and follow the instructions sent to your email to reset your password."
        },
        {
          question: "How do I delete my account?",
          answer: "Contact our support team directly, and we'll guide you through the account deletion process."
        }
      ]
    },
    {
      id: "rides",
      title: "Rides & Deliveries",
      icon: "car-outline",
      questions: [
        {
          question: "How are fares calculated?",
          answer: "Fares are based on distance, time, demand, and vehicle type. You'll see the estimated fare before accepting a ride."
        },
        {
          question: "What should I do if a passenger cancels?",
          answer: "If a passenger cancels after you've accepted, you may be eligible for a cancellation fee depending on how long you've waited."
        },
        {
          question: "How do I handle difficult passengers?",
          answer: "Your safety is our priority. If you feel uncomfortable, you can end the ride in a safe location and contact support immediately."
        }
      ]
    },
    {
      id: "payments",
      title: "Payments & Earnings",
      icon: "cash-outline",
      questions: [
        {
          question: "When will I receive my earnings?",
          answer: "Earnings are processed weekly and transferred to your registered bank account every Tuesday."
        },
        {
          question: "How can I view my earnings breakdown?",
          answer: "Go to Settings → Earnings to see a detailed breakdown of your trips, tips, and deductions."
        },
        {
          question: "What payment methods are supported?",
          answer: "We support direct bank transfers, mobile money, and other local payment methods depending on your region."
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Issues",
      icon: "hardware-chip-outline",
      questions: [
        {
          question: "The app keeps crashing. What should I do?",
          answer: "Try restarting the app and your phone. If the issue persists, uninstall and reinstall the app, or contact support."
        },
        {
          question: "GPS is not working properly",
          answer: "Ensure location services are enabled for the app. Try switching between WiFi and mobile data, or restart your device."
        },
        {
          question: "I'm not receiving ride requests",
          answer: "Check your internet connection and ensure you're in a service area with good network coverage. Also verify your app is updated."
        }
      ]
    }
  ];

  const contactMethods = [
    {
      id: "phone",
      title: "Call Support",
      description: "Speak directly with our support team",
      icon: "call-outline",
      action: handleContactSupport,
      color: theme.success
    },
    {
      id: "email",
      title: "Email Support",
      description: "Send us a detailed message",
      icon: "mail-outline",
      action: handleEmailSupport,
      color: theme.primary
    },
    {
      id: "website",
      title: "Help Center",
      description: "Visit our online help center",
      icon: "globe-outline",
      action: handleVisitWebsite,
      color: theme.info
    }
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header */}
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
          Help & Support
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Welcome Section */}
        <View
          style={[
            styles.welcomeSection,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.welcomeHeader}>
            <Ionicons name="help-buoy-outline" size={32} color={theme.primary} />
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
              How can we help you?
            </Text>
          </View>
          <Text style={[styles.welcomeText, { color: theme.muted }]}>
            Find answers to common questions or get in touch with our support team for personalized assistance.
          </Text>
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Get in Touch
          </Text>
          <View
            style={[
              styles.contactSection,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {contactMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.contactMethod,
                  { borderBottomColor: theme.border },
                ]}
                onPress={method.action}
              >
                <View style={styles.contactLeft}>
                  <Ionicons
                    name={method.icon}
                    size={24}
                    color={method.color}
                  />
                  <View style={styles.contactText}>
                    <Text style={[styles.contactTitle, { color: theme.text }]}>
                      {method.title}
                    </Text>
                    <Text style={[styles.contactDesc, { color: theme.muted }]}>
                      {method.description}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Frequently Asked Questions
          </Text>
          <View
            style={[
              styles.faqSection,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {faqSections.map((section) => (
              <View key={section.id}>
                <TouchableOpacity
                  style={[
                    styles.faqHeader,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={styles.faqHeaderLeft}>
                    <Ionicons
                      name={section.icon}
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={[styles.faqTitle, { color: theme.text }]}>
                      {section.title}
                    </Text>
                  </View>
                  <Ionicons
                    name={expandedSection === section.id ? "chevron-down" : "chevron-forward"}
                    size={20}
                    color={theme.muted}
                  />
                </TouchableOpacity>
                
                {expandedSection === section.id && (
                  <View style={styles.faqContent}>
                    {section.questions.map((item, index) => (
                      <View
                        key={index}
                        style={[
                          styles.faqItem,
                          index < section.questions.length - 1 && {
                            borderBottomColor: theme.border,
                            borderBottomWidth: 1,
                          },
                        ]}
                      >
                        <Text style={[styles.question, { color: theme.text }]}>
                          {item.question}
                        </Text>
                        <Text style={[styles.answer, { color: theme.muted }]}>
                          {item.answer}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Emergency Section */}
        <View
          style={[
            styles.emergencySection,
            {
              backgroundColor: theme.danger + "20",
              borderColor: theme.danger + "40",
            },
          ]}
        >
          <Ionicons name="warning-outline" size={24} color={theme.danger} />
          <View style={styles.emergencyText}>
            <Text style={[styles.emergencyTitle, { color: theme.danger }]}>
              Emergency Assistance
            </Text>
            <Text style={[styles.emergencyDesc, { color: theme.danger }]}>
              For urgent safety concerns, call emergency services immediately
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.emergencyButton, { backgroundColor: theme.danger }]}
            onPress={() => Linking.openURL("tel:911")}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <Text style={[styles.versionText, { color: theme.muted }]}>
          RideRequest Help Center • V1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
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
  welcomeSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  contactSection: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactDesc: {
    fontSize: 13,
  },
  faqSection: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  faqHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  faqContent: {
    padding: 0,
  },
  faqItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  emergencySection: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  emergencyDesc: {
    fontSize: 12,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});