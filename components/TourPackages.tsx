import React, { useState } from 'react';
import { Clock, Check, Map, Eye, X, MapPin, Calendar, Info } from 'lucide-react';
import { Translation, Tour } from '../types';

interface TourPackagesProps {
  t: Translation;
  tours: Tour[];
  onBookTour: (tour: Tour) => void;
}

export const TourPackages: React.FC<TourPackagesProps> = ({ t, tours, onBookTour }) => {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  const handleBuy = () => {
    if (selectedTour) {
        onBookTour(selectedTour);
        setSelectedTour(null);
    }
  };

  return (
    <div className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.tours.title}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {t.tours.subtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <div key={tour.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-video w-full overflow-hidden bg-slate-200">
                <img 
                  src={tour.image} 
                  alt={tour.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                  {tour.price.toLocaleString()} CVE
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-slate-900">{tour.title}</h3>
                
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={16} />
                  <span>{t.tours.duration}: {tour.duration}</span>
                </div>

                <p className="mt-3 text-sm text-slate-600 flex-1 line-clamp-3">
                  {tour.description}
                </p>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.tours.included}
                  </p>
                  <ul className="space-y-2">
                    {tour.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check size={16} className="text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                    {tour.features.length > 3 && (
                      <li className="text-xs text-slate-400 italic">
                        + {tour.features.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedTour(tour)}
                  className="mt-4 w-full rounded-lg border-2 border-red-600 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white flex items-center justify-center gap-2"
                >
                  <Eye size={18} />
                  {t.tours.view_details}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tour Detail Modal - Responsive */}
      {selectedTour && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedTour(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-slate-600 backdrop-blur-sm hover:bg-white hover:text-red-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Hero Image */}
            <div className="relative h-64 w-full sm:h-80">
              <img 
                src={selectedTour.image} 
                alt={selectedTour.title} 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white shadow-sm">{selectedTour.title}</h2>
                    <div className="flex items-center gap-4 mt-2 text-white/90">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock size={16} />
                        {selectedTour.duration}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Calendar size={16} />
                        Available Daily
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-xl shadow-lg">
                    {selectedTour.price.toLocaleString()} CVE
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 sm:p-8">
              {/* Left Column: Description & Map */}
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Info size={20} className="text-slate-400" />
                    About this tour
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedTour.description}
                  </p>
                </div>

                {/* Map Placeholder */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin size={20} className="text-slate-400" />
                    Route Map
                  </h3>
                  <div className="relative w-full h-48 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    {/* Simulated Map Visuals */}
                    <div className="absolute inset-0 opacity-10" style={{ 
                        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }}></div>
                    <svg className="absolute inset-0 w-full h-full text-slate-300" stroke="currentColor" fill="none">
                      <path d="M50,150 Q150,50 350,150 T650,100" strokeWidth="3" strokeDasharray="6 4" />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center text-slate-400">
                      <Map size={32} className="mb-2" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Map View Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Features & CTA */}
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                    {t.tours.included}
                  </h3>
                  <ul className="space-y-3">
                    {selectedTour.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                          <Check size={12} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleBuy}
                  className="w-full rounded-xl bg-red-600 py-4 text-base font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t.tours.buy_now}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};