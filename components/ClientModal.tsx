import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { X, Save, User, Smartphone, Server, FileText, Calendar, CreditCard, Cpu, Key, Calculator } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  editingClient: Client | null;
}

// Gera string YYYY-MM-DD baseada no horário local do dispositivo
// Evita bugs onde 'toLocaleDateString' pode retornar formatos inesperados (ex: MM/DD/YYYY) dependendo do browser
const getTodayISO = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para somar dias sem erro de fuso
const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  
  const newY = date.getFullYear();
  const newM = String(date.getMonth() + 1).padStart(2, '0');
  const newD = String(date.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
};

const getEmptyClient = (): Omit<Client, 'id'> => {
  const today = getTodayISO();
  return {
    name: '',
    phone: '',
    startDate: today,
    renewalDate: addDaysToDate(today, 30), 
    price: 35.00,
    devices: 1,
    notes: '',
    server: '',
    macAddress: '',
    devicePassword: ''
  };
};

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, editingClient }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>(getEmptyClient());

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        phone: editingClient.phone,
        startDate: editingClient.startDate.split('T')[0],
        renewalDate: editingClient.renewalDate.split('T')[0],
        price: editingClient.price,
        devices: editingClient.devices,
        notes: editingClient.notes || '',
        server: editingClient.server || '',
        macAddress: editingClient.macAddress || '',
        devicePassword: editingClient.devicePassword || ''
      });
    } else {
      setFormData(getEmptyClient());
    }
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingClient ? editingClient.id : crypto.randomUUID(),
    });
    onClose();
  };

  const setRenewalTo30Days = () => {
    if (formData.startDate) {
        const newDate = addDaysToDate(formData.startDate, 30);
        setFormData({ ...formData, renewalDate: newDate });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="glass border-white/10 rounded-[32px] md:rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border border-white/10">
        <div className="px-6 md:px-8 py-4 md:py-5 border-b border-white/5 flex justify-between items-center flex-shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <User className="text-indigo-400" size={18} />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {editingClient ? 'Editar Cliente' : 'Novo Registro'}
            </h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-90 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 md:space-y-6 overflow-y-auto scroll-ios flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Dados Pessoais */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Cliente</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-medium text-base hover:border-white/10"
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-medium text-base hover:border-white/10"
                  placeholder="DDD + Número"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => {
                    const newStart = e.target.value;
                    const updates: any = { startDate: newStart };
                    
                    // Se for novo cliente, calcula auto +30
                    if (!editingClient && newStart) {
                       updates.renewalDate = addDaysToDate(newStart, 30);
                    }
                    setFormData({...formData, ...updates});
                  }}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none text-base hover:border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Próxima Renovação</label>
                  <button 
                    type="button" 
                    onClick={setRenewalTo30Days}
                    className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded hover:bg-indigo-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Somar 30 dias a partir do início"
                  >
                    <Calculator size={10} /> +30 Dias
                  </button>
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/50" size={16} />
                <input
                  type="date"
                  required
                  value={formData.renewalDate}
                  onChange={e => setFormData({...formData, renewalDate: e.target.value})}
                  className="w-full bg-slate-950/40 border border-indigo-500/20 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none font-bold text-base hover:border-indigo-500/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço (R$)</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none font-bold text-base hover:border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Servidor / Painel</label>
              <div className="relative">
                <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="text"
                  value={formData.server}
                  onChange={e => setFormData({...formData, server: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all uppercase font-bold text-base hover:border-white/10"
                  placeholder="P2P, Gold..."
                />
              </div>
            </div>
          </div>
          
          <div className="w-full h-px bg-white/5 my-2"></div>

          {/* Dados Técnicos / Acesso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço MAC</label>
              <div className="relative">
                <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="text"
                  value={formData.macAddress}
                  onChange={e => setFormData({...formData, macAddress: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-mono text-sm uppercase hover:border-white/10"
                  placeholder="00:1A:2B:3C:4D:5E"
                />
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Dispositivo</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="text"
                  value={formData.devicePassword}
                  onChange={e => setFormData({...formData, devicePassword: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-3.5 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-medium text-base hover:border-white/10"
                  placeholder="Senha de acesso"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações Privadas</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-slate-600" size={16} />
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/5 rounded-3xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all h-28 resize-none font-medium text-base hover:border-white/10"
                placeholder="Login, detalhes adicionais..."
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 pb-4">
             <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-2xl shadow-indigo-900/40 active:scale-95 cursor-pointer"
            >
              <Save size={18} />
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};