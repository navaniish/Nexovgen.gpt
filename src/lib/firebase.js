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
    apiKey: "AIzaSyDuOWbcrhcXxu9BojEI06yFoo-Hd62igJo",
    authDomain: "nexovgen-gpt-1b4f2.firebaseapp.com",
    projectId: "nexovgen-gpt-1b4f2",
    storageBucket: "nexovgen-gpt-1b4f2.firebasestorage.app",
    messagingSenderId: "614043112687",
    appId: "1:614043112687:web:fa42720f9fc8638f9e371a",
    measurementId: "G-NL4SQF92PV"
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
