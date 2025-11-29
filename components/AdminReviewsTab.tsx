
import React, { useState } from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { Translation, Review, Vehicle } from '../types';
import { StarRating } from './StarRating';
import { Pagination } from './Pagination';
import { useNotification } from './NotificationSystem';

const ITEMS_PER_PAGE = 8;

interface AdminReviewsTabProps {
  t: Translation;
  reviews: Review[];
  vehicles: Vehicle[];
  onReviewAction: (id: string, action: 'approved' | 'rejected') => void;
}

export const AdminReviewsTab: React.FC<AdminReviewsTabProps> = ({
  t,
  reviews,
  vehicles,
  onReviewAction
}) => {
  const { notify } = useNotification();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [page, setPage] = useState(1);

  const filteredReviews = reviews.filter(r => filter === 'pending' ? r.status === 'pending' : true);
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const currentReviews = filteredReviews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model}` : 'Unknown Vehicle';
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm animate-in fade-in">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">{t.admin.reviews_moderation}</h3>
        <div className="flex rounded-md bg-slate-100 p-1">
          <button onClick={() => { setFilter('pending'); setPage(1); }} className={`rounded px-3 py-1 text-xs font-medium transition-colors ${filter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{t.admin.filter_pending}</button>
          <button onClick={() => { setFilter('all'); setPage(1); }} className={`rounded px-3 py-1 text-xs font-medium transition-colors ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{t.admin.filter_all}</button>
        </div>
      </div>
      
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center">
           <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4"><Check size={24} /></div>
           <h3 className="text-sm font-semibold text-slate-900">All caught up!</h3>
           <p className="mt-1 text-sm text-slate-500">No {filter} reviews found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-6 py-4">Customer / Vehicle</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Comment</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">{t.admin.status}</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentReviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><p className="font-semibold text-slate-900">{review.customerName}</p><p className="text-xs text-slate-500">{getVehicleName(review.vehicleId)}</p></td>
                  <td className="px-6 py-4"><StarRating rating={review.rating} size={14} /></td>
                  <td className="px-6 py-4 max-w-xs truncate" title={review.comment}>{review.comment}</td>
                  <td className="px-6 py-4">{review.date}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${review.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : review.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{review.status.charAt(0).toUpperCase() + review.status.slice(1)}</span></td>
                  <td className="px-6 py-4 text-right">
                    {review.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { onReviewAction(review.id, 'approved'); notify('success', 'Review approved'); }} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" title={t.admin.approve}><Check size={18} /></button>
                        <button onClick={() => { onReviewAction(review.id, 'rejected'); notify('info', 'Review rejected'); }} className="rounded p-1 text-red-600 hover:bg-red-50" title={t.admin.reject}><XIcon size={18} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} t={t} />
    </div>
  );
};
