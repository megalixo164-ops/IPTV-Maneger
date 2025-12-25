import React, { useState, useEffect, useMemo } from 'react';
import { Client, ClientStats, User as UserType } from './types';
import { Plus, Search, Tv, LayoutDashboard, BarChart3, LogOut, X, Settings } from 'lucide-react';
import { StatsCards } from './components/StatsCards';
import { ClientCard } from './components/ClientCard';
import { ClientModal } from './components/ClientModal';
import { SettingsModal } from './components/SettingsModal';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthView } from './components/AuthView';
import { auth, onAuthStateChanged, signOut } from './services/firebase';

// Helper seguro para criar data local a partir de YYYY-MM-DD
// Evita o erro de fuso horário que subtrai 1 dia
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getDaysDifference = (dateString: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = parseLocalDate(dateString);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const App: React.FC = () => {
  const [loggedUser, setLoggedUser] = useState<UserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Monitoramento de Autenticação (Observer do Firebase/Mock)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      if (user) {
        // Tenta pegar o nome direto, ou extrai do email fictício (user@sistema.admin)
        const username = user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário');
        
        setLoggedUser({
          id: user.uid,
          username: username,
          email: user.email || '',
          avatar: user.photoURL || undefined
        });
      } else {
        setLoggedUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Carregar dados específicos do usuário logado
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
  }, [loggedUser]);

  // Salvar dados
  useEffect(() => {
    if (loggedUser) {
      const storageKey = `iptv_data_user_${loggedUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(clients));
    }
  }, [clients, loggedUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLoggedUser(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleRenewClient = (id: string) => {
    setClients(prev => prev.map(client => {
      if (client.id !== id) return client;

      const today = new Date();
      today.setHours(0,0,0,0);
      
      const currentRenewal = parseLocalDate(client.renewalDate);
      let newBaseDate = currentRenewal;

      // Se já venceu, renova a partir de HOJE. Se não, soma à data atual.
      if (currentRenewal < today) {
        newBaseDate = today;
      }
      
      // Soma 30 dias
      newBaseDate.setDate(newBaseDate.getDate() + 30);

      return {
        ...client,
        renewalDate: formatLocalDate(newBaseDate)
      };
    }));
  };

  const stats: ClientStats = useMemo(() => {
    let revenue = 0;
    let expiring = 0;
    clients.forEach(c => {
      const days = getDaysDifference(c.renewalDate);
      // Considera receita apenas se não estiver vencido há muito tempo (ex: 30 dias)
      if (days > -30) {
          revenue += c.price;
      }
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
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Div #tela-login (Conceitualmente, renderizada quando !loggedUser)
  if (!loggedUser) return <AuthView />;

  // Div #conteudo-sistema (Renderizada quando loggedUser é true)
  return (
    <div id="conteudo-sistema" className="min-h-screen bg-[#020617] text-slate-200 pb-safe">
      {/* iOS Optimized Header with Google User Info */}
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
            <div className="flex items-center gap-3 pl-3 md:pl-0 border-l md:border-l-0 border-white/5">
               <div className="text-right hidden sm:block">
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Conta Ativa</p>
                 {/* Injeção de Nome (#user-name) */}
                 <p id="user-name" className="text-xs font-bold text-white leading-none truncate max-w-[120px]">{loggedUser.username}</p>
               </div>
               {/* Injeção de Foto (#user-photo) */}
               {loggedUser.avatar ? (
                 <img 
                   id="user-photo"
                   src={loggedUser.avatar} 
                   alt="Avatar" 
                   className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-indigo-500/30 object-cover shadow-lg"
                 />
               ) : (
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${loggedUser.username}&background=4f46e5&color=fff&bold=true`}
                      alt={loggedUser.username}
                      className="w-full h-full object-cover"
                    />
                 </div>
               )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Configurações e Backup"
              >
                <Settings size={20} />
              </button>
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

        {/* Tab Switcher */}
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

            {filteredClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredClients.map(client => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    daysUntilExpiration={getDaysDifference(client.renewalDate)} 
                    onDelete={(id) => { if (confirm('Excluir este cliente?')) setClients(prev => prev.filter(c => c.id !== id)); }} 
                    onEdit={(c) => { setEditingClient(c); setIsModalOpen(true); }}
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
      </main>

      {/* Spacing for iOS Bottom Bar */}
      <div className="h-[env(safe-area-inset-bottom)]"></div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(c) => { if (editingClient) setClients(prev => prev.map(cl => cl.id === c.id ? c : cl)); else setClients(prev => [...prev, c]); }} 
        editingClient={editingClient} 
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        clients={clients}
        onImportClients={setClients}
      />
    </div>
  );
};

const FilterTab: React.FC<{active: boolean, onClick: () => void, label: string, count: number, color: string}> = ({ active, onClick, label, count, color }) => {
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
};

export default App;