
import React, { useState } from 'react';
import { Translation, Reservation, Review, Vehicle, ReservationStatus, Expense, Tour, CategoryItem } from '../types';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminFleetTab } from './AdminFleetTab';
import { AdminReservationsTab } from './AdminReservationsTab';
import { AdminDeliveriesTab } from './AdminDeliveriesTab';
import { AdminReviewsTab } from './AdminReviewsTab';
import { AdminFinanceTab } from './AdminFinanceTab';
import { AdminToursTab } from './AdminToursTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminSettingsTab } from './AdminSettingsTab';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'reservations' | 'deliveries' | 'reviews' | 'settings' | 'finance' | 'tours' | 'reports'>('overview');
  
  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length;

  // Global Logic shared between Overview and Fleet
  const getRealTimeVehicleStatus = (vehicle: Vehicle) => {
      if (vehicle.status === 'maintenance') return 'maintenance';
      const today = new Date().toISOString().split('T')[0];
      const activeRes = reservations.find(r => r.vehicleId === vehicle.id && r.status === 'active');
      if (activeRes) return 'rented';
      const recentReturn = reservations.find(r => r.vehicleId === vehicle.id && r.status === 'completed' && r.endDate === today);
      if (recentReturn) return 'cleaning';
      return vehicle.status === 'rented' ? 'rented' : 'available'; 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h1 className="text-2xl font-bold text-slate-900">{t.admin.dashboard}</h1><p className="text-slate-500">Welcome back, Admin</p></div>
          <div className="flex overflow-x-auto rounded-lg bg-white p-1 shadow-sm">
            {['overview', 'fleet', 'reservations', 'finance', 'tours', 'deliveries', 'reviews', 'reports', 'settings'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center ${activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {t.admin[`tabs_${tab}` as keyof typeof t.admin]}
                {tab === 'reviews' && pendingReviewsCount > 0 && (<span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab ? 'bg-white text-red-600' : 'bg-red-100 text-red-600'}`}>{pendingReviewsCount}</span>)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && <AdminOverviewTab t={t} reservations={reservations} vehicles={vehicles} reviews={reviews} getRealTimeVehicleStatus={getRealTimeVehicleStatus} onNavigateToReservations={() => setActiveTab('reservations')} />}
        {activeTab === 'fleet' && <AdminFleetTab t={t} vehicles={vehicles} vehicleCategories={vehicleCategories} getRealTimeVehicleStatus={getRealTimeVehicleStatus} onAddVehicle={onAddVehicle} onUpdateVehicle={onUpdateVehicle} onDeleteVehicle={onDeleteVehicle} />}
        {activeTab === 'reservations' && <AdminReservationsTab t={t} reservations={reservations} vehicles={vehicles} tours={tours} onUpdateReservationStatus={onUpdateReservationStatus} />}
        {activeTab === 'deliveries' && <AdminDeliveriesTab t={t} reservations={reservations} vehicles={vehicles} onUpdateReservationStatus={onUpdateReservationStatus} />}
        {activeTab === 'reviews' && <AdminReviewsTab t={t} reviews={reviews} vehicles={vehicles} onReviewAction={onReviewAction} />}
        {activeTab === 'finance' && <AdminFinanceTab t={t} expenses={expenses} reservations={reservations} expenseCategories={expenseCategories} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} />}
        {activeTab === 'tours' && <AdminToursTab t={t} tours={tours} reservations={reservations} onAddTour={onAddTour} onUpdateTour={onUpdateTour} onDeleteTour={onDeleteTour} />}
        {activeTab === 'reports' && <AdminReportsTab t={t} reservations={reservations} vehicles={vehicles} expenses={expenses} vehicleCategories={vehicleCategories} />}
        {activeTab === 'settings' && <AdminSettingsTab t={t} vehicleCategories={vehicleCategories} expenseCategories={expenseCategories} onAddCategory={onAddCategory} onDeleteCategory={onDeleteCategory} />}
      </div>
    </div>
  );
};
