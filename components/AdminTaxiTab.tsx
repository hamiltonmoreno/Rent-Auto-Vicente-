import React, { useState } from 'react';
import { Translation, Driver, Vehicle, TaxiDailyLog } from '../types';
import { User, DollarSign, Car, Users } from 'lucide-react';
import { AdminTaxiOperations } from './AdminTaxiOperations';
import { AdminTaxiDrivers } from './AdminTaxiDrivers';
import { AdminTaxiVehicles } from './AdminTaxiVehicles';

interface AdminTaxiTabProps {
  t: Translation;
  vehicles: Vehicle[];
  drivers: Driver[];
  taxiLogs: TaxiDailyLog[]; // Global State
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onAddTaxiLog: (log: TaxiDailyLog) => void; // Global Handler
}

export const AdminTaxiTab: React.FC<AdminTaxiTabProps> = ({ 
  t, 
  vehicles, 
  drivers, 
  taxiLogs,
  onAddDriver, 
  onUpdateDriver, 
  onDeleteDriver,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddTaxiLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'operations' | 'drivers' | 'vehicles'>('operations');

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex border-b border-slate-200 overflow-x-auto">
            <button onClick={() => setActiveSubTab('operations')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'operations' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><DollarSign size={16} /> {t.admin.taxi_tab_operations}</button>
            <button onClick={() => setActiveSubTab('drivers')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'drivers' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Users size={16} /> {t.admin.taxi_tab_drivers}</button>
            <button onClick={() => setActiveSubTab('vehicles')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'vehicles' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Car size={16} /> {t.admin.taxi_tab_vehicles}</button>
        </div>

        {activeSubTab === 'operations' && <AdminTaxiOperations t={t} drivers={drivers} vehicles={vehicles} taxiLogs={taxiLogs} onAddTaxiLog={onAddTaxiLog} />}
        
        {activeSubTab === 'drivers' && (
            <AdminTaxiDrivers 
                t={t} 
                drivers={drivers} 
                vehicles={vehicles} 
                onAddDriver={onAddDriver} 
                onUpdateDriver={onUpdateDriver} 
                onDeleteDriver={onDeleteDriver} 
            />
        )}

        {activeSubTab === 'vehicles' && (
            <AdminTaxiVehicles 
                t={t} 
                vehicles={vehicles} 
                drivers={drivers} 
                onAddVehicle={onAddVehicle} 
                onUpdateVehicle={onUpdateVehicle} 
                onDeleteVehicle={onDeleteVehicle} 
            />
        )}
    </div>
  );
};