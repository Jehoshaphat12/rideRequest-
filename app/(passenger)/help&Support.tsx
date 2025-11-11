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

export default function CustomerHelpSupportScreen() {
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

  const handleLiveChat = () => {
    Alert.alert("Live Chat", "Connecting you with a support agent...", [
      { text: "Cancel", style: "cancel" },
      { text: "Continue", onPress: () => {
        // Implement live chat navigation here
      }}
    ]);
  };

  const faqSections = [
    {
      id: "booking",
      title: "Booking & Rides",
      icon: "car-outline",
      questions: [
        {
          question: "How do I book a ride?",
          answer: "Open the app, enter your destination, select your ride type, and confirm your pickup location. Tap 'Book Ride' to request a driver."
        },
        {
          question: "Can I schedule a ride in advance?",
          answer: "Yes! Use the 'Schedule' feature to book rides up to 24 hours in advance. Your driver will arrive at the scheduled time."
        },
        {
          question: "How do I cancel a ride?",
          answer: "Go to your active ride screen and tap 'Cancel Ride'. Note that cancellation fees may apply if you cancel after a driver has accepted."
        },
        {
          question: "What ride types are available?",
          answer: "We offer Economy, Comfort, and Premium options. Each provides different vehicle types and service levels at varying prices."
        }
      ]
    },
    {
      id: "payments",
      title: "Payments & Pricing",
      icon: "card-outline",
      questions: [
        {
          question: "What payment methods are accepted?",
          answer: "We accept credit/debit cards, mobile wallets, and cash in select regions. You can manage payment methods in your account settings."
        },
        {
          question: "How are fares calculated?",
          answer: "Fares are based on distance, time, demand, and ride type. You'll see the estimated fare before confirming your booking."
        },
        {
          question: "Can I split the fare with friends?",
          answer: "Yes! Use the 'Split Fare' feature to divide the cost with other passengers who have RideRequest accounts."
        },
        {
          question: "How do I get a receipt?",
          answer: "Receipts are automatically emailed after each completed ride. You can also view them in your Ride History section."
        }
      ]
    },
    {
      id: "safety",
      title: "Safety & Security",
      icon: "shield-checkmark-outline",
      questions: [
        {
          question: "What safety features are available?",
          answer: "We offer ride tracking, emergency assistance, driver verification, and 24/7 support to ensure your safety."
        },
        {
          question: "How are drivers screened?",
          answer: "All drivers undergo background checks, vehicle inspections, and safety training before being approved to drive."
        },
        {
          question: "What should I do if I left an item in the vehicle?",
          answer: "Use the 'Lost Item' feature in the app to contact your driver directly or call support for assistance."
        },
        {
          question: "Can I share my ride details with others?",
          answer: "Yes! Use the 'Share Ride' feature to send your route, driver details, and ETA to friends or family."
        }
      ]
    },
    {
      id: "account",
      title: "Account & App",
      icon: "person-outline",
      questions: [
        {
          question: "How do I update my profile information?",
          answer: "Go to Settings → Edit Profile to update your personal information, profile picture, and preferences."
        },
        {
          question: "I forgot my password. What should I do?",
          answer: "On the login screen, tap 'Forgot Password' and follow the instructions sent to your email to reset your password."
        },
        {
          question: "How do I change my language preferences?",
          answer: "Go to Settings → Language to select your preferred app language from the available options."
        },
        {
          question: "Why is my account suspended?",
          answer: "Account suspensions usually occur due to policy violations. Contact support for specific details about your account status."
        }
      ]
    },
    {
      id: "promotions",
      title: "Promotions & Rewards",
      icon: "gift-outline",
      questions: [
        {
          question: "How do I apply a promo code?",
          answer: "Go to Payment Methods → Promotions and enter your code before booking your ride. Discounts will apply automatically."
        },
        {
          question: "Do you offer referral bonuses?",
          answer: "Yes! Refer friends using your unique code and both you and your friend will receive ride credits when they complete their first ride."
        },
        {
          question: "How does the rewards program work?",
          answer: "Earn points for every ride completed. Redeem points for ride discounts, premium upgrades, and other exclusive benefits."
        },
        {
          question: "Where can I find active promotions?",
          answer: "Check the 'Promotions' section in the app menu to see all current offers and limited-time discounts."
        }
      ]
    }
  ];

  const contactMethods = [
    {
      id: "chat",
      title: "Live Chat",
      description: "Instant help from our support team",
      icon: "chatbubble-ellipses-outline",
      action: handleLiveChat,
      color: theme.primary
    },
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
      color: theme.info
    },
    {
      id: "website",
      title: "Help Center",
      description: "Visit our online help center",
      icon: "globe-outline",
      action: handleVisitWebsite,
      color: theme.warning
    }
  ];

  const quickActions = [
    {
      id: "lost-item",
      title: "Lost Item",
      icon: "bag-outline",
      onPress: () => router.push("/(passenger)/passengerWelcomeScreen"),
      color: theme.warning
    },
    {
      id: "ride-issue",
      title: "Report Issue",
      icon: "warning-outline",
      onPress: () => router.push("/(passenger)/passengerWelcomeScreen"),
      color: theme.danger
    },
    {
      id: "feedback",
      title: "Give Feedback",
      icon: "star-outline",
      onPress: () => router.push("/(passenger)/passengerWelcomeScreen"),
      color: theme.success
    },
    {
      id: "rate-app",
      title: "Rate App",
      icon: "thumbs-up-outline",
      onPress: () => Linking.openURL("https://appstore.com/riderequest"),
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
              We're here to help!
            </Text>
          </View>
          <Text style={[styles.welcomeText, { color: theme.muted }]}>
            Get answers to common questions, report issues, or contact our 24/7 support team for assistance with your rides.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickAction,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={action.onPress}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
                <Text style={[styles.quickActionText, { color: theme.text }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Contact Support
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
            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.contactMethod,
                  { borderBottomColor: theme.border },
                  index === contactMethods.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={method.action}
              >
                <View style={styles.contactLeft}>
                  <Ionicons
                    name={method.icon as any}
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
                      name={section.icon as any}
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
          <Ionicons name="shield-outline" size={24} color={theme.danger} />
          <View style={styles.emergencyText}>
            <Text style={[styles.emergencyTitle, { color: theme.danger }]}>
              Emergency Assistance
            </Text>
            <Text style={[styles.emergencyDesc, { color: theme.danger }]}>
              For urgent safety concerns during a ride, use the in-app emergency button or call local authorities
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

        {/* Support Hours */}
        <View
          style={[
            styles.hoursSection,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="time-outline" size={20} color={theme.primary} />
          <Text style={[styles.hoursText, { color: theme.text }]}>
            Support available 24/7 • Average response time: <Text style={{fontWeight: '600'}}>2 minutes</Text>
          </Text>
        </View>

        {/* App Info */}
        <Text style={[styles.versionText, { color: theme.muted }]}>
          RideRequest Customer Support • V1.0.0
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
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
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
    marginBottom: 16,
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
    lineHeight: 16,
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
  hoursSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20,
  },
  hoursText: {
    fontSize: 14,
    textAlign: "center",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});