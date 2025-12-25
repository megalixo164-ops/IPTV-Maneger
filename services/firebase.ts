// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import * as firebaseAuth from "firebase/auth";

// Acesso seguro ao process.env para evitar erros em ambientes sem polyfill
const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`VITE_${key}`];
  }
  // Suporte a Vite (import.meta.env) caso o bundler suporte
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[`VITE_${key}`];
  }
  return undefined;
};

// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// Busca variáveis de ambiente ou usa placeholder para Modo Demo
// ============================================================

const apiKey = getEnvVar('FIREBASE_API_KEY') || "AIzaSy...";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') || "seu-projeto.firebaseapp.com",
  projectId: getEnvVar('FIREBASE_PROJECT_ID') || "seu-projeto",
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET') || "seu-projeto.appspot.com",
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || "123456...",
  appId: getEnvVar('FIREBASE_APP_ID') || "1:123456..."
};

// Verifica se está usando a configuração padrão/inválida
export const isDemoMode = apiKey === "AIzaSy..." || apiKey.includes("SUA_API_KEY");

let auth: any;
let signInWithEmailAndPassword: any;
let createUserWithEmailAndPassword: any;
let signOut: any;
let onAuthStateChanged: any;

if (!isDemoMode) {
  // --- MODO REAL ---
  try {
    const app = initializeApp(firebaseConfig);
    // Cast to any to handle potential type definition mismatches
    const authModule = firebaseAuth as any;
    
    auth = authModule.getAuth(app);
    signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
    createUserWithEmailAndPassword = authModule.createUserWithEmailAndPassword;
    signOut = authModule.signOut;
    onAuthStateChanged = authModule.onAuthStateChanged;
  } catch (error) {
    console.error("Erro ao inicializar Firebase (Verifique suas variáveis de ambiente):", error);
    // Fallback gracioso para evitar crash total, mas o login real falhará
    auth = {};
  }
} else {
  // --- MODO DEMO (MOCK) ---
  console.warn("⚠️ MODO DEMO ATIVADO: Autenticação simulada (Sem Firebase)");
  
  // Usuário Fictício Base
  const createMockUser = (email: string) => {
    // Extrai o nome de usuário da parte antes do @
    const username = email.split('@')[0];
    return {
      uid: "demo-user-" + Math.floor(Math.random() * 1000),
      displayName: username,
      email: email,
      photoURL: `https://ui-avatars.com/api/?name=${username}&background=4f46e5&color=fff&rounded=true`,
      emailVerified: true
    };
  };

  // Estado local simples
  const savedUser = localStorage.getItem('demo_auth_user');
  let currentUser: any = savedUser ? JSON.parse(savedUser) : null;
  const observers: any[] = [];

  auth = { currentUser };

  const updateSession = (user: any) => {
    currentUser = user;
    if (user) {
      localStorage.setItem('demo_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('demo_auth_user');
    }
    observers.forEach(cb => cb(currentUser));
  };

  signInWithEmailAndPassword = async (_auth: any, email: string, _password: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulação básica de erro
        if (!email.includes('@')) {
          reject({ code: 'auth/invalid-email' });
          return;
        }
        // Simular usuário encontrado
        const user = createMockUser(email);
        updateSession(user);
        resolve({ user });
      }, 800);
    });
  };

  createUserWithEmailAndPassword = async (_auth: any, email: string, _password: string) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
         if (!email.includes('@')) {
          reject({ code: 'auth/invalid-email' });
          return;
        }
        const user = createMockUser(email);
        updateSession(user);
        resolve({ user });
      }, 800);
    });
  };

  signOut = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        updateSession(null);
        resolve(void 0);
      }, 400);
    });
  };

  onAuthStateChanged = (_auth: any, callback: any) => {
    observers.push(callback);
    // Dispara estado inicial
    setTimeout(() => callback(currentUser), 100);
    // Retorna função de unsubscribe
    return () => {
      const idx = observers.indexOf(callback);
      if (idx > -1) observers.splice(idx, 1);
    };
  };
}

export { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};