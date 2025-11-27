
import React, { useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { Translation, Reservation, Review } from '../types';
import { MOCK_VEHICLES } from '../constants';
import { StarRating } from './StarRating';

interface CustomerDashboardProps {
  t: Translation;
  reservations: Reservation[];
  onAddReview?: (review: Review) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ t, reservations, onAddReview }) => {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());

  const getVehicle = (id: string) => MOCK_VEHICLES.find(v => v.id === id);

  const handleSubmitReview = (e: React.FormEvent, reservation: Reservation) => {
    e.preventDefault();
    
    if (onAddReview) {
      onAddReview({
        id: `REV-${Date.now()}`,
        vehicleId: reservation.vehicleId,
        customerName: reservation.customerName,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });
    }

    alert('Review submitted for moderation!');
    setSubmittedReviews(prev => new Set(prev).add(reservation.id));
    setReviewingId(null);
    setComment('');
    setRating(5);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">{t.customer.dashboard}</h1>
      
      <div className="space-y-6">
        {reservations.map(res => {
          const vehicle = getVehicle(res.vehicleId);
          if (!vehicle) return null;
          const isCompleted = res.status === 'completed';
          const isReviewed = submittedReviews.has(res.id);

          return (
            <div key={res.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:flex sm:items-center sm:justify-between gap-6">
                    {/* Vehicle Info */}
                    <div className="flex items-center gap-4">
                         <img src={vehicle.image} alt={vehicle.model} className="w-24 h-16 object-cover rounded-md" />
                         <div>
                             <h3 className="font-bold text-slate-900">{vehicle.make} {vehicle.model}</h3>
                             <p className="text-sm text-slate-500">{vehicle.year}</p>
                         </div>
                    </div>

                    {/* Reservation Details */}
                    <div className="mt-4 sm:mt-0 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar size={14} />
                            <span>{res.startDate} - {res.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                             <span className="font-medium text-slate-900">{res.total.toLocaleString()} CVE</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            res.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            res.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            res.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 sm:mt-0 flex flex-col items-end gap-2">
                         {isCompleted && !isReviewed && !reviewingId && (
                             <button 
                                onClick={() => setReviewingId(res.id)}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-500 transition-colors"
                             >
                                {t.customer.leave_review}
                             </button>
                         )}
                         {(isReviewed) && (
                             <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                                 <CheckCircle size={16} /> {t.customer.review_submitted}
                             </span>
                         )}
                    </div>
                </div>

                {/* Review Form */}
                {reviewingId === res.id && (
                    <div className="bg-slate-50 border-t border-slate-100 p-6 animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-slate-900 mb-3">{t.booking.write_review}</h4>
                        <form onSubmit={(e) => handleSubmitReview(e, res)} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">{t.booking.your_rating}</label>
                                <StarRating rating={rating} interactive onRate={setRating} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">{t.booking.your_comment}</label>
                                <textarea 
                                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required
                                    placeholder="How was your experience?"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800">
                                    {t.booking.submit_review}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setReviewingId(null)}
                                    className="px-4 py-2 text-slate-600 text-xs font-bold hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
