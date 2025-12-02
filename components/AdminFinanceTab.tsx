
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Trash2, RefreshCcw } from 'lucide-react';
import { Translation, Expense, Reservation, CategoryItem, TaxiDailyLog } from '../types';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';
import { ExpenseForm } from './ExpenseForm';

const ITEMS_PER_PAGE = 8;

interface AdminFinanceTabProps {
  t: Translation;
  expenses: Expense[];
  reservations: Reservation[];
  taxiLogs: TaxiDailyLog[]; 
  expenseCategories: CategoryItem[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const AdminFinanceTab: React.FC<AdminFinanceTabProps> = ({
  t,
  expenses,
  reservations,
  taxiLogs,
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

  // Chart Data Logic
  const financialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data: Record<number, { income: number; expense: number; taxi: number }> = {};

    reservations.forEach(r => {
      const isRevenue = r.status !== 'cancelled' || r.paymentStatus === 'refunded';
      if (!isRevenue || new Date(r.startDate).getFullYear() !== currentYear) return;
      const month = new Date(r.startDate).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0, taxi: 0 };
      data[month].income += r.total;
    });

    taxiLogs.forEach(l => {
        if (new Date(l.date).getFullYear() !== currentYear) return;
        const month = new Date(l.date).getMonth();
        if (!data[month]) data[month] = { income: 0, expense: 0, taxi: 0 };
        data[month].taxi += l.amount;
    });

    expenses.forEach(e => {
      if (new Date(e.date).getFullYear() !== currentYear) return;
      const month = new Date(e.date).getMonth();
      if (!data[month]) data[month] = { income: 0, expense: 0, taxi: 0 };
      data[month].expense += e.amount;
    });

    return months.map((name, index) => ({
      name,
      income: data[index]?.income || 0,
      expense: data[index]?.expense || 0,
      profit: ((data[index]?.income || 0) + (data[index]?.taxi || 0)) - (data[index]?.expense || 0)
    }));
  }, [reservations, expenses, taxiLogs]);

  const totalRentRevenue = reservations.filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + r.total, 0);
  const totalTaxiRevenue = taxiLogs.reduce((sum, l) => sum + l.amount, 0);
  const totalRevenue = totalRentRevenue + totalTaxiRevenue;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Transactions Logic
  const recentTransactions = useMemo(() => {
    let rentalIncomes = reservations.map(r => ({
      id: r.id,
      date: r.dateCreated,
      description: `Reserva #${r.id} - ${r.customerName}`,
      amount: r.total,
      type: 'income',
      category: 'Rental'
    }));

    let taxiIncomes = taxiLogs.map(l => ({
        id: l.id,
        date: l.date,
        description: `Taxi Settlement - Driver ${l.driverId}`,
        amount: l.amount,
        type: 'income',
        category: 'Taxi'
    }));

    let outcomes = expenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'expense',
      category: e.category
    }));

    let combined = [...rentalIncomes, ...taxiIncomes, ...outcomes];

    if (startDate) combined = combined.filter(t => new Date(t.date) >= new Date(startDate));
    if (endDate) combined = combined.filter(t => new Date(t.date) <= new Date(endDate));
    if (filterType !== 'all') combined = combined.filter(t => t.type === filterType);
    if (filterCategory !== 'all') combined = combined.filter(t => t.category === filterCategory);

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reservations, expenses, taxiLogs, startDate, endDate, filterType, filterCategory]);

  const totalPages = Math.ceil(recentTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = recentTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleAddExpenseSubmit = (expense: Expense) => {
    onAddExpense(expense);
    notify('success', 'Expense record added');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20} /></div><p className="text-sm font-medium text-slate-500">{t.admin.fin_total_income}</p></div>
                <div className="flex flex-col">
                    <p className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} CVE</p>
                    <p className="text-xs text-slate-400 mt-1 flex gap-2"><span>Rent: {totalRentRevenue.toLocaleString()}</span><span>|</span><span>Taxi: {totalTaxiRevenue.toLocaleString()}</span></p>
                </div>
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
                <h3 className="mb-6 text-lg font-bold text-slate-900">Financial Overview</h3>
                <div className="w-full h-80 min-h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={financialData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} CVE`, '']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Bar dataKey="income" name="Rentals" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={20} />
                            <Bar dataKey="taxi" name="Taxi" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="lg:col-span-1">
                <ExpenseForm 
                    t={t}
                    expenseCategories={expenseCategories}
                    onSubmit={handleAddExpenseSubmit}
                />
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
                    <button onClick={() => { setStartDate(''); setEndDate(''); setFilterType('all'); setFilterCategory('all'); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50"><RefreshCcw size={14} /></button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">{t.admin.fin_date}</th><th className="px-6 py-4">{t.admin.fin_desc}</th><th className="px-6 py-4">{t.admin.fin_category}</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-right">{t.admin.fin_amount}</th><th className="px-6 py-4 text-right"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentTransactions.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-xs">{item.date}</td><td className="px-6 py-4">{item.description}</td><td className="px-6 py-4 capitalize"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.category === 'Taxi' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-800'}`}>{item.category}</span></td>
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
