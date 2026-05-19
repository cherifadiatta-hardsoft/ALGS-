import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "green-marking-mkm1r",
  appId: "1:577804054773:web:4e72981c84a54670de55bc",
  apiKey: "AIzaSyBrA3VwAvW8EP_Po3JMZC_HG4CriD77u2Q",
  authDomain: "green-marking-mkm1r.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-9f7d2118-a1e6-45b4-a22a-6a3db7c1b536",
  storageBucket: "green-marking-mkm1r.firebasestorage.app",
  messagingSenderId: "577804054773"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
