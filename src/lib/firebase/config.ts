import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNP6H0zB0LL9OpcDnppiqcC70WXvqOQ7k",
  authDomain: "team-shach.firebaseapp.com",
  projectId: "team-shach",
  storageBucket: "team-shach.firebasestorage.app",
  messagingSenderId: "573266759025",
  appId: "1:573266759025:web:b1e8bd3e27c378c846fad0",
  measurementId: "G-5HGZHXSHF2"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
