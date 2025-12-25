import React from 'react';
import { Users, DollarSign, AlertTriangle } from 'lucide-react';
import { ClientStats } from '../types';

interface StatsCardsProps {
  stats: ClientStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <StatItem 
        icon={<Users size={22} />}
        label="Total de Clientes"
        value={stats.totalClients}
        color="indigo"
      />
      <StatItem 
        icon={<DollarSign size={22} />}
        label="Receita Mensal"
        value={`R$ ${stats.activeRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        color="emerald"
      />
      <StatItem 
        icon={<AlertTriangle size={22} />}
        label="Vencem em breve"
        value={stats.expiringSoon}
        color="orange"
      />
    </div>
  );
};

const StatItem = ({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: 'indigo' | 'emerald' | 'orange' }) => {
  const colorStyles = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40 shadow-indigo-500/5",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40 shadow-emerald-500/5",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20 group-hover:border-orange-500/40 shadow-orange-500/5"
  };

  return (
    <div className={`glass border rounded-[24px] p-6 group transition-all duration-300 hover:-translate-y-1 ${colorStyles[color]}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorStyles[color]} border transition-all`}>
          {icon}
        </div>
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        </div>
      </div>
    </div>
  );
};