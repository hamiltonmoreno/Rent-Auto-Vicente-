
import React, { useState } from 'react';
import { Briefcase, Key, CreditCard, ExternalLink, Car, Tag, Trash2 } from 'lucide-react';
import { Translation, CategoryItem } from '../types';
import { useNotification } from './NotificationSystem';

interface AdminSettingsTabProps {
  t: Translation;
  vehicleCategories: CategoryItem[];
  expenseCategories: CategoryItem[];
  onAddCategory: (cat: CategoryItem) => void;
  onDeleteCategory: (id: string, type: 'vehicle' | 'expense') => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  t,
  vehicleCategories,
  expenseCategories,
  onAddCategory,
  onDeleteCategory
}) => {
  const { notify } = useNotification();
  const [subTab, setSubTab] = useState<'general' | 'integrations' | 'payments' | 'categories'>('general');
  const [apiKey, setApiKey] = useState(localStorage.getItem('admin_api_key') || '');
  const [vinti4PosId, setVinti4PosId] = useState(localStorage.getItem('vinti4_pos_id') || '');
  const [vinti4ApiKey, setVinti4ApiKey] = useState(localStorage.getItem('vinti4_api_key') || '');
  const [stripeKey, setStripeKey] = useState(localStorage.getItem('stripe_key') || '');
  const [paypalClient, setPaypalClient] = useState(localStorage.getItem('paypal_client') || '');
  const [compName, setCompName] = useState(localStorage.getItem('av_comp_name') || 'Auto Vicente');
  const [compEmail, setCompEmail] = useState(localStorage.getItem('av_comp_email') || 'reservas@autovicente.cv');
  const [compPhone, setCompPhone] = useState(localStorage.getItem('av_comp_phone') || '+238 991 12 34');
  const [compAddress, setCompAddress] = useState(localStorage.getItem('av_comp_address') || 'Achada Santo António, Praia');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'vehicle' | 'expense'>('vehicle');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('admin_api_key', apiKey); localStorage.setItem('vinti4_pos_id', vinti4PosId);
    localStorage.setItem('vinti4_api_key', vinti4ApiKey); localStorage.setItem('stripe_key', stripeKey);
    localStorage.setItem('paypal_client', paypalClient); localStorage.setItem('av_comp_name', compName);
    localStorage.setItem('av_comp_email', compEmail); localStorage.setItem('av_comp_phone', compPhone);
    localStorage.setItem('av_comp_address', compAddress);
    notify('success', t.admin.settings_saved);
  };

  const handleAddCat = () => {
      if(!newCatName) return;
      onAddCategory({ id: newCatName.toLowerCase().replace(/\s+/g, '-'), name: newCatName, type: newCatType });
      setNewCatName(''); notify('success', 'Category added');
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm max-w-2xl mx-auto animate-in fade-in">
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
            {['general', 'categories', 'integrations', 'payments'].map(tab => (
                <button key={tab} onClick={() => setSubTab(tab as any)} className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${subTab === tab ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{t.admin[`settings_${tab}` as keyof typeof t.admin]}</button>
            ))}
        </div>
        <div className="p-6">
            <form onSubmit={handleSave} className="space-y-8">
                {subTab === 'general' && (<div><h4 className="text-sm font-semibold mb-4 flex gap-2"><Briefcase size={16}/> Company Info</h4><div className="space-y-4"><input value={compName} onChange={(e) => setCompName(e.target.value)} className="w-full border rounded p-2" placeholder="Name"/><input value={compEmail} onChange={(e) => setCompEmail(e.target.value)} className="w-full border rounded p-2" placeholder="Email"/><input value={compPhone} onChange={(e) => setCompPhone(e.target.value)} className="w-full border rounded p-2" placeholder="Phone"/><input value={compAddress} onChange={(e) => setCompAddress(e.target.value)} className="w-full border rounded p-2" placeholder="Address"/></div></div>)}
                {subTab === 'categories' && (<div><div className="flex gap-2 mb-6 items-end"><input value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} className="border rounded p-2 flex-1" placeholder="New Category"/><select value={newCatType} onChange={(e)=>setNewCatType(e.target.value as any)} className="border rounded p-2"><option value="vehicle">Vehicle</option><option value="expense">Expense</option></select><button type="button" onClick={handleAddCat} className="bg-slate-900 text-white px-4 py-2 rounded">Add</button></div><div className="grid grid-cols-2 gap-4"><div><h5 className="font-bold mb-2">Vehicle</h5>{vehicleCategories.map(c => <div key={c.id} className="flex justify-between p-2 border rounded mb-2"><span>{c.name}</span><button type="button" onClick={()=>onDeleteCategory(c.id, 'vehicle')} className="text-red-500"><Trash2 size={14}/></button></div>)}</div><div><h5 className="font-bold mb-2">Expense</h5>{expenseCategories.map(c => <div key={c.id} className="flex justify-between p-2 border rounded mb-2"><span>{c.name}</span><button type="button" onClick={()=>onDeleteCategory(c.id, 'expense')} className="text-red-500"><Trash2 size={14}/></button></div>)}</div></div></div>)}
                {subTab === 'integrations' && (<div><h4 className="text-sm font-semibold mb-4 flex gap-2"><Key size={16}/> API Keys</h4><input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} className="w-full border rounded p-2" placeholder="General API Key"/></div>)}
                {subTab === 'payments' && (<div><h4 className="text-sm font-semibold mb-4 flex gap-2"><CreditCard size={16}/> Gateways</h4><div className="space-y-4"><input value={vinti4PosId} onChange={(e)=>setVinti4PosId(e.target.value)} className="w-full border rounded p-2" placeholder="Vinti4 POS ID"/><input value={vinti4ApiKey} onChange={(e)=>setVinti4ApiKey(e.target.value)} className="w-full border rounded p-2" placeholder="Vinti4 Token"/><input value={stripeKey} onChange={(e)=>setStripeKey(e.target.value)} className="w-full border rounded p-2" placeholder="Stripe Key"/><input value={paypalClient} onChange={(e)=>setPaypalClient(e.target.value)} className="w-full border rounded p-2" placeholder="PayPal Client ID"/></div></div>)}
                {subTab !== 'categories' && <div className="pt-4 flex justify-end"><button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded font-bold">Save Settings</button></div>}
            </form>
        </div>
    </div>
  );
};
