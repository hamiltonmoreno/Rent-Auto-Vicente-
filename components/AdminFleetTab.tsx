import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Tag } from 'lucide-react';
import { Translation, Vehicle, CategoryItem } from '../types';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';
import { VehicleForm } from './VehicleForm';

const ITEMS_PER_PAGE = 8;
const STATUS_COLORS = {
    available: '#10b981',
    rented: '#3b82f6',
    maintenance: '#f59e0b',
    cleaning: '#8b5cf6'
};

interface AdminFleetTabProps {
  t: Translation;
  vehicles: Vehicle[];
  vehicleCategories: CategoryItem[];
  getRealTimeVehicleStatus: (vehicle: Vehicle) => string;
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
}

export const AdminFleetTab: React.FC<AdminFleetTabProps> = ({
  t,
  vehicles,
  vehicleCategories,
  getRealTimeVehicleStatus,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}) => {
  const { notify } = useNotification();
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState<Vehicle | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');

  const filteredVehicles = useMemo(() => {
      return vehicles.filter(v => {
          const term = searchTerm.toLowerCase();
          const matchesSearch = 
            v.model.toLowerCase().includes(term) ||
            v.make.toLowerCase().includes(term) ||
            (v.plate && v.plate.toLowerCase().includes(term));
          
          if (!matchesSearch) return false;
          if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
          if (statusFilter !== 'all' && v.status !== statusFilter) return false;
          if (usageFilter !== 'all' && v.usageType !== usageFilter) return false;

          return true;
      });
  }, [vehicles, searchTerm, statusFilter, categoryFilter, usageFilter]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const currentVehicles = filteredVehicles.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStartAdd = () => {
    setIsEditing(null);
    setIsAdding(true);
  };

  const handleStartEdit = (v: Vehicle) => {
    setIsAdding(false);
    setIsEditing(v);
  };

  const handleFormSubmit = (vehicleData: Vehicle) => {
    if (isEditing) {
      onUpdateVehicle(vehicleData);
      notify('success', 'Vehicle updated successfully');
    } else {
      onAddVehicle(vehicleData);
      notify('success', 'Vehicle added to fleet');
    }
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleCancelForm = () => {
    setIsEditing(null);
    setIsAdding(false);
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm animate-in fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-slate-100 p-6 gap-4 bg-white rounded-t-xl sticky top-0 z-10">
        <div>
            <h3 className="text-lg font-bold text-slate-900">{t.admin.fleet_status}</h3>
            <p className="text-sm text-slate-500">Manage your entire fleet (Rentals & Taxis)</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto min-w-[200px]">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder={t.admin.search_placeholder_fleet} 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:border-red-500 focus:ring-red-500 transition-all"
                />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {/* Usage Filter */}
                <select 
                    value={usageFilter}
                    onChange={(e) => { setUsageFilter(e.target.value); setPage(1); }}
                    className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 bg-slate-50 font-medium text-slate-700 cursor-pointer hover:border-slate-300 transition-colors"
                >
                    <option value="all">All Usage</option>
                    <option value="rental">Rental Only</option>
                    <option value="taxi">Taxi Only</option>
                    <option value="both">Rental & Taxi</option>
                </select>

                {/* Category Filter */}
                <select 
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 bg-slate-50 text-slate-600 cursor-pointer hover:border-slate-300"
                >
                    <option value="all">{t.filters.all}</option>
                    {vehicleCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>

                {/* Status Filter */}
                <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="py-2 px-3 border border-slate-200 rounded-lg text-sm focus:border-red-500 focus:ring-red-500 bg-slate-50 text-slate-600 cursor-pointer hover:border-slate-300"
                >
                    <option value="all">Any Status</option>
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                </select>
            </div>

            <button onClick={handleStartAdd} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-100 transition-all active:scale-95">
                <Plus size={18} /> {t.admin.add_vehicle}
            </button>
        </div>
      </div>
      
      {/* Add/Edit Form - REFACTORED to use VehicleForm */}
      {(isEditing || isAdding) && (
        <VehicleForm 
            t={t}
            initialData={isEditing}
            vehicleCategories={vehicleCategories}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
        />
      )}

      {/* Fleet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">{t.admin.plate}</th>
                  <th className="px-6 py-4">Usage Type</th>
                  <th className="px-6 py-4">{t.admin.price}</th>
                  <th className="px-6 py-4 text-center">{t.admin.status}</th>
                  <th className="px-6 py-4 text-right">{t.admin.actions}</th>
              </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentVehicles.length > 0 ? currentVehicles.map((v) => {
              const smartStatus = getRealTimeVehicleStatus(v);
              return (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-16 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                            <img src={v.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p>{v.make} {v.model}</p>
                            <p className="text-xs text-slate-400 capitalize">{v.category}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{v.plate || 'N/A'}</td>
                <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border ${
                        v.usageType === 'taxi' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                        v.usageType === 'both' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                        'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                       <Tag size={10} /> {v.usageType === 'both' ? 'Both' : v.usageType === 'taxi' ? 'Taxi' : 'Rental'}
                    </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">{v.pricePerDay.toLocaleString()} CVE</td>
                <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`} style={{ backgroundColor: `${STATUS_COLORS[smartStatus as keyof typeof STATUS_COLORS]}15`, color: STATUS_COLORS[smartStatus as keyof typeof STATUS_COLORS] }}>
                        {smartStatus === 'cleaning' ? t.admin.fleet_status_cleaning : smartStatus}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(v)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm(t.admin.confirm_delete)) { onDeleteVehicle(v.id); notify('info', 'Vehicle deleted'); }}} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                </td>
              </tr>
            )}) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No vehicles found matching criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
    </div>
  );
};