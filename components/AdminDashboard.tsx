

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
  LineChart,
  ComposedChart,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, Car, DollarSign, Check, X as XIcon, Plus, Edit2, Trash2, MapPin, Truck, Upload, Settings, Key, ExternalLink, CreditCard, TrendingUp, TrendingDown, PieChart as PieChartIcon, Briefcase, LayoutGrid, Map, FileText, Download, Clock, Activity, ListOrdered, Filter, RefreshCcw } from 'lucide-react';
import { Translation, Reservation, Review, Vehicle, ReservationStatus, Expense, Tour } from '../types';
import { StarRating } from './StarRating';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';

const ITEMS_PER_PAGE = 8;
const COLORS = ['#dc2626', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];

interface AdminDashboardProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  reviews: Review[];
  expenses: Expense[];
  tours: Tour[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
  onReviewAction: (id: string, action: 'approved' | 'rejected') => void;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddTour: (tour: Tour) => void;
  onUpdateTour: (tour: Tour) => void;
  onDeleteTour: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  t, 
  reservations, 
  vehicles, 
  reviews, 
  expenses,
  tours,
  onUpdateVehicle,
  onAddVehicle,
  onDeleteVehicle,
  onUpdateReservationStatus,
  onReviewAction,
  onAddExpense,
  onDeleteExpense,
  onAddTour,
  onUpdateTour,
  onDeleteTour
}) => {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'reservations' | 'deliveries' | 'reviews' | 'settings' | 'finance' | 'tours' | 'reports'>('overview');
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'all'>('pending');
  const [isEditingVehicle, setIsEditingVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [vehicleImage, setVehicleImage] = useState<string>('');
  
  // Tours State
  const [isEditingTour, setIsEditingTour] = useState<Tour | null>(null);
  const [isAddingTour, setIsAddingTour] = useState(false);
  const [tourImage, setTourImage] = useState<string>('');
  
  // Pagination State
  const [fleetPage, setFleetPage] = useState(1);
  const [reservationPage, setReservationPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [financePage, setFinancePage] = useState(1);
  const [tourPage, setTourPage] = useState(1);

  // Settings State
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'integrations' | 'payments'>('general');
  const [apiKey, setApiKey] = useState(localStorage.getItem('admin_api_key') || '');
  const [vinti4PosId, setVinti4PosId] = useState(localStorage.getItem('vinti4_pos_id') || '');
  const [vinti4ApiKey, setVinti4ApiKey] = useState(localStorage.getItem('vinti4_api_key') || '');
  const [stripeKey, setStripeKey] = useState(localStorage.getItem('stripe_key') || '');
  const [paypalClient, setPaypalClient] = useState(localStorage.getItem('paypal_client') || '');
  
  // Company Info State (Customization)
  const [compName, setCompName] = useState(localStorage.getItem('av_comp_name') || 'Auto Vicente');
  const [compEmail, setCompEmail] = useState(localStorage.getItem('av_comp_email') || 'reservas@autovicente.cv');
  const [compPhone, setCompPhone] = useState(localStorage.getItem('av_comp_phone') || '+238 991 12 34');
  const [compAddress, setCompAddress] = useState(localStorage.getItem('av_comp_address') || 'Achada Santo António, Praia');
  
  // Report Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTransactionType, setFilterTransactionType] = useState('all'); // all, income, expense

  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  // Real Analytics Data Calculation (Overview) - Unfiltered for Dashboard Overview
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

  // Filter Logic for Reports
  const filteredReservations = useMemo(() => {
    if (filterTransactionType === 'expense') return []; // If only looking for expenses, skip reservations

    return reservations.filter(res => {
        // Date Filter
        if (filterStartDate && new Date(res.startDate) < new Date(filterStartDate)) return false;
        if (filterEndDate && new Date(res.startDate) > new Date(filterEndDate)) return false;

        // Vehicle Filter
        if (filterVehicle !== 'all' && res.vehicleId !== filterVehicle) return false;

        // Category Filter
        if (filterCategory !== 'all') {
             // Find vehicle to check category
             const v = vehicles.find(v => v.id === res.vehicleId);
             if (!v || v.category !== filterCategory) return false;
        }

        return true;
    });
  }, [reservations, vehicles, filterStartDate, filterEndDate, filterVehicle, filterCategory, filterTransactionType]);

  const filteredExpenses = useMemo(() => {
    if (filterTransactionType === 'income') return []; // If only looking for income, skip expenses

    return expenses.filter(exp => {
        // Date Filter
        if (filterStartDate && new Date(exp.date) < new Date(filterStartDate)) return false;
        if (filterEndDate && new Date(exp.date) > new Date(filterEndDate)) return false;
        
        // Note: Expenses don't typically have vehicle IDs or Categories in this simple model, 
        // so we don't filter them by vehicle/category to avoid hiding all expenses when a vehicle is selected.
        // If we strictly wanted to, we'd need to link expenses to vehicles.
        
        return true;
    });
  }, [expenses, filterStartDate, filterEndDate, filterTransactionType]);


  // REPORT DATA CALCULATIONS (Using Filtered Data)
  const reportData = useMemo(() => {
     // 1. Occupancy Rate (Approximate based on current filter context)
     // Use all vehicles for capacity, but filtered reservations for occupancy
     const rentedOrActiveCount = vehicles.filter(v => v.status === 'rented' || v.status === 'maintenance').length; 
     const occupancyRate = vehicles.length > 0 ? (rentedOrActiveCount / vehicles.length) * 100 : 0;

     // 2. Average Ticket & Duration (Filtered)
     const validReservations = filteredReservations.filter(r => r.status !== 'cancelled' && r.type === 'vehicle');
     const revenueSum = validReservations.reduce((sum, r) => sum + r.total, 0);
     const avgTicket = validReservations.length > 0 ? revenueSum / validReservations.length : 0;

     // Avg Duration
     const totalDurationDays = validReservations.reduce((sum, res) => {
        const start = new Date(res.startDate);
        const end = new Date(res.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        return sum + days;
     }, 0);
     const avgDuration = validReservations.length > 0 ? totalDurationDays / validReservations.length : 0;

     // 3. Revenue by Category (Filtered)
     const revByCategory: Record<string, number> = {};
     validReservations.forEach(res => {
         if (res.vehicleId) {
             const v = vehicles.find(veh => veh.id === res.vehicleId);
             if (v) {
                 revByCategory[v.category] = (revByCategory[v.category] || 0) + res.total;
             }
         } else if (res.type === 'tour') {
             revByCategory['tours'] = (revByCategory['tours'] || 0) + res.total;
         }
     });
     const pieData = Object.entries(revByCategory).map(([name, value]) => ({ name, value }));

     // 4. Status Distribution (Filtered)
     const statusCounts: Record<string, number> = {};
     filteredReservations.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
     });
     const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

     // 5. Vehicle Performance (Filtered by Date primarily)
     const vehiclePerformance = vehicles.map(v => {
        // Filter reservations for this vehicle that match the global date filters
        const vehicleRes = filteredReservations.filter(r => r.vehicleId === v.id && r.status !== 'cancelled');
        const revenue = vehicleRes.reduce((sum, r) => sum + r.total, 0);
        const daysRented = vehicleRes.reduce((sum, res) => {
            const start = new Date(res.startDate);
            const end = new Date(res.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            return sum + (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1);
         }, 0);
         return {
            ...v,
            revenue,
            daysRented
         };
     }).sort((a,b) => b.revenue - a.revenue);

     return { occupancyRate, avgTicket, avgDuration, totalDurationDays, pieData, statusData, vehiclePerformance };
  }, [filteredReservations, vehicles]);


  // Financial Data Calculations (Filtered)
  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: Record<number, { income: number; expense: number }> = {};

    filteredReservations.forEach(r => {
      if (r.status === 'cancelled') return;
      const month = new Date(r.startDate).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].income += r.total;
    });

    filteredExpenses.forEach(e => {
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
  }, [filteredReservations, filteredExpenses]);

  const reportTotalRevenue = filteredReservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.total, 0);

  const reportTotalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const reportNetProfit = reportTotalRevenue - reportTotalExpenses;

  // Total Expenses for Dashboard view (Unfiltered)
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

  // PAGINATION CALCULATIONS
  
  // 1. Fleet
  const fleetTotalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE);
  const currentVehicles = vehicles.slice(
    (fleetPage - 1) * ITEMS_PER_PAGE,
    fleetPage * ITEMS_PER_PAGE
  );

  // 2. Reservations
  const reservationTotalPages = Math.ceil(reservations.length / ITEMS_PER_PAGE);
  const currentReservations = reservations.slice(
    (reservationPage - 1) * ITEMS_PER_PAGE,
    reservationPage * ITEMS_PER_PAGE
  );

  // 3. Reviews
  const filteredReviews = reviews.filter(review => {
    if (reviewFilter === 'pending') return review.status === 'pending';
    return true;
  });
  const reviewTotalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const currentReviews = filteredReviews.slice(
    (reviewPage - 1) * ITEMS_PER_PAGE,
    reviewPage * ITEMS_PER_PAGE
  );

  // 4. Finance (Transactions)
  const financeTotalPages = Math.ceil(recentTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = recentTransactions.slice(
    (financePage - 1) * ITEMS_PER_PAGE,
    financePage * ITEMS_PER_PAGE
  );

  // 5. Tours
  const tourTotalPages = Math.ceil(tours.length / ITEMS_PER_PAGE);
  const currentTours = tours.slice(
    (tourPage - 1) * ITEMS_PER_PAGE,
    tourPage * ITEMS_PER_PAGE
  );

  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model}` : 'Unknown Vehicle';
  };

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
      notify('success', 'Vehicle updated successfully');
    } else {
      onAddVehicle(vehicleData);
      notify('success', 'Vehicle added successfully');
    }
    setIsEditingVehicle(null);
    setIsAddingVehicle(false);
    setVehicleImage('');
  };

  // Tours Handlers
  const handleStartAddTour = () => {
    setTourImage('');
    setIsEditingTour(null);
    setIsAddingTour(true);
  };

  const handleStartEditTour = (tour: Tour) => {
    setTourImage(tour.image);
    setIsAddingTour(false);
    setIsEditingTour(tour);
  };

  const handleTourImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTourImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTourSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const tourData: Tour = {
      id: isEditingTour ? isEditingTour.id : `TOUR-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      image: tourImage || (isEditingTour ? isEditingTour.image : 'https://picsum.photos/400/250'),
      duration: formData.get('duration') as string,
      price: Number(formData.get('price')),
      features: (formData.get('features') as string).split(',').map(s => s.trim()).filter(s => s)
    };

    if (isEditingTour) {
      onUpdateTour(tourData);
      notify('success', 'Tour package updated');
    } else {
      onAddTour(tourData);
      notify('success', 'Tour package created');
    }
    setIsEditingTour(null);
    setIsAddingTour(false);
    setTourImage('');
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
    notify('success', 'Expense record added');
    (e.target as HTMLFormElement).reset();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Integrations
    localStorage.setItem('admin_api_key', apiKey);
    localStorage.setItem('vinti4_pos_id', vinti4PosId);
    localStorage.setItem('vinti4_api_key', vinti4ApiKey);
    localStorage.setItem('stripe_key', stripeKey);
    localStorage.setItem('paypal_client', paypalClient);
    
    // General / Company Info
    localStorage.setItem('av_comp_name', compName);
    localStorage.setItem('av_comp_email', compEmail);
    localStorage.setItem('av_comp_phone', compPhone);
    localStorage.setItem('av_comp_address', compAddress);

    notify('success', t.admin.settings_saved);
  };

  const handleClearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterVehicle('all');
    setFilterCategory('all');
    setFilterTransactionType('all');
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
            {['overview', 'fleet', 'reservations', 'finance', 'tours', 'deliveries', 'reviews', 'reports', 'settings'].map((tab) => (
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

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
           <div className="space-y-6 animate-in fade-in">
              {/* FILTERS SECTION */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-slate-900 font-semibold">
                      <Filter size={18} />
                      Filters
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_date_start}</label>
                          <input 
                              type="date" 
                              value={filterStartDate}
                              onChange={(e) => setFilterStartDate(e.target.value)}
                              className="w-full rounded-md border-slate-200 text-sm py-1.5 focus:border-red-500 focus:ring-red-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_date_end}</label>
                          <input 
                              type="date" 
                              value={filterEndDate}
                              onChange={(e) => setFilterEndDate(e.target.value)}
                              className="w-full rounded-md border-slate-200 text-sm py-1.5 focus:border-red-500 focus:ring-red-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_vehicle}</label>
                          <select 
                             value={filterVehicle} 
                             onChange={(e) => setFilterVehicle(e.target.value)}
                             className="w-full rounded-md border-slate-200 text-sm py-1.5 focus:border-red-500 focus:ring-red-500"
                          >
                              <option value="all">{t.filters.all}</option>
                              {vehicles.map(v => (
                                  <option key={v.id} value={v.id}>{v.make} {v.model}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_category}</label>
                          <select 
                             value={filterCategory} 
                             onChange={(e) => setFilterCategory(e.target.value)}
                             className="w-full rounded-md border-slate-200 text-sm py-1.5 focus:border-red-500 focus:ring-red-500"
                          >
                              <option value="all">{t.filters.all}</option>
                              <option value="economy">{t.filters.economy}</option>
                              <option value="suv">{t.filters.suv}</option>
                              <option value="luxury">{t.filters.luxury}</option>
                              <option value="van">{t.filters.van}</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.rep_filter_type}</label>
                          <select 
                             value={filterTransactionType} 
                             onChange={(e) => setFilterTransactionType(e.target.value)}
                             className="w-full rounded-md border-slate-200 text-sm py-1.5 focus:border-red-500 focus:ring-red-500"
                          >
                              <option value="all">{t.filters.all}</option>
                              <option value="income">Income Only</option>
                              <option value="expense">Expense Only</option>
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-end mt-4">
                      <button 
                         onClick={handleClearFilters}
                         className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50"
                      >
                          <RefreshCcw size={14} />
                          {t.admin.rep_filter_clear}
                      </button>
                  </div>
              </div>

              {/* Top Metrics Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                          <PieChartIcon size={20} className="text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">{t.admin.rep_occupancy}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportData.occupancyRate.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={20} className="text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">{t.admin.rep_avg_ticket}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{Math.round(reportData.avgTicket).toLocaleString()} CVE</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                          <Clock size={20} className="text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">{t.admin.rep_avg_duration}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportData.avgDuration.toFixed(1)} {t.vehicle.day}s</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                          <Activity size={20} className="text-slate-500" />
                          <p className="text-sm font-medium text-slate-500">{t.admin.rep_days_rented}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{reportData.totalDurationDays}</p>
                  </div>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                  {/* Revenue Growth Line Chart */}
                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-slate-900">{t.admin.rep_monthly_growth}</h3>
                          <button onClick={() => notify('success', 'PDF Downloaded')} className="text-xs flex items-center gap-1 text-red-600 font-medium hover:underline">
                              <Download size={14} /> {t.admin.rep_export_pdf}
                          </button>
                      </div>
                      <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={financialData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  <Legend />
                                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                              </LineChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Revenue by Category Pie Chart */}
                  <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6">{t.admin.rep_rev_by_cat}</h3>
                      <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={reportData.pieData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  >
                                      {reportData.pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} CVE`} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                 {/* Status Distribution Donut */}
                 <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6">{t.admin.rep_status_dist}</h3>
                      <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={reportData.statusData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      paddingAngle={5}
                                      dataKey="value"
                                      label={({ name, value }) => `${name} (${value})`}
                                  >
                                      {reportData.statusData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                 </div>

                 {/* Top 5 Vehicles Bar Chart (Horizontal) */}
                 <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-900 mb-6">{t.admin.rep_top_vehicles}</h3>
                     <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart 
                             layout="vertical" 
                             data={reportData.vehiclePerformance.slice(0, 5).map(v => ({ name: `${v.make} ${v.model}`, revenue: v.revenue }))}
                             margin={{ left: 40 }}
                           >
                             <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                             <Tooltip formatter={(value) => `${Number(value).toLocaleString()} CVE`} cursor={{fill: 'transparent'}} />
                             <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
              </div>

              {/* Fleet Performance Table */}
              <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ListOrdered size={20} className="text-slate-500" />
                        {t.admin.rep_vehicle_perf}
                    </h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                       <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                             <th className="px-6 py-4">Vehicle</th>
                             <th className="px-6 py-4 text-center">{t.admin.rep_perf_days}</th>
                             <th className="px-6 py-4 text-right">{t.admin.rep_perf_revenue}</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {reportData.vehiclePerformance.map(v => (
                             <tr key={v.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                   {v.make} {v.model} <span className="text-slate-400 font-normal">({v.plate})</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                      {v.daysRented || 0} days
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                   {v.revenue ? v.revenue.toLocaleString() : 0} CVE
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* Financial Statement Table (DRE) */}
              <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">{t.admin.rep_statement}</h3>
                      <button onClick={() => notify('success', 'CSV Downloaded')} className="text-xs flex items-center gap-1 text-slate-600 font-medium hover:text-slate-900">
                          <FileText size={14} /> {t.admin.rep_export_csv}
                      </button>
                  </div>
                  <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                              <th className="px-6 py-4">Month</th>
                              <th className="px-6 py-4 text-right">Revenue</th>
                              <th className="px-6 py-4 text-right">Expenses</th>
                              <th className="px-6 py-4 text-right">Net Profit</th>
                              <th className="px-6 py-4 text-right">Margin</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {financialData.filter(d => d.income > 0 || d.expense > 0).map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                  <td className="px-6 py-4 text-right text-emerald-600">{row.income.toLocaleString()} CVE</td>
                                  <td className="px-6 py-4 text-right text-red-600">{row.expense.toLocaleString()} CVE</td>
                                  <td className={`px-6 py-4 text-right font-bold ${row.profit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                      {row.profit.toLocaleString()} CVE
                                  </td>
                                  <td className="px-6 py-4 text-right text-slate-500">
                                      {row.income > 0 ? ((row.profit / row.income) * 100).toFixed(1) : 0}%
                                  </td>
                              </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold">
                              <td className="px-6 py-4">TOTAL</td>
                              <td className="px-6 py-4 text-right text-emerald-700">{reportTotalRevenue.toLocaleString()} CVE</td>
                              <td className="px-6 py-4 text-right text-red-700">{reportTotalExpenses.toLocaleString()} CVE</td>
                              <td className="px-6 py-4 text-right text-slate-900">{reportNetProfit.toLocaleString()} CVE</td>
                              <td className="px-6 py-4 text-right">{(reportTotalRevenue > 0 ? (reportNetProfit/reportTotalRevenue)*100 : 0).toFixed(1)}%</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
           </div>
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
                            <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" />
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
                         {currentTransactions.map((item: any) => (
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
                <Pagination 
                   currentPage={financePage}
                   totalPages={financeTotalPages}
                   onPageChange={setFinancePage}
                   t={t}
                />
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
                  {currentVehicles.map((v) => (
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
                                    notify('info', 'Vehicle deleted');
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
            <Pagination 
                currentPage={fleetPage}
                totalPages={fleetTotalPages}
                onPageChange={setFleetPage}
                t={t}
            />
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
                       {currentReservations.map(res => (
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
              <Pagination 
                currentPage={reservationPage}
                totalPages={reservationTotalPages}
                onPageChange={setReservationPage}
                t={t}
              />
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
                         <button onClick={() => { onUpdateReservationStatus(res.id, 'confirmed'); notify('success', 'Order confirmed'); }} className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800">
                            Confirm Order
                         </button>
                       )}
                       {res.status === 'confirmed' && (
                         <button onClick={() => { onUpdateReservationStatus(res.id, 'active'); notify('success', 'Driver dispatched'); }} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500">
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
                  onClick={() => { setReviewFilter('pending'); setReviewPage(1); }}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    reviewFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.admin.filter_pending}
                </button>
                <button 
                  onClick={() => { setReviewFilter('all'); setReviewPage(1); }}
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
                    {currentReviews.map((review) => (
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
                                onClick={() => { onReviewAction(review.id, 'approved'); notify('success', 'Review approved'); }}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                title={t.admin.approve}
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                onClick={() => { onReviewAction(review.id, 'rejected'); notify('info', 'Review rejected'); }}
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
             <Pagination 
                currentPage={reviewPage}
                totalPages={reviewTotalPages}
                onPageChange={setReviewPage}
                t={t}
            />
          </div>
        )}

        {/* TOURS TAB */}
        {activeTab === 'tours' && (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-900">{t.admin.tabs_tours}</h3>
              <button onClick={handleStartAddTour} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Plus size={16} /> {t.admin.add_tour}
              </button>
            </div>
            
            {(isEditingTour || isAddingTour) && (
              <div className="border-b border-slate-100 bg-slate-50 p-6">
                 <form onSubmit={handleTourSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.admin.tour_title}</label>
                        <input name="title" defaultValue={isEditingTour?.title} required className="w-full rounded-md border-slate-300 p-2 text-sm border" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.tours.duration}</label>
                        <input name="duration" defaultValue={isEditingTour?.duration} required className="w-full rounded-md border-slate-300 p-2 text-sm border" placeholder="e.g. 4 Hours" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.admin.tour_price}</label>
                        <input name="price" type="number" defaultValue={isEditingTour?.price} required className="w-full rounded-md border-slate-300 p-2 text-sm border" />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.admin.tour_features} <span className="text-xs text-slate-500">({t.admin.tour_features_help})</span></label>
                        <input name="features" defaultValue={isEditingTour?.features.join(', ')} required className="w-full rounded-md border-slate-300 p-2 text-sm border" />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea name="description" rows={3} defaultValue={isEditingTour?.description} required className="w-full rounded-md border-slate-300 p-2 text-sm border" />
                    </div>

                    {/* Image Upload */}
                    <div className="sm:col-span-2 border-t border-slate-200 pt-4 mt-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tour Image</label>
                        <div className="flex items-center gap-4">
                            <div className="relative h-24 w-40 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                                {tourImage ? (
                                    <img src={tourImage} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                        <Map size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block">
                                  <span className="sr-only">Choose photo</span>
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={handleTourImageUpload}
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
                            </div>
                        </div>
                    </div>
                    
                    <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
                        <button type="button" onClick={() => { setIsEditingTour(null); setIsAddingTour(false); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{t.admin.cancel}</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500">{t.admin.save}</button>
                    </div>
                 </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tour</th>
                    <th className="px-6 py-4">{t.tours.duration}</th>
                    <th className="px-6 py-4">{t.admin.tour_price}</th>
                    <th className="px-6 py-4 text-right">{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                           <img src={tour.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                           <span className="font-semibold">{tour.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{tour.duration}</td>
                      <td className="px-6 py-4 font-semibold">{tour.price.toLocaleString()} CVE</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleStartEditTour(tour)} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                           <button 
                             onClick={() => {
                                if (window.confirm(t.admin.confirm_delete)) {
                                    onDeleteTour(tour.id);
                                    notify('info', 'Tour deleted');
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
            <Pagination 
                currentPage={tourPage}
                totalPages={tourTotalPages}
                onPageChange={setTourPage}
                t={t}
            />
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

             {/* Settings Sub-Navigation */}
             <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
                <button
                   onClick={() => setSettingsSubTab('general')}
                   className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      settingsSubTab === 'general' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                   }`}
                >
                   {t.admin.settings_general}
                </button>
                <button
                   onClick={() => setSettingsSubTab('integrations')}
                   className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      settingsSubTab === 'integrations' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                   }`}
                >
                   {t.admin.settings_integrations}
                </button>
                <button
                   onClick={() => setSettingsSubTab('payments')}
                   className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      settingsSubTab === 'payments' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                   }`}
                >
                   {t.admin.settings_payments}
                </button>
             </div>
             
             <div className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-8">
                   
                   {/* GENERAL SETTINGS */}
                   {settingsSubTab === 'general' && (
                     <div className="animate-in fade-in">
                        <div className="grid gap-6">
                           <div>
                              <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                  <Briefcase size={16} className="text-slate-600" />
                                  Company Information
                              </h4>
                              <div className="space-y-4">
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t.admin.comp_name}</label>
                                    <input 
                                       type="text" 
                                       value={compName}
                                       onChange={(e) => setCompName(e.target.value)}
                                       className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border px-3"
                                    />
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-2">{t.admin.comp_email}</label>
                                       <input 
                                          type="email" 
                                          value={compEmail}
                                          onChange={(e) => setCompEmail(e.target.value)}
                                          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border px-3"
                                       />
                                    </div>
                                    <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-2">{t.admin.comp_phone}</label>
                                       <input 
                                          type="text" 
                                          value={compPhone}
                                          onChange={(e) => setCompPhone(e.target.value)}
                                          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border px-3"
                                       />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">{t.admin.comp_address}</label>
                                    <input 
                                       type="text" 
                                       value={compAddress}
                                       onChange={(e) => setCompAddress(e.target.value)}
                                       className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border px-3"
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {/* INTEGRATIONS SETTINGS (General API) */}
                   {settingsSubTab === 'integrations' && (
                     <div className="animate-in fade-in space-y-8">
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
                     </div>
                   )}

                   {/* PAYMENTS SETTINGS (Vinti4, Stripe, PayPal) */}
                   {settingsSubTab === 'payments' && (
                     <div className="animate-in fade-in space-y-8">
                       {/* Vinti4 Section */}
                       <div>
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
                     </div>
                   )}

                   <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                      <div>
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