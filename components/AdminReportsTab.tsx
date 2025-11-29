
import React, { useState, useMemo } from 'react';
import { PieChart as PieChartIcon, DollarSign, Clock, Activity, Download, FileText, Filter, RefreshCcw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Legend, Line, BarChart, Bar } from 'recharts';
import { Translation, Reservation, Vehicle, Expense, CategoryItem } from '../types';
import { useNotification } from './NotificationSystem';

const COLORS = ['#dc2626', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

interface AdminReportsTabProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  expenses: Expense[];
  vehicleCategories: CategoryItem[];
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  t,
  reservations,
  vehicles,
  expenses,
  vehicleCategories
}) => {
  const { notify } = useNotification();
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTransactionType, setFilterTransactionType] = useState('all');

  const filteredReservations = useMemo(() => {
    if (filterTransactionType === 'expense') return []; 
    return reservations.filter(res => {
        if (filterStartDate && new Date(res.startDate) < new Date(filterStartDate)) return false;
        if (filterEndDate && new Date(res.startDate) > new Date(filterEndDate)) return false;
        if (filterVehicle !== 'all' && res.vehicleId !== filterVehicle) return false;
        if (filterCategory !== 'all') {
             const v = vehicles.find(v => v.id === res.vehicleId);
             if (!v || v.category !== filterCategory) return false;
        }
        return true;
    });
  }, [reservations, vehicles, filterStartDate, filterEndDate, filterVehicle, filterCategory, filterTransactionType]);

  const filteredExpenses = useMemo(() => {
    if (filterTransactionType === 'income') return [];
    return expenses.filter(exp => {
        if (filterStartDate && new Date(exp.date) < new Date(filterStartDate)) return false;
        if (filterEndDate && new Date(exp.date) > new Date(filterEndDate)) return false;
        return true;
    });
  }, [expenses, filterStartDate, filterEndDate, filterTransactionType]);

  const reportData = useMemo(() => {
     const rentedOrActiveCount = vehicles.filter(v => v.status === 'rented' || v.status === 'maintenance').length; 
     const occupancyRate = vehicles.length > 0 ? (rentedOrActiveCount / vehicles.length) * 100 : 0;
     const validReservations = filteredReservations.filter(r => r.status !== 'cancelled' && r.status !== 'pending' && r.type === 'vehicle');
     const revenueSum = validReservations.reduce((sum, r) => sum + r.total, 0);
     const avgTicket = validReservations.length > 0 ? revenueSum / validReservations.length : 0;
     const totalDurationDays = validReservations.reduce((sum, res) => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return sum + (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1);
     }, 0);
     const avgDuration = validReservations.length > 0 ? totalDurationDays / validReservations.length : 0;

     const revByCategory: Record<string, number> = {};
     validReservations.forEach(res => {
         if (res.vehicleId) {
             const v = vehicles.find(veh => veh.id === res.vehicleId);
             if (v) revByCategory[v.category] = (revByCategory[v.category] || 0) + res.total;
         } else if (res.type === 'tour') {
             revByCategory['tours'] = (revByCategory['tours'] || 0) + res.total;
         }
     });
     const pieData = Object.entries(revByCategory).map(([name, value]) => ({ name, value }));

     const statusCounts: Record<string, number> = {};
     filteredReservations.forEach(r => statusCounts[r.status] = (statusCounts[r.status] || 0) + 1);
     const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

     const vehiclePerformance = vehicles.map(v => {
        const vehicleRes = filteredReservations.filter(r => r.vehicleId === v.id && r.status !== 'cancelled' && r.status !== 'pending');
        const revenue = vehicleRes.reduce((sum, r) => sum + r.total, 0);
        const daysRented = vehicleRes.reduce((sum, res) => {
            const start = new Date(res.startDate);
            const end = new Date(res.endDate);
            return sum + (Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1);
         }, 0);
         return { ...v, revenue, daysRented };
     }).sort((a,b) => b.revenue - a.revenue);

     return { occupancyRate, avgTicket, avgDuration, totalDurationDays, pieData, statusData, vehiclePerformance };
  }, [filteredReservations, vehicles]);

  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data: Record<number, { income: number; expense: number }> = {};

    filteredReservations.forEach(r => {
      if (r.status === 'cancelled' || r.status === 'pending') return;
      const date = new Date(r.startDate);
      if (date.getFullYear() !== currentYear) return;
      const month = date.getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].income += r.total;
    });

    filteredExpenses.forEach(e => {
      const date = new Date(e.date);
      if (date.getFullYear() !== currentYear) return;
      const month = date.getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].expense += e.amount;
    });

    return months.map((name, index) => ({
      name,
      income: data[index]?.income || 0,
      expense: data[index]?.expense || 0,
      profit: (data[index]?.income || 0) - (data[index]?.expense || 0)
    }));
  }, [filteredReservations, filteredExpenses]);

  const handleQuickFilter = (type: 'week' | 'month') => {
      const end = new Date();
      const start = new Date();
      if (type === 'week') start.setDate(end.getDate() - 7);
      else start.setDate(1); 
      setFilterStartDate(start.toISOString().split('T')[0]);
      setFilterEndDate(end.toISOString().split('T')[0]);
  };

  const handleClearFilters = () => {
      setFilterStartDate(''); setFilterEndDate(''); setFilterVehicle('all'); setFilterCategory('all'); setFilterTransactionType('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
            <div><label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_date_start}</label><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="rounded-lg border-slate-200 text-sm py-2" /></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_date_end}</label><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="rounded-lg border-slate-200 text-sm py-2" /></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_vehicle}</label><select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="rounded-lg border-slate-200 text-sm py-2 w-32"><option value="all">All</option>{vehicles.map(v => (<option key={v.id} value={v.id}>{v.model}</option>))}</select></div>
            <div className="flex gap-2 pb-1"><button onClick={() => handleQuickFilter('week')} className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">{t.admin.rep_quick_7days}</button><button onClick={() => handleQuickFilter('month')} className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">{t.admin.rep_quick_month}</button></div>
            <button onClick={handleClearFilters} className="text-sm text-slate-500 hover:text-red-600 pb-2">{t.admin.rep_filter_clear}</button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">{t.admin.rep_occupancy}</p><p className="text-xl font-bold text-slate-900">{reportData.occupancyRate.toFixed(1)}%</p></div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">{t.admin.rep_avg_ticket}</p><p className="text-xl font-bold text-slate-900">{reportData.avgTicket.toLocaleString('pt-CV', { maximumFractionDigits: 0 })} CVE</p></div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">{t.admin.rep_avg_duration}</p><p className="text-xl font-bold text-slate-900">{reportData.avgDuration.toFixed(1)} Days</p></div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm"><p className="text-xs font-bold uppercase text-slate-400">{t.admin.rep_days_rented}</p><p className="text-xl font-bold text-slate-900">{reportData.totalDurationDays}</p></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><div className="flex justify-between mb-4"><h3 className="font-bold text-slate-900">{t.admin.rep_monthly_growth}</h3><button onClick={() => notify('success', 'PDF')} className="text-xs text-red-600"><Download size={14}/></button></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={financialData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} /><Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-900 mb-4">{t.admin.rep_rev_by_cat}</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData.pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>{reportData.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">{t.admin.rep_vehicle_perf}</h3></div><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4 text-right">{t.admin.rep_perf_revenue}</th><th className="px-6 py-4 text-center">{t.admin.rep_perf_days}</th><th className="px-6 py-4 text-center">ROI Index</th></tr></thead><tbody className="divide-y divide-slate-100">{reportData.vehiclePerformance.map(v => (<tr key={v.id}><td className="px-6 py-4 font-bold">{v.make} {v.model}</td><td className="px-6 py-4 text-right font-mono text-emerald-600">{v.revenue.toLocaleString()} CVE</td><td className="px-6 py-4 text-center">{v.daysRented}</td><td className="px-6 py-4 text-center"><div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px] mx-auto overflow-hidden"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((v.revenue / 100000) * 100, 100)}%` }}></div></div></td></tr>))}</tbody></table></div>
    </div>
  );
};
