import React, { useState } from 'react';
import { Tv, ShieldCheck, User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/firebase';

export const AuthView: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const translateFirebaseError = (code: string) => {
    switch (code) {
      case 'auth/invalid-email': return 'Formato de usuário inválido.';
      case 'auth/user-disabled': return 'Este usuário foi desativado.';
      case 'auth/user-not-found': return 'Usuário não encontrado.';
      case 'auth/wrong-password': return 'Senha incorreta.';
      case 'auth/email-already-in-use': return 'Este usuário já existe.';
      case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
      default: return 'Ocorreu um erro ao tentar entrar. Tente novamente.';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    // Validação simples do nome de usuário (sem espaços, sem caracteres especiais)
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');
    if (cleanUsername.length < 3) {
      setErrorMsg('O usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    // Truque: Adicionar um domínio fictício para satisfazer o Firebase
    const dummyEmail = `${cleanUsername}@sistema.admin`;

    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, dummyEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, dummyEmail, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(translateFirebaseError(error.code));
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
              Entrar
            </button>
            <button
              onClick={() => { setIsRegistering(true); setErrorMsg(''); }}
              className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest transition-all ${isRegistering ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cadastrar
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu nome de usuário"
                    className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                    autoCapitalize="none"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
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
                    <span>{isRegistering ? 'Criar Acesso' : 'Acessar Painel'}</span>
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
            Dados Criptografados
          </div>
        </div>
      </div>
    </div>
  );
};