// Component with improvements
import { AuthError, registerUser } from "@/services/auth";
import { isValidEmail, isValidPassword, isValidPhone } from "@/utils/validation";
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

type ValidationErrors = {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RiderRegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "rider",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Required field validation
    if (!form.username.trim()) {
      errors.username = "Username is required";
    } else if (form.username.trim().length < 2) {
      errors.username = "Username must be at least 2 characters";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Invalid email format";
    }

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!isValidPhone(form.phone)) {
      errors.phone = "Invalid Ghana phone number format";
    }

    if (!form.password) {
      errors.password = "Password is required";
    } else if (!isValidPassword(form.password)) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (form.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: keyof ValidationErrors) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        form.email.trim(),
        form.password,
        form.username.trim(),
        form.phone.trim().replace(/\s/g, ''),
        "rider"
      );

      // Clear form on success
      setForm({
        username: "",
        email: "",
        password: "",
        phone: "",
        role: "rider",
      });
      setConfirmPassword("");
      
      // Success - auth listener will handle navigation
    } catch (error: any) {
      const authError = error as AuthError;

      // Show specific error messages based on error type
      switch (authError.type) {
        case "email-already-in-use":
          Alert.alert("Email Already Registered", authError.message, [
            {
              text: "Sign In",
              onPress: () => router.push("/(auth)/RiderLogin"),
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Rider Sign Up</Text>
            <Text style={styles.subtitle}>
              Welcome! Sign up, become a Rider & start earning on your own.
            </Text>
          </View>

          {/* Register form */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                autoCorrect={false}
                autoCapitalize="words"
                style={[
                  styles.inputControl,
                  validationErrors.username && styles.inputError
                ]}
                value={form.username}
                placeholder="John Doe"
                placeholderTextColor={"#999"}
                onChangeText={(username) => {
                  setForm({ ...form, username });
                  clearFieldError('username');
                }}
                editable={!loading}
              />
              {validationErrors.username && (
                <Text style={styles.errorText}>{validationErrors.username}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                autoCorrect={false}
                autoCapitalize="none"
                style={[
                  styles.inputControl,
                  validationErrors.email && styles.inputError
                ]}
                value={form.email}
                keyboardType="email-address"
                placeholder="john@gmail.com"
                placeholderTextColor={"#999"}
                onChangeText={(email) => {
                  setForm({ ...form, email });
                  clearFieldError('email');
                }}
                editable={!loading}
                autoComplete="email"
              />
              {validationErrors.email && (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={[
                  styles.inputControl,
                  validationErrors.phone && styles.inputError
                ]}
                value={form.phone}
                keyboardType="phone-pad"
                placeholder="050 123 4567"
                placeholderTextColor="#999"
                onChangeText={(phone) => {
                  setForm({ ...form, phone });
                  clearFieldError('phone');
                }}
                editable={!loading}
                autoComplete="tel"
              />
              {validationErrors.phone && (
                <Text style={styles.errorText}>{validationErrors.phone}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.passwordContainer,
                validationErrors.password && styles.inputError
              ]}>
                <TextInput
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={[styles.inputControl, { flex: 1 }]}
                  value={form.password}
                  placeholder="*********"
                  placeholderTextColor={"#999"}
                  onChangeText={(password) => {
                    setForm({ ...form, password });
                    clearFieldError('password');
                  }}
                  editable={!loading}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password ? (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              ) : (
                <Text style={styles.passwordHint}>
                  Must be at least 6 characters
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[
                styles.passwordContainer,
                validationErrors.confirmPassword && styles.inputError
              ]}>
                <TextInput
                  secureTextEntry={!showConfirmPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                  style={[styles.inputControl, { flex: 1 }]}
                  value={confirmPassword}
                  placeholder="*********"
                  placeholderTextColor={"#999"}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearFieldError('confirmPassword');
                  }}
                  editable={!loading}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.confirmPassword && (
                <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.formAction}>
              <TouchableOpacity
                onPress={handleRegister}
                style={[styles.btn, loading && styles.btnDisabled]}
                disabled={loading}
                accessibilityLabel="Create rider account"
                accessibilityRole="button"
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
                <Link href={"/(auth)/RiderLogin"} style={styles.footerLink}>
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
    marginBottom: 16,
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
  inputError: {
    borderColor: "#ff3d02",
    borderWidth: 1,
  },
  errorText: {
    color: "#ff3d02",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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