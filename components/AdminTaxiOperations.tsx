import React, { useState, useMemo } from 'react';
import { User, DollarSign, Check, AlertCircle, Search, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { Translation, Driver, Vehicle, TaxiDailyLog } from '../types';
import { useNotification } from './NotificationSystem';

interface AdminTaxiOperationsProps {
  t: Translation;
  drivers: Driver[];
  vehicles: Vehicle[];
  taxiLogs: TaxiDailyLog[]; // From Props
  onAddTaxiLog: (log: TaxiDailyLog) => void; // From Props
}

export const AdminTaxiOperations: React.FC<AdminTaxiOperationsProps> = ({ t, drivers, vehicles, taxiLogs, onAddTaxiLog }) => {
  const { notify } = useNotification();
  
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [amount, setAmount] = useState('3000');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'active' | 'off'>('all');

  const getDriverPaymentStatus = (driverId: string) => {
      const log = taxiLogs.find(l => l.driverId === driverId && l.date === selectedDate);
      if (log) return 'paid';
      return 'pending';
  };

  const getVehicleModel = (id?: string) => {
      const v = vehicles.find(v => v.id === id);
      return v ? `${v.plate} • ${v.model}` : 'No Vehicle';
  };

  const driversStatusList = useMemo(() => {
      let list = drivers.map(d => ({
          ...d,
          paymentStatus: getDriverPaymentStatus(d.id),
          todayAmount: taxiLogs.find(l => l.driverId === d.id && l.date === selectedDate)?.amount || 0
      }));

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          list = list.filter(d => d.name.toLowerCase().includes(term) || d.license.toLowerCase().includes(term));
      }
      if (paymentFilter !== 'all') {
          list = list.filter(d => d.paymentStatus === paymentFilter);
      }
      if (driverStatusFilter === 'active') {
          list = list.filter(d => d.status !== 'off_duty');
      } else if (driverStatusFilter === 'off') {
          list = list.filter(d => d.status === 'off_duty');
      }
      return list;
  }, [drivers, taxiLogs, selectedDate, searchTerm, paymentFilter, driverStatusFilter]);

  const dailyTotal = taxiLogs
    .filter(l => l.date === selectedDate)
    .reduce((sum, l) => sum + l.amount, 0);

  const pendingCount = drivers.filter(d => getDriverPaymentStatus(d.id) === 'pending' && d.status !== 'off_duty').length;

  const handleRegisterPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDriverId || !amount) return;
      if (getDriverPaymentStatus(selectedDriverId) === 'paid') {
          notify('warning', 'This driver has already paid for this date.');
          return;
      }
      const newLog: TaxiDailyLog = {
          id: `TL-${Date.now()}`,
          driverId: selectedDriverId,
          amount: Number(amount),
          date: selectedDate,
          status: 'paid',
          notes: notes
      };
      
      onAddTaxiLog(newLog); // Use Global Handler
      notify('success', 'Daily settlement recorded');
      setSelectedDriverId('');
      setAmount('3000');
      setNotes('');
  };

  const handleDateChange = (days: number) => {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + days);
      setSelectedDate(date.toISOString().split('T')[0]);
  };

  const setToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);
  
  const setYesterday = () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleClearFilters = () => {
      setSearchTerm(''); setPaymentFilter('all'); setDriverStatusFilter('all'); setToday();
  };

  return (
    <>
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-slate-500 mb-1">{t.admin.taxi_daily_total}</p><p className="text-2xl font-bold text-emerald-600">{dailyTotal.toLocaleString()} CVE</p></div><div className="bg-emerald-50 p-3 rounded-lg text-emerald-600"><DollarSign size={20}/></div></div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-slate-500 mb-1">{t.admin.taxi_paid}</p><p className="text-2xl font-bold text-slate-900">{drivers.length - pendingCount} / {drivers.length}</p></div><div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Check size={20}/></div></div>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-slate-500 mb-1">{t.admin.taxi_unpaid} (Active)</p><p className="text-2xl font-bold text-red-600">{pendingCount}</p></div><div className="bg-red-50 p-3 rounded-lg text-red-600"><AlertCircle size={20}/></div></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sticky top-6">
                    <h3 className="font-bold text-slate-900 mb-4">{t.admin.taxi_settlement}</h3>
                    <div className="mb-6 p-1 bg-slate-100 rounded-lg flex items-center justify-between"><button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-slate-900 transition-colors"><ChevronLeft size={16}/></button><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-0 text-sm font-bold text-slate-900 text-center focus:ring-0 cursor-pointer"/><button onClick={() => handleDateChange(1)} className="p-2 hover:bg-white rounded-md text-slate-500 hover:text-slate-900 transition-colors"><ChevronRight size={16}/></button></div>
                    <div className="flex gap-2 mb-6"><button onClick={setYesterday} className="flex-1 text-xs font-medium py-1.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600">Yesterday</button><button onClick={setToday} className="flex-1 text-xs font-medium py-1.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600">Today</button></div>
                    <form onSubmit={handleRegisterPayment} className="space-y-4">
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.taxi_driver_status}</label><select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" required><option value="">Select Driver...</option>{drivers.map(d => { const status = getDriverPaymentStatus(d.id); return (<option key={d.id} value={d.id} disabled={status === 'paid'}>{d.name} {status === 'paid' ? '(Paid)' : ''}</option>); })}</select></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.taxi_amount_paid} (CVE)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-lg border-slate-200 text-sm font-bold"/></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">{t.admin.fin_desc} (Optional)</label><input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border-slate-200 text-sm" placeholder="Notes..."/></div>
                        <button type="submit" disabled={!selectedDriverId} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">{t.admin.taxi_register_payment}</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-slate-900">{t.admin.taxi_driver_status}</h3><span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">{selectedDate}</span></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2"><div className="relative col-span-2 md:col-span-1"><Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" /><input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 py-2 text-xs rounded-lg border-slate-300 w-full"/></div><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="py-2 px-2 text-xs rounded-lg border-slate-300 w-full"><option value="all">Payment: All</option><option value="paid">Paid</option><option value="pending">Pending</option></select><select value={driverStatusFilter} onChange={(e) => setDriverStatusFilter(e.target.value as any)} className="py-2 px-2 text-xs rounded-lg border-slate-300 w-full"><option value="all">Duty: All</option><option value="active">Active Only</option><option value="off">Off Duty</option></select><button onClick={handleClearFilters} className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1 text-xs font-medium"><RefreshCcw size={12}/> Clear</button></div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {driversStatusList.length === 0 ? (<div className="p-8 text-center text-slate-500 text-sm">No drivers found matching criteria.</div>) : (driversStatusList.map(driver => (<div key={driver.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${driver.status === 'off_duty' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-blue-100 text-blue-600'}`}><User size={20} /></div><div><div className="flex items-center gap-2"><p className="font-bold text-slate-900">{driver.name}</p>{driver.status === 'off_duty' && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">OFF</span>}</div><p className="text-xs text-slate-500 flex items-center gap-1"><span className="font-medium text-slate-700">{driver.license}</span> • {getVehicleModel(driver.currentVehicleId)}</p></div></div><div className="text-right">{driver.paymentStatus === 'paid' ? (<><p className="font-bold text-emerald-600">{driver.todayAmount.toLocaleString()} CVE</p><span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><Check size={10} /> Paid</span></>) : (driver.status !== 'off_duty' ? (<span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Pending</span>) : (<span className="text-xs text-slate-400 italic">Not working</span>))}</div></div>)))}
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};