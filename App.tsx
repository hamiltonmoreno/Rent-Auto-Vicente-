








import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BookingModal } from './components/BookingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';
import { Vehicle, Language, User, Reservation, ReservationStatus, Review, Expense } from './types';
import { TRANSLATIONS, MOCK_VEHICLES, MOCK_RESERVATIONS, MOCK_REVIEWS, MOCK_EXPENSES } from './constants';
import { StarRating } from './components/StarRating';

function App() {
  const [lang, setLang] = useState<Language>('pt');
  const [view, setView] = useState<'home' | 'admin' | 'customer'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Central Data State with Persistence
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

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('av_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('av_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('av_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('av_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Search State
  const [searchLocation, setSearchLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const t = TRANSLATIONS[lang];

  // Helper: Check overlap
  const isDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    return start1 <= end2 && start2 <= end1;
  };

  // Availability Logic
  const getVehicleAvailability = (vehicleId: string) => {
    // If no dates selected, check generic 'available' flag and status
    if (!pickupDate || !dropoffDate) {
       const v = vehicles.find(veh => veh.id === vehicleId);
       // If status is maintenance, it's unavailable regardless of dates
       if (v?.status === 'maintenance') return false;
       return true;
    }

    // Check specific reservations overlaps
    const conflictingReservation = reservations.find(res => {
      if (res.vehicleId !== vehicleId) return false;
      if (res.status === 'cancelled' || res.status === 'completed') return false;
      return isDateOverlap(pickupDate, dropoffDate, res.startDate, res.endDate);
    });

    return !conflictingReservation;
  };

  // Filtering Logic
  const filteredVehicles = vehicles.filter(v => {
    // 1. Filter by Category
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    
    // 2. Filter by Maintenance
    // Admin sees everything in admin panel, but in Client 'Fleet' view, we hide maintenance or show as unavailable
    // Here we will keep them visible but disabled in UI if status is maintenance
    
    return true;
  });

  const handleBook = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setView('admin');
    } else {
      setView('customer');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
  };

  const handleCreateReservation = (data: Partial<Reservation>) => {
    const newReservation: Reservation = {
      id: `RES-${Date.now()}`,
      vehicleId: data.vehicleId!,
      userId: data.userId!,
      customerName: data.customerName!,
      startDate: data.startDate!,
      endDate: data.endDate!,
      status: data.status || 'pending',
      total: data.total!,
      discount: data.discount || 0,
      pickupType: data.pickupType as any,
      pickupAddress: data.pickupAddress,
      flightNumber: data.flightNumber,
      numberOfPassengers: data.numberOfPassengers,
      extras: data.extras!,
      paymentMethod: data.paymentMethod as any,
      paymentStatus: data.paymentStatus || 'pending',
      transactionId: data.transactionId,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    setReservations([newReservation, ...reservations]);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles([...vehicles, newVehicle]);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleUpdateReservationStatus = (id: string, status: ReservationStatus) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, status } : r));
    
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    // Logic to update Vehicle Status based on Reservation Status
    if (status === 'active') {
      // Car is now on the road
      setVehicles(vehicles.map(v => v.id === res.vehicleId ? { ...v, status: 'rented', available: false } : v));
    } else if (status === 'completed' || status === 'cancelled') {
      // Car returned
      setVehicles(vehicles.map(v => v.id === res.vehicleId ? { ...v, status: 'available', available: true } : v));
    }
  };

  const handleReviewAction = (id: string, action: 'approved' | 'rejected') => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: action } : r));
  };
  
  const handleAddReview = (newReview: Review) => {
    setReviews([...reviews, newReview]);
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleSearch = () => {
    setIsSearchActive(true);
    const fleetSection = document.getElementById('fleet-section');
    if (fleetSection) {
       fleetSection.scrollIntoView({ behavior: 'smooth' });
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
          onUpdateVehicle={handleUpdateVehicle}
          onAddVehicle={handleAddVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onUpdateReservationStatus={handleUpdateReservationStatus}
          onReviewAction={handleReviewAction}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      );
    }
    
    if (view === 'customer' && user?.role === 'customer') {
      return (
         <CustomerDashboard 
            t={t} 
            reservations={reservations.filter(r => r.userId === user.id)}
            onAddReview={handleAddReview}
         />
      );
    }

    // Home View
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
        
        {/* Fleet Section */}
        <div id="fleet-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-3xl font-bold text-slate-900">{t.nav.fleet}</h2>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'economy', 'suv', 'luxury', 'van'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => {
              const isAvailable = getVehicleAvailability(vehicle.id);
              
              // Calculate dynamic stats based on approved reviews
              const vehicleReviews = reviews.filter(r => r.vehicleId === vehicle.id && r.status === 'approved');
              const hasReviews = vehicleReviews.length > 0;
              
              const averageRating = hasReviews 
                ? vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length
                : vehicle.rating;
                
              const reviewCount = hasReviews ? vehicleReviews.length : vehicle.reviewCount;
              
              return (
              <div key={vehicle.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl">
                <div className="aspect-[16/10] w-full overflow-hidden bg-slate-200">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.model}
                    className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${!isAvailable ? 'grayscale' : ''}`}
                  />
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
                      <span className={`rounded-md px-3 py-1 text-sm font-bold text-white ${vehicle.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {vehicle.status === 'maintenance' ? t.vehicle.maintenance : t.vehicle.unavailable}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 uppercase tracking-wide">{vehicle.make}</p>
                      <h3 className="mt-1 text-xl font-bold text-slate-900">{vehicle.model}</h3>
                      <div className="mt-1 flex items-center gap-1">
                        <StarRating rating={averageRating} size={14} />
                        <span className="text-xs text-slate-500">({reviewCount} {t.vehicle.reviews})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{vehicle.pricePerDay.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">CVE / {t.vehicle.day}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      {vehicle.transmission === 'automatic' ? t.filters.automatic : t.filters.manual}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      {vehicle.seats} {t.vehicle.seats}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      AC / Bluetooth
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      {vehicle.year}
                    </div>
                  </div>

                  <div className="mt-6 flex-1"></div>

                  <button
                    onClick={() => handleBook(vehicle)}
                    disabled={!isAvailable}
                    className="mt-4 w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAvailable ? t.vehicle.book_now : t.vehicle.unavailable}
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        currentLang={lang} 
        setLang={setLang} 
        t={t} 
        onNavigate={setView}
        currentView={view}
        currentUser={user}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={handleLogout}
      />

      {renderContent()}

      <Footer t={t} />

      {selectedVehicle && (
        <BookingModal 
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          t={t}
          currentUser={user}
          reviews={reviews}
          onLoginRequest={() => {
            setIsModalOpen(false);
            setIsLoginModalOpen(true);
          }}
          onCreateReservation={handleCreateReservation}
          defaultStartDate={pickupDate}
          defaultEndDate={dropoffDate}
        />
      )}

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        t={t}
      />
    </div>
  );
}

export default App;