
import React, { useState } from 'react';
import { Translation, Reservation, Vehicle, ReservationStatus, Tour } from '../types';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 8;

interface AdminReservationsTabProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  tours: Tour[];
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
}

export const AdminReservationsTab: React.FC<AdminReservationsTabProps> = ({
  t,
  reservations,
  vehicles,
  tours,
  onUpdateReservationStatus
}) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(reservations.length / ITEMS_PER_PAGE);
  const currentReservations = reservations.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">{t.admin.tabs_reservations}</h3>
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
               {currentReservations.map(res => (
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
               ))}
            </tbody>
         </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
   </div>
  );
};
