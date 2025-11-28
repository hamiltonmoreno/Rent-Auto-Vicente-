



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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Users, Car, DollarSign, Check, X as XIcon, Plus, Edit2, Trash2, MapPin, Truck, Upload, Settings, Key, ExternalLink, CreditCard, TrendingUp, TrendingDown, PieChart as PieChartIcon, Briefcase, LayoutGrid, Map, FileText, Download, Clock, Activity, ListOrdered, Filter, RefreshCcw, Tag, Calendar, AlertTriangle, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Translation, Reservation, Review, Vehicle, ReservationStatus, Expense, Tour, CategoryItem } from '../types';
import { StarRating } from './StarRating';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';

const ITEMS_PER_PAGE = 8;
const COLORS = ['#dc2626', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'];
const STATUS_COLORS = {
    available: '#10b981', // emerald
    rented: '#3b82f6',    // blue
    maintenance: '#f59e0b' // amber
};

interface AdminDashboardProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  reviews: Review[];
  expenses: Expense[];
  tours: Tour[];
  vehicleCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
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
  onAddCategory: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string, type: 'vehicle' | 'expense') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  t, 
  reservations, 
  vehicles, 
  reviews, 
  expenses,
  tours,
  vehicleCategories,
  expenseCategories,
  onUpdateVehicle,
  onAddVehicle,
  onDeleteVehicle,
  onUpdateReservationStatus,
  onReviewAction,
  onAddExpense,
  onDeleteExpense,
  onAddTour,
  onUpdateTour,
  onDeleteTour,
  onAddCategory,
  onDeleteCategory
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
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'integrations' | 'payments' | 'categories'>('general');
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

  // Category Management State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'vehicle' | 'expense'>('vehicle');
  
  // Report Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTransactionType, setFilterTransactionType] = useState('all'); // all, income, expense

  // Finance Tab Filters
  const [finFilterStartDate, setFinFilterStartDate] = useState('');
  const [finFilterEndDate, setFinFilterEndDate] = useState('');
  const [finFilterType, setFinFilterType] = useState('all'); // all, income, expense
  const [finFilterCategory, setFinFilterCategory] = useState('all');

  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  // --- OVERVIEW METRICS CALCULATION ---
  const overviewMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Operational (Today)
    const pickupsToday = reservations.filter(r => r.startDate === today && r.status === 'confirmed').length;
    const returnsToday = reservations.filter(r => r.endDate === today && r.status === 'active').length;
    
    // 2. Health
    const rentedCount = vehicles.filter(v => v.status === 'rented').length;
    const occupancyRate = vehicles.length > 0 ? (rentedCount / vehicles.length) * 100 : 0;
    
    // 3. Alerts
    const overdueReturns = reservations.filter(r => r.status === 'active' && r.endDate < today).length;
    const pendingReviews = reviews.filter(r => r.status === 'pending').length;

    // 4. Financial Growth (MoM)
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthRev = reservations
        .filter(r => new Date(r.startDate).getMonth() === currentMonth && r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.total, 0);
        
    const lastMonthRev = reservations
        .filter(r => new Date(r.startDate).getMonth() === lastMonth && r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.total, 0);
        
    const growth = lastMonthRev > 0 ? ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100 : 100;

    // 5. Fleet Status Data for Pie Chart
    const statusCounts = { available: 0, rented: 0, maintenance: 0 };
    vehicles.forEach(v => {
        statusCounts[v.status]++;
    });
    const fleetStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return {
        pickupsToday,
        returnsToday,
        occupancyRate,
        overdueReturns,
        pendingReviews,
        growth,
        fleetStatusData,
        currentMonthRev
    };
  }, [reservations, vehicles, reviews]);


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

  // Combined Transactions List (Filtered for Finance Tab)
  const recentTransactions = useMemo(() => {
    let incomes = reservations.map(r => ({
      id: r.id,
      date: r.dateCreated,
      description: `Reserva #${r.id} - ${r.customerName}`,
      amount: r.total,
      type: 'income',
      category: 'Rental'
    }));

    let outcomes = expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'expense',
      category: e.category
    }));

    let combined = [...incomes, ...outcomes];

    // Apply Finance Tab Filters
    if (finFilterStartDate) {
        combined = combined.filter(t => new Date(t.date) >= new Date(finFilterStartDate));
    }
    if (finFilterEndDate) {
        combined = combined.filter(t => new Date(t.date) <= new Date(finFilterEndDate));
    }
    if (finFilterType !== 'all') {
        combined = combined.filter(t => t.type === finFilterType);
    }
    if (finFilterCategory !== 'all') {
        combined = combined.filter(t => t.category === finFilterCategory);
    }

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations, expenses, finFilterStartDate, finFilterEndDate, finFilterType, finFilterCategory]);

  const handleClearFinFilters = () => {
      setFinFilterStartDate('');
      setFinFilterEndDate('');
      setFinFilterType('all');
      setFinFilterCategory('all');
  };

  const handleQuickFilter = (type: 'week' | 'month') => {
      const end = new Date();
      const start = new Date();
      if (type === 'week') {
          start.setDate(end.getDate() - 7);
      } else {
          start.setDate(1); // 1st of current month
      }
      setFilterStartDate(start.toISOString().split('T')[0]);
      setFilterEndDate(end.toISOString().split('T')[0]);
  };

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

  // Category Handlers
  const handleSubmitCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName.trim()) return;

      const id = newCatName.toLowerCase().replace(/\s+/g, '-');
      onAddCategory({
          id,
          name: newCatName,
          type: newCatType
      });
      setNewCatName('');
      notify('success', 'Category added');
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
          <div className="space-y-6 animate-in fade-in">
            {/* 1. OPERATIONS CENTER (Daily Pulse) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_today_pickups}</p>
                        <p className="text-2xl font-bold text-slate-900">{overviewMetrics.pickupsToday}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Key size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_today_returns}</p>
                        <p className="text-2xl font-bold text-slate-900">{overviewMetrics.returnsToday}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                        <RefreshCcw size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_occupancy_rate}</p>
                        <p className="text-2xl font-bold text-slate-900">{overviewMetrics.occupancyRate.toFixed(1)}%</p>
                    </div>
                    <div className={`p-3 rounded-lg ${overviewMetrics.occupancyRate > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Activity size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">{t.admin.ov_pending_actions}</p>
                        <p className="text-2xl font-bold text-red-600">{overviewMetrics.overdueReturns + overviewMetrics.pendingReviews}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-red-600">
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* 2. MAIN REVENUE CHART */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{t.admin.ov_revenue_trend}</h3>
                            <p className="text-sm text-slate-500">Total: <span className="font-semibold text-slate-900">{totalRevenue.toLocaleString()} CVE</span></p>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${overviewMetrics.growth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {overviewMetrics.growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {Math.abs(overviewMetrics.growth).toFixed(1)}% MoM
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip 
                                    formatter={(value) => [`${Number(value).toLocaleString()} CVE`, 'Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. FLEET STATUS (Donut) & ALERTS */}
                <div className="space-y-6">
                    {/* Fleet Status */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">{t.admin.ov_fleet_health}</h3>
                        <div className="h-48 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={overviewMetrics.fleetStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {overviewMetrics.fleetStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-900">{vehicles.length}</span>
                                    <span className="text-xs text-slate-500 uppercase">Total</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 text-xs mt-2">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Available</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Rented</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Maint.</div>
                        </div>
                    </div>

                    {/* Action Items List */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">{t.admin.ov_action_needed}</h3>
                        <div className="space-y-3">
                            {overviewMetrics.overdueReturns > 0 && (
                                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-red-800 text-sm">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <span><strong>{overviewMetrics.overdueReturns}</strong> Vehicles overdue for return.</span>
                                </div>
                            )}
                            {overviewMetrics.pendingReviews > 0 && (
                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm">
                                    <Clock size={16} className="mt-0.5 shrink-0" />
                                    <span><strong>{overviewMetrics.pendingReviews}</strong> Customer reviews pending moderation.</span>
                                </div>
                            )}
                            {overviewMetrics.overdueReturns === 0 && overviewMetrics.pendingReviews === 0 && (
                                <div className="flex items-center justify-center text-slate-400 text-sm py-4 italic">
                                    All clear! No urgent actions.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. RECENT ACTIVITY TABLE */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">{t.admin.recent_reservations}</h3>
                    <button onClick={() => setActiveTab('reservations')} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                        View All <ArrowRight size={16} />
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {reservations.slice(0, 5).map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                              <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{res.customerName}</p>
                            <p className="text-xs text-slate-500">{getVehicleName(res.vehicleId)} • {res.startDate}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{res.total.toLocaleString()} CVE</p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wide ${
                            res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {res.status}
                          </span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
           <div className="space-y-6 animate-in fade-in">
              {/* FILTERS SECTION */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold">
                          <Filter size={18} />
                          Filters
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => handleQuickFilter('week')} className="px-3 py-1 text-xs border border-slate-200 rounded-full hover:bg-slate-50">{t.admin.rep_quick_7days}</button>
                          <button onClick={() => handleQuickFilter('month')} className="px-3 py-1 text-xs border border-slate-200 rounded-full hover:bg-slate-50">{t.admin.rep_quick_month}</button>
                      </div>
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
                              {vehicleCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
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
