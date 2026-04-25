import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAcgw2-4UyM8y5ZFHjx4y4PZgT2GophgPY",
  authDomain: "krishisetu-18464.firebaseapp.com",
  projectId: "krishisetu-18464",
  storageBucket: "krishisetu-18464.firebasestorage.app",
  messagingSenderId: "792828800023",
  appId: "1:792828800023:web:1d93127803ff3f56f2c052",
  measurementId: "G-LMXGCG2BCG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
