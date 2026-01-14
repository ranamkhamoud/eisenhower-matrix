import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsae-vAYTL2y8Km9PuwXpj9NLvCO2Oxuk",
  authDomain: "eisenhower-matrix-869aa.firebaseapp.com",
  projectId: "eisenhower-matrix-869aa",
  storageBucket: "eisenhower-matrix-869aa.firebasestorage.app",
  messagingSenderId: "884508527894",
  appId: "1:884508527894:web:c885b54c63dbbd6aa11437"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
