// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from "firebase/auth";
// @ts-ignore
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// @ts-ignore
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// ============================================================
// CONFIGURAÇÃO REAL DO FIREBASE
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBNrCyPKMBhOz5lP6bPYtS_eZeiqIm1f6s",
  authDomain: "gemini-drive-8e00a.firebaseapp.com",
  projectId: "gemini-drive-8e00a",
  storageBucket: "gemini-drive-8e00a.firebasestorage.app",
  messagingSenderId: "371030679230",
  appId: "1:371030679230:web:83269918dedbae6952c8ef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { 
  app,
  auth,
  storage,
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
};