import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIzQuQuhS-Fu6xS6h0vMt7F0iv3MDEsDw",
  authDomain: "calendario-musical-regional.firebaseapp.com",
  projectId: "calendario-musical-regional",
  storageBucket: "calendario-musical-regional.firebasestorage.app",
  messagingSenderId: "623166985934",
  appId: "1:623166985934:web:0fc3d45915b12a9f02a29f",
  measurementId: "G-KCTFZ86L35"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias para serem usadas no Login.jsx e App.jsx
export const db = getFirestore(app);
export const auth = getAuth(app);