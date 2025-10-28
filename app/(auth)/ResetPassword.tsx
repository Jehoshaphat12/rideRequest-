import { resetPassword } from "@/services/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { oobCode } = useLocalSearchParams(); // Grab the reset code from URL
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill out both fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (!oobCode) {
      Alert.alert("Error", "Invalid or missing reset code.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(oobCode as string, password);
      Alert.alert("Success", "Password has been reset successfully!", [
        { text: "OK", onPress: () => router.replace("/(auth)/Login") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
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
          <Text style={styles.title}>Create a New Password</Text>
          <Text style={styles.subtitle}>
            Enter and confirm your new password below.
          </Text>

          <View style={styles.input}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              secureTextEntry
              style={styles.inputControl}
              value={password}
              placeholder="Enter new password"
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.input}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              secureTextEntry
              style={styles.inputControl}
              value={confirmPassword}
              placeholder="Confirm new password"
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>
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
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
