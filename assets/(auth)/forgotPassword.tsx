// app/(auth)/ForgotPassword.tsx
import { AuthError, sendPasswordResetEmail } from "@/services/auth";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(email)
      Alert.alert(
        "Email Sent",
        "Check your email for instructions to reset your password.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      const authError = error as AuthError;
      Alert.alert("Error", authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <View style={styles.input}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.inputControl}
              value={email}
              keyboardType="email-address"
              placeholder="your@email.com"
              placeholderTextColor={"#999"}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Sending..." : "Send Reset Instructions"}
            </Text>
          </TouchableOpacity>

          <Link href="/Login" style={styles.backLink}>
            Back to Sign In
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  btn: {
    backgroundColor: "#7500fc",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  backLink: {
    color: "#7500fc",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
});