
import React from 'react';
import { Translation, Expense, CategoryItem } from '../types';

interface ExpenseFormProps {
  t: Translation;
  expenseCategories: CategoryItem[];
  onSubmit: (expense: Expense) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ t, expenseCategories, onSubmit }) => {
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    onSubmit({
      id: `EXP-${Date.now()}`,
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as any,
      date: formData.get('date') as string,
    });
    
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm h-full">
        <h3 className="mb-6 text-lg font-bold text-slate-900">{t.admin.fin_add_expense}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.admin.fin_desc}</label>
                <input name="description" required className="w-full rounded-lg border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 border" placeholder="e.g. Office Rent" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.admin.fin_amount}</label>
                <input name="amount" type="number" required className="w-full rounded-lg border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 border" placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.admin.fin_category}</label>
                    <select name="category" className="w-full rounded-lg border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 border bg-white">
                        {expenseCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.admin.fin_date}</label>
                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2.5 border" />
                </div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors mt-4 shadow-md">
                Add Expense
            </button>
        </form>
    </div>
  );
};
