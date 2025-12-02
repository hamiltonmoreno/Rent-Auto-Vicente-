import React, { useState, useEffect } from 'react';
import { Car, Edit2, Plus, Tag } from 'lucide-react';
import { Vehicle, CategoryItem, Translation } from '../types';

interface VehicleFormProps {
  t: Translation;
  initialData: Vehicle | null; // null means "Add Mode"
  vehicleCategories: CategoryItem[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  t,
  initialData,
  vehicleCategories,
  onSubmit,
  onCancel
}) => {
  const [vehicleImage, setVehicleImage] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setVehicleImage(initialData.image);
    } else {
      setVehicleImage('');
    }
  }, [initialData]);

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
    const usageType = formData.get('usageType');

    const vehicleData: any = {
      make: formData.get('make'),
      model: formData.get('model'),
      year: Number(formData.get('year')),
      plate: formData.get('plate'),
      category: formData.get('category'),
      usageType: usageType || 'rental',
      transmission: formData.get('transmission'),
      seats: Number(formData.get('seats')),
      pricePerDay: Number(formData.get('pricePerDay')),
      status: formData.get('status'),
      available: formData.get('status') === 'available',
      // If editing, keep ID. If adding, generate ID (logic can be handled by parent too, but we prepare data here)
      id: initialData ? initialData.id : Date.now().toString(),
      image: vehicleImage || (initialData ? initialData.image : 'https://picsum.photos/400/250'),
      rating: initialData ? initialData.rating : 5,
      reviewCount: initialData ? initialData.reviewCount : 0,
    };

    onSubmit(vehicleData);
  };

  const isEditing = !!initialData;

  return (
    <div className="border-b border-slate-100 bg-slate-50 p-6 animate-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          {isEditing ? <Edit2 size={18} className="text-blue-500"/> : <Plus size={18} className="text-emerald-500"/>}
          {isEditing ? t.admin.edit : t.admin.add_vehicle}
        </h4>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1: Basic Info */}
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Make</label>
            <input name="make" defaultValue={initialData?.make} placeholder="Toyota" required className="w-full rounded-md border-slate-300 p-2 text-sm focus:border-red-500 focus:ring-red-500" />
        </div>
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
            <input name="model" defaultValue={initialData?.model} placeholder="Yaris" required className="w-full rounded-md border-slate-300 p-2 text-sm focus:border-red-500 focus:ring-red-500" />
        </div>
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
            <input name="year" type="number" defaultValue={initialData?.year} placeholder="2024" required className="w-full rounded-md border-slate-300 p-2 text-sm focus:border-red-500 focus:ring-red-500" />
        </div>
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.plate}</label>
            <input name="plate" defaultValue={initialData?.plate} placeholder="ST-XX-XX" className="w-full rounded-md border-slate-300 p-2 text-sm focus:border-red-500 focus:ring-red-500" />
        </div>
        
        {/* Row 2: Classification */}
        <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select name="category" defaultValue={initialData?.category || 'economy'} className="w-full rounded-md border-slate-300 p-2 text-sm focus:border-red-500 focus:ring-red-500">
                {vehicleCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
        </div>

        {/* USAGE TYPE SELECTOR */}
        <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
            <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1"><Tag size={12}/> {t.admin.fleet_usage_type}</label>
            <select name="usageType" defaultValue={initialData?.usageType || 'rental'} className="w-full rounded-md border-amber-200 bg-white p-2 text-sm focus:border-amber-500 focus:ring-amber-500 font-medium">
                <option value="rental">{t.admin.fleet_usage_rental}</option>
                <option value="taxi">{t.admin.fleet_usage_taxi}</option>
                <option value="both">{t.admin.fleet_usage_both}</option>
            </select>
        </div>

        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Transmission</label>
            <select name="transmission" defaultValue={initialData?.transmission || 'manual'} className="w-full rounded-md border-slate-300 p-2 text-sm"><option value="manual">Manual</option><option value="automatic">Automatic</option></select>
        </div>
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Seats</label>
            <input name="seats" type="number" defaultValue={initialData?.seats || 5} placeholder="5" required className="w-full rounded-md border-slate-300 p-2 text-sm" />
        </div>
        
        {/* Row 3: Pricing & Status */}
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.price} (CVE)</label>
            <input name="pricePerDay" type="number" defaultValue={initialData?.pricePerDay} placeholder="4500" required className="w-full rounded-md border-slate-300 p-2 text-sm font-bold" />
        </div>
        <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.status}</label>
            <select name="status" defaultValue={initialData?.status || 'available'} className="w-full rounded-md border-slate-300 p-2 text-sm"><option value="available">Available</option><option value="maintenance">Maintenance</option></select>
        </div>
        
        {/* Image Upload */}
        <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle Image</label>
            <div className="flex items-center gap-4 p-2 border border-slate-200 rounded-md bg-white">
                <div className="relative h-12 w-20 overflow-hidden rounded bg-slate-100 flex-shrink-0 border border-slate-100">
                    {vehicleImage ? (<img src={vehicleImage} alt="Preview" className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center text-slate-300"><Car size={20} /></div>)}
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"/>
            </div>
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 lg:col-span-4 flex gap-3 justify-end mt-4 pt-4 border-t border-slate-200/50">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-colors">{t.admin.cancel}</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all flex items-center gap-2">
                {isEditing ? <Edit2 size={16}/> : <Plus size={16}/>} {t.admin.save}
            </button>
        </div>
      </form>
    </div>
  );
};