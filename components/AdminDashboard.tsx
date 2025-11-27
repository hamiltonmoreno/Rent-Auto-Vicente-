

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { Users, Car, DollarSign, Check, X as XIcon, Plus, Edit2, Trash2, MapPin, Truck, Upload, Settings, Key, ExternalLink, CreditCard, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { Translation, Reservation, Review, Vehicle, ReservationStatus, Expense } from '../types';
import { StarRating } from './StarRating';

interface AdminDashboardProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  reviews: Review[];
  expenses: Expense[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
  onReviewAction: (id: string, action: 'approved' | 'rejected') => void;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  t, 
  reservations, 
  vehicles, 
  reviews,
  expenses,
  onUpdateVehicle,
  onAddVehicle,
  onDeleteVehicle,
  onUpdateReservationStatus,
  onReviewAction,
  onAddExpense,
  onDeleteExpense
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'reservations' | 'deliveries' | 'reviews' | 'settings' | 'finance'>('overview');
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'all'>('pending');
  const [isEditingVehicle, setIsEditingVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [vehicleImage, setVehicleImage] = useState<string>('');
  
  // Settings State
  const [apiKey, setApiKey] = useState(localStorage.getItem('admin_api_key') || '');
  const [vinti4PosId, setVinti4PosId] = useState(localStorage.getItem('vinti4_pos_id') || '');
  const [vinti4ApiKey, setVinti4ApiKey] = useState(localStorage.getItem('vinti4_api_key') || '');
  const [stripeKey, setStripeKey] = useState(localStorage.getItem('stripe_key') || '');
  const [paypalClient, setPaypalClient] = useState(localStorage.getItem('paypal_client') || '');
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  // Real Analytics Data Calculation (Overview)
  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group by month
    const monthlyTotals = reservations.reduce((acc, res) => {
        if (res.status === 'cancelled') return acc;
        
        const date = new Date(res.startDate);
        const monthIndex = date.getMonth();
        
        acc[monthIndex] = (acc[monthIndex] || 0) + res.total;
        return acc;
    }, {} as Record<number, number>);

    // Format for chart
    return months.map((name, index) => ({
        name,
        revenue: monthlyTotals[index] || 0
    })).filter(item => item.revenue > 0 || true); // Keep all months or filter
  }, [reservations]);

  const totalRevenue = reservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.total, 0);

  // Financial Data Calculations
  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: Record<number, { income: number; expense: number }> = {};

    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      const month = new Date(r.startDate).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].income += r.total;
    });

    expenses.forEach(e => {
      const month = new Date(e.date).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].expense += e.amount;
    });

    return months.map((name, index) => ({
      name,
      income: data[index]?.income || 0,
      expense: data[index]?.expense || 0,
      profit: (data[index]?.income || 0) - (data[index]?.expense || 0)
    }));
  }, [reservations, expenses]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Combined Transactions List
  const recentTransactions = useMemo(() => {
    const incomes = reservations.map(r => ({
      id: r.id,
      date: r.dateCreated,
      description: `Reserva #${r.id} - ${r.customerName}`,
      amount: r.total,
      type: 'income',
      category: 'Rental'
    }));

    const outcomes = expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'expense',
      category: e.category
    }));

    return [...incomes, ...outcomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations, expenses]);

  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model}` : 'Unknown Vehicle';
  };

  const filteredReviews = reviews.filter(review => {
    if (reviewFilter === 'pending') return review.status === 'pending';
    return true;
  });

  const deliveryReservations = reservations.filter(r => r.pickupType === 'delivery' && (r.status === 'confirmed' || r.status === 'pending'));

  const handleStartAdd = () => {
    setVehicleImage('');
    setIsEditingVehicle(null);
    setIsAddingVehicle(true);
  };

  const handleStartEdit = (v: Vehicle) => {
    setVehicleImage(v.image);
    setIsAddingVehicle(false);
    setIsEditingVehicle(v);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVehicleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const vehicleData: any = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: Number(formData.get('year')),
      plate: formData.get('plate'),
      category: formData.get('category'),
      transmission: formData.get('transmission'),
      seats: Number(formData.get('seats')),
      pricePerDay: Number(formData.get('pricePerDay')),
      status: formData.get('status'),
      available: formData.get('status') === 'available',
      // Keep existing data if editing, or defaults if adding
      id: isEditingVehicle ? isEditingVehicle.id : Date.now().toString(),
      image: vehicleImage || (isEditingVehicle ? isEditingVehicle.image : 'https://picsum.photos/400/250'),
      rating: isEditingVehicle ? isEditingVehicle.rating : 5,
      reviewCount: isEditingVehicle ? isEditingVehicle.reviewCount : 0,
    };

    if (isEditingVehicle) {
      onUpdateVehicle(vehicleData);
    } else {
      onAddVehicle(vehicleData);
    }
    setIsEditingVehicle(null);
    setIsAddingVehicle(false);
    setVehicleImage('');
  };

  const handleAddExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddExpense({
      id: `EXP-${Date.now()}`,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as any,
      date: formData.get('date') as string,
    });
    (e.target as HTMLFormElement).reset();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('admin_api_key', apiKey);
    localStorage.setItem('vinti4_pos_id', vinti4PosId);
    localStorage.setItem('vinti4_api_key', vinti4ApiKey);
    localStorage.setItem('stripe_key', stripeKey);
    localStorage.setItem('paypal_client', paypalClient);
    setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.admin.dashboard}</h1>
            <p className="text-slate-500">Welcome back, Admin</p>
          </div>
          <div className="flex overflow-x-auto rounded-lg bg-white p-1 shadow-sm">
            {['overview', 'fleet', 'reservations', 'finance', 'deliveries', 'reviews', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center ${
                  activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.admin[`tabs_${tab}` as keyof typeof t.admin]}
                {tab === 'reviews' && pendingReviewsCount > 0 && (
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: t.admin.revenue, value: `${totalRevenue.toLocaleString()} CVE`, icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50' },
                { title: t.admin.active_rentals, value: reservations.filter(r => r.status === 'active').length.toString(), icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Fleet Size', value: vehicles.length.toString(), icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { title: 'Total Customers', value: new Set(reservations.map(r => r.userId)).size.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((stat, idx) => (
                <div key={idx} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${stat.bg} ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="mb-6 text-lg font-bold text-slate-900">{t.admin.revenue}</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString()} CVE`, 'Revenue']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        cursor={{ fill: '#f1f5f9' }} 
                      />
                      <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-900">{t.admin.recent_reservations}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {reservations.slice(0, 5).map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{res.customerName}</p>
                        <p className="text-xs text-slate-500">{res.startDate}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* FINANCE TAB */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
             {/* Finance Cards */}
             <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
                      <p className="text-sm font-medium text-slate-500">{t.admin.fin_total_income}</p>
                   </div>
                   <p className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} CVE</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20} /></div>
                      <p className="text-sm font-medium text-slate-500">{t.admin.fin_total_expenses}</p>
                   </div>
                   <p className="text-2xl font-bold text-slate-900">{totalExpenses.toLocaleString()} CVE</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                      <p className="text-sm font-medium text-slate-500">{t.admin.fin_net_profit}</p>
                   </div>
                   <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {netProfit.toLocaleString()} CVE
                   </p>
                </div>
             </div>

             <div className="grid gap-6 lg:grid-cols-3">
                {/* Chart */}
                <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                   <h3 className="mb-6 text-lg font-bold text-slate-900">Profit & Loss</h3>
                   <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={financialData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip 
                               formatter={(value) => [`${Number(value).toLocaleString()} CVE`, '']}
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                         </ComposedChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Add Expense Form */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                   <h3 className="mb-6 text-lg font-bold text-slate-900">{t.admin.fin_add_expense}</h3>
                   <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                      <div>
                         <label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_desc}</label>
                         <input name="description" required className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="e.g. Office Rent" />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_amount}</label>
                         <input name="amount" type="number" required className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="0" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_category}</label>
                            <select name="category" className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">
                               <option value="maintenance">Maintenance</option>
                               <option value="fuel">Fuel</option>
                               <option value="office">Office</option>
                               <option value="marketing">Marketing</option>
                               <option value="other">Other</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_date}</label>
                            <input name="date" type="date" required className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
                         </div>
                      </div>
                      <button type="submit" className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 mt-2">
                         Add Expense
                      </button>
                   </form>
                </div>
             </div>

             {/* Recent Transactions Table */}
             <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                   <h3 className="text-lg font-bold text-slate-900">{t.admin.fin_recent_transactions}</h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                         <tr>
                            <th className="px-6 py-4">{t.admin.fin_date}</th>
                            <th className="px-6 py-4">{t.admin.fin_desc}</th>
                            <th className="px-6 py-4">{t.admin.fin_category}</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">{t.admin.fin_amount}</th>
                            <th className="px-6 py-4 text-right"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {recentTransactions.slice(0, 10).map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                               <td className="px-6 py-4 font-mono text-xs">{item.date}</td>
                               <td className="px-6 py-4">{item.description}</td>
                               <td className="px-6 py-4 capitalize">
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                                     {item.category}
                                  </span>
                               </td>
                               <td className="px-6 py-4">
                                  {item.type === 'income' ? (
                                     <span className="text-emerald-600 flex items-center gap-1 font-medium"><TrendingUp size={14} /> {t.admin.fin_type_income}</span>
                                  ) : (
                                     <span className="text-red-600 flex items-center gap-1 font-medium"><TrendingDown size={14} /> {t.admin.fin_type_expense}</span>
                                  )}
                               </td>
                               <td className={`px-6 py-4 text-right font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  {item.type === 'expense' && (
                                     <button onClick={() => onDeleteExpense(item.id)} className="text-slate-400 hover:text-red-600 p-1">
                                        <Trash2 size={16} />
                                     </button>
                                  )}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* FLEET MANAGEMENT TAB */}
        {activeTab === 'fleet' && (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">{t.admin.fleet_status}</h3>
              <button onClick={handleStartAdd} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Plus size={16} /> {t.admin.add_vehicle}
              </button>
            </div>
            
            {(isEditingVehicle || isAddingVehicle) && (
              <div className="border-b border-slate-100 bg-slate-50 p-6">
                 <form onSubmit={handleVehicleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <input name="make" defaultValue={isEditingVehicle?.make} placeholder="Make" required className="rounded-md border-slate-300 p-2 text-sm" />
                    <input name="model" defaultValue={isEditingVehicle?.model} placeholder="Model" required className="rounded-md border-slate-300 p-2 text-sm" />
                    <input name="year" type="number" defaultValue={isEditingVehicle?.year} placeholder="Year" required className="rounded-md border-slate-300 p-2 text-sm" />
                    <input name="plate" defaultValue={isEditingVehicle?.plate} placeholder="Plate (ST-XX-XX)" className="rounded-md border-slate-300 p-2 text-sm" />
                    
                    <select name="category" defaultValue={isEditingVehicle?.category || 'economy'} className="rounded-md border-slate-300 p-2 text-sm">
                       <option value="economy">Economy</option>
                       <option value="suv">SUV</option>
                       <option value="luxury">Luxury</option>
                       <option value="van">Van</option>
                    </select>
                    <select name="transmission" defaultValue={isEditingVehicle?.transmission || 'manual'} className="rounded-md border-slate-300 p-2 text-sm">
                       <option value="manual">Manual</option>
                       <option value="automatic">Automatic</option>
                    </select>
                    <input name="seats" type="number" defaultValue={isEditingVehicle?.seats || 5} placeholder="Seats" required className="rounded-md border-slate-300 p-2 text-sm" />
                    <input name="pricePerDay" type="number" defaultValue={isEditingVehicle?.pricePerDay} placeholder="Price/Day" required className="rounded-md border-slate-300 p-2 text-sm" />
                    
                    <select name="status" defaultValue={isEditingVehicle?.status || 'available'} className="rounded-md border-slate-300 p-2 text-sm">
                       <option value="available">Available</option>
                       <option value="maintenance">Maintenance</option>
                       <option value="rented">Rented</option>
                    </select>

                    {/* Image Upload */}
                    <div className="sm:col-span-2 lg:col-span-4 border-t border-slate-200 pt-4 mt-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Image</label>
                        <div className="flex items-center gap-4">
                            <div className="relative h-24 w-40 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                                {vehicleImage ? (
                                    <img src={vehicleImage} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                        <Car size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block">
                                  <span className="sr-only">Choose profile photo</span>
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="block w-full text-sm text-slate-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-xs file:font-semibold
                                        file:bg-slate-900 file:text-white
                                        hover:file:bg-slate-800
                                        cursor-pointer
                                      "
                                  />
                                </label>
                                <p className="mt-1 text-xs text-slate-500">Supported formats: JPG, PNG. Recommended size: 400x250px</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end mt-2">
                        <button type="button" onClick={() => { setIsEditingVehicle(null); setIsAddingVehicle(false); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{t.admin.cancel}</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500">{t.admin.save}</button>
                    </div>
                 </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">{t.admin.plate}</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">{t.admin.price}</th>
                    <th className="px-6 py-4">{t.admin.status}</th>
                    <th className="px-6 py-4 text-right">{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                           <img src={v.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                           {v.make} {v.model} <span className="text-slate-400 font-normal">({v.year})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{v.plate || 'N/A'}</td>
                      <td className="px-6 py-4 capitalize">{v.category}</td>
                      <td className="px-6 py-4 font-semibold">{v.pricePerDay.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          v.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 
                          v.status === 'maintenance' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleStartEdit(v)} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                           <button 
                             onClick={() => {
                                if (window.confirm(t.admin.confirm_delete)) {
                                    onDeleteVehicle(v.id);
                                }
                             }} 
                             className="p-1 text-slate-400 hover:text-red-600"
                             title={t.admin.delete}
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESERVATIONS TAB */}
        {activeTab === 'reservations' && (
           <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900">{t.admin.tabs_reservations}</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                       <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Vehicle</th>
                          <th className="px-6 py-4">Dates</th>
                          <th className="px-6 py-4">Pickup</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">{t.admin.payment_status}</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {reservations.map(res => (
                          <tr key={res.id} className="hover:bg-slate-50">
                             <td className="px-6 py-4 font-mono text-xs">{res.id}</td>
                             <td className="px-6 py-4 font-medium text-slate-900">{res.customerName}</td>
                             <td className="px-6 py-4 text-xs">{getVehicleName(res.vehicleId)}</td>
                             <td className="px-6 py-4 text-xs">{res.startDate} <br/> {res.endDate}</td>
                             <td className="px-6 py-4">
                                <span className="capitalize">{res.pickupType}</span>
                                {res.pickupAddress && <div className="text-xs text-slate-400 max-w-[150px] truncate" title={res.pickupAddress}>{res.pickupAddress}</div>}
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                   res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                   res.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                                   res.status === 'active' ? 'bg-purple-50 text-purple-700' :
                                   res.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                   'bg-amber-50 text-amber-700'
                                }`}>
                                   {res.status}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    res.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                    res.paymentStatus === 'refunded' ? 'bg-slate-100 text-slate-600' :
                                    'bg-amber-50 text-amber-700'
                                }`}>
                                   {res.paymentStatus === 'paid' ? t.admin.paid : t.admin.pending_payment}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                   {res.status === 'pending' && (
                                     <button onClick={() => onUpdateReservationStatus(res.id, 'confirmed')} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded hover:bg-emerald-200">
                                       {t.admin.confirm}
                                     </button>
                                   )}
                                   {res.status === 'confirmed' && (
                                     <button onClick={() => onUpdateReservationStatus(res.id, 'active')} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200">
                                       {t.admin.mark_active}
                                     </button>
                                   )}
                                   {res.status === 'active' && (
                                     <button onClick={() => onUpdateReservationStatus(res.id, 'completed')} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                                       {t.admin.mark_completed}
                                     </button>
                                   )}
                                   {res.status !== 'completed' && res.status !== 'cancelled' && (
                                     <button onClick={() => onUpdateReservationStatus(res.id, 'cancelled')} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200">
                                       {t.admin.mark_cancelled}
                                     </button>
                                   )}
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {deliveryReservations.length === 0 ? (
               <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-100">
                 <Truck className="mx-auto h-12 w-12 text-slate-300" />
                 <h3 className="mt-2 text-sm font-semibold text-slate-900">No pending deliveries</h3>
               </div>
             ) : (
               deliveryReservations.map(res => (
                 <div key={res.id} className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                       <div className="rounded-full bg-red-50 p-3 text-red-600">
                          <Truck size={20} />
                       </div>
                       <span className={`rounded-full px-2 py-1 text-xs font-medium ${res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {res.status}
                       </span>
                    </div>
                    <div className="mt-4">
                       <h3 className="font-bold text-slate-900">{res.customerName}</h3>
                       <p className="text-sm text-slate-500">{getVehicleName(res.vehicleId)}</p>
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                       <MapPin size={16} className="mt-0.5 shrink-0" />
                       {res.pickupAddress}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-400">
                       <span>{res.startDate}</span>
                       <span>{res.endDate}</span>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                       {res.status === 'pending' && (
                         <button onClick={() => onUpdateReservationStatus(res.id, 'confirmed')} className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800">
                            Confirm Order
                         </button>
                       )}
                       {res.status === 'confirmed' && (
                         <button onClick={() => onUpdateReservationStatus(res.id, 'active')} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500">
                            Dispatch Driver
                         </button>
                       )}
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">{t.admin.reviews_moderation}</h3>
              
              <div className="flex rounded-md bg-slate-100 p-1">
                <button 
                  onClick={() => setReviewFilter('pending')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    reviewFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.admin.filter_pending}
                </button>
                <button 
                  onClick={() => setReviewFilter('all')}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    reviewFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.admin.filter_all}
                </button>
              </div>
            </div>
            
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center">
                 <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                    <Check size={24} />
                 </div>
                 <h3 className="text-sm font-semibold text-slate-900">All caught up!</h3>
                 <p className="mt-1 text-sm text-slate-500">No {reviewFilter} reviews found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Customer / Vehicle</th>
                      <th className="px-6 py-4 font-medium">Rating</th>
                      <th className="px-6 py-4 font-medium">Comment</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">{t.admin.status}</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{review.customerName}</p>
                          <p className="text-xs text-slate-500">{getVehicleName(review.vehicleId)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <StarRating rating={review.rating} size={14} />
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={review.comment}>
                          {review.comment}
                        </td>
                        <td className="px-6 py-4">{review.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            review.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 
                            review.status === 'rejected' ? 'bg-red-50 text-red-700' : 
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {review.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => onReviewAction(review.id, 'approved')}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                title={t.admin.approve}
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                onClick={() => onReviewAction(review.id, 'rejected')}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                title={t.admin.reject}
                              >
                                <XIcon size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm max-w-2xl mx-auto">
             <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   <Settings className="text-slate-500" size={20} />
                   {t.admin.tabs_settings}
                </h3>
             </div>
             
             <div className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-8">
                   
                   {/* API Key Section */}
                   <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <Key size={16} className="text-red-600" />
                          General API Settings
                      </h4>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                         {t.admin.api_key_label}
                      </label>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="text-slate-400" size={18} />
                         </div>
                         <input 
                            type="text" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="block w-full pl-10 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border"
                            placeholder={t.admin.api_key_placeholder}
                         />
                      </div>
                   </div>

                   {/* Vinti4 Section */}
                   <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <CreditCard size={16} className="text-emerald-600" />
                          {t.admin.vinti4_section}
                      </h4>
                      
                      <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t.admin.vinti4_pos_id}
                            </label>
                            <input 
                                type="text" 
                                value={vinti4PosId}
                                onChange={(e) => setVinti4PosId(e.target.value)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border px-3"
                                placeholder="123456"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t.admin.vinti4_api_key}
                            </label>
                            <input 
                                type="password" 
                                value={vinti4ApiKey}
                                onChange={(e) => setVinti4ApiKey(e.target.value)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5 border px-3"
                                placeholder="******************"
                            />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                         <a 
                           href="https://www.vinti4.cv/web.aspx" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                         >
                            {t.admin.vinti4_doc_link}
                            <ExternalLink size={12} />
                         </a>
                      </div>
                   </div>

                   {/* Stripe & PayPal Section */}
                   <div className="pt-6 border-t border-slate-100 grid gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-purple-600" />
                            {t.admin.stripe_section}
                        </h4>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t.admin.stripe_key}
                        </label>
                        <input 
                            type="text" 
                            value={stripeKey}
                            onChange={(e) => setStripeKey(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2.5 border px-3"
                            placeholder="pk_test_..."
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-blue-600" />
                            {t.admin.paypal_section}
                        </h4>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t.admin.paypal_client}
                        </label>
                        <input 
                            type="text" 
                            value={paypalClient}
                            onChange={(e) => setPaypalClient(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 border px-3"
                            placeholder="Client ID"
                        />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      {showSaveMsg && (
                         <span className="text-sm text-emerald-600 font-medium animate-in fade-in flex items-center gap-1">
                            <Check size={16} /> {t.admin.settings_saved}
                         </span>
                      )}
                      <div className={showSaveMsg ? '' : 'ml-auto'}>
                         <button 
                            type="submit"
                            className="inline-flex justify-center rounded-lg border border-transparent bg-slate-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                         >
                            {t.admin.save_settings}
                         </button>
                      </div>
                   </div>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};