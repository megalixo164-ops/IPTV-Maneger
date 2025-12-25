import React, { useState } from 'react';
import { Tv, ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Loader2, User as UserIcon, Camera, Upload } from 'lucide-react';
import { 
  auth, 
  storage,
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  setDoc
} from '../services/firebase';

export const AuthView: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Display Name
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        // 1. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Upload Photo (if selected)
        let photoURL = null;
        if (photoFile) {
          try {
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(storageRef);
          } catch (uploadError) {
            console.error("Error uploading photo:", uploadError);
            // Continue execution even if photo fails
          }
        }

        // 3. Update Auth Profile
        await updateProfile(user, {
          displayName: name || email.split('@')[0],
          photoURL: photoURL
        });

        // 4. Create User Document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          username: name || email.split('@')[0],
          email: email,
          photoURL: photoURL,
          createdAt: new Date().toISOString()
        });

      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        // The App.tsx component will handle checking/creating the Firestore doc on login
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      // Specific Error Message requirement
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-login-credentials'
      ) {
        setErrorMsg('Password or Email Incorrect');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Email is already in use.');
      } else {
        setErrorMsg(error.message || 'An error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div id="tela-login" className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#020617] relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-[400px] z-10 animate-fade-up">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] bg-gradient-to-br from-indigo-500 to-blue-600 shadow-2xl shadow-indigo-900/40 mb-6 transform hover:scale-110 transition-transform duration-500">
            <Tv className="text-white" size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tighter mb-2">
            IPTV Manager<span className="text-indigo-500">.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium px-4">
            Gerencie sua revenda com inteligência.
          </p>
        </div>

        <div className="glass rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
          {/* Abas */}
          <div className="flex border-b border-white/5 bg-slate-900/50">
            <button
              onClick={() => { setIsRegistering(false); setErrorMsg(''); }}
              className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all ${!isRegistering ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsRegistering(true); setErrorMsg(''); }}
              className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all ${isRegistering ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
              
              {/* Display Name - Only Register */}
              {isRegistering && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                      type="text"
                      required={isRegistering}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                  />
                </div>
              </div>

              {/* Photo Upload - Only Register */}
              {isRegistering && (
                <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Profile Photo</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border border-white/10 border-dashed rounded-2xl bg-slate-950/30 hover:bg-slate-950/50 hover:border-indigo-500/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {photoFile ? (
                        <div className="flex items-center gap-2 text-indigo-400">
                          <ShieldCheck size={20} />
                          <p className="text-xs font-bold">{photoFile.name.substring(0, 20)}...</p>
                        </div>
                      ) : (
                        <>
                          <Camera className="mb-2 text-slate-500 group-hover:text-indigo-400 transition-colors" size={20} />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tap to upload</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{isRegistering ? 'Sign Up' : 'Log In'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            Secure Connection
          </div>
        </div>
      </div>
    </div>
  );
};