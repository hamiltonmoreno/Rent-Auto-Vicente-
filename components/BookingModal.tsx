
import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, CreditCard, Truck, Shield, MapPin, Baby, Navigation, Calendar, Wallet, Check, Plane, Users, Phone, Loader2, Lock, FileCheck } from 'lucide-react';
import { Vehicle, Translation, Review, ReservationExtras, User, PaymentMethod } from '../types';
import { EXTRAS_PRICING } from '../constants';
import { StarRating } from './StarRating';
import { useNotification } from './NotificationSystem';

interface BookingModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  currentUser: User | null;
  reviews: Review[];
  onLoginRequest: () => void;
  onCreateReservation: (data: any) => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  vehicle, 
  isOpen, 
  onClose, 
  t, 
  currentUser,
  reviews,
  onLoginRequest,
  onCreateReservation,
  defaultStartDate = '',
  defaultEndDate = ''
}) => {
  const { notify } = useNotification();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Form State
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [pickupType, setPickupType] = useState<'office' | 'delivery'>('office');
  const [pickupLocation, setPickupLocation] = useState<string>('airport');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [numPassengers, setNumPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vinti4');
  
  // File Upload State
  const [licenseFile, setLicenseFile] = useState<string | null>(null);
  
  // Payment Details State
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [vinti4Phone, setVinti4Phone] = useState('');
  
  // Data State
  const [vehicleReviews, setVehicleReviews] = useState<Review[]>([]);
  const [dateError, setDateError] = useState('');
  
  // Extras State
  const [extras, setExtras] = useState<ReservationExtras>({
    gps: false,
    childSeat: false,
    insurance: false
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsProcessing(false);
      setPickupType('office');
      setPickupLocation('airport');
      setDeliveryAddress('');
      setFlightNumber('');
      setNumPassengers(1);
      setPaymentMethod('vinti4');
      setCardDetails({ name: '', number: '', expiry: '', cvc: '' });
      setVinti4Phone('');
      setExtras({ gps: false, childSeat: false, insurance: false });
      setStartDate(defaultStartDate);
      setEndDate(defaultEndDate);
      setLicenseFile(null);
      setDateError('');
      
      const relevantReviews = reviews.filter(
        r => r.vehicleId === vehicle.id && r.status === 'approved'
      );
      setVehicleReviews(relevantReviews);
    }
  }, [isOpen, vehicle.id, defaultStartDate, defaultEndDate, reviews]);

  // Calculate Duration
  const getDaysDiff = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const totalDays = getDaysDiff(startDate, endDate);
  const rentalBase = vehicle.pricePerDay * totalDays;
  
  // Dynamic Pricing: 10% discount if > 7 days
  const discount = totalDays > 7 ? rentalBase * 0.10 : 0;
  
  const extrasTotal = (
    (extras.gps ? EXTRAS_PRICING.gps : 0) +
    (extras.childSeat ? EXTRAS_PRICING.childSeat : 0) +
    (extras.insurance ? EXTRAS_PRICING.insurance : 0)
  ) * totalDays;

  const deliveryCost = pickupType === 'delivery' || pickupLocation === 'custom' ? EXTRAS_PRICING.delivery : 0;
  
  const finalTotal = (rentalBase - discount) + extrasTotal + deliveryCost;
  
  // Deposit Logic (e.g. 15% deposit)
  const depositAmount = Math.round(finalTotal * 0.15);
  const payAtCounterAmount = finalTotal - depositAmount;

  const validateStep1 = () => {
    if (!startDate || !endDate) {
      setDateError(t.hero.error_dates);
      return false;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setDateError(t.booking.error_dates_invalid);
      return false;
    }
    setDateError('');
    return true;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCardDetails({...cardDetails, number: formatCardNumber(val)});
  };

  const handleFileUpload = () => {
     setTimeout(() => {
        setLicenseFile("drivers_license_scan.jpg");
        notify('success', t.booking.upload_success);
     }, 800);
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(prev => (prev + 1) as any);
  };

  const handlePayment = () => {
    if (!currentUser) {
        onClose();
        onLoginRequest();
        return;
    }

    // Basic Validation for Payment Fields
    if (paymentMethod === 'card' || paymentMethod === 'stripe') {
        if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvc) {
            notify('error', "Please fill in all card details.");
            return;
        }
        setProcessingStatus(t.booking.payment_processing);
    } else if (paymentMethod === 'vinti4') {
        if (!vinti4Phone || vinti4Phone.length < 7) {
            notify('error', "Please enter a valid phone number.");
            return;
        }
        // Retrieve configured credentials
        const posId = localStorage.getItem('vinti4_pos_id');
        const posToken = localStorage.getItem('vinti4_api_key');
        
        if (posId) {
            setProcessingStatus(`Connecting to Vinti4 POS: ${posId}...`);
            console.log(`[Vinti4 Integration] Initiating transaction... POS ID: ${posId}, Token: ${posToken ? '****' : 'Missing'}`);
        } else {
            setProcessingStatus(t.booking.payment_processing);
            console.log(`[Vinti4 Integration] Warning: No POS ID configured in Admin Settings. Using mock ID.`);
        }
    } else if (paymentMethod === 'paypal') {
        setProcessingStatus(t.booking.payment_processing);
    }

    setIsProcessing(true);
    
    // Simulate API Call delay
    setTimeout(() => {
      setIsProcessing(false);
      onCreateReservation({
        vehicleId: vehicle.id,
        userId: currentUser.id,
        customerName: currentUser.name,
        startDate,
        endDate,
        status: 'confirmed', // Confirmed because deposit is paid
        total: finalTotal,
        discount: discount,
        pickupType,
        pickupLocation,
        pickupAddress: pickupLocation === 'custom' ? deliveryAddress : undefined,
        flightNumber,
        numberOfPassengers: numPassengers,
        extras,
        paymentMethod,
        paymentStatus: 'paid', // Simulate successful charge
        transactionId: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
      notify('success', t.booking.success_title);
      setStep(4); // Success
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 p-4 backdrop-blur-sm md:p-8">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl my-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto lg:overflow-hidden lg:h-auto">
          {/* Left Sidebar - Summary & Info */}
          <div className="w-full lg:w-[35%] rounded-t-2xl bg-slate-50 p-6 lg:rounded-l-2xl lg:rounded-tr-none lg:border-r lg:border-slate-100 lg:overflow-y-auto">
            
            {/* Trust Signals */}
            <div className="mb-6 space-y-4">
               <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{t.booking.about_company_title}</h3>
                  <p className="text-sm text-slate-600">{t.booking.about_company_desc}</p>
               </div>
               
               <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{t.booking.useful_info_title}</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                     <li className="flex items-start gap-2">
                        <Check size={16} className="text-emerald-500 mt-0.5" />
                        <span>{t.booking.info_cancellation}</span>
                     </li>
                     <li className="flex items-start gap-2">
                        <Check size={16} className="text-emerald-500 mt-0.5" />
                        <span>{t.booking.info_no_credit_card}</span>
                     </li>
                     <li className="flex items-start gap-2">
                        <Check size={16} className="text-emerald-500 mt-0.5" />
                        <span>{t.booking.info_insurance}</span>
                     </li>
                  </ul>
               </div>
            </div>

            <div className="h-px bg-slate-200 mb-6"></div>

            <div className="mb-6 overflow-hidden rounded-lg">
              <img src={vehicle.image} alt={vehicle.model} className="h-32 w-full object-cover" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">{vehicle.make} {vehicle.model}</p>
              <div className="flex items-center gap-2">
                 <StarRating rating={vehicle.rating} size={14} />
                 <span className="text-xs text-slate-500">({vehicle.reviewCount})</span>
              </div>
              <p className="text-sm text-slate-500">{vehicle.year} • {vehicle.transmission}</p>
              
              <div className="my-4 h-px bg-slate-200"></div>

              {/* Date Summary */}
              {startDate && endDate && (
                <div className="mb-4 rounded-lg bg-white p-3 border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 flex justify-between font-medium">
                        <span>{startDate}</span>
                        <span>→</span>
                        <span>{endDate}</span>
                    </div>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{totalDays} {t.vehicle.day}s x {vehicle.pricePerDay}</span>
                  <span className="font-medium text-slate-900">{rentalBase.toLocaleString()} CVE</span>
                </div>
                
                {discount > 0 && (
                   <div className="flex justify-between text-sm text-emerald-600">
                      <span>{t.booking.discount_applied}</span>
                      <span>-{discount.toLocaleString()} CVE</span>
                   </div>
                )}
                
                {extras.gps && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>GPS</span>
                    <span>+{(EXTRAS_PRICING.gps * totalDays).toLocaleString()}</span>
                  </div>
                )}
                {extras.childSeat && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Child Seat</span>
                    <span>+{(EXTRAS_PRICING.childSeat * totalDays).toLocaleString()}</span>
                  </div>
                )}
                {extras.insurance && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Insurance</span>
                    <span>+{(EXTRAS_PRICING.insurance * totalDays).toLocaleString()}</span>
                  </div>
                )}
                
                {deliveryCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Delivery</span>
                    <span className="font-medium text-red-600">+{deliveryCost.toLocaleString()} CVE</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-base font-bold mb-1">
                  <span>{t.booking.total}</span>
                  <span>{finalTotal.toLocaleString()} CVE</span>
                </div>
                
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                    <div className="flex justify-between text-sm font-semibold text-emerald-800">
                        <span>{t.booking.pay_now}</span>
                        <span>{depositAmount.toLocaleString()} CVE</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600 mt-1">
                        <span>{t.booking.pay_later}</span>
                        <span>{payAtCounterAmount.toLocaleString()} CVE</span>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Steps */}
          <div className="flex-1 p-6 lg:p-10">
            {/* Progress */}
            <div className="mb-8 flex items-center justify-between px-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      step >= s ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && <div className={`h-1 w-8 sm:w-16 ${step > s ? 'bg-red-600' : 'bg-slate-100'}`}></div>}
                </div>
              ))}
            </div>

            {/* Step 1: Details & Location */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in">
                
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                       <input 
                         type="date" 
                         value={startDate}
                         onChange={(e) => setStartDate(e.target.value)}
                         className={`block w-full rounded-md border pl-9 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 ${dateError ? 'border-red-500' : 'border-slate-300'}`}
                       />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                       <input 
                         type="date" 
                         value={endDate}
                         onChange={(e) => setEndDate(e.target.value)}
                         className={`block w-full rounded-md border pl-9 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm py-2 ${dateError ? 'border-red-500' : 'border-slate-300'}`}
                       />
                    </div>
                  </div>
                  {dateError && <p className="col-span-2 text-xs text-red-600 font-medium">{dateError}</p>}
                </div>

                <div className="h-px bg-slate-100"></div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-900">{t.booking.pickup_location_title}</h4>
                  <p className="text-sm text-slate-500 -mt-3 mb-2">Select where you want to pick up the vehicle.</p>
                  
                  <div className="space-y-3">
                    <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${pickupLocation === 'airport' ? 'border-red-600 ring-1 ring-red-600' : 'border-slate-300'}`}>
                      <input type="radio" name="location" value="airport" checked={pickupLocation === 'airport'} onChange={() => { setPickupLocation('airport'); setPickupType('office'); }} className="sr-only" />
                      <div className="flex w-full items-center justify-between">
                         <div className="flex items-center">
                            <Plane className={`h-5 w-5 ${pickupLocation === 'airport' ? 'text-red-600' : 'text-slate-400'}`} />
                            <div className="ml-3">
                               <p className="text-sm font-medium text-slate-900">{t.booking.loc_airport}</p>
                               <p className="text-xs text-slate-500">Terminal</p>
                            </div>
                         </div>
                         <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{t.booking.free}</span>
                      </div>
                    </label>

                    <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${pickupLocation === 'city' ? 'border-red-600 ring-1 ring-red-600' : 'border-slate-300'}`}>
                      <input type="radio" name="location" value="city" checked={pickupLocation === 'city'} onChange={() => { setPickupLocation('city'); setPickupType('office'); }} className="sr-only" />
                      <div className="flex w-full items-center justify-between">
                         <div className="flex items-center">
                            <MapPin className={`h-5 w-5 ${pickupLocation === 'city' ? 'text-red-600' : 'text-slate-400'}`} />
                            <div className="ml-3">
                               <p className="text-sm font-medium text-slate-900">{t.booking.loc_city}</p>
                               <p className="text-xs text-slate-500">Praia (Plateau)</p>
                            </div>
                         </div>
                         <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{t.booking.free}</span>
                      </div>
                    </label>

                    <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${pickupLocation === 'port' ? 'border-red-600 ring-1 ring-red-600' : 'border-slate-300'}`}>
                      <input type="radio" name="location" value="port" checked={pickupLocation === 'port'} onChange={() => { setPickupLocation('port'); setPickupType('office'); }} className="sr-only" />
                      <div className="flex w-full items-center justify-between">
                         <div className="flex items-center">
                            <Truck className={`h-5 w-5 ${pickupLocation === 'port' ? 'text-red-600' : 'text-slate-400'}`} />
                            <div className="ml-3">
                               <p className="text-sm font-medium text-slate-900">{t.booking.loc_port}</p>
                               <p className="text-xs text-slate-500">Meet & Greet</p>
                            </div>
                         </div>
                         <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{t.booking.free}</span>
                      </div>
                    </label>

                    <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${pickupLocation === 'custom' ? 'border-red-600 ring-1 ring-red-600' : 'border-slate-300'}`}>
                      <input type="radio" name="location" value="custom" checked={pickupLocation === 'custom'} onChange={() => { setPickupLocation('custom'); setPickupType('delivery'); }} className="sr-only" />
                      <div className="flex w-full items-center justify-between">
                         <div className="flex items-center">
                            <MapPin className={`h-5 w-5 ${pickupLocation === 'custom' ? 'text-red-600' : 'text-slate-400'}`} />
                            <div className="ml-3">
                               <p className="text-sm font-medium text-slate-900">{t.booking.loc_custom}</p>
                               <p className="text-xs text-slate-500">Delivery to Hotel/Address</p>
                            </div>
                         </div>
                         <span className="text-xs font-medium text-slate-500">+2000 CVE</span>
                      </div>
                    </label>
                  </div>

                  {pickupLocation === 'custom' && (
                     <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
                        <input 
                          type="text" 
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder={t.booking.delivery_placeholder}
                        />
                     </div>
                  )}

                  {/* Flight Info for Airport */}
                  {pickupLocation === 'airport' && (
                    <div className="animate-in fade-in slide-in-from-top-2 mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.booking.flight_number}</label>
                        <input 
                          type="text" 
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value)}
                          className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder="e.g. TP1503"
                        />
                        <p className="mt-1 text-xs text-slate-500">{t.booking.flight_hint}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.booking.num_passengers}</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select 
                            value={numPassengers}
                            onChange={(e) => setNumPassengers(Number(e.target.value))}
                            className="block w-full rounded-md border border-slate-300 pl-9 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        >
                            {[1,2,3,4,5,6,7,8].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Next: Extras
                </button>
              </div>
            )}

            {/* Step 2: Extras */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <h4 className="text-lg font-bold text-slate-900">{t.booking.extras_title}</h4>
                
                <div className="space-y-3">
                  <label className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${extras.insurance ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600"><Shield size={20} /></div>
                      <div>
                        <span className="block font-medium text-slate-900">{t.booking.extra_insurance}</span>
                        <span className="text-xs text-slate-500">Zero liability for damages</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={extras.insurance} onChange={(e) => setExtras({...extras, insurance: e.target.checked})} className="h-5 w-5 accent-red-600" />
                  </label>

                  <label className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${extras.gps ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-100 p-2 text-amber-600"><Navigation size={20} /></div>
                      <div>
                        <span className="block font-medium text-slate-900">{t.booking.extra_gps}</span>
                        <span className="text-xs text-slate-500">Built-in navigation system</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={extras.gps} onChange={(e) => setExtras({...extras, gps: e.target.checked})} className="h-5 w-5 accent-red-600" />
                  </label>

                  <label className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${extras.childSeat ? 'border-red-500 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-purple-100 p-2 text-purple-600"><Baby size={20} /></div>
                      <div>
                        <span className="block font-medium text-slate-900">{t.booking.extra_child_seat}</span>
                        <span className="text-xs text-slate-500">Safety seat for ages 1-4</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={extras.childSeat} onChange={(e) => setExtras({...extras, childSeat: e.target.checked})} className="h-5 w-5 accent-red-600" />
                  </label>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">Next: Documents</button>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <h4 className="text-lg font-bold text-slate-900">{t.booking.step_docs}</h4>
                
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    Please upload a photo of your Driver's License. You can also do this later from your dashboard.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 hover:border-red-500 hover:bg-red-50/30 transition-all cursor-pointer" onClick={handleFileUpload}>
                    <div className="text-center">
                       {licenseFile ? (
                          <>
                             <FileCheck className="mx-auto h-12 w-12 text-emerald-500" />
                             <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                <span className="font-semibold text-emerald-600">{licenseFile}</span>
                             </div>
                             <p className="text-xs text-emerald-500">Ready for submission</p>
                          </>
                       ) : (
                          <>
                             <Upload className="mx-auto h-12 w-12 text-slate-300" />
                             <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                <span className="relative rounded-md bg-white font-semibold text-red-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-red-600 focus-within:ring-offset-2 hover:text-red-500">
                                   {t.booking.upload_license}
                                </span>
                             </div>
                             <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                          </>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back</button>
                  <button onClick={() => setStep(4)} className="flex-1 rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">Next: Payment</button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in">
                <h4 className="text-lg font-bold text-slate-900">{t.booking.payment_method}</h4>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => setPaymentMethod('vinti4')}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${paymentMethod === 'vinti4' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} />
                      <span className="font-semibold">{t.booking.pay_vinti4}</span>
                    </div>
                    {paymentMethod === 'vinti4' && <CheckCircle size={20} />}
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${paymentMethod === 'card' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} />
                      <span className="font-semibold">{t.booking.pay_card}</span>
                    </div>
                    {paymentMethod === 'card' && <CheckCircle size={20} />}
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${paymentMethod === 'stripe' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} />
                      <span className="font-semibold">{t.booking.pay_stripe}</span>
                    </div>
                    {paymentMethod === 'stripe' && <CheckCircle size={20} />}
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet size={20} />
                      <span className="font-semibold">{t.booking.pay_paypal}</span>
                    </div>
                    {paymentMethod === 'paypal' && <CheckCircle size={20} />}
                  </button>
                </div>

                {/* Dynamic Payment Forms */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    {paymentMethod === 'vinti4' && (
                        <div className="space-y-3 animate-in fade-in">
                            <label className="block text-sm font-medium text-slate-700">{t.booking.vinti4_phone}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input 
                                    type="tel" 
                                    value={vinti4Phone}
                                    onChange={(e) => setVinti4Phone(e.target.value)}
                                    placeholder="9911234" 
                                    className="block w-full rounded-md border-slate-300 pl-9 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2 border" 
                                />
                            </div>
                            <p className="text-xs text-slate-500">{t.booking.vinti4_instr}</p>
                        </div>
                    )}

                    {(paymentMethod === 'card' || paymentMethod === 'stripe') && (
                        <div className="space-y-3 animate-in fade-in">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">{t.booking.card_holder}</label>
                                <input 
                                    type="text" 
                                    value={cardDetails.name}
                                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                                    placeholder="John Doe" 
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm p-2 border" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">{t.booking.card_number}</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={cardDetails.number}
                                        onChange={handleCardNumberChange}
                                        placeholder="0000 0000 0000 0000" 
                                        maxLength={19}
                                        className="block w-full rounded-md border-slate-300 pl-9 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 border" 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.booking.card_expiry}</label>
                                    <input 
                                        type="text" 
                                        value={cardDetails.expiry}
                                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                        placeholder="MM/YY" 
                                        maxLength={5}
                                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm p-2 border" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">{t.booking.card_cvc}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-3 w-3 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={cardDetails.cvc}
                                            onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                                            placeholder="123" 
                                            maxLength={4}
                                            className="block w-full rounded-md border-slate-300 pl-8 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm p-2 border" 
                                        />
                                    </div>
                                </div>
                            </div>
                            {paymentMethod === 'stripe' && <p className="text-xs text-slate-500">{t.booking.stripe_instr}</p>}
                        </div>
                    )}

                    {paymentMethod === 'paypal' && (
                        <div className="text-center py-4 animate-in fade-in">
                            <p className="text-sm text-slate-600 mb-2">{t.booking.paypal_instr}</p>
                            <button className="bg-[#0070ba] text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-[#005ea6]">
                                PayPal Checkout
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(3)} className="flex-1 rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back</button>
                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 rounded-lg bg-red-600 py-3 font-bold text-white shadow-lg hover:bg-red-500 hover:shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                       <>
                         <Loader2 className="animate-spin" size={20} />
                         {processingStatus}
                       </>
                    ) : (
                       t.booking.confirm_pay
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
