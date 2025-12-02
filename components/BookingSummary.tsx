import React from 'react';
import { Star, Check } from 'lucide-react';
import { Vehicle, Translation, Review, ReservationExtras } from '../types';
import { EXTRAS_PRICING } from '../constants';
import { StarRating } from './StarRating';

interface BookingSummaryProps {
  t: Translation;
  vehicle: Vehicle;
  startDate: string;
  endDate: string;
  totalDays: number;
  rentalBase: number;
  discount: number;
  extras: ReservationExtras;
  deliveryCost: number;
  finalTotal: number;
  depositAmount: number;
  payAtCounterAmount: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  t, vehicle, startDate, endDate, totalDays, rentalBase, discount, extras, deliveryCost, finalTotal, depositAmount, payAtCounterAmount
}) => {
  return (
    // Responsive container:
    // Mobile: w-full, border-b (separates from form)
    // Desktop: w-[35%], full height, border-r (side-by-side)
    <div className="w-full lg:w-[35%] bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 lg:overflow-y-auto lg:h-full flex flex-col shrink-0">
        
        {/* Trust Signals - Hide on small mobile to save space, show on larger screens */}
        <div className="hidden sm:block mb-6 space-y-4">
            <div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{t.booking.about_company_title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t.booking.about_company_desc}</p>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-2">{t.booking.useful_info_title}</h3>
                <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /><span>{t.booking.info_cancellation}</span></li>
                    <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /><span>{t.booking.info_no_credit_card}</span></li>
                    <li className="flex items-start gap-2"><Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /><span>{t.booking.info_insurance}</span></li>
                </ul>
            </div>
        </div>

        <div className="hidden sm:block h-px bg-slate-200 mb-6"></div>

        {/* Vehicle Info */}
        <div className="flex gap-4 lg:block mb-6 lg:mb-0">
            <div className="w-24 h-16 sm:w-full sm:h-40 overflow-hidden rounded-lg sm:mb-4 bg-white border border-slate-100 shrink-0">
                <img src={vehicle.image} alt={vehicle.model} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
                <p className="font-bold text-slate-900 text-lg">{vehicle.make} {vehicle.model}</p>
                <div className="flex items-center gap-2 mb-1"><StarRating rating={vehicle.rating} size={14} /><span className="text-xs text-slate-500">({vehicle.reviewCount})</span></div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-100 inline-block px-2 py-0.5 rounded">{vehicle.year} • {vehicle.transmission}</p>
            </div>
        </div>
        
        <div className="my-4 h-px bg-slate-200 hidden lg:block"></div>

        {startDate && endDate && (
            <div className="mb-4 rounded-lg bg-white p-3 border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 flex justify-between font-medium">
                    <div className="text-center"><p className="text-[10px] uppercase text-slate-400">Start</p><p className="text-slate-900">{startDate}</p></div>
                    <div className="self-center text-slate-300">→</div>
                    <div className="text-center"><p className="text-[10px] uppercase text-slate-400">End</p><p className="text-slate-900">{endDate}</p></div>
                </div>
            </div>
        )}
        
        <div className="space-y-2 lg:flex-1">
            <div className="flex justify-between text-sm"><span className="text-slate-600">{totalDays} {t.vehicle.day}s x {vehicle.pricePerDay.toLocaleString()}</span><span className="font-medium text-slate-900">{rentalBase.toLocaleString()} CVE</span></div>
            {discount > 0 && (<div className="flex justify-between text-sm text-emerald-600"><span>{t.booking.discount_applied}</span><span>-{discount.toLocaleString()} CVE</span></div>)}
            {extras.gps && (<div className="flex justify-between text-sm text-slate-600"><span>GPS</span><span>+{(EXTRAS_PRICING.gps * totalDays).toLocaleString()}</span></div>)}
            {extras.childSeat && (<div className="flex justify-between text-sm text-slate-600"><span>Child Seat</span><span>+{(EXTRAS_PRICING.childSeat * totalDays).toLocaleString()}</span></div>)}
            {extras.insurance && (<div className="flex justify-between text-sm text-slate-600"><span>Insurance</span><span>+{(EXTRAS_PRICING.insurance * totalDays).toLocaleString()}</span></div>)}
            {deliveryCost > 0 && (<div className="flex justify-between text-sm"><span className="text-slate-600">Delivery</span><span className="font-medium text-red-600">+{deliveryCost.toLocaleString()} CVE</span></div>)}
        </div>
        
        <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex justify-between text-lg font-bold mb-2 text-slate-900"><span>{t.booking.total}</span><span>{finalTotal.toLocaleString()} CVE</span></div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                <div className="flex justify-between text-sm font-bold text-emerald-800 mb-1"><span>{t.booking.pay_now}</span><span>{depositAmount.toLocaleString()} CVE</span></div>
                <div className="flex justify-between text-xs font-medium text-emerald-600/80"><span>{t.booking.pay_later}</span><span>{payAtCounterAmount.toLocaleString()} CVE</span></div>
            </div>
        </div>
    </div>
  );
};