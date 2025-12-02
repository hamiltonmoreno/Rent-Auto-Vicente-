

import React, { useState, useMemo } from 'react';
import { Translation, Reservation, Vehicle, ReservationStatus, Tour } from '../types';
import { Pagination } from './Pagination';
import { Search, Filter } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

interface AdminReservationsTabProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  tours: Tour[];
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
  onUpdateReservation?: (res: Reservation) => void;
}

export const AdminReservationsTab: React.FC<AdminReservationsTabProps> = ({
  t,
  reservations,
  vehicles,
  tours,
  onUpdateReservationStatus,
  onUpdateReservation
}) => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      // 1. Text Search
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        res.customerName.toLowerCase().includes(term) || 
        res.id.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== 'all' && res.status !== statusFilter) return false;

      // 3. Date Filter (Check if start date matches)
      if (dateFilter && res.startDate !== dateFilter) return false;

      return true;
    });
  }, [reservations, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const currentReservations = filteredReservations.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getVehicleName = (id?: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model}` : 'Unknown';
  };

  const getTourName = (id?: string) => {
      const tour = tours.find(t => t.id === id);
      return tour ? tour.title : 'Unknown Tour';
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 p-6 gap-4">
        <h3 className="text-lg font-bold text-slate-900">{t.admin.tabs_reservations}</h3>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder={t.admin.search_placeholder_res} 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:border-slate-900 focus:ring-0"
                />
            </div>

            {/* Status Filter */}
            <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:border-slate-900 focus:ring-0"
            >
                <option value="all">{t.filters.all}</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>

            {/* Date Filter */}
            <input 
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:border-slate-900 focus:ring-0"
            />
        </div>
      </div>
      <div className="overflow-x-auto">
         <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
               <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Pickup/Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">{t.admin.payment_status}</th>
                  <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {currentReservations.length > 0 ? currentReservations.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-mono text-xs">{res.id}</td>
                     <td className="px-6 py-4 font-medium text-slate-900">{res.customerName}</td>
                     <td className="px-6 py-4 text-xs">{res.type === 'tour' ? getTourName(res.tourId) : getVehicleName(res.vehicleId)}</td>
                     <td className="px-6 py-4 text-xs">{res.startDate} <br/> {res.endDate}</td>
                     <td className="px-6 py-4">
                        <span className="capitalize">{res.pickupType}</span>
                        {res.pickupAddress && <div className="text-xs text-slate-400 max-w-[150px] truncate" title={res.pickupAddress}>{res.pickupAddress}</div>}
                        {res.type === 'tour' && <div className="text-xs text-slate-400">{res.numberOfPassengers} Pax</div>}
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
                           {res.status === 'pending' && <button onClick={() => onUpdateReservationStatus(res.id, 'confirmed')} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded hover:bg-emerald-200">{t.admin.confirm}</button>}
                           {res.status === 'confirmed' && <button onClick={() => onUpdateReservationStatus(res.id, 'active')} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200">{t.admin.mark_active}</button>}
                           {res.status === 'active' && <button onClick={() => onUpdateReservationStatus(res.id, 'completed')} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">{t.admin.mark_completed}</button>}
                           {res.status !== 'completed' && res.status !== 'cancelled' && <button onClick={() => onUpdateReservationStatus(res.id, 'cancelled')} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200">{t.admin.mark_cancelled}</button>}
                        </div>
                     </td>
                  </tr>
               )) : (
                   <tr>
                       <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                           No reservations found matching criteria.
                       </td>
                   </tr>
               )}
            </tbody>
         </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
   </div>
  );
};