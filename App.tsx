import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BookingModal } from './components/BookingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';
import { Pagination } from './components/Pagination';
import { TourPackages } from './components/TourPackages'; 
import { TourBookingModal } from './components/TourBookingModal';
import { NotificationProvider, useNotification } from './components/NotificationSystem'; 
import { Vehicle, Language, User, Reservation, ReservationStatus, Review, Expense, Tour, CategoryItem, Driver, TaxiDailyLog } from './types';
import { TRANSLATIONS, MOCK_VEHICLES, MOCK_RESERVATIONS, MOCK_REVIEWS, MOCK_EXPENSES, MOCK_TOURS, DEFAULT_VEHICLE_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, MAINTENANCE_BUFFER_DAYS, MOCK_DRIVERS } from './constants';
import { StarRating } from './components/StarRating';

const ITEMS_PER_PAGE = 6;
const TRANSACTION_FEES = {
  vinti4: 0.015,
  card: 0.025,
  stripe: 0.029,
  paypal: 0.034,
  cash: 0
};

// Internal component to access Notification Context
const AppInner = () => {
  const { notify } = useNotification();
  const [lang, setLang] = useState<Language>('pt');
  const [view, setView] = useState<'home' | 'admin' | 'customer'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTourForBooking, setSelectedTourForBooking] = useState<Tour | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  // --- STATE MANAGEMENT ---
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('av_vehicles');
    return saved ? JSON.parse(saved) : MOCK_VEHICLES;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('av_reservations');
    return saved ? JSON.parse(saved) : MOCK_RESERVATIONS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('av_reviews');
    return saved ? JSON.parse(saved) : MOCK_REVIEWS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('av_expenses');
    return saved ? JSON.parse(saved) : MOCK_EXPENSES;
  });

  const [tours, setTours] = useState<Tour[]>(() => {
    const saved = localStorage.getItem('av_tours');
    return saved ? JSON.parse(saved) : MOCK_TOURS;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('av_drivers');
    return saved ? JSON.parse(saved) : MOCK_DRIVERS;
  });

  // Global State for Taxi Financials
  const [taxiLogs, setTaxiLogs] = useState<TaxiDailyLog[]>(() => {
    const saved = localStorage.getItem('av_taxi_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [vehicleCategories, setVehicleCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('av_cats_vehicles');
    return saved ? JSON.parse(saved) : DEFAULT_VEHICLE_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('av_cats_expenses');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
  });

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('av_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('av_reservations', JSON.stringify(reservations)); }, [reservations]);
  useEffect(() => { localStorage.setItem('av_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('av_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('av_tours', JSON.stringify(tours)); }, [tours]);
  useEffect(() => { localStorage.setItem('av_drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('av_taxi_logs', JSON.stringify(taxiLogs)); }, [taxiLogs]);
  useEffect(() => { localStorage.setItem('av_cats_vehicles', JSON.stringify(vehicleCategories)); }, [vehicleCategories]);
  useEffect(() => { localStorage.setItem('av_cats_expenses', JSON.stringify(expenseCategories)); }, [expenseCategories]);

  useEffect(() => { setCurrentPage(1); }, [selectedCategory]);

  const [searchLocation, setSearchLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');

  const t = TRANSLATIONS[lang];

  // Helper: Check overlap
  const isDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const existingEnd = new Date(end2);
    existingEnd.setDate(existingEnd.getDate() + MAINTENANCE_BUFFER_DAYS);
    const bufferedEnd2 = existingEnd.toISOString().split('T')[0];
    return start1 <= bufferedEnd2 && end1 >= start2;
  };

  // Availability Logic (FIXED)
  const getVehicleAvailability = (vehicleId: string) => {
    const v = vehicles.find(veh => veh.id === vehicleId);
    if (!v) return false;
    
    // 1. Maintenance Check
    if (v.status === 'maintenance') return false;

    // 2. TAXI ASSIGNMENT CHECK (New Safety Logic)
    // If a car is assigned to a Taxi Driver, it is NOT available for online rental
    const isAssignedToTaxi = drivers.some(d => d.currentVehicleId === vehicleId && d.status !== 'off_duty');
    if (isAssignedToTaxi) return false;

    // 3. Dates check
    if (!pickupDate || !dropoffDate) return true;

    // 4. Reservation Overlap Check
    const conflictingReservation = reservations.find(res => {
      if (res.vehicleId !== vehicleId) return false;
      if (res.status === 'cancelled') return false;
      return isDateOverlap(pickupDate, dropoffDate, res.startDate, res.endDate);
    });

    return !conflictingReservation;
  };

  // Fleet Filtering (Enhanced with Search and TAXI EXCLUSION)
  const filteredVehicles = vehicles.filter(v => {
    // 0. EXCLUDE TAXIS from Public Fleet
    // We check usageType. If it's 'taxi', hide it. 'rental' or 'both' or undefined are shown.
    if (v.usageType === 'taxi') return false;

    // 1. Category Filter
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    
    // 2. Search Text Filter (from Hero)
    if (searchLocation) {
        const term = searchLocation.toLowerCase();
        const match = v.make.toLowerCase().includes(term) || 
                      v.model.toLowerCase().includes(term) ||
                      (v.plate && v.plate.toLowerCase().includes(term));
        if (!match) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const currentVehicles = filteredVehicles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleBook = (vehicle: Vehicle) => { setSelectedVehicle(vehicle); setIsModalOpen(true); };
  const handleBookTour = (tour: Tour) => { setSelectedTourForBooking(tour); setIsTourModalOpen(true); };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') setView('admin'); else setView('customer');
  };

  const handleLogout = () => { setUser(null); setView('home'); };

  const handleUpdateUser = (updatedData: Partial<User>) => {
     if (user) setUser({ ...user, ...updatedData });
  };

  const handleCreateReservation = (data: Partial<Reservation>) => {
    let calculatedTotal = 0;
    let calculatedDiscount = 0;

    if (data.type === 'vehicle' && data.vehicleId) {
        const v = vehicles.find(veh => veh.id === data.vehicleId);
        if (v && data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
            const base = v.pricePerDay * days;
            calculatedDiscount = days > 7 ? base * 0.10 : 0;
            let extrasCost = 0;
            if (data.extras?.gps) extrasCost += 500 * days;
            if (data.extras?.childSeat) extrasCost += 1000 * days;
            if (data.extras?.insurance) extrasCost += 2500 * days;
            let deliveryCost = (data.pickupType === 'delivery' || data.pickupLocation === 'custom') ? 2000 : 0;
            calculatedTotal = (base - calculatedDiscount) + extrasCost + deliveryCost;
        }
    } else if (data.type === 'tour' && data.tourId) {
        const t = tours.find(tour => tour.id === data.tourId);
        if (t && data.numberOfPassengers) calculatedTotal = t.price * data.numberOfPassengers;
    }

    const finalTotal = calculatedTotal > 0 ? calculatedTotal : (data.total || 0);

    const newReservation: Reservation = {
      id: `RES-${Date.now()}`,
      vehicleId: data.vehicleId, 
      tourId: data.tourId,
      type: data.type || 'vehicle',
      userId: data.userId!,
      customerName: data.customerName!,
      startDate: data.startDate!,
      endDate: data.endDate!,
      status: data.status || 'pending',
      total: finalTotal,
      discount: calculatedDiscount,
      paidAmount: data.paidAmount || (finalTotal * 0.15), 
      pickupType: data.pickupType as any,
      pickupAddress: data.pickupAddress,
      flightNumber: data.flightNumber,
      numberOfPassengers: data.numberOfPassengers,
      extras: data.extras,
      paymentMethod: data.paymentMethod as any,
      paymentStatus: data.paymentStatus || 'pending',
      transactionId: data.transactionId,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    
    setReservations([newReservation, ...reservations]);

    if (data.paymentStatus === 'paid' && data.paymentMethod && finalTotal) {
      const amountPaid = newReservation.paidAmount || 0;
      const feePercentage = TRANSACTION_FEES[data.paymentMethod as keyof typeof TRANSACTION_FEES] || 0;
      if (feePercentage > 0 && amountPaid > 0) {
        const feeAmount = Math.round(amountPaid * feePercentage);
        const newExpense: Expense = {
          id: `EXP-FEE-${Date.now()}`,
          description: `Transaction Fee (${data.paymentMethod}) - Res #${newReservation.id}`,
          amount: feeAmount,
          category: 'other',
          date: new Date().toISOString().split('T')[0]
        };
        setExpenses(prev => [newExpense, ...prev]);
      }
    }
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
      setVehicles([...vehicles, newVehicle]);
  };

  const handleDeleteVehicle = (id: string) => {
    const hasActiveReservations = reservations.some(r => r.vehicleId === id && (r.status === 'confirmed' || r.status === 'active' || r.status === 'pending'));
    if (hasActiveReservations) {
        notify('error', 'Cannot delete vehicle. It has active reservations.');
        return;
    }
    setVehicles(vehicles.filter(v => v.id !== id));
    notify('success', 'Vehicle deleted');
  };

  const handleUpdateReservationStatus = (id: string, status: ReservationStatus) => {
    setReservations(prev => prev.map(r => {
        if (r.id !== id) return r;
        if (status === 'active' && r.paymentStatus === 'paid' && r.paidAmount && r.paidAmount < r.total) {
            return { ...r, status, paidAmount: r.total }; 
        }
        if (status === 'cancelled' && r.paymentStatus === 'paid' && (r.paidAmount || 0) > 0) {
            const refundExpense: Expense = {
                id: `EXP-REFUND-${Date.now()}`,
                description: `Refund - Reservation #${r.id} (${r.customerName})`,
                amount: r.paidAmount || 0,
                category: 'other',
                date: new Date().toISOString().split('T')[0]
            };
            setExpenses(prevExp => [refundExpense, ...prevExp]);
            return { ...r, status, paymentStatus: 'refunded' };
        }
        return { ...r, status };
    }));
    
    const res = reservations.find(r => r.id === id);
    if (res && res.vehicleId) {
        if (status === 'active') {
          setVehicles(prevV => prevV.map(v => v.id === res.vehicleId ? { ...v, status: 'rented', available: false } : v));
        } else if (status === 'completed' || status === 'cancelled') {
          setVehicles(prevV => prevV.map(v => v.id === res.vehicleId ? { ...v, status: 'available', available: true } : v));
        }
    }
  };

  const handleUpdateReservation = (updatedRes: Reservation) => {
      setReservations(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
  };

  const handleAddTour = (newTour: Tour) => setTours([...tours, newTour]);
  const handleUpdateTour = (updatedTour: Tour) => setTours(tours.map(t => t.id === updatedTour.id ? updatedTour : t));
  const handleDeleteTour = (id: string) => setTours(tours.filter(t => t.id !== id));

  const handleAddDriver = (newDriver: Driver) => setDrivers([...drivers, newDriver]);
  const handleUpdateDriver = (updatedDriver: Driver) => setDrivers(drivers.map(d => d.id === updatedDriver.id ? updatedDriver : d));
  const handleDeleteDriver = (id: string) => {
      const hasVehicle = drivers.find(d => d.id === id)?.currentVehicleId;
      if (hasVehicle) {
          notify('error', 'Cannot delete driver assigned to a vehicle. Unassign first.');
          return;
      }
      setDrivers(drivers.filter(d => d.id !== id));
      notify('success', 'Driver deleted');
  };

  const handleAddCategory = (cat: CategoryItem) => {
    if (cat.type === 'vehicle') setVehicleCategories([...vehicleCategories, cat]);
    else setExpenseCategories([...expenseCategories, cat]);
  };

  const handleDeleteCategory = (id: string, type: 'vehicle' | 'expense') => {
    if (type === 'vehicle') setVehicleCategories(vehicleCategories.filter(c => c.id !== id));
    else setExpenseCategories(expenseCategories.filter(c => c.id !== id));
  };

  const handleAddTaxiLog = (log: TaxiDailyLog) => {
      setTaxiLogs(prev => [log, ...prev]);
  };

  const handleReviewAction = (id: string, action: 'approved' | 'rejected') => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    notify('success', `Review ${action}`);
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    notify('success', 'Expense deleted');
  };

  const handleAddReview = (review: Review) => {
    setReviews(prev => [review, ...prev]);
  };

  const handleCancelReservation = (id: string) => {
    handleUpdateReservationStatus(id, 'cancelled');
  };

  const handleSearch = () => {
    const element = document.getElementById('fleet-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderContent = () => {
    if (view === 'admin' && user?.role === 'admin') {
      return (
        <AdminDashboard 
          t={t} 
          reservations={reservations} 
          vehicles={vehicles}
          reviews={reviews}
          expenses={expenses}
          tours={tours}
          drivers={drivers}
          taxiLogs={taxiLogs} 
          vehicleCategories={vehicleCategories}
          expenseCategories={expenseCategories}
          onUpdateVehicle={handleUpdateVehicle}
          onAddVehicle={handleAddVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onUpdateReservationStatus={handleUpdateReservationStatus}
          onReviewAction={handleReviewAction}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onAddTour={handleAddTour}
          onUpdateTour={handleUpdateTour}
          onDeleteTour={handleDeleteTour}
          onAddDriver={handleAddDriver}
          onUpdateDriver={handleUpdateDriver}
          onDeleteDriver={handleDeleteDriver}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onUpdateReservation={handleUpdateReservation}
          onAddTaxiLog={handleAddTaxiLog} 
        />
      );
    }
    
    if (view === 'customer' && user?.role === 'customer') {
      return (
         <CustomerDashboard 
            t={t} 
            reservations={reservations.filter(r => r.userId === user.id)}
            tours={tours}
            currentUser={user}
            onAddReview={handleAddReview}
            onUpdateUser={handleUpdateUser}
            onCancelReservation={handleCancelReservation}
         />
      );
    }

    return (
      <main>
        <Hero 
          t={t} 
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          pickupDate={pickupDate}
          setPickupDate={setPickupDate}
          dropoffDate={dropoffDate}
          setDropoffDate={setDropoffDate}
          onSearch={handleSearch}
        />
        
        <div id="fleet-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-3xl font-bold text-slate-900">{t.nav.fleet}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === 'all' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}
                >
                  {t.filters.all}
              </button>
              {vehicleCategories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-red-600 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}>
                        {t.filters[cat.id as keyof typeof t.filters] || cat.name}
                    </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {currentVehicles.map((vehicle) => {
              const isAvailable = getVehicleAvailability(vehicle.id);
              const vehicleReviews = reviews.filter(r => r.vehicleId === vehicle.id && r.status === 'approved');
              const averageRating = vehicleReviews.length > 0 ? vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length : vehicle.rating;
              
              return (
              <div key={vehicle.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl">
                <div className="aspect-video w-full overflow-hidden bg-slate-200">
                  <img src={vehicle.image} alt={vehicle.model} className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${!isAvailable ? 'grayscale' : ''}`} />
                  {!isAvailable && (<div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]"><span className={`rounded-md px-3 py-1 text-sm font-bold text-white ${vehicle.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}>{vehicle.status === 'maintenance' ? t.vehicle.maintenance : t.vehicle.unavailable}</span></div>)}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-600 uppercase tracking-wide">{vehicle.make}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">{vehicle.model}</h3>
                      <div className="mt-1 flex items-center gap-1"><StarRating rating={averageRating} size={14} /><span className="text-xs text-slate-500">({vehicleReviews.length > 0 ? vehicleReviews.length : vehicle.reviewCount} {t.vehicle.reviews})</span></div>
                    </div>
                    <div className="text-right"><p className="text-lg font-bold text-slate-900">{vehicle.pricePerDay.toLocaleString()}</p><p className="text-xs text-slate-500">CVE / {t.vehicle.day}</p></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>{vehicle.transmission === 'automatic' ? t.filters.automatic : t.filters.manual}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-600"><div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>{vehicle.seats} {t.vehicle.seats}</div>
                    <div className="flex items-center gap-2 text-sm text-slate-600"><div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>AC / Bluetooth</div>
                    <div className="flex items-center gap-2 text-sm text-slate-600"><div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>{vehicle.year}</div>
                  </div>
                  <div className="mt-4 flex-1"></div>
                  <button onClick={() => handleBook(vehicle)} disabled={!isAvailable} className="mt-3 w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-400">{isAvailable ? t.vehicle.book_now : t.vehicle.unavailable}</button>
                </div>
              </div>
            )})}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => { setCurrentPage(page); document.getElementById('fleet-section')?.scrollIntoView({ behavior: 'smooth' }); }} t={t} />
        </div>
        <TourPackages t={t} tours={tours} onBookTour={handleBookTour} />
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentLang={lang} setLang={setLang} t={t} onNavigate={setView} currentView={view} currentUser={user} onLoginClick={() => setIsLoginModalOpen(true)} onLogoutClick={handleLogout} />
      {renderContent()}
      <Footer t={t} />
      {selectedVehicle && (<BookingModal vehicle={selectedVehicle} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} t={t} currentUser={user} reviews={reviews} onLoginRequest={() => { setIsModalOpen(false); setIsLoginModalOpen(true); }} onCreateReservation={handleCreateReservation} defaultStartDate={pickupDate} defaultEndDate={dropoffDate} />)}
      {selectedTourForBooking && (<TourBookingModal tour={selectedTourForBooking} isOpen={isTourModalOpen} onClose={() => setIsTourModalOpen(false)} t={t} currentUser={user} onLoginRequest={() => { setIsTourModalOpen(false); setIsLoginModalOpen(true); }} onCreateReservation={handleCreateReservation} reservations={reservations} />)}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} t={t} />
    </div>
  );
};

export default function App() { return <NotificationProvider><AppInner /></NotificationProvider>; }