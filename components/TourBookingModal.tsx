
import React, { useState } from 'react';
import { X, Calendar, Users, CheckCircle, Loader2, Download, Mail } from 'lucide-react';
import { Tour, Translation, User, PaymentMethod, Reservation } from '../types';
import { useNotification } from './NotificationSystem';

interface TourBookingModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  currentUser: User | null;
  onLoginRequest: () => void;
  onCreateReservation: (data: any) => void;
  reservations: Reservation[];
}

export const TourBookingModal: React.FC<TourBookingModalProps> = ({
  tour,
  isOpen,
  onClose,
  t,
  currentUser,
  onLoginRequest,
  onCreateReservation,
  reservations
}) => {
  const { notify } = useNotification();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Vinti4 / Payment Details Mock State
  const [vinti4Phone, setVinti4Phone] = useState('');
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvc: '' });

  const totalPrice = tour.price * guests;

  const handleNext = () => {
    if (step === 1) {
        if (!date) {
            notify('error', "Please select a date");
            return;
        }

        // CAPACITY CHECK LOGIC
        if (tour.capacity) {
            const existingBookings = reservations.filter(r => 
                r.type === 'tour' && 
                r.tourId === tour.id && 
                r.startDate === date && 
                r.status !== 'cancelled'
            );

            const totalPax = existingBookings.reduce((sum, r) => sum + (r.numberOfPassengers || 0), 0);
            const remainingSpots = tour.capacity - totalPax;

            if (guests > remainingSpots) {
                notify('error', `Overbooking: Only ${remainingSpots > 0 ? remainingSpots : 0} spots available for this date.`);
                return;
            }
        }
    }
    setStep(prev => (prev + 1) as any);
  };

  const handlePayment = () => {
    if (!currentUser) {
        onClose();
        onLoginRequest();
        return;
    }

    setIsProcessing(true);
    
    // Simulate API Call
    setTimeout(() => {
        setIsProcessing(false);
        onCreateReservation({
            tourId: tour.id,
            type: 'tour',
            userId: currentUser.id,
            customerName: currentUser.name,
            startDate: date,
            endDate: date, // Same day
            status: 'confirmed',
            total: totalPrice,
            numberOfPassengers: guests,
            paymentMethod,
            paymentStatus: 'paid',
            transactionId: `TX-TOUR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });
        
        // Move to Success Step
        setStep(3);
        notify('success', t.tour_booking.success_title);
        
        // Mock sending email
        console.log(`Sending confirmation email to ${currentUser.email} for Tour: ${tour.title}`);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
           <h3 className="font-bold text-slate-900">
               {step === 3 ? t.tour_booking.success_title : t.tour_booking.title}
           </h3>
           <button 
             onClick={onClose}
             className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
           >
             <X size={20} />
           </button>
        </div>

        <div className="p-6">
            {/* Step 1: Configuration */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <img src={tour.image} alt={tour.title} className="w-20 h-20 object-cover rounded-lg" />
                        <div>
                            <h4 className="font-bold text-slate-900">{tour.title}</h4>
                            <p className="text-sm text-slate-500">{tour.duration}</p>
                            <p className="text-red-600 font-bold mt-1">{tour.price.toLocaleString()} CVE <span className="text-xs text-slate-400 font-normal">/ person</span></p>
                            {tour.capacity && <p className="text-xs text-slate-500 mt-1">Max capacity: {tour.capacity} pax</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.tour_booking.select_date}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="block w-full rounded-md border-slate-300 pl-9 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 border cursor-pointer caret-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.tour_booking.guests}</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <select 
                                value={guests}
                                onChange={(e) => setGuests(Number(e.target.value))}
                                className="block w-full rounded-md border-slate-300 pl-9 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 border cursor-pointer"
                            >
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                    <option key={n} value={n}>{n} People</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <span className="text-slate-600 font-medium">{t.tour_booking.total_price}:</span>
                        <span className="text-xl font-bold text-slate-900">{totalPrice.toLocaleString()} CVE</span>
                    </div>

                    <button 
                        onClick={handleNext}
                        className="w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                    >
                        Next: Payment
                    </button>
                </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <p className="text-sm text-slate-500">Total to pay</p>
                        <p className="text-3xl font-bold text-slate-900">{totalPrice.toLocaleString()} CVE</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Select Payment Method</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setPaymentMethod('vinti4')}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${paymentMethod === 'vinti4' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                Vinti4 (Debit)
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('card')}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${paymentMethod === 'card' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                Credit Card
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'vinti4' && (
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t.booking.vinti4_phone}</label>
                            <input 
                                type="tel"
                                value={vinti4Phone}
                                onChange={(e) => setVinti4Phone(e.target.value)}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                placeholder="9911234"
                            />
                            <p className="text-xs text-slate-500 mt-1">{t.booking.vinti4_instr}</p>
                         </div>
                    )}

                    {paymentMethod === 'card' && (
                         <div className="space-y-3">
                            <input 
                                type="text"
                                placeholder={t.booking.card_holder}
                                value={cardDetails.name}
                                onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                            />
                            <input 
                                type="text"
                                placeholder={t.booking.card_number}
                                value={cardDetails.number}
                                onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="text"
                                    placeholder={t.booking.card_expiry}
                                    value={cardDetails.expiry}
                                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                />
                                <input 
                                    type="text"
                                    placeholder={t.booking.card_cvc}
                                    value={cardDetails.cvc}
                                    onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                />
                            </div>
                         </div>
                    )}

                    <button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : t.tour_booking.confirm_purchase}
                    </button>
                    
                    <button 
                        onClick={() => setStep(1)}
                        className="w-full text-center text-sm text-slate-500 hover:text-slate-800"
                    >
                        Back to details
                    </button>
                </div>
            )}

            {/* Step 3: Success / Confirmation */}
            {step === 3 && (
                <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                        <CheckCircle size={32} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t.tour_booking.success_title}</h3>
                    <p className="text-slate-500 mb-8">{t.tour_booking.success_msg}</p>

                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-6 text-left">
                        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-200">
                             <img src={tour.image} alt={tour.title} className="w-12 h-12 object-cover rounded-md" />
                             <div>
                                 <p className="font-bold text-slate-900">{tour.title}</p>
                                 <p className="text-sm text-slate-500">{date}</p>
                             </div>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">{guests} Guests</span>
                            <span className="font-medium text-slate-900">{totalPrice.toLocaleString()} CVE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                             <span className="text-slate-600">Payment</span>
                             <span className="text-emerald-600 font-medium uppercase">{paymentMethod}</span>
                        </div>
                    </div>

                    {currentUser?.email && (
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6 bg-blue-50 p-3 rounded-lg text-blue-700">
                            <Mail size={16} />
                            <span>{t.tour_booking.email_sent} <strong>{currentUser.email}</strong></span>
                        </div>
                    )}

                    <div className="space-y-3">
                         <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <Download size={18} />
                            {t.tour_booking.download_ticket}
                         </button>
                         <button 
                            onClick={onClose}
                            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
                        >
                            {t.booking.close}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
