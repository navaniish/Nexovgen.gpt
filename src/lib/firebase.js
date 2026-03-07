import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInAnonymously
} from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, getDoc, query, where, doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAyXRBzVECR1tSDkdCl39zKY62QgSEo9qU",
    authDomain: "nexovgen-ai.firebaseapp.com",
    projectId: "nexovgen-ai",
    storageBucket: "nexovgen-ai.firebasestorage.app",
    messagingSenderId: "425711955850",
    appId: "1:425711955850:web:89033deb46a0feac8fa273",
    measurementId: "G-8ZH3G1PC15"
};

// Only init once — prevents duplicate-app crash
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
window.firebaseAuth = auth;
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    getDoc,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInAnonymously
};
