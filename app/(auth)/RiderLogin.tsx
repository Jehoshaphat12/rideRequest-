import { auth } from "@/lib/firebaseConfig";
import { AuthError, loginUser } from "@/services/auth";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Google from "expo-auth-session/providers/google";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

type FormData = {
  email: string;
  password: string;
};

export default function RiderLogin() {
  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [promptMsg, setPromptMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // ✅ Initialize Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "REMOVED", // 🔹 Replace this with your actual Web client ID
    clientId: "REMOVED",
    redirectUri: "https://auth.expo.io/@jehoshaphat12/rideRequest",

  });

  // ✅ Handle Google Sign-In Response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          console.log("✅ Google Sign-In successful");
        })
        .catch((error) => {
          console.error("❌ Google Sign-In error:", error);
        });
    }
  }, [response]);

  // 🔹 Handle email/password login
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields");
      setPrompt(true);
      setPromptMsg("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      await loginUser(form.email.trim(), form.password);
      setSuccess(true);
      setPrompt(true);
      setPromptMsg("Login successful");
    } catch (error: any) {
      const authError = error as AuthError;
      switch (authError.type) {
        case "user-not-found":
          setPrompt(true);
          setPromptMsg("Account not found");
          Alert.alert("Account Not Found", authError.message, [
            {
              text: "Sign Up",
              onPress: () => router.push("/Register"),
              style: "default",
            },
            { text: "Try Again", style: "cancel" },
          ]);
          break;
        case "wrong-password":
          setPrompt(true);
          setPromptMsg("Incorrect Password. Please try again");
          Alert.alert("Incorrect Password", authError.message, [
            {
              text: "Reset Password",
              onPress: () => router.push("/forgotPassword"),
              style: "default",
            },
            { text: "Try Again", style: "cancel" },
          ]);
          break;
        case "invalid-email":
          setPrompt(true);
          setPromptMsg("Invalid Email. Please check and try again");
          Alert.alert("Invalid Email", authError.message, [
            { text: "OK", style: "default" },
          ]);
          break;
        case "too-many-requests":
          Alert.alert("Too Many Attempts", authError.message, [
            { text: "OK", style: "default" },
          ]);
          break;
        case "network-error":
          setPrompt(true);
          setPromptMsg("Network Error. Please try again");
          Alert.alert("Network Error", authError.message, [
            { text: "OK", style: "default" },
          ]);
          break;
        default:
          setPrompt(true);
          setPromptMsg(
            "Invalid Email or password. Please check and try again."
          );
          Alert.alert("Login Failed", authError.message, [
            { text: "OK", style: "default" },
          ]);
      }
    } finally {
      setSuccess(false);
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
            <Image
              source={require("../../assets/images/welcome-img.png")}
              style={styles.headerImg}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Welcome back! Please login to your account.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.input}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                autoCorrect={false}
                autoCapitalize="none"
                aria-label="email"
                style={styles.inputControl}
                value={form.email}
                keyboardType="email-address"
                placeholder="john@gmail.com"
                placeholderTextColor={"#999"}
                onChangeText={(email) => setForm({ ...form, email })}
              />
            </View>

            <View style={styles.input}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  aria-label="password"
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
            </View>

            {/* Prompt for messages */}
            {prompt && (
              <View
                style={{
                  backgroundColor: success ? "#c8ff94ff" : "#fff3caff",
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: success ? "#00ac00ff" : "#ff3d02ff",
                    fontSize: 12,
                  }}
                >
                  {promptMsg}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/forgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.formAction}>
              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.btn, loading && styles.btnDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Sign in</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ✅ Google Sign-In Button */}
            <View style={styles.formAction}>
              <TouchableOpacity
                disabled={!request}
                onPress={() => promptAsync()}
                style={styles.googleBtn}
              >
                <View style={styles.googleBtnContent}>
                  <Ionicons
                    name="logo-google"
                    size={24}
                    color="#000"
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleBtnText}>Sign in with Google</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <Link href={"/Register"} style={styles.footerLink}>
                  Sign Up
                </Link>
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
  headerImg: {
    width: "80%",
    height: 200,
    maxWidth: 250,
    marginBottom: 16,
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
    color: "#333",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  btn: {
    backgroundColor: "#7500fc",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  formAction: {
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#7500fc",
    fontSize: 14,
    fontWeight: "500",
  },
  googleBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    marginRight: 8,
  },
  googleBtnText: {
    color: "#000",
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
  footerLink: {
    color: "#7500fc",
    fontWeight: "600",
  },
});
