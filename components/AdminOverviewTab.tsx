
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Key, RefreshCcw, Activity, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Calendar } from 'lucide-react';
import { Translation, Reservation, Vehicle, Review } from '../types';

const STATUS_COLORS = {
    available: '#10b981',
    rented: '#3b82f6',
    maintenance: '#f59e0b',
    cleaning: '#8b5cf6'
};

interface AdminOverviewTabProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  reviews: Review[];
  getRealTimeVehicleStatus: (vehicle: Vehicle) => string;
  onNavigateToReservations: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  t,
  reservations,
  vehicles,
  reviews,
  getRealTimeVehicleStatus,
  onNavigateToReservations
}) => {
  const overviewMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pickupsToday = reservations.filter(r => r.startDate === today && r.status === 'confirmed').length;
    const returnsToday = reservations.filter(r => r.endDate === today && r.status === 'active').length;
    const rentedCount = vehicles.filter(v => v.status === 'rented').length;
    const occupancyRate = vehicles.length > 0 ? (rentedCount / vehicles.length) * 100 : 0;
    const overdueReturns = reservations.filter(r => r.status === 'active' && r.endDate < today).length;
    const pendingReviews = reviews.filter(r => r.status === 'pending').length;

    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthRev = reservations
        .filter(r => new Date(r.startDate).getMonth() === currentMonth && r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.total, 0);
        
    const lastMonthRev = reservations
        .filter(r => new Date(r.startDate).getMonth() === lastMonth && r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.total, 0);
        
    const growth = lastMonthRev > 0 ? ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100 : 100;

    const statusCounts = { available: 0, rented: 0, maintenance: 0, cleaning: 0 };
    vehicles.forEach(v => {
        const smartStatus = getRealTimeVehicleStatus(v);
        if (smartStatus === 'cleaning') {
            statusCounts.maintenance++; 
        } else {
            statusCounts[smartStatus as keyof typeof statusCounts]++;
        }
    });
    const fleetStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value })).filter(d => d.name !== 'cleaning');

    return { pickupsToday, returnsToday, occupancyRate, overdueReturns, pendingReviews, growth, fleetStatusData };
  }, [reservations, vehicles, reviews, getRealTimeVehicleStatus]);

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyTotals = reservations.reduce((acc, res) => {
        if (res.status === 'cancelled') return acc;
        const date = new Date(res.startDate);
        if (date.getFullYear() !== currentYear) return acc;
        const monthIndex = date.getMonth();
        acc[monthIndex] = (acc[monthIndex] || 0) + res.total;
        return acc;
    }, {} as Record<number, number>);

    return months.map((name, index) => ({ name, revenue: monthlyTotals[index] || 0 }));
  }, [reservations]);

  const totalRevenue = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.total, 0);

  const getVehicleName = (id: string) => {
    const v = vehicles.find(veh => veh.id === id);
    return v ? `${v.make} ${v.model}` : 'Unknown Vehicle';
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_today_pickups}</p><p className="text-2xl font-bold text-slate-900">{overviewMetrics.pickupsToday}</p></div>
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Key size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_today_returns}</p><p className="text-2xl font-bold text-slate-900">{overviewMetrics.returnsToday}</p></div>
              <div className="bg-amber-50 p-3 rounded-lg text-amber-600"><RefreshCcw size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_occupancy_rate}</p><p className="text-2xl font-bold text-slate-900">{overviewMetrics.occupancyRate.toFixed(1)}%</p></div>
              <div className={`p-3 rounded-lg ${overviewMetrics.occupancyRate > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}><Activity size={20} /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_pending_actions}</p><p className="text-2xl font-bold text-red-600">{overviewMetrics.overdueReturns + overviewMetrics.pendingReviews}</p></div>
              <div className="bg-red-50 p-3 rounded-lg text-red-600"><AlertTriangle size={20} /></div>
          </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div><h3 className="text-lg font-bold text-slate-900">{t.admin.ov_revenue_trend}</h3><p className="text-sm text-slate-500">Total: <span className="font-semibold text-slate-900">{totalRevenue.toLocaleString()} CVE</span></p></div>
                  <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${overviewMetrics.growth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {overviewMetrics.growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}{Math.abs(overviewMetrics.growth).toFixed(1)}% MoM
                  </div>
              </div>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString()} CVE`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}/><Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" /></AreaChart></ResponsiveContainer>
              </div>
          </div>
          <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">{t.admin.ov_fleet_health}</h3>
                  <div className="h-48 w-full relative">
                      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={overviewMetrics.fleetStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{overviewMetrics.fleetStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#cbd5e1'} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="text-center"><span className="block text-2xl font-bold text-slate-900">{vehicles.length}</span><span className="text-xs text-slate-500 uppercase">Total</span></div></div>
                  </div>
                  <div className="flex justify-center gap-4 text-xs mt-2">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Available</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Rented</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Maint.</div>
                  </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">{t.admin.ov_action_needed}</h3>
                  <div className="space-y-3">
                      {overviewMetrics.overdueReturns > 0 && (<div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-red-800 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span><strong>{overviewMetrics.overdueReturns}</strong> Vehicles overdue for return.</span></div>)}
                      {overviewMetrics.pendingReviews > 0 && (<div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm"><Activity size={16} className="mt-0.5 shrink-0" /><span><strong>{overviewMetrics.pendingReviews}</strong> Customer reviews pending moderation.</span></div>)}
                      {overviewMetrics.overdueReturns === 0 && overviewMetrics.pendingReviews === 0 && (<div className="flex items-center justify-center text-slate-400 text-sm py-4 italic">All clear! No urgent actions.</div>)}
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">{t.admin.recent_reservations}</h3>
              <button onClick={onNavigateToReservations} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1">View All <ArrowRight size={16} /></button>
          </div>
          <div className="divide-y divide-slate-100">
            {reservations.slice(0, 5).map((res) => (
              <div key={res.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}><Calendar size={18} /></div>
                    <div><p className="text-sm font-bold text-slate-900">{res.customerName}</p><p className="text-xs text-slate-500">{getVehicleName(res.vehicleId || '')} • {res.startDate}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-medium text-slate-900">{res.total.toLocaleString()} CVE</p><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide ${res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{res.status}</span></div>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};
