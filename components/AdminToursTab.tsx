
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Map, ClipboardList, X as XIcon } from 'lucide-react';
import { Translation, Tour, Reservation } from '../types';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';

const ITEMS_PER_PAGE = 8;

interface AdminToursTabProps {
  t: Translation;
  tours: Tour[];
  reservations: Reservation[];
  onAddTour: (tour: Tour) => void;
  onUpdateTour: (tour: Tour) => void;
  onDeleteTour: (id: string) => void;
}

export const AdminToursTab: React.FC<AdminToursTabProps> = ({
  t,
  tours,
  reservations,
  onAddTour,
  onUpdateTour,
  onDeleteTour
}) => {
  const { notify } = useNotification();
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState<Tour | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [tourImage, setTourImage] = useState<string>('');
  
  // Manifest State
  const [manifestDate, setManifestDate] = useState('');
  const [selectedTourForManifest, setSelectedTourForManifest] = useState<Tour | null>(null);

  const totalPages = Math.ceil(tours.length / ITEMS_PER_PAGE);
  const currentTours = tours.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStartAdd = () => {
    setTourImage('');
    setIsEditing(null);
    setIsAdding(true);
  };

  const handleStartEdit = (tour: Tour) => {
    setTourImage(tour.image);
    setIsAdding(false);
    setIsEditing(tour);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTourImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tourData: Tour = {
      id: isEditing ? isEditing.id : `TOUR-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      image: tourImage || (isEditing ? isEditing.image : 'https://picsum.photos/400/250'),
      duration: formData.get('duration') as string,
      price: Number(formData.get('price')),
      capacity: Number(formData.get('capacity')),
      features: (formData.get('features') as string).split(',').map(s => s.trim()).filter(s => s)
    };

    if (isEditing) {
      onUpdateTour(tourData);
      notify('success', 'Tour updated');
    } else {
      onAddTour(tourData);
      notify('success', 'Tour created');
    }
    setIsEditing(null);
    setIsAdding(false);
    setTourImage('');
  };

  const getManifestList = () => {
    if (!selectedTourForManifest || !manifestDate) return [];
    return reservations.filter(r => 
        r.type === 'tour' && 
        r.tourId === selectedTourForManifest.id &&
        r.startDate === manifestDate &&
        r.status !== 'cancelled'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-end gap-2"><button onClick={handleStartAdd} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> {t.admin.add_tour}</button></div>
        {(isAdding || isEditing) && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-in fade-in">
            <h3 className="text-lg font-bold mb-4">{isEditing ? t.admin.edit : t.admin.add_tour}</h3>
            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
                    <div className="col-span-2 flex items-center gap-6"><div className="h-24 w-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">{tourImage ? (<img src={tourImage} alt="Preview" className="h-full w-full object-cover" />) : (<div className="h-full w-full flex items-center justify-center text-slate-400"><Map size={32} /></div>)}</div><div><label className="block text-sm font-medium text-slate-700 mb-2">Tour Image</label><input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"/></div></div>
                    <input name="title" placeholder={t.admin.tour_title} defaultValue={isEditing?.title} required className="rounded-lg border-slate-200" />
                    <input name="duration" placeholder={t.tours.duration} defaultValue={isEditing?.duration} required className="rounded-lg border-slate-200" />
                    <input name="price" type="number" placeholder={t.admin.tour_price} defaultValue={isEditing?.price} required className="rounded-lg border-slate-200" />
                    <input name="capacity" type="number" placeholder="Capacity (Pax)" defaultValue={isEditing?.capacity} required className="rounded-lg border-slate-200" />
                    <div className="col-span-2"><textarea name="description" placeholder="Description" defaultValue={isEditing?.description} rows={3} className="w-full rounded-lg border-slate-200" required /></div>
                    <div className="col-span-2"><input name="features" placeholder={t.admin.tour_features_help} defaultValue={isEditing?.features.join(', ')} required className="w-full rounded-lg border-slate-200" /></div>
                    <div className="col-span-2 flex justify-end gap-3 mt-4"><button type="button" onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">{t.admin.cancel}</button><button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">{t.admin.save}</button></div>
            </form>
        </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentTours.map(tour => (
                <div key={tour.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="h-40 w-full relative bg-slate-200"><img src={tour.image} alt={tour.title} className="h-full w-full object-cover" /><div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">{tour.price.toLocaleString()} CVE</div></div>
                    <div className="p-4 flex-1 flex flex-col"><h4 className="font-bold text-slate-900">{tour.title}</h4><p className="text-sm text-slate-500 mb-2">{tour.duration} • Max {tour.capacity} Pax</p><div className="flex-1"></div><div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100"><button onClick={() => setSelectedTourForManifest(tour)} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"><ClipboardList size={14} /> Manifest</button><div className="flex gap-2"><button onClick={() => handleStartEdit(tour)} className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-md"><Edit2 size={16} /></button><button onClick={() => { if(window.confirm(t.admin.confirm_delete)) onDeleteTour(tour.id) }} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-md"><Trash2 size={16} /></button></div></div></div>
                </div>
            ))}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
        {selectedTourForManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold">Manifest: {selectedTourForManifest.title}</h3><button onClick={() => setSelectedTourForManifest(null)} className="text-slate-400 hover:text-slate-600"><XIcon size={20}/></button></div><div className="mb-6"><label className="block text-sm font-medium text-slate-700 mb-2">{t.admin.fin_date}</label><input type="date" value={manifestDate} onChange={(e) => setManifestDate(e.target.value)} className="w-full rounded-lg border-slate-200"/></div><div className="bg-slate-50 rounded-lg p-4 max-h-60 overflow-y-auto"><h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Passengers</h4><ul className="space-y-3">{getManifestList().length > 0 ? getManifestList().map(r => (<li key={r.id} className="flex justify-between text-sm border-b border-slate-200 pb-2 last:border-0"><div><p className="font-bold text-slate-900">{r.customerName}</p><p className="text-xs text-slate-500">Res #{r.id}</p></div><span className="font-medium bg-white px-2 py-1 rounded border border-slate-200">{r.numberOfPassengers} Pax</span></li>)) : <p className="text-sm text-slate-400">No bookings for this date.</p>}</ul></div></div></div>
        )}
    </div>
  );
};
