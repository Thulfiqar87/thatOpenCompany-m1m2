// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "thatopencompany-m1m2.firebaseapp.com",
    projectId: "thatopencompany-m1m2",
    storageBucket: "thatopencompany-m1m2.firebasestorage.app",
    messagingSenderId: "894572630727",
    appId: "1:894572630727:web:3083159a44ba6e785e24e2",
    measurementId: "G-WEV2RF9Z2J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
