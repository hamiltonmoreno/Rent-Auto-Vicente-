import React, { useState } from 'react';
import { Calendar, CheckCircle, X, User as UserIcon, Settings, Mail, Phone, Check, MapPin } from 'lucide-react';
import { Translation, Reservation, Review, User, Tour } from '../types';
import { MOCK_VEHICLES } from '../constants';
import { StarRating } from './StarRating';
import { useNotification } from './NotificationSystem';

interface CustomerDashboardProps {
  t: Translation;
  reservations: Reservation[];
  tours: Tour[];
  currentUser: User | null;
  onAddReview?: (review: Review) => void;
  onUpdateUser?: (user: Partial<User>) => void;
  onCancelReservation?: (id: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  t, 
  reservations, 
  tours,
  currentUser,
  onAddReview,
  onUpdateUser,
  onCancelReservation
}) => {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState<'reservations' | 'profile'>('reservations');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const getVehicle = (id: string) => MOCK_VEHICLES.find(v => v.id === id);
  const getTour = (id: string) => tours.find(t => t.id === id);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingId) return;
    
    const reservation = reservations.find(r => r.id === reviewingId);
    if (!reservation) return;

    if (onAddReview) {
      onAddReview({
        id: `REV-${Date.now()}`,
        vehicleId: reservation.vehicleId!,
        customerName: reservation.customerName,
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });
      notify('success', t.customer.review_submitted);
    }

    setSubmittedReviews(prev => new Set(prev).add(reviewingId));
    closeModal();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
        onUpdateUser({
            name,
            email,
            phone
        });
        notify('success', t.customer.profile_updated);
    }
  };

  const checkCanCancel = (startDateStr: string) => {
      const start = new Date(startDateStr);
      const now = new Date();
      const diffMs = start.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 48;
  };

  const handleCancelClick = (id: string) => {
      if (window.confirm(t.customer.confirm_cancel)) {
          if (onCancelReservation) {
              onCancelReservation(id);
              notify('info', 'Reservation cancelled');
          }
      }
  };

  const closeModal = () => {
    setReviewingId(null);
    setComment('');
    setRating(5);
  };

  // Determine which reservation is currently being reviewed for the modal context
  const activeReviewReservation = reviewingId ? reservations.find(r => r.id === reviewingId) : null;
  const activeReviewVehicle = activeReviewReservation && activeReviewReservation.vehicleId ? getVehicle(activeReviewReservation.vehicleId) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
         <h1 className="text-2xl font-bold text-slate-900">{t.customer.dashboard}</h1>
         
         {/* Tabs */}
         <div className="mt-4 md:mt-0 flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('reservations')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'reservations' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <Calendar size={16} />
                {t.customer.tabs_reservations}
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'profile' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <UserIcon size={16} />
                {t.customer.tabs_profile}
            </button>
         </div>
      </div>
      
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {reservations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500">You don't have any reservations yet.</p>
            </div>
            ) : (
            reservations.map(res => {
                const isVehicle = res.type === 'vehicle' || !res.type; // Default to vehicle for backward compat
                
                let title = '';
                let subtitle = '';
                let image = '';
                let isValid = false;

                if (isVehicle && res.vehicleId) {
                    const vehicle = getVehicle(res.vehicleId);
                    if (vehicle) {
                        title = `${vehicle.make} ${vehicle.model}`;
                        subtitle = `${vehicle.year}`;
                        image = vehicle.image;
                        isValid = true;
                    }
                } else if (res.type === 'tour' && res.tourId) {
                    const tour = getTour(res.tourId);
                    if (tour) {
                        title = tour.title;
                        subtitle = tour.duration;
                        image = tour.image;
                        isValid = true;
                    }
                }

                if (!isValid) return null;

                const isCompleted = res.status === 'completed';
                const isReviewed = submittedReviews.has(res.id);
                const canCancel = (res.status === 'pending' || res.status === 'confirmed') && checkCanCancel(res.startDate);

                return (
                <div key={res.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-5 sm:flex sm:items-center sm:justify-between gap-6">
                        {/* Info */}
                        <div className="flex items-center gap-4">
                            <img src={image} alt={title} className="w-20 h-14 object-cover rounded-md bg-slate-100" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900">{title}</h3>
                                    {!isVehicle && <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Tour</span>}
                                </div>
                                <p className="text-sm text-slate-500">{subtitle}</p>
                            </div>
                        </div>

                        {/* Reservation Details */}
                        <div className="mt-4 sm:mt-0 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar size={14} />
                                <span>{res.startDate} {isVehicle && `- ${res.endDate}`}</span>
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
                            {canCancel && (
                                <button
                                    onClick={() => handleCancelClick(res.id)}
                                    className="px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    {t.customer.cancel_booking}
                                </button>
                            )}

                            {isVehicle && isCompleted && !isReviewed && (
                                <button 
                                    onClick={() => setReviewingId(res.id)}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
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
                </div>
                );
            })
            )}
        </div>
      )}

      {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <div className="p-3 bg-red-50 rounded-full text-red-600">
                      <Settings size={24} />
                  </div>
                  <div>
                      <h2 className="text-lg font-bold text-slate-900">{t.customer.profile_settings}</h2>
                      <p className="text-sm text-slate-500">{t.customer.personal_details}</p>
                  </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <UserIcon size={18} />
                        </div>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-10 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border"
                        />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-10 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border"
                        />
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Phone size={18} />
                        </div>
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="block w-full pl-10 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2.5 border"
                            placeholder="+238 ..."
                        />
                      </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                      <button
                            type="submit"
                            className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 py-2.5 px-6 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            {t.customer.save_changes}
                        </button>
                  </div>
              </form>
          </div>
      )}

      {/* Review Modal */}
      {reviewingId && activeReviewVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <button 
                    onClick={closeModal}
                    className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-slate-900 mb-1">{t.booking.write_review}</h3>
                <p className="text-sm text-slate-500 mb-6">
                    {activeReviewVehicle.make} {activeReviewVehicle.model} ({activeReviewVehicle.year})
                </p>

                <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.booking.your_rating}</label>
                        <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <StarRating rating={rating} size={32} interactive onRate={setRating} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.booking.your_comment}</label>
                        <textarea 
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 border"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            placeholder="Share your experience with this vehicle..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={closeModal}
                            className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-300 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors shadow-sm"
                        >
                            {t.booking.submit_review}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};