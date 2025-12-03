// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFFUsjyUa6ZeIKqPImjdUzrZnmv04dloA",
  authDomain: "thriv-ef9fe.firebaseapp.com",
  projectId: "thriv-ef9fe",
  storageBucket: "thriv-ef9fe.firebasestorage.app",
  messagingSenderId: "367624554242",
  appId: "1:367624554242:web:c98daaf81f2e319cf6e41b",
  measurementId: "G-VSD9WC5BE0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;

