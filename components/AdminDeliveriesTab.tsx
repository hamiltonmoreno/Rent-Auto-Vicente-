
import React from 'react';
import { Truck, MapPin } from 'lucide-react';
import { Translation, Reservation, Vehicle, ReservationStatus } from '../types';
import { useNotification } from './NotificationSystem';

interface AdminDeliveriesTabProps {
  t: Translation;
  reservations: Reservation[];
  vehicles: Vehicle[];
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
}

export const AdminDeliveriesTab: React.FC<AdminDeliveriesTabProps> = ({
  t,
  reservations,
  vehicles,
  onUpdateReservationStatus
}) => {
  const { notify } = useNotification();
  const deliveryReservations = reservations.filter(r => r.pickupType === 'delivery' && (r.status === 'confirmed' || r.status === 'pending'));

  const getVehicleName = (id?: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model}` : 'Unknown';
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in">
       {deliveryReservations.length === 0 ? (
         <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-100">
           <Truck className="mx-auto h-12 w-12 text-slate-300" />
           <h3 className="mt-2 text-sm font-semibold text-slate-900">No pending deliveries</h3>
         </div>
       ) : (
         deliveryReservations.map(res => (
           <div key={res.id} className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                 <div className="rounded-full bg-red-50 p-3 text-red-600"><Truck size={20} /></div>
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
                 {res.status === 'pending' && <button onClick={() => { onUpdateReservationStatus(res.id, 'confirmed'); notify('success', 'Order confirmed'); }} className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800">Confirm Order</button>}
                 {res.status === 'confirmed' && <button onClick={() => { onUpdateReservationStatus(res.id, 'active'); notify('success', 'Driver dispatched'); }} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500">Dispatch Driver</button>}
              </div>
           </div>
         ))
       )}
    </div>
  );
};
