import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAyWkjo0ev_VEZtXntq_HO8RUBvAovueQQ",
    authDomain: "bg-demon-list.firebaseapp.com",
    projectId: "bg-demon-list",
    storageBucket: "bg-demon-list.firebasestorage.app",
    messagingSenderId: "23365765002",
    appId: "1:23365765002:web:cfbb20a5ad902a2a84ea73",
    measurementId: "G-J2J5B4WE2B"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();