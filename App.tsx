

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
import { NotificationProvider } from './components/NotificationSystem'; // Import Provider
import { Vehicle, Language, User, Reservation, ReservationStatus, Review, Expense, Tour, CategoryItem } from './types';
import { TRANSLATIONS, MOCK_VEHICLES, MOCK_RESERVATIONS, MOCK_REVIEWS, MOCK_EXPENSES, MOCK_TOURS, DEFAULT_VEHICLE_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, MAINTENANCE_BUFFER_DAYS } from './constants';
import { StarRating } from './components/StarRating';

const ITEMS_PER_PAGE = 6;
// Business Logic Configuration
const TRANSACTION_FEES = {
  vinti4: 0.015, // 1.5%
  card: 0.025,   // 2.5%
  stripe: 0.029, // 2.9%
  paypal: 0.034, // 3.4%
  cash: 0
};

function AppContent() { // Extracted inner component to use Notification Hook if needed in App level later
  const [lang, setLang] = useState<Language>('pt');
  const [view, setView] = useState<'home' | 'admin' | 'customer'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTourForBooking, setSelectedTourForBooking] = useState<Tour | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Pagination State for Fleet
  const [currentPage, setCurrentPage] = useState(1);

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

  const [tours, setTours] = useState<Tour[]>(() => {
    const saved = localStorage.getItem('av_tours');
    return saved ? JSON.parse(saved) : MOCK_TOURS;
  });

  // Category State
  const [vehicleCategories, setVehicleCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('av_cats_vehicles');
    return saved ? JSON.parse(saved) : DEFAULT_VEHICLE_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('av_cats_expenses');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
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

  useEffect(() => {
    localStorage.setItem('av_tours', JSON.stringify(tours));
  }, [tours]);

  useEffect(() => {
    localStorage.setItem('av_cats_vehicles', JSON.stringify(vehicleCategories));
  }, [vehicleCategories]);

  useEffect(() => {
    localStorage.setItem('av_cats_expenses', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Search State
  const [searchLocation, setSearchLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const t = TRANSLATIONS[lang];

  // Helper: Check overlap with Buffer
  const isDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    // Add buffer to existing reservation end date
    const existingEnd = new Date(end2);
    existingEnd.setDate(existingEnd.getDate() + MAINTENANCE_BUFFER_DAYS);
    const bufferedEnd2 = existingEnd.toISOString().split('T')[0];

    // Standard overlap check: (StartA <= EndB) and (EndA >= StartB)
    return start1 <= bufferedEnd2 && end1 >= start2;
  };

  // Availability Logic
  const getVehicleAvailability = (vehicleId: string) => {
    const v = vehicles.find(veh => veh.id === vehicleId);
    if (!v) return false;

    // 1. Strict Maintenance Check: If 'maintenance', it is unavailable regardless of dates
    if (v.status === 'maintenance') return false;

    // 2. If no dates selected, assume available (since we passed maintenance check)
    if (!pickupDate || !dropoffDate) {
       return true;
    }

    // 3. Check specific reservations overlaps with buffer
    const conflictingReservation = reservations.find(res => {
      if (res.vehicleId !== vehicleId) return false;
      
      // Ignore cancelled reservations
      if (res.status === 'cancelled') return false;
      
      // We include 'completed' reservations in the overlap check to ensure 
      // the maintenance buffer (cleaning time) is respected even after a car is returned.
      
      return isDateOverlap(pickupDate, dropoffDate, res.startDate, res.endDate);
    });

    return !conflictingReservation;
  };

  // Filtering Logic
  const filteredVehicles = vehicles.filter(v => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const currentVehicles = filteredVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleBook = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };
  
  const handleBookTour = (tour: Tour) => {
    setSelectedTourForBooking(tour);
    setIsTourModalOpen(true);
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

  const handleUpdateUser = (updatedData: Partial<User>) => {
     if (user) {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
     }
  };

  const handleCreateReservation = (data: Partial<Reservation>) => {
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
      total: data.total!,
      discount: data.discount || 0,
      paidAmount: data.paidAmount || (data.total! * 0.15), // Assuming deposit paid if creating new
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

    // Financial Logic: Record Transaction Fee
    if (data.paymentStatus === 'paid' && data.paymentMethod && data.total) {
      // Fee is calculated on the amount ACTUALLY paid (e.g. Deposit)
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
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const handleUpdateReservationStatus = (id: string, status: ReservationStatus) => {
    // 1. Update the Reservation Status
    setReservations(prevReservations => {
        return prevReservations.map(r => {
            if (r.id !== id) return r;

            // Logic for "Check-out" (Active) - Calculating remaining payment
            if (status === 'active' && r.paymentStatus === 'paid' && r.paidAmount && r.paidAmount < r.total) {
                // If moving to active, assume customer pays the rest at counter
                return { ...r, status, paidAmount: r.total }; // Mark fully paid
            }

            // FINANCIAL INTEGRITY: Automatic Refund Logic
            // If cancelling a reservation that has been PAID (Deposit or Total), 
            // generate a negative transaction (Expense) to represent the refund.
            if (status === 'cancelled' && r.paymentStatus === 'paid' && (r.paidAmount || 0) > 0) {
                const refundAmount = r.paidAmount || 0;
                
                // Create Refund Expense
                const refundExpense: Expense = {
                    id: `EXP-REFUND-${Date.now()}`,
                    description: `Refund - Reservation #${r.id} (${r.customerName})`,
                    amount: refundAmount,
                    category: 'other', // Or specific refund category if available
                    date: new Date().toISOString().split('T')[0]
                };
                
                // Add expense to system
                setExpenses(prev => [refundExpense, ...prev]);

                // Update reservation to indicate refunded status
                return { ...r, status, paymentStatus: 'refunded' };
            }

            return { ...r, status };
        });
    });
    
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    // 2. Update Vehicle Status (If it's a vehicle reservation)
    if (res.vehicleId) {
        if (status === 'active') {
          setVehicles(vehicles.map(v => v.id === res.vehicleId ? { ...v, status: 'rented', available: false } : v));
        } else if (status === 'completed' || status === 'cancelled') {
          setVehicles(vehicles.map(v => v.id === res.vehicleId ? { ...v, status: 'available', available: true } : v));
        }
    }
  };

  const handleCancelReservation = (id: string) => {
      handleUpdateReservationStatus(id, 'cancelled');
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

  // Tours Handlers
  const handleAddTour = (newTour: Tour) => {
    setTours([...tours, newTour]);
  };

  const handleUpdateTour = (updatedTour: Tour) => {
    setTours(tours.map(t => t.id === updatedTour.id ? updatedTour : t));
  };

  const handleDeleteTour = (id: string) => {
    setTours(tours.filter(t => t.id !== id));
  };

  // Category Handlers
  const handleAddCategory = (cat: CategoryItem) => {
    if (cat.type === 'vehicle') {
        setVehicleCategories([...vehicleCategories, cat]);
    } else {
        setExpenseCategories([...expenseCategories, cat]);
    }
  };

  const handleDeleteCategory = (id: string, type: 'vehicle' | 'expense') => {
    if (type === 'vehicle') {
        setVehicleCategories(vehicleCategories.filter(c => c.id !== id));
    } else {
        setExpenseCategories(expenseCategories.filter(c => c.id !== id));
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
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
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
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  {t.filters.all}
              </button>
              {vehicleCategories.map(cat => {
                 // Try to find translation or use name
                 const label = t.filters[cat.id as keyof typeof t.filters] || cat.name;
                 return (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            selectedCategory === cat.id
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
                        }`}
                    >
                        {label}
                    </button>
                 );
              })}
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {currentVehicles.map((vehicle) => {
              const isAvailable = getVehicleAvailability(vehicle.id);
              
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

          <Pagination 
             currentPage={currentPage}
             totalPages={totalPages}
             onPageChange={(page) => {
                setCurrentPage(page);
                document.getElementById('fleet-section')?.scrollIntoView({ behavior: 'smooth' });
             }}
             t={t}
          />
        </div>

        <TourPackages t={t} tours={tours} onBookTour={handleBookTour} />
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

      {selectedTourForBooking && (
        <TourBookingModal
            tour={selectedTourForBooking}
            isOpen={isTourModalOpen}
            onClose={() => setIsTourModalOpen(false)}
            t={t}
            currentUser={user}
            onLoginRequest={() => {
                setIsTourModalOpen(false);
                setIsLoginModalOpen(true);
            }}
            onCreateReservation={handleCreateReservation}
            reservations={reservations}
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

// Wrapper for Provider
function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
