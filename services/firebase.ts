// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from "firebase/auth";

// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// Se mantiver as chaves de exemplo, o app entrará em MODO DEMO.
// Para usar o Firebase real, substitua pelo seu config do Console.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};

// Verifica se está usando a configuração padrão/inválida
const isDemoMode = firebaseConfig.apiKey === "AIzaSy..." || firebaseConfig.apiKey.includes("SUA_API_KEY");

let auth: any;
let signInWithEmailAndPassword: any;
let createUserWithEmailAndPassword: any;
let signOut: any;
let onAuthStateChanged: any;

if (!isDemoMode) {
  // --- MODO REAL ---
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  signInWithEmailAndPassword = firebaseSignInWithEmailAndPassword;
  createUserWithEmailAndPassword = firebaseCreateUserWithEmailAndPassword;
  signOut = firebaseSignOut;
  onAuthStateChanged = firebaseOnAuthStateChanged;
} else {
  // --- MODO DEMO (MOCK) ---
  console.warn("⚠️ MODO DEMO ATIVADO: Autenticação simulada (Sem Firebase)");
  
  // Usuário Fictício Base
  const createMockUser = (email: string) => {
    // Extrai o nome de usuário da parte antes do @
    const username = email.split('@')[0];
    return {
      uid: "demo-user-" + Math.floor(Math.random() * 1000),
      displayName: username, // O nome de exibição será o usuário
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