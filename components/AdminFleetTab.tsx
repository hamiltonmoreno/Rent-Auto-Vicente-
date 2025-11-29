
import React, { useState } from 'react';
import { Plus, Car, Edit2, Trash2 } from 'lucide-react';
import { Translation, Vehicle, CategoryItem } from '../types';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';

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
  const [vehicleImage, setVehicleImage] = useState<string>('');

  const totalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE);
  const currentVehicles = vehicles.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStartAdd = () => {
    setVehicleImage('');
    setIsEditing(null);
    setIsAdding(true);
  };

  const handleStartEdit = (v: Vehicle) => {
    setVehicleImage(v.image);
    setIsAdding(false);
    setIsEditing(v);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVehicleImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const vehicleData: any = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: Number(formData.get('year')),
      plate: formData.get('plate'),
      category: formData.get('category'),
      transmission: formData.get('transmission'),
      seats: Number(formData.get('seats')),
      pricePerDay: Number(formData.get('pricePerDay')),
      status: formData.get('status'),
      available: formData.get('status') === 'available',
      id: isEditing ? isEditing.id : Date.now().toString(),
      image: vehicleImage || (isEditing ? isEditing.image : 'https://picsum.photos/400/250'),
      rating: isEditing ? isEditing.rating : 5,
      reviewCount: isEditing ? isEditing.reviewCount : 0,
    };

    if (isEditing) {
      onUpdateVehicle(vehicleData);
      notify('success', 'Vehicle updated');
    } else {
      onAddVehicle(vehicleData);
      notify('success', 'Vehicle added');
    }
    setIsEditing(null);
    setIsAdding(false);
    setVehicleImage('');
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm animate-in fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">{t.admin.fleet_status}</h3>
        <button onClick={handleStartAdd} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus size={16} /> {t.admin.add_vehicle}
        </button>
      </div>
      
      {(isEditing || isAdding) && (
        <div className="border-b border-slate-100 bg-slate-50 p-6">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input name="make" defaultValue={isEditing?.make} placeholder="Make" required className="rounded-md border-slate-300 p-2 text-sm" />
              <input name="model" defaultValue={isEditing?.model} placeholder="Model" required className="rounded-md border-slate-300 p-2 text-sm" />
              <input name="year" type="number" defaultValue={isEditing?.year} placeholder="Year" required className="rounded-md border-slate-300 p-2 text-sm" />
              <input name="plate" defaultValue={isEditing?.plate} placeholder="Plate" className="rounded-md border-slate-300 p-2 text-sm" />
              <select name="category" defaultValue={isEditing?.category || 'economy'} className="rounded-md border-slate-300 p-2 text-sm">{vehicleCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select>
              <select name="transmission" defaultValue={isEditing?.transmission || 'manual'} className="rounded-md border-slate-300 p-2 text-sm"><option value="manual">Manual</option><option value="automatic">Automatic</option></select>
              <input name="seats" type="number" defaultValue={isEditing?.seats || 5} placeholder="Seats" required className="rounded-md border-slate-300 p-2 text-sm" />
              <input name="pricePerDay" type="number" defaultValue={isEditing?.pricePerDay} placeholder="Price" required className="rounded-md border-slate-300 p-2 text-sm" />
              <select name="status" defaultValue={isEditing?.status || 'available'} className="rounded-md border-slate-300 p-2 text-sm"><option value="available">Available</option><option value="maintenance">Maintenance</option></select>
              
              <div className="sm:col-span-2 lg:col-span-4 border-t border-slate-200 pt-4 mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Image</label>
                  <div className="flex items-center gap-4">
                      <div className="relative h-24 w-40 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                          {vehicleImage ? (<img src={vehicleImage} alt="Preview" className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center text-slate-400"><Car size={24} /></div>)}
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"/>
                  </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end mt-2"><button type="button" onClick={() => { setIsEditing(null); setIsAdding(false); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{t.admin.cancel}</button><button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500">{t.admin.save}</button></div>
           </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">{t.admin.plate}</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">{t.admin.price}</th><th className="px-6 py-4">{t.admin.status}</th><th className="px-6 py-4 text-right">{t.admin.actions}</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {currentVehicles.map((v) => {
              const catName = vehicleCategories.find(c => c.id === v.category)?.name || v.category;
              const smartStatus = getRealTimeVehicleStatus(v);
              return (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900"><div className="flex items-center gap-3"><img src={v.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />{v.make} {v.model}</div></td>
                <td className="px-6 py-4 font-mono text-xs">{v.plate || 'N/A'}</td>
                <td className="px-6 py-4 capitalize">{catName}</td>
                <td className="px-6 py-4 font-semibold">{v.pricePerDay.toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`} style={{ backgroundColor: `${STATUS_COLORS[smartStatus as keyof typeof STATUS_COLORS]}20`, color: STATUS_COLORS[smartStatus as keyof typeof STATUS_COLORS] }}>{smartStatus === 'cleaning' ? t.admin.fleet_status_cleaning : smartStatus}</span></td>
                <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleStartEdit(v)} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button><button onClick={() => { if (window.confirm(t.admin.confirm_delete)) { onDeleteVehicle(v.id); notify('info', 'Vehicle deleted'); }}} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button></div></td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
    </div>
  );
};
