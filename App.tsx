import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Client, ClientStats, User as UserType } from './types';
import { Plus, Search, Tv, LayoutDashboard, BarChart3, LogOut, X, Loader2 } from 'lucide-react';
import { StatsCards } from './components/StatsCards';
import { ClientCard } from './components/ClientCard';
import { supabase } from './services/supabase'; // NOTE: Keeping for reference, but we are moving to Firebase logic in this file based on prompt
import { 
  auth, 
  onAuthStateChanged, 
  signOut, 
  db, 
  doc, 
  getDoc, 
  setDoc 
} from './services/firebase';
import { UserProfileModal } from './components/UserProfileModal';

// Lazy loading components
const ClientModal = lazy(() => import('./components/ClientModal').then(m => ({ default: m.ClientModal })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const AuthView = lazy(() => import('./components/AuthView').then(m => ({ default: m.AuthView })));

const getDaysDifference = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Loader2 size={32} className="text-indigo-500 animate-spin" />
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando painel...</p>
  </div>
);

const App: React.FC = () => {
  const [loggedUser, setLoggedUser] = useState<UserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Monitoramento de Autenticação com FIREBASE & FIRESTORE SYNC
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        try {
          // Check if user exists in Firestore
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // User exists in DB, use DB data
            const userData = userSnap.data();
            setLoggedUser({
              id: user.uid,
              username: userData.username || user.displayName || 'User',
              email: userData.email || user.email || '',
              avatar: userData.photoURL || user.photoURL || undefined
            });
          } else {
            // User registered (via Auth) but not in DB -> Create Doc
            const newUserData = {
              username: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString()
            };
            
            await setDoc(userRef, newUserData);
            
            setLoggedUser({
              id: user.uid,
              username: newUserData.username,
              email: newUserData.email,
              avatar: newUserData.photoURL || undefined
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to Auth data if DB fails
          setLoggedUser({
            id: user.uid,
            username: user.displayName || 'User',
            email: user.email || '',
            avatar: user.photoURL || undefined
          });
        }
      } else {
        setLoggedUser(null);
        setClients([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Use localStorage for client data (Simulating DB for clients for now, as requested only User Auth was to be Firebase)
  // If you wanted clients in Firestore too, we'd change this. For now, keeping existing client logic but tied to loggedUser.id
  useEffect(() => {
    if (loggedUser) {
      const storageKey = `iptv_data_user_${loggedUser.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try { setClients(JSON.parse(saved)); } 
        catch (e) { console.error(e); }
      } else {
        setClients([]); 
      }
    }
  }, [loggedUser?.id]); // Only re-run if ID changes

  useEffect(() => {
    if (loggedUser) {
      const storageKey = `iptv_data_user_${loggedUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(clients));
    }
  }, [clients, loggedUser]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setLoggedUser(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }, []);

  const handleRenewClient = useCallback(async (id: string) => {
    setClients(prev => prev.map(client => {
      if (client.id !== id) return client;

      const today = new Date();
      const currentRenewal = new Date(client.renewalDate);
      let newDate = currentRenewal < today ? new Date(today) : new Date(currentRenewal);
      newDate.setDate(newDate.getDate() + 30);
      
      const newDateStr = newDate.toISOString().split('T')[0];

      return { ...client, renewalDate: newDateStr };
    }));
  }, []);

  const handleDeleteClient = useCallback((id: string) => {
    // Exclusão imediata sem confirmação
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleEditClient = useCallback((c: Client) => {
    setEditingClient(c);
    setIsModalOpen(true);
  }, []);

  const handleSaveClient = useCallback(async (clientData: Client) => {
    if (!loggedUser) return;
    
    // LocalStorage logic (App logic)
    if (editingClient) {
      setClients(prev => prev.map(cl => cl.id === clientData.id ? clientData : cl));
    } else {
      setClients(prev => [...prev, clientData]);
    }
    setIsModalOpen(false);
  }, [editingClient, loggedUser]);

  const stats: ClientStats = useMemo(() => {
    let revenue = 0;
    let expiring = 0;
    clients.forEach(c => {
      revenue += c.price || 0;
      const days = getDaysDifference(c.renewalDate);
      if (days >= 0 && days <= 3) expiring++;
    });
    return { totalClients: clients.length, activeRevenue: revenue, expiringSoon: expiring };
  }, [clients]);

  const counts = useMemo(() => {
    const counts = { all: clients.length, active: 0, expiring: 0, expired: 0 };
    clients.forEach(c => {
      const days = getDaysDifference(c.renewalDate);
      if (days < 0) counts.expired++;
      else if (days <= 3) counts.expiring++;
      else counts.active++;
    });
    return counts;
  }, [clients]);

  const filteredClients = useMemo(() => {
    const query = debouncedSearchTerm.toLowerCase();
    return clients
      .filter(c => {
        if (query) {
          const matchesSearch = c.name.toLowerCase().includes(query) || 
                               c.server?.toLowerCase().includes(query) ||
                               c.phone.includes(query) ||
                               c.macAddress?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }
        const days = getDaysDifference(c.renewalDate);
        if (filterStatus === 'active') return days > 3;
        if (filterStatus === 'expiring') return days >= 0 && days <= 3;
        if (filterStatus === 'expired') return days < 0;
        return true;
      })
      .sort((a, b) => getDaysDifference(a.renewalDate) - getDaysDifference(b.renewalDate));
  }, [clients, debouncedSearchTerm, filterStatus]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!loggedUser) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
        <AuthView />
      </Suspense>
    );
  }

  return (
    <div id="conteudo-sistema" className="min-h-screen bg-[#020617] text-slate-200 pb-safe">
      <header className="sticky top-0 z-40 glass border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Tv className="text-white" size={18} />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base md:text-lg font-black tracking-tighter text-white">MANAGER PRO</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-3 pl-3 md:pl-0 border-l md:border-l-0 border-white/5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsProfileModalOpen(true)}>
               <div className="text-right hidden sm:block">
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Conta Ativa</p>
                 <p id="user-name" className="text-xs font-bold text-white leading-none truncate max-w-[120px]">{loggedUser.username}</p>
               </div>
               {loggedUser.avatar ? (
                 <img src={loggedUser.avatar} alt="Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-indigo-500/30 object-cover shadow-lg" />
               ) : (
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${loggedUser.username}&background=4f46e5&color=fff&bold=true`} alt={loggedUser.username} className="w-full h-full object-cover" />
                 </div>
               )}
            </div>

            <div className="flex items-center gap-1">
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Sair">
                <LogOut size={20} />
              </button>
              <button 
                onClick={() => { setEditingClient(null); setIsModalOpen(true); }} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black flex items-center gap-2 transition-all active:scale-90 shadow-xl shadow-indigo-900/20"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">NOVO CLIENTE</span>
                <span className="sm:hidden">NOVO</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto scrollbar-hide scroll-ios">
          <button onClick={() => setActiveTab('list')} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'list' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutDashboard size={14} /> Painel
            {activeTab === 'list' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-full shadow-[0_-4px_12px_rgba(99,102,241,0.6)]"></div>}
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'analytics' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <BarChart3 size={14} /> Analytics
            {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-full shadow-[0_-4px_12px_rgba(99,102,241,0.6)]"></div>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 animate-fade-up scroll-ios">
        <Suspense fallback={<LoadingSpinner />}>
          {activeTab === 'list' ? (
            <>
              <StatsCards stats={stats} />
              <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por nome, MAC ou telefone..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full bg-slate-900/50 border border-white/5 text-white rounded-2xl md:rounded-[24px] pl-12 pr-12 py-4 md:py-5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all text-base font-medium shadow-inner" 
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
                      <X size={14} className="text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="flex flex-nowrap overflow-x-auto gap-2 md:gap-3 items-center p-1.5 rounded-[20px] md:rounded-[24px] bg-slate-900/40 border border-white/5 scrollbar-hide scroll-ios">
                  <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="Todos" count={counts.all} color="indigo" />
                  <FilterTab active={filterStatus === 'active'} onClick={() => setFilterStatus('active')} label="Ativos" count={counts.active} color="emerald" />
                  <FilterTab active={filterStatus === 'expiring'} onClick={() => setFilterStatus('expiring')} label="Aviso" count={counts.expiring} color="amber" />
                  <FilterTab active={filterStatus === 'expired'} onClick={() => setFilterStatus('expired')} label="Fim" count={counts.expired} color="rose" />
                </div>
              </div>

              {loadingData ? (
                 <div className="text-center py-24"><Loader2 className="animate-spin mx-auto text-indigo-500"/></div>
              ) : filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {filteredClients.map(client => (
                    <ClientCard 
                      key={client.id} 
                      client={client} 
                      daysUntilExpiration={getDaysDifference(client.renewalDate)} 
                      onDelete={handleDeleteClient} 
                      onEdit={handleEditClient}
                      onRenew={handleRenewClient}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 md:py-24 glass rounded-[32px] md:rounded-[40px] border-dashed border-2 border-white/5">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={24} className="text-slate-500" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Nenhum registro</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm">Ajuste seus filtros ou adicione um novo cliente.</p>
                </div>
              )}
            </>
          ) : <AnalyticsView clients={clients} />}
        </Suspense>
      </main>

      <div className="h-[env(safe-area-inset-bottom)]"></div>

      <Suspense fallback={null}>
        <ClientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveClient} 
          editingClient={editingClient} 
        />
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={loggedUser}
          onUpdate={setLoggedUser}
          onLogout={handleLogout}
        />
      </Suspense>
    </div>
  );
};

const FilterTab = React.memo(({ active, onClick, label, count, color }: {active: boolean, onClick: () => void, label: string, count: number, color: string}) => {
  const colorMap: any = {
    indigo: active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white/5',
    emerald: active ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-white/5',
    amber: active ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-white/5',
    rose: active ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-white/5'
  };
  return (
    <button onClick={onClick} className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${colorMap[color]} active:scale-95`}>
      {label}
      <span className={`px-1.5 py-0.5 rounded-lg ${active ? 'bg-black/20' : 'bg-slate-800'}`}>{count}</span>
    </button>
  );
});

export default App;