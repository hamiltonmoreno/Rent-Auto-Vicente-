

import React from 'react';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';
import { Translation } from '../types';
import { COMPANY_LOGO } from '../constants';

interface FooterProps {
  t: Translation;
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand & About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                <img src={COMPANY_LOGO} alt="Auto Vicente" className="h-full w-full object-cover" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Auto Vicente</span>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              {t.footer.about_text}
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">{t.footer.links}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm hover:text-red-500 transition-colors">{t.nav.home}</a>
              </li>
              <li>
                <a href="#fleet-section" className="text-sm hover:text-red-500 transition-colors">{t.nav.fleet}</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-red-500 transition-colors">{t.nav.my_reservations}</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-red-500 transition-colors">{t.footer.about}</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">{t.footer.contact}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-red-600 shrink-0" size={20} />
                <span className="text-sm">{t.footer.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-red-600 shrink-0" size={20} />
                <span className="text-sm">{t.footer.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-red-600 shrink-0" size={20} />
                <span className="text-sm">{t.footer.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Auto Vicente. {t.footer.rights}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href="#" className="text-xs text-slate-500 hover:text-white transition-colors">{t.footer.terms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};