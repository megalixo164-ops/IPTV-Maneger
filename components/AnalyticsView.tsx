import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ComposedChart, Area
} from 'recharts';
import { Client } from '../types';
import { TrendingUp, Users, DollarSign, UserPlus, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnalyticsViewProps {
  clients: Client[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ clients }) => {
  const [timeRange, setTimeRange] = useState<number>(12); // Últimos 6 ou 12 meses

  // ==================================================================================
  // LÓGICA DE BI - PROJEÇÃO HISTÓRICA
  // Como não temos tabela de transações, reconstruímos a história baseada nas datas
  // de início e renovação de cada cliente.
  // ==================================================================================
  const monthlyData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Gera os últimos X meses
    for (let i = timeRange - 1; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); // ex: Out/24
      
      // Definição do intervalo do mês analisado
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      let monthlyRevenue = 0;
      let activeCount = 0;
      let newCount = 0;
      let recurringCount = 0;

      clients.forEach(client => {
        // Normaliza as datas do cliente (zera horas para evitar bugs de fuso)
        const clientStart = new Date(client.startDate + 'T00:00:00'); 
        const clientEnd = new Date(client.renewalDate + 'T00:00:00');

        // LÓGICA 1: O cliente estava ativo neste mês?
        // Ele deve ter iniciado ANTES do fim deste mês
        // E a data de renovação (validade) deve ser DEPOIS do início deste mês
        const isActiveInMonth = clientStart <= monthEnd && clientEnd >= monthStart;

        if (isActiveInMonth) {
          monthlyRevenue += client.price;
          activeCount++;

          // LÓGICA 2: Ele é novo ou recorrente neste mês?
          // Se a data de início dele cai dentro deste mês, ele é NOVO.
          const isNewInMonth = clientStart >= monthStart && clientStart <= monthEnd;
          
          if (isNewInMonth) {
            newCount++;
          } else {
            recurringCount++;
          }
        }
      });

      data.push({
        name: monthKey,
        fullDate: monthStart,
        receita: monthlyRevenue,
        totalClientes: activeCount,
        novos: newCount,
        recorrentes: recurringCount
      });
    }
    return data;
  }, [clients, timeRange]);

  // Cálculos do Mês Atual (Último item do array)
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowth(currentMonth.receita, previousMonth?.receita || 0);
  const clientsGrowth = calculateGrowth(currentMonth.totalClientes, previousMonth?.totalClientes || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Analytics Financeiro</h2>
          <p className="text-slate-500 text-sm">Visão detalhada de receita e retenção.</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setTimeRange(6)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 6 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            6 Meses
          </button>
          <button 
            onClick={() => setTimeRange(12)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === 12 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            12 Meses
          </button>
        </div>
      </div>

      {/* KPI Cards - Focados no Mês Atual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          title="Receita (Mês Atual)" 
          value={`R$ ${currentMonth.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          subValue={`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs mês anterior`}
          trend={revenueGrowth >= 0 ? 'up' : 'down'}
          icon={<DollarSign size={20}/>} 
          color="emerald" 
        />
        <KPICard 
          title="Clientes Ativos" 
          value={currentMonth.totalClientes.toString()} 
          subValue={`${clientsGrowth > 0 ? '+' : ''}${clientsGrowth.toFixed(1)}% vs mês anterior`}
          trend={clientsGrowth >= 0 ? 'up' : 'down'}
          icon={<Users size={20}/>} 
          color="indigo" 
        />
        <KPICard 
          title="Novos Clientes" 
          value={currentMonth.novos.toString()} 
          subValue="Entraram neste mês"
          trend="neutral"
          icon={<UserPlus size={20}/>} 
          color="blue" 
        />
        <KPICard 
          title="Recorrentes" 
          value={currentMonth.recorrentes.toString()} 
          subValue="Base fiel que pagou"
          trend="neutral"
          icon={<TrendingUp size={20}/>} 
          color="amber" 
        />
      </div>

      {/* GRÁFICO 1: Evolução da Receita */}
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="text-emerald-400" size={18} />
              Receita Mensal Confirmada
            </h3>
            <p className="text-xs text-slate-500">Total arrecadado com mensalidades por mês.</p>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
              />
              <Bar dataKey="receita" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
              <Line type="monotone" dataKey="receita" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: Aquisição vs Recorrência */}
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[24px] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-indigo-400" size={18} />
              Comportamento da Base de Clientes
            </h3>
            <p className="text-xs text-slate-500">Comparativo entre aquisição de novos vs. manutenção de antigos.</p>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Novos
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700"></div> Recorrentes
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="recorrentes" stackId="a" fill="#334155" radius={[0, 0, 4, 4]} barSize={32} name="Recorrentes" />
              <Bar dataKey="novos" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} name="Novos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Resumo Mensal */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[24px] overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="text-slate-400" size={18} />
            Detalhamento Mensal
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4 font-bold">Mês</th>
                <th className="px-6 py-4 font-bold text-right">Novos</th>
                <th className="px-6 py-4 font-bold text-right">Recorrentes</th>
                <th className="px-6 py-4 font-bold text-right">Total Ativos</th>
                <th className="px-6 py-4 font-bold text-right text-emerald-400">Receita Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...monthlyData].reverse().map((month, index) => (
                <tr key={month.name} className="hover:bg-white/5 transition-colors text-sm font-medium">
                  <td className="px-6 py-4 text-white font-bold">{month.name}</td>
                  <td className="px-6 py-4 text-right text-indigo-400">+{month.novos}</td>
                  <td className="px-6 py-4 text-right text-slate-400">{month.recorrentes}</td>
                  <td className="px-6 py-4 text-right text-white">{month.totalClientes}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-400">
                    R$ {month.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// Componente Auxiliar de KPI Card
const KPICard = ({ title, value, subValue, icon, color, trend }: { 
  title: string, value: string, subValue: string, icon: any, color: string, trend: 'up' | 'down' | 'neutral' 
}) => {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  const trendIcon = trend === 'up' ? <ArrowUpRight size={14} className="text-emerald-500" /> : 
                    trend === 'down' ? <ArrowDownRight size={14} className="text-rose-500" /> : null;
  
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500';

  return (
    <div className={`glass p-5 rounded-2xl border ${colors[color]} hover:scale-[1.02] transition-transform duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
          {icon}
        </div>
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trendColor}`}>
        {trendIcon}
        <span>{subValue}</span>
      </div>
    </div>
  );
};