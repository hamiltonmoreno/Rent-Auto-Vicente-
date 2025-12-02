
import React, { useState } from 'react';
import { Translation, Driver, Vehicle } from '../types';
import { User, Edit2, Trash2, Plus, Car } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface AdminTaxiVehiclesProps {
  t: Translation;
  vehicles: Vehicle[];
  drivers: Driver[];
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
}

export const AdminTaxiVehicles: React.FC<AdminTaxiVehiclesProps> = ({
  t,
  vehicles,
  drivers,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}) => {
  const { notify } = useNotification();
  const [isEditingVehicle, setIsEditingVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [vehicleImage, setVehicleImage] = useState<string>('');

  const handleVehicleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const vehicleData: any = {
          make: formData.get('make'), model: formData.get('model'), year: Number(formData.get('year')),
          plate: formData.get('plate'), category: 'taxi',
          transmission: 'manual', seats: 4, pricePerDay: 0, status: 'available', available: true,
          id: isEditingVehicle ? isEditingVehicle.id : `V-${Date.now()}`,
          image: vehicleImage || (isEditingVehicle ? isEditingVehicle.image : 'https://picsum.photos/400/250'),
          rating: 5, reviewCount: 0
      };
      if (isEditingVehicle) { onUpdateVehicle(vehicleData); notify('success', 'Vehicle updated'); } 
      else { onAddVehicle(vehicleData); notify('success', 'Vehicle added'); }
      setIsAddingVehicle(false); setIsEditingVehicle(null); setVehicleImage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setVehicleImage(reader.result as string); reader.readAsDataURL(file); }
  };

  const getAssignedDriver = (vehicleId: string) => {
      return drivers.find(d => d.currentVehicleId === vehicleId);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-end"><button onClick={() => { setIsAddingVehicle(true); setIsEditingVehicle(null); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800"><Plus size={16} /> {t.admin.add_vehicle}</button></div>
        {(isAddingVehicle || isEditingVehicle) && (<div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-in fade-in"><h3 className="text-lg font-bold mb-4">{isEditingVehicle ? t.admin.edit : t.admin.add_vehicle}</h3><form onSubmit={handleVehicleSubmit} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"><input name="make" defaultValue={isEditingVehicle?.make} placeholder="Make" required className="rounded-md border-slate-300 p-2 text-sm" /><input name="model" defaultValue={isEditingVehicle?.model} placeholder="Model" required className="rounded-md border-slate-300 p-2 text-sm" /><input name="year" type="number" defaultValue={isEditingVehicle?.year} placeholder="Year" required className="rounded-md border-slate-300 p-2 text-sm" /><input name="plate" defaultValue={isEditingVehicle?.plate} placeholder="Plate" className="rounded-md border-slate-300 p-2 text-sm" /><div className="sm:col-span-2 lg:col-span-4 border-t border-slate-200 pt-4 mt-2"><label className="block text-sm font-medium text-slate-700 mb-2">Image</label><div className="flex items-center gap-4"><div className="relative h-24 w-40 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">{vehicleImage ? (<img src={vehicleImage} alt="Preview" className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center text-slate-400"><Car size={24} /></div>)}</div><input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"/></div></div><div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end mt-2"><button type="button" onClick={() => { setIsEditingVehicle(null); setIsAddingVehicle(false); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{t.admin.cancel}</button><button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500">{t.admin.save}</button></div></form></div>)}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">{t.admin.plate}</th><th className="px-6 py-4">Assigned Driver</th><th className="px-6 py-4">{t.admin.status}</th><th className="px-6 py-4 text-right">{t.admin.actions}</th></tr></thead><tbody className="divide-y divide-slate-100">{vehicles.map(v => { const assignedDriver = getAssignedDriver(v.id); return (<tr key={v.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-medium text-slate-900"><div className="flex items-center gap-3"><img src={v.image} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />{v.make} {v.model}</div></td><td className="px-6 py-4 font-mono text-xs">{v.plate || 'N/A'}</td><td className="px-6 py-4">{assignedDriver ? (<span className="flex items-center gap-1 font-semibold text-slate-900"><User size={14} className="text-slate-400"/> {assignedDriver.name}</span>) : (<span className="text-slate-400 text-xs italic">Unassigned</span>)}</td><td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{v.status}</span></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => { setIsAddingVehicle(false); setIsEditingVehicle(v); setVehicleImage(v.image); }} className="p-1 text-slate-400 hover:text-slate-600"><Edit2 size={16} /></button><button onClick={() => { if (window.confirm(t.admin.confirm_delete)) onDeleteVehicle(v.id); }} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button></div></td></tr>) })}</tbody></table></div>
    </div>
  );
};
