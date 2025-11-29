
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Trash2, RefreshCcw } from 'lucide-react';
import { Translation, Expense, Reservation, CategoryItem } from '../types';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';

const ITEMS_PER_PAGE = 8;

interface AdminFinanceTabProps {
  t: Translation;
  expenses: Expense[];
  reservations: Reservation[];
  expenseCategories: CategoryItem[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const AdminFinanceTab: React.FC<AdminFinanceTabProps> = ({
  t,
  expenses,
  reservations,
  expenseCategories,
  onAddExpense,
  onDeleteExpense
}) => {
  const { notify } = useNotification();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Chart Data
  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data: Record<number, { income: number; expense: number }> = {};

    reservations.forEach(r => {
      if (r.status === 'cancelled' || new Date(r.startDate).getFullYear() !== currentYear) return;
      const month = new Date(r.startDate).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].income += r.total;
    });

    expenses.forEach(e => {
      if (new Date(e.date).getFullYear() !== currentYear) return;
      const month = new Date(e.date).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0 };
      data[month].expense += e.amount;
    });

    return months.map((name, index) => ({
      name,
      income: data[index]?.income || 0,
      expense: data[index]?.expense || 0,
      profit: (data[index]?.income || 0) - (data[index]?.expense || 0)
    }));
  }, [reservations, expenses]);

  const totalRevenue = reservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + r.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Transactions Logic
  const recentTransactions = useMemo(() => {
    let incomes = reservations.map(r => ({
      id: r.id,
      date: r.dateCreated,
      description: `Reserva #${r.id} - ${r.customerName}`,
      amount: r.total,
      type: 'income',
      category: 'Rental'
    }));

    let outcomes = expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'expense',
      category: e.category
    }));

    let combined = [...incomes, ...outcomes];

    if (startDate) combined = combined.filter(t => new Date(t.date) >= new Date(startDate));
    if (endDate) combined = combined.filter(t => new Date(t.date) <= new Date(endDate));
    if (filterType !== 'all') combined = combined.filter(t => t.type === filterType);
    if (filterCategory !== 'all') combined = combined.filter(t => t.category === filterCategory);

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations, expenses, startDate, endDate, filterType, filterCategory]);

  const totalPages = Math.ceil(recentTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = recentTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAddExpense({
      id: `EXP-${Date.now()}`,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as any,
      date: formData.get('date') as string,
    });
    notify('success', 'Expense record added');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20} /></div><p className="text-sm font-medium text-slate-500">{t.admin.fin_total_income}</p></div>
                <p className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} CVE</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20} /></div><p className="text-sm font-medium text-slate-500">{t.admin.fin_total_expenses}</p></div>
                <p className="text-2xl font-bold text-slate-900">{totalExpenses.toLocaleString()} CVE</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-blue-100 rounded-lg text-blue-600"><DollarSign size={20} /></div><p className="text-sm font-medium text-slate-500">{t.admin.fin_net_profit}</p></div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{netProfit.toLocaleString()} CVE</p>
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-slate-900">Profit & Loss</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%"><ComposedChart data={financialData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString()} CVE`, '']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Legend /><Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} /><Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} /><Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} /></ComposedChart></ResponsiveContainer>
                </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-slate-900">{t.admin.fin_add_expense}</h3>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_desc}</label><input name="description" required className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="e.g. Office Rent" /></div>
                    <div><label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_amount}</label><input name="amount" type="number" required className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" placeholder="0" /></div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_category}</label><select name="category" className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border">{expenseCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
                        <div><label className="block text-xs font-medium text-slate-700 mb-1">{t.admin.fin_date}</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border" /></div>
                    </div>
                    <button type="submit" className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800 mt-2">Add Expense</button>
                </form>
            </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">{t.admin.fin_recent_transactions}</h3>
                <div className="flex flex-wrap gap-2 items-center">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border-slate-200 text-xs py-1.5" />
                    <span className="text-slate-400">-</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border-slate-200 text-xs py-1.5" />
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-md border-slate-200 text-xs py-1.5"><option value="all">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-md border-slate-200 text-xs py-1.5"><option value="all">All Categories</option><option value="Rental">Rental</option>{expenseCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select>
                    <button onClick={() => { setStartDate(''); setEndDate(''); setFilterType('all'); setFilterCategory('all'); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50"><RefreshCcw size={14} /></button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">{t.admin.fin_date}</th><th className="px-6 py-4">{t.admin.fin_desc}</th><th className="px-6 py-4">{t.admin.fin_category}</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-right">{t.admin.fin_amount}</th><th className="px-6 py-4 text-right"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTransactions.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-xs">{item.date}</td><td className="px-6 py-4">{item.description}</td><td className="px-6 py-4 capitalize"><span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">{item.category}</span></td>
                                <td className="px-6 py-4">{item.type === 'income' ? (<span className="text-emerald-600 flex items-center gap-1 font-medium"><TrendingUp size={14} /> {t.admin.fin_type_income}</span>) : (<span className="text-red-600 flex items-center gap-1 font-medium"><TrendingDown size={14} /> {t.admin.fin_type_expense}</span>)}</td>
                                <td className={`px-6 py-4 text-right font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">{item.type === 'expense' && (<button onClick={() => onDeleteExpense(item.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
        </div>
    </div>
  );
};
