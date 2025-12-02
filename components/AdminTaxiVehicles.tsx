
import React, { useState } from 'react';
import { Translation, Driver, Vehicle, CategoryItem } from '../types';
import { User, Edit2, Trash2, Plus, XCircle } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { VehicleForm } from './VehicleForm';

interface AdminTaxiVehiclesProps {
  t: Translation;
  vehicles: Vehicle[];
  drivers: Driver[];
  vehicleCategories: CategoryItem[]; // Added prop
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateDriver: (driver: Driver) => void;
}

export const AdminTaxiVehicles: React.FC<AdminTaxiVehiclesProps> = ({
  t,
  vehicles,
  drivers,
  vehicleCategories,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onUpdateDriver
}) => {
  const { notify } = useNotification();
  const [isEditingVehicle, setIsEditingVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const handleFormSubmit = (vehicleData: Vehicle) => {
      if (isEditingVehicle) { 
          onUpdateVehicle(vehicleData); 
          notify('success', 'Vehicle updated'); 
      } else { 
          onAddVehicle(vehicleData); 
          notify('success', 'Vehicle added'); 
      }
      setIsAddingVehicle(false); 
      setIsEditingVehicle(null);
  };

  const getAssignedDriver = (vehicleId: string) => {
      return drivers.find(d => d.currentVehicleId === vehicleId);
  };

  const handleUnassignDriver = (driver: Driver) => {
      if (window.confirm(`Unassign ${driver.name} from this vehicle?`)) {
          onUpdateDriver({
              ...driver,
              currentVehicleId: undefined // Remove assignment
          });
          notify('success', 'Driver unassigned');
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-end"><button onClick={() => { setIsAddingVehicle(true); setIsEditingVehicle(null); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800"><Plus size={16} /> {t.admin.add_vehicle}</button></div>
        
        {/* Reused VehicleForm Component */}
        {(isAddingVehicle || isEditingVehicle) && (
            <VehicleForm 
                t={t}
                initialData={isEditingVehicle}
                vehicleCategories={vehicleCategories}
                onSubmit={handleFormSubmit}
                onCancel={() => { setIsAddingVehicle(false); setIsEditingVehicle(null); }}
            />
        )}

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Vehicle</th>
                        <th className="px-6 py-4">{t.admin.plate}</th>
                        <th className="px-6 py-4">Assigned Driver</th>
                        <th className="px-6 py-4">{t.admin.status}</th>
                        <th className="px-6 py-4 text-right">{t.admin.actions}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {vehicles.map(v => { 
                        const assignedDriver = getAssignedDriver(v.id); 
                        return (
                            <tr key={v.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    <div className="flex items-center gap-3">
                                        <img src={v.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                                        {v.make} {v.model}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">{v.plate || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    {assignedDriver ? (
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 font-semibold text-slate-900">
                                                <User size={14} className="text-slate-400"/> {assignedDriver.name}
                                            </span>
                                            <button 
                                                onClick={() => handleUnassignDriver(assignedDriver)}
                                                className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                title="Unassign Driver"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setIsAddingVehicle(false); setIsEditingVehicle(v); }} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button>
                                        <button onClick={() => { if (window.confirm(t.admin.confirm_delete)) onDeleteVehicle(v.id); }} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ) 
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};
