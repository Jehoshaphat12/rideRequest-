// firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
// import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { initializeAuth } from "firebase/auth";
// @ts-ignore: module 'firebase/auth' has no bundled type declarations in this project
import { getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3PKIlIK1X3Qf6KQRsHYU84PVVx3kuiEM",
  authDomain: "ride-request-560ef.firebaseapp.com",
  projectId: "ride-request-560ef",
  // storageBucket: "ride-request-560ef.firebasestorage.app",
  storageBucket: "ride-request-560ef.appspot.com",
  messagingSenderId: "185616930122",
  appId: "1:185616930122:web:6eef967c852fcc28295db3",
  measurementId: "G-BPWEQ597RP",
};

// ✅ Ensure Firebase initializes only once (works in SSR & CSR)
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const app = initializeApp(firebaseConfig);


export const firebaseApp = app;
// export const auth = getAuth(app);
// Use persistent auth for React Native
// export const auth = initializeAuth(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
