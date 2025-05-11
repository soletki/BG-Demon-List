// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAyWkjo0ev_VEZtXntq_HO8RUBvAovueQQ",
  authDomain: "bg-demon-list.firebaseapp.com",
  projectId: "bg-demon-list",
  storageBucket: "bg-demon-list.firebasestorage.app",
  messagingSenderId: "23365765002",
  appId: "1:23365765002:web:cfbb20a5ad902a2a84ea73",
  measurementId: "G-J2J5B4WE2B"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
