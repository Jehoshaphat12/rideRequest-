// services/auth.ts
import { auth, db } from "@/lib/firebaseConfig";
import { isValidEmail } from "@/utils/validation";
import {
  AuthErrorCodes,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword
} from "firebase/auth";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Alert } from "react-native";

// Define custom error types
export type AuthErrorType =
  | "user-not-found"
  | "wrong-password"
  | "invalid-email"
  | "email-already-in-use"
  | "weak-password"
  | "network-error"
  | "too-many-requests"
  | "unknown-error";

export interface AuthError {
  type: AuthErrorType;
  message: string;
  originalError?: any;
}

// Helper function to map Firebase errors to user-friendly messages
const getAuthError = (error: any): AuthError => {
  const errorCode = error.code;

  switch (errorCode) {
    case AuthErrorCodes.USER_DELETED:
      return {
        type: "user-not-found",
        message:
          "No account found with this email address. Please check your email or sign up for a new account.",
        originalError: error,
      };

    case AuthErrorCodes.INVALID_PASSWORD:
      return {
        type: "wrong-password",
        message: "Incorrect password. Please try again or reset your password.",
        originalError: error,
      };

    case AuthErrorCodes.INVALID_EMAIL:
      return {
        type: "invalid-email",
        message:
          "Invalid email address format. Please check your email and try again.",
        originalError: error,
      };

    case AuthErrorCodes.EMAIL_EXISTS:
      return {
        type: "email-already-in-use",
        message:
          "This email is already registered. Please sign in or use a different email.",
        originalError: error,
      };

    case AuthErrorCodes.WEAK_PASSWORD:
      return {
        type: "weak-password",
        message: "Password is too weak. Please use at least 6 characters.",
        originalError: error,
      };

    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
      return {
        type: "too-many-requests",
        message: "Too many failed attempts. Please try again later.",
        originalError: error,
      };

    case "auth/network-request-failed":
      return {
        type: "network-error",
        message:
          "Network error. Please check your internet connection and try again.",
        originalError: error,
      };

    default:
      return {
        type: "unknown-error",
        message: "An unexpected error occurred. Please try again.",
        originalError: error,
      };
  }
};

// Login function with proper error handling
export const loginUser = async (email: string, password: string) => {
  if (!isValidEmail(email)) {
    throw {
      type: "invalid-email",
      message: "Invalid email format. Please check your email address.",
    };
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Login successful - the auth listener will handle navigation
  } catch (error: any) {
    console.error("Login error:", error);
    const authError = getAuthError(error);
    throw authError; // Throw our custom error object
  }
};

// Register function (if you need it)
export const registerUser = async (
  email: string,
  password: string,
  userName: string,
  phone: string,
  role: "passenger" | "rider"
): Promise<void> => {
  if (!isValidEmail(email)) {
    throw {
      type: "invalid-email",
      message: "Invalid email format. Please enter a valid email.",
    };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // You can add user data to Firestore here if needed
    // await createUser(user.uid, userData);
    // ✅ Save extra data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      userName,
      phone,
      role,
      onboardingStatus: role === "rider" ? "incomplete" : "not-required",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

    });
  } catch (error: any) {
    const authError = getAuthError(error);
    throw authError;
  }
};

// Password reset function
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  if (!email) {
    throw {
      type: "invalid-email",
      message: "Please enter a valid email address.",
    };
  }

  try {
    await firebaseSendPasswordResetEmail(auth, email)
    .then(() => {
      // Password reset email sent.
      Alert.alert("Success", "Password reset email sent. Please check your inbox.")
    })
  } catch (error: any) {
    console.error("Password reset error:", error);
    const authError = getAuthError(error);
    throw authError;
  }
};

// Confirm Reset password function
export const resetPassword = async (oobCode: string, newPassword: string): Promise<void> => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (error: any) {
    const authError = getAuthError(error);
    throw authError;
  }
};

// export const signInWithGoogle = async (idToken: string) => {
//   // Implementation for Google Sign-In can be added here
//   if(response?.type === "success") {
//     const {id_token} = response.params
//     const credential = GoogleAuthProvider.credential(id_token)
//     signInWithCredential(auth, credential)
//     .then(() => {
//       Alert.alert("Success", "Logged in with Google successful!")
//     })
//     .catch((error) => {
//       Alert.alert("Error", "Google Sign-In failed. Please try again.", error)
//     })
//   }
// }
