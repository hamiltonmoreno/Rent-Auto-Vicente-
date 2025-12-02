
import React from 'react';
import { Translation, Driver, Vehicle } from '../types';
import { Edit2, Plus } from 'lucide-react';

interface DriverFormProps {
  t: Translation;
  initialData: Driver | null;
  vehicles: Vehicle[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const DriverForm: React.FC<DriverFormProps> = ({
  t,
  initialData,
  vehicles,
  onSubmit,
  onCancel
}) => {
  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const driverData: any = {
      id: initialData ? initialData.id : `DRV-${Date.now()}`,
      name: formData.get('name'),
      phone: formData.get('phone'),
      license: formData.get('license'),
      currentVehicleId: formData.get('vehicleId'),
      status: formData.get('status')
    };

    onSubmit(driverData);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-in fade-in mb-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {isEditing ? <Edit2 size={18} className="text-blue-600"/> : <Plus size={18} className="text-emerald-600"/>}
            {isEditing ? t.admin.edit : t.admin.taxi_add_driver}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.admin.taxi_driver_name}</label>
            <input name="name" defaultValue={initialData?.name} required className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="e.g. John Doe" />
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.admin.taxi_driver_phone}</label>
            <input name="phone" defaultValue={initialData?.phone} required className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="+238..." />
        </div>
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.admin.taxi_driver_license}</label>
            <input name="license" defaultValue={initialData?.license} required className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="License No." />
        </div>
        
        {/* Vehicle Assignment Dropdown */}
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{t.admin.taxi_assign_vehicle}</label>
            <select name="vehicleId" defaultValue={initialData?.currentVehicleId || ''} className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
                <option value="">No Vehicle Assigned</option>
                {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                        {v.make} {v.model} - {v.plate || 'No Plate'}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
            <select name="status" defaultValue={initialData?.status || 'available'} className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off_duty">Off Duty</option>
            </select>
        </div>
        
        <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">{t.admin.cancel}</button>
            <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md transition-all flex items-center gap-2">
                {isEditing ? 'Save Changes' : 'Add Driver'}
            </button>
        </div>
      </form>
    </div>
  );
};
