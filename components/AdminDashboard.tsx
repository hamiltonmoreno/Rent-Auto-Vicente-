
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  CalendarRange, 
  DollarSign, 
  Map, 
  Truck, 
  Star, 
  BarChart3, 
  Settings,
  CarTaxiFront 
} from 'lucide-react';
import { Translation, Reservation, Review, Vehicle, ReservationStatus, Expense, Tour, CategoryItem, Driver, TaxiDailyLog } from '../types';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminFleetTab } from './AdminFleetTab';
import { AdminReservationsTab } from './AdminReservationsTab';
import { AdminDeliveriesTab } from './AdminDeliveriesTab';
import { AdminReviewsTab } from './AdminReviewsTab';
import { AdminFinanceTab } from './AdminFinanceTab';
import { AdminToursTab } from './AdminToursTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminTaxiTab } from './AdminTaxiTab';

interface AdminDashboardProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  reviews: Review[];
  expenses: Expense[];
  tours: Tour[];
  drivers: Driver[];
  taxiLogs: TaxiDailyLog[]; 
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
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
  onAddCategory: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string, type: 'vehicle' | 'expense') => void;
  onUpdateReservation?: (res: Reservation) => void;
  onAddTaxiLog: (log: TaxiDailyLog) => void; 
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  t, 
  reservations, 
  vehicles, 
  reviews, 
  expenses, 
  tours, 
  drivers,
  taxiLogs,
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
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onAddCategory,
  onDeleteCategory,
  onUpdateReservation,
  onAddTaxiLog
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'reservations' | 'deliveries' | 'reviews' | 'settings' | 'finance' | 'tours' | 'reports' | 'taxi'>('overview');
  
  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  // Rental Fleet: Used only for Overview stats calculations
  const rentalFleet = useMemo(() => vehicles.filter(v => v.usageType === 'rental' || v.usageType === 'both' || !v.usageType), [vehicles]);
  
  // Taxi Fleet: Used for Taxi Tab driver assignments
  const taxiFleet = useMemo(() => vehicles.filter(v => v.usageType === 'taxi' || v.usageType === 'both'), [vehicles]);

  const getRealTimeVehicleStatus = (vehicle: Vehicle) => {
      if (vehicle.status === 'maintenance') return 'maintenance';
      const today = new Date().toISOString().split('T')[0];
      const activeRes = reservations.find(r => r.vehicleId === vehicle.id && r.status === 'active');
      if (activeRes) return 'rented';
      const recentReturn = reservations.find(r => r.vehicleId === vehicle.id && r.status === 'completed' && r.endDate === today);
      if (recentReturn) return 'cleaning';
      return vehicle.status === 'rented' ? 'rented' : 'available'; 
  };

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard },
    { id: 'fleet', icon: Car },
    { id: 'reservations', icon: CalendarRange },
    { id: 'finance', icon: DollarSign },
    { id: 'tours', icon: Map },
    { id: 'taxi', icon: CarTaxiFront },
    { id: 'deliveries', icon: Truck },
    { id: 'reviews', icon: Star },
    { id: 'reports', icon: BarChart3 },
    { id: 'settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t.admin.dashboard}</h1>
          <p className="text-slate-500">Welcome back, Admin</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 rounded-xl bg-white p-2 shadow-sm border border-slate-100 lg:sticky lg:top-24 scrollbar-hide">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`
                    flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all whitespace-nowrap shrink-0 lg:shrink
                    ${activeTab === item.id 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-400'} />
                  <span className="flex-1 text-left">{t.admin[`tabs_${item.id}` as keyof typeof t.admin]}</span>
                  
                  {item.id === 'reviews' && pendingReviewsCount > 0 && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeTab === item.id ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'overview' && <AdminOverviewTab t={t} reservations={reservations} vehicles={rentalFleet} reviews={reviews} getRealTimeVehicleStatus={getRealTimeVehicleStatus} onNavigateToReservations={() => setActiveTab('reservations')} />}
            
            {activeTab === 'fleet' && <AdminFleetTab t={t} vehicles={vehicles} vehicleCategories={vehicleCategories} getRealTimeVehicleStatus={getRealTimeVehicleStatus} onAddVehicle={onAddVehicle} onUpdateVehicle={onUpdateVehicle} onDeleteVehicle={onDeleteVehicle} />}
            
            {activeTab === 'reservations' && <AdminReservationsTab t={t} reservations={reservations} vehicles={vehicles} tours={tours} onUpdateReservationStatus={onUpdateReservationStatus} onUpdateReservation={onUpdateReservation} />}
            
            {activeTab === 'deliveries' && <AdminDeliveriesTab t={t} reservations={reservations} vehicles={vehicles} onUpdateReservationStatus={onUpdateReservationStatus} />}
            
            {activeTab === 'reviews' && <AdminReviewsTab t={t} reviews={reviews} vehicles={vehicles} onReviewAction={onReviewAction} />}
            
            {activeTab === 'finance' && <AdminFinanceTab t={t} expenses={expenses} reservations={reservations} taxiLogs={taxiLogs} expenseCategories={expenseCategories} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} />}
            
            {activeTab === 'tours' && <AdminToursTab t={t} tours={tours} reservations={reservations} onAddTour={onAddTour} onUpdateTour={onUpdateTour} onDeleteTour={onDeleteTour} />}
            
            {activeTab === 'reports' && <AdminReportsTab t={t} reservations={reservations} vehicles={rentalFleet} expenses={expenses} vehicleCategories={vehicleCategories} />}
            
            {activeTab === 'settings' && <AdminSettingsTab t={t} vehicleCategories={vehicleCategories} expenseCategories={expenseCategories} onAddCategory={onAddCategory} onDeleteCategory={onDeleteCategory} />}
            
            {/* Pass vehicleCategories to Taxi Tab for the VehicleForm */}
            {activeTab === 'taxi' && <AdminTaxiTab t={t} vehicles={taxiFleet} drivers={drivers} taxiLogs={taxiLogs} vehicleCategories={vehicleCategories} onAddDriver={onAddDriver} onUpdateDriver={onUpdateDriver} onDeleteDriver={onDeleteDriver} onAddVehicle={onAddVehicle} onUpdateVehicle={onUpdateVehicle} onDeleteVehicle={onDeleteVehicle} onAddTaxiLog={onAddTaxiLog} />}
          </main>
        </div>
      </div>
    </div>
  );
};
