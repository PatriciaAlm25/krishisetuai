// ⚠️ REPLACE these values with your actual Firebase project config
// Firebase Console → Project Settings → Your Apps → Web App → firebaseConfig
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJvWlYG3M2F5EHwdZvrZrXp1q2n_bA_YU",
  authDomain: "krishisetuai.firebaseapp.com",
  projectId: "krishisetuai",
  storageBucket: "krishisetuai.firebasestorage.app",
  messagingSenderId: "418887583374",
  appId: "1:418887583374:web:9ebe1fbbe3d32231a06bdf",
  measurementId: "G-Q03XP4ZRE4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
