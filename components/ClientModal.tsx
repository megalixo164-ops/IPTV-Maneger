import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { X, Save, User, Smartphone, Server, FileText, Calendar, CreditCard, Cpu, Key, Tv, Monitor, Copy, Check } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  editingClient: Client | null;
}

const emptyClient: Omit<Client, 'id'> = {
  name: '',
  phone: '',
  startDate: new Date().toISOString().split('T')[0],
  renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  price: 35.00,
  devices: 1,
  notes: '',
  server: '',
  macAddress: '',
  devicePassword: '',
  deviceType: 'other'
};

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, editingClient }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>(emptyClient);
  const [copied, setCopied] = useState(false);

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
        devicePassword: editingClient.devicePassword || '',
        deviceType: editingClient.deviceType || 'other'
      });
    } else {
      setFormData(emptyClient);
    }
  }, [editingClient, isOpen]);

  // Função para aplicar máscara de telefone (BR)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove não dígitos
    
    // Limita a 11 dígitos
    if (value.length > 11) value = value.substring(0, 11);

    // Aplica a máscara (XX) XXXXX-XXXX
    if (value.length > 2) {
      value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    }
    if (value.length > 10) {
      value = `${value.substring(0, 10)}-${value.substring(10)}`;
    }
    
    setFormData({...formData, phone: value});
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingClient ? editingClient.id : crypto.randomUUID(),
    });
    onClose();
  };

  const handleCopyData = () => {
    const lines = [
      `👤 *NOME:* ${formData.name}`,
      `📱 *WHATSAPP:* ${formData.phone}`,
      `📅 *VENCIMENTO:* ${new Date(formData.renewalDate).toLocaleDateString('pt-BR')}`,
      `💰 *VALOR:* R$ ${formData.price.toFixed(2)}`,
      formData.server ? `📺 *SERVIDOR:* ${formData.server}` : null,
      formData.macAddress ? `📟 *MAC:* ${formData.macAddress}` : null,
      formData.devicePassword ? `🔑 *SENHA:* ${formData.devicePassword}` : null,
      formData.notes ? `📝 *OBS:* ${formData.notes}` : null,
    ];

    const text = lines.filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const DeviceOption = ({ type, label, icon: Icon }: { type: 'android' | 'iphone' | 'tv' | 'other', label: string, icon: any }) => {
    const isSelected = formData.deviceType === type;
    return (
      <button
        type="button"
        onClick={() => setFormData({ ...formData, deviceType: type })}
        className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl border transition-all ${
          isSelected 
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40' 
            : 'bg-slate-950/40 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'
        }`}
      >
        <Icon size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="glass border-white/10 rounded-[32px] md:rounded-[40px] w-full max-w-2xl shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="px-6 md:px-8 py-4 md:py-6 border-b border-white/5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <User className="text-indigo-400" size={18} />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {editingClient ? 'Editar Cliente' : 'Novo Registro'}
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleCopyData}
              className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all active:scale-90 border border-white/5 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title="Copiar dados do cliente"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-90">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto scroll-ios flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Dados Pessoais */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Cliente</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-medium text-base placeholder:text-slate-600"
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-medium text-base placeholder:text-slate-600"
                  placeholder="(DDD) 9XXXX-XXXX"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Próxima Renovação</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/50 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="date"
                  required
                  value={formData.renewalDate}
                  onChange={e => setFormData({...formData, renewalDate: e.target.value})}
                  className="w-full bg-slate-950/40 border border-indigo-500/20 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none font-bold text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço (R$)</label>
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none font-bold text-base placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Servidor / Painel</label>
              <div className="relative group">
                <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="text"
                  value={formData.server}
                  onChange={e => setFormData({...formData, server: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all uppercase font-bold text-base placeholder:text-slate-600"
                  placeholder="P2P, Gold..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dispositivo Principal</label>
            <div className="flex gap-2">
              <DeviceOption type="android" label="Android" icon={Smartphone} />
              <DeviceOption type="iphone" label="iPhone" icon={Smartphone} />
              <DeviceOption type="tv" label="TV / Box" icon={Tv} />
              <DeviceOption type="other" label="Outro" icon={Monitor} />
            </div>
          </div>
          
          <div className="w-full h-px bg-white/5 my-2"></div>

          {/* Dados Técnicos / Acesso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço MAC</label>
              <div className="relative group">
                <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="text"
                  value={formData.macAddress}
                  onChange={e => setFormData({...formData, macAddress: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-mono text-sm uppercase placeholder:text-slate-600"
                  placeholder="00:1A:2B:3C:4D:5E"
                />
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Dispositivo</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="text"
                  value={formData.devicePassword}
                  onChange={e => setFormData({...formData, devicePassword: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 md:py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all font-medium text-base placeholder:text-slate-600"
                  placeholder="Senha de acesso"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações Privadas</label>
            <div className="relative group">
              <FileText className="absolute left-4 top-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/5 rounded-3xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all h-28 resize-none font-medium text-base placeholder:text-slate-600"
                placeholder="Login, detalhes adicionais..."
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 pb-4">
             <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-2xl shadow-indigo-900/40 active:scale-95 hover:shadow-indigo-500/20"
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