import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { Calendar, Smartphone, DollarSign, MessageCircle, Trash2, Edit, Check, UserCheck, Clock, AlertCircle, StickyNote, ExternalLink, Zap, Cpu, Key, Copy } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  daysUntilExpiration: number;
  onDelete: (id: string) => void;
  onEdit: (client: Client) => void;
  onRenew: (id: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, daysUntilExpiration, onDelete, onEdit, onRenew }) => {
  const [successAnimation, setSuccessAnimation] = useState(false);
  
  // States para cópia individual de campos
  const [macCopied, setMacCopied] = useState(false);
  const [passCopied, setPassCopied] = useState(false);

  // UseEffect para resetar a animação caso o card mude drasticamente
  useEffect(() => {
    if (successAnimation) {
      const timer = setTimeout(() => setSuccessAnimation(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [successAnimation]);

  // Status Logic
  let statusTheme = {
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-400",
    text: "Ativo",
    icon: UserCheck
  };

  if (daysUntilExpiration < 0) {
    statusTheme = {
      border: "border-rose-500/20 hover:border-rose-500/40",
      bg: "bg-rose-500/5",
      badge: "bg-rose-500/10 text-rose-400",
      text: "Vencido",
      icon: AlertCircle
    };
  } else if (daysUntilExpiration <= 3) {
    statusTheme = {
      border: "border-amber-500/20 hover:border-amber-500/40",
      bg: "bg-amber-500/5",
      badge: "bg-amber-500/10 text-amber-400",
      text: "Vencendo",
      icon: Clock
    };
  }

  const copyField = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1500);
  };

  const handleRenewClick = () => {
    setSuccessAnimation(true);
    onRenew(client.id);
  };

  return (
    <div className={`glass rounded-3xl border ${successAnimation ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : statusTheme.border} p-6 transition-all duration-300 group hover:shadow-2xl relative overflow-hidden`}>
      
      {/* Background Flash Animation on Renew */}
      {successAnimation && (
        <div className="absolute inset-0 bg-emerald-500/10 animate-pulse z-0 pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex gap-4">
          <div className={`p-3 rounded-2xl ${successAnimation ? 'bg-emerald-500/20 text-emerald-400' : statusTheme.bg + ' ' + (statusTheme as any).iconClass} border border-white/5 text-white/80 transition-colors duration-500`}>
             {successAnimation ? <Check size={24} /> : <statusTheme.icon size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight leading-tight truncate max-w-[160px]">
              {client.name}
            </h3>
            <span className={`inline-block mt-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-full transition-colors duration-500 ${successAnimation ? 'bg-emerald-500/20 text-emerald-400' : statusTheme.badge}`}>
              {successAnimation ? "RENOVADO" : statusTheme.text}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(client)}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={() => onDelete(client.id)}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-all"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium flex items-center gap-2">
            <Calendar size={14} /> Expiração
          </span>
          <span className={`font-semibold transition-colors duration-500 ${successAnimation ? 'text-emerald-400 scale-105 origin-right' : 'text-slate-200'}`}>
            {new Date(client.renewalDate).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium flex items-center gap-2">
            <DollarSign size={14} /> Valor
          </span>
          <span className="text-emerald-400 font-bold">
            R$ {client.price.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium flex items-center gap-2">
            <Smartphone size={14} /> Telas
          </span>
          <span className="text-slate-200 font-semibold">{client.devices} dispositivo(s)</span>
        </div>
        {client.server && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <ExternalLink size={14} /> Servidor
            </span>
            <span className="text-indigo-400 font-semibold px-2 py-0.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 uppercase text-[10px]">
              {client.server}
            </span>
          </div>
        )}
      </div>

      {/* Seção de Dados do Dispositivo (Mac e Senha) */}
      {(client.macAddress || client.devicePassword) && (
        <div className="mb-6 p-3 bg-slate-900/50 rounded-2xl border border-white/5 space-y-2 relative z-10">
          {client.macAddress && (
            <div className="flex items-center justify-between group/mac">
               <div className="flex items-center gap-2 text-slate-500">
                  <Cpu size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">MAC</span>
               </div>
               <button 
                onClick={() => copyField(client.macAddress!, setMacCopied)}
                className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors"
                title="Copiar MAC"
               >
                 {client.macAddress}
                 {macCopied ? <Check size={12} className="text-emerald-400"/> : <Copy size={12} className="opacity-0 group-hover/mac:opacity-100 transition-opacity"/>}
               </button>
            </div>
          )}
          {client.devicePassword && (
            <div className="flex items-center justify-between group/pass">
               <div className="flex items-center gap-2 text-slate-500">
                  <Key size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Senha</span>
               </div>
               <button 
                onClick={() => copyField(client.devicePassword!, setPassCopied)}
                className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                title="Copiar Senha"
               >
                 {client.devicePassword}
                 {passCopied ? <Check size={12} className="text-emerald-400"/> : <Copy size={12} className="opacity-0 group-hover/pass:opacity-100 transition-opacity"/>}
               </button>
            </div>
          )}
        </div>
      )}

      {client.notes && (
        <div className="mb-6 p-3.5 bg-slate-950/40 rounded-2xl border border-white/5 flex gap-3 relative z-10">
          <StickyNote size={14} className="text-indigo-500 shrink-0 mt-1" />
          <p className="text-xs text-slate-400 italic leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-default">
            {client.notes}
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-white/5 space-y-3 relative z-10">
        {/* Lógica de Exibição do Botão de Renovação */}
        {(daysUntilExpiration <= 3 && !successAnimation) ? (
          <button
            onClick={handleRenewClick}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-emerald-900/30 active:scale-[0.98] animate-pulse"
          >
            <Zap size={18} fill="currentColor" />
            RENOVAR AGORA
          </button>
        ) : successAnimation ? (
           <div className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold animate-in fade-in zoom-in-95 duration-300">
              <Check size={18} />
              Renovado com Sucesso!
           </div>
        ) : null}
        
        {!successAnimation && (
           <button 
            onClick={() => {
              const cleanPhone = client.phone.replace(/\D/g, '');
              window.open(`https://wa.me/55${cleanPhone}`, '_blank');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-[0.97] uppercase tracking-wide border border-white/5"
            title="Abrir WhatsApp"
           >
             <MessageCircle size={18} />
             WhatsApp
           </button>
        )}
      </div>
    </div>
  );
};