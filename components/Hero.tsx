
import React from 'react';
import { Calendar, MapPin, Search } from 'lucide-react';
import { Translation } from '../types';

interface HeroProps {
  t: Translation;
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  pickupDate: string;
  setPickupDate: (val: string) => void;
  dropoffDate: string;
  setDropoffDate: (val: string) => void;
  onSearch: () => void;
}

export const Hero: React.FC<HeroProps> = ({ 
  t, 
  searchLocation, 
  setSearchLocation, 
  pickupDate, 
  setPickupDate, 
  dropoffDate, 
  setDropoffDate,
  onSearch
}) => {
  return (
    <div className="relative bg-slate-900 py-20 sm:py-24 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Road trip" 
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-900/50 to-slate-900/90"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-center sm:mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            {t.hero.subtitle}
          </p>
        </div>

        {/* Search Box */}
        <div className="mt-10 sm:mx-auto sm:max-w-4xl">
          <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-xl sm:grid-cols-12">
            
            <div className="relative sm:col-span-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MapPin size={18} />
              </div>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="block w-full rounded-lg border-0 bg-slate-50 py-3 pl-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                placeholder={t.hero.search_placeholder}
              />
            </div>

            <div className="relative sm:col-span-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="text"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => (e.target.type = 'text')}
                className="block w-full rounded-lg border-0 bg-slate-50 py-3 pl-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                placeholder={t.hero.pickup_date}
              />
            </div>

            <div className="relative sm:col-span-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="text"
                value={dropoffDate}
                onChange={(e) => setDropoffDate(e.target.value)}
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => (e.target.type = 'text')}
                className="block w-full rounded-lg border-0 bg-slate-50 py-3 pl-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                placeholder={t.hero.dropoff_date}
              />
            </div>

            <div className="sm:col-span-2">
              <button 
                onClick={onSearch}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                <Search size={18} />
                <span className="hidden sm:inline">Buscar</span>
                <span className="sm:hidden">{t.hero.search_btn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
