import React, { useRef } from 'react';
import { X, Server, Shield, Database, Download, Upload, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { isDemoMode } from '../services/firebase';
import { Client } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportClients: (clients: Client[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, clients, onImportClients }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Verificação segura da API Key
  const hasApiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;

  // Função de Exportação
  const handleExport = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup_iptv_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Função de Importação
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
            const parsed = JSON.parse(event.target.result as string);
            if (Array.isArray(parsed)) {
              if (confirm(`Encontrados ${parsed.length} clientes no backup. Deseja substituir a lista atual?`)) {
                onImportClients(parsed);
                onClose();
              }
            } else {
              alert("Formato de arquivo inválido.");
            }
          }
        } catch (error) {
          alert("Erro ao ler o arquivo de backup.");
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="glass border-white/10 rounded-[32px] w-full max-w-lg shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server size={20} className="text-slate-400" />
            Configurações do Sistema
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Seção 1: Status da IA */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Inteligência Artificial (Gemini)</h3>
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${hasApiKey ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
              <div className={`p-2.5 rounded-xl ${hasApiKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <Key size={20} />
              </div>
              <div className="flex-1">
                <p className={`font-bold ${hasApiKey ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hasApiKey ? 'Chave de API Configurada' : 'Chave de API Ausente'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">
                  {hasApiKey 
                    ? 'A geração automática de mensagens de cobrança está ativa e pronta para uso.' 
                    : 'A IA não funcionará. Configure a variável API_KEY no ambiente.'}
                </p>
              </div>
              {hasApiKey && <CheckCircle size={18} className="text-emerald-500" />}
            </div>
          </div>

          {/* Seção 2: Banco de Dados */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Armazenamento de Dados</h3>
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${!isDemoMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
              <div className={`p-2.5 rounded-xl ${!isDemoMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {!isDemoMode ? <Database size={20} /> : <Shield size={20} />}
              </div>
              <div className="flex-1">
                <p className={`font-bold ${!isDemoMode ? 'text-indigo-400' : 'text-amber-400'}`}>
                  {isDemoMode ? 'Modo Local (Demo)' : 'Conectado ao Firebase'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">
                  {isDemoMode 
                    ? 'Seus dados estão salvos apenas neste navegador. Exporte regularmente para não perder.' 
                    : 'Seus dados estão sincronizados na nuvem em tempo real.'}
                </p>
              </div>
            </div>
          </div>

          {/* Seção 3: Backup */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Gestão de Backup</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl text-xs font-bold border border-white/5 transition-all active:scale-95"
              >
                <Download size={16} />
                Exportar Dados
              </button>
              <button 
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl text-xs font-bold border border-white/5 transition-all active:scale-95"
              >
                <Upload size={16} />
                Restaurar Dados
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center italic">
              O arquivo de backup contém todos os clientes cadastrados.
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
          </div>

          <div className="text-center pt-2">
             <p className="text-[9px] text-slate-600 font-mono">
               Runtime: {typeof process !== 'undefined' && process.env.NODE_ENV ? process.env.NODE_ENV : 'unknown'} | v1.2.0
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};