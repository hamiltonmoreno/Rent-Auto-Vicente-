
import React, { useState } from 'react';
import { Translation, Driver, Vehicle } from '../types';
import { Edit2, Trash2, Plus, Car } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { DriverForm } from './DriverForm';

interface AdminTaxiDriversProps {
  t: Translation;
  drivers: Driver[];
  vehicles: Vehicle[];
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
}

export const AdminTaxiDrivers: React.FC<AdminTaxiDriversProps> = ({
  t,
  drivers,
  vehicles,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver
}) => {
  const { notify } = useNotification();
  const [isEditingDriver, setIsEditingDriver] = useState<Driver | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);

  const getVehicleModel = (id?: string) => {
      const v = vehicles.find(v => v.id === id);
      return v ? `${v.make} ${v.model} (${v.plate || 'No Plate'})` : 'No Vehicle Assigned';
  };

  const handleFormSubmit = (driverData: Driver) => {
      if (isEditingDriver) { 
          onUpdateDriver(driverData); 
          notify('success', 'Driver updated'); 
      } else { 
          onAddDriver(driverData); 
          notify('success', 'Driver added'); 
      }
      setIsAddingDriver(false); 
      setIsEditingDriver(null);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <button 
                onClick={() => { setIsAddingDriver(true); setIsEditingDriver(null); }} 
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
            >
                <Plus size={16} /> {t.admin.taxi_add_driver}
            </button>
        </div>
        
        {(isAddingDriver || isEditingDriver) && (
            <DriverForm 
                t={t}
                initialData={isEditingDriver}
                vehicles={vehicles}
                onSubmit={handleFormSubmit}
                onCancel={() => { setIsAddingDriver(false); setIsEditingDriver(null); }}
            />
        )}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">License</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {drivers.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{d.name}</td>
                            <td className="px-6 py-4 font-mono text-xs">{d.license}</td>
                            <td className="px-6 py-4">{d.phone}</td>
                            <td className="px-6 py-4">
                                {d.currentVehicleId ? (
                                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                                        <Car size={14} className="text-slate-400" />
                                        {getVehicleModel(d.currentVehicleId)}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic text-xs">None</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${d.status === 'available' ? 'bg-emerald-100 text-emerald-800' : d.status === 'busy' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {d.status.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setIsAddingDriver(false); setIsEditingDriver(d); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => { if(window.confirm('Delete this driver?')) onDeleteDriver(d.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
