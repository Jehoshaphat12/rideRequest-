import { AuthError, registerUser } from "@/services/auth";
import { isValidEmail } from "@/utils/validation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

type FormData = {
  username: string;
  email: string;
  password: string;
  phone: string;
  role: string;
};

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "passenger",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [promptMsg, setPromptMsg] = useState("")
  

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password || !form.phone) {
      setPrompt(true)
      setPromptMsg("Please fill all field before submitting")
      return;
    }

    if (!isValidEmail(form.email)) {
          setPrompt(true);
          setPromptMsg("❌ Invalid email format. Please check and try again.");
          return;
        }

    if (form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      setPrompt(true)
      setPromptMsg("Password must be at least 6 characters long")
      return;
    }

    if (form.password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      setPrompt(true)
      setPromptMsg("Passwords do not match. Please try again")
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        form.email,
        form.password,
        form.username,
        form.phone,
        "passenger"
      );

      // Success - the auth listener in _layout.tsx will handle navigation
      // No need to show alert or navigate manually
    } catch (error: any) {
      const authError = error as AuthError;

      // Show specific error messages based on error type
      switch (authError.type) {
        case "email-already-in-use":
          Alert.alert("Email Already Registered", authError.message, [
            {
              text: "Sign In",
              onPress: () => router.push("/Login"),
              style: "default",
            },
            {
              text: "Try Again",
              style: "cancel",
            },
          ]);
          break;

        case "weak-password":
          Alert.alert("Weak Password", authError.message, [
            { text: "OK", style: "default" },
          ]);
          break;

        case "invalid-email":
          Alert.alert("Invalid Email", authError.message, [
            { text: "OK", style: "default" },
          ]);
          break;

        case "network-error":
          Alert.alert("Network Error", authError.message, [
            { text: "OK", style: "default" },
          ]);
          break;

        default:
          Alert.alert("Registration Failed", authError.message, [
            { text: "OK", style: "default" },
          ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>
              Welcome! Please fill the form to register an account.
            </Text>
          </View>

          {/* Register form */}
          <View style={styles.form}>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                autoCorrect={false}
                autoCapitalize="words"
                style={styles.inputControl}
                value={form.username}
                placeholder="John Doe"
                placeholderTextColor={"#999"}
                onChangeText={(username) => setForm({ ...form, username })}
              />
            </View>

            <View style={styles.input}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.inputControl}
                value={form.email}
                keyboardType="email-address"
                placeholder="john@gmail.com"
                placeholderTextColor={"#999"}
                onChangeText={(email) => setForm({ ...form, email })}
              />
            </View>

            {/* Phone */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.inputControl}
                value={form.phone}
                keyboardType="phone-pad"
                placeholder="050 123 4567"
                placeholderTextColor="#999"
                onChangeText={(phone) => setForm({ ...form, phone })}
              />
            </View>

            <View style={styles.input}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={[styles.inputControl, { flex: 1 }]}
                  value={form.password}
                  placeholder="*********"
                  placeholderTextColor={"#999"}
                  onChangeText={(password) => setForm({ ...form, password })}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Must be at least 6 characters
              </Text>
            </View>

            <View style={styles.input}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  secureTextEntry={!showConfirmPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={[styles.inputControl, { flex: 1 }]}
                  value={confirmPassword}
                  placeholder="*********"
                  placeholderTextColor={"#999"}
                  onChangeText={(text) => setConfirmPassword(text)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>
            {prompt && (
              <View
                style={{
                  backgroundColor: "#fff3caff",
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#ff3d02ff", fontSize: 12 }}>{promptMsg}</Text>
              </View>
            )}

            <View style={styles.formAction}>
              <TouchableOpacity
                onPress={handleRegister}
                style={[styles.btn, loading && styles.btnDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Link href={"/Login"} style={styles.footerLink}>
                  Sign in
                </Link>
              </Text>

              <Text style={[styles.footerText, styles.termsText]}>
                By signing up, you agree to our{" "}
                <Text style={styles.footerLink}>Terms of Service</Text> and{" "}
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d5caff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  form: {
    width: "100%",
  },
  formAction: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingRight: 12,
  },
  inputControl: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingRight: 12,
    color: "#333",
  },
  eyeIcon: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 4,
  },
  btn: {
    backgroundColor: "#7500fc",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 12,
  },
  termsText: {
    marginTop: 16,
  },
  footerLink: {
    color: "#7500fc",
    fontWeight: "600",
  },
});
