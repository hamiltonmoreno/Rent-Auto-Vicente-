

import React from 'react';
import { X, User, ShieldCheck } from 'lucide-react';
import { Translation, User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserType) => void;
  t: Translation;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, t }) => {
  if (!isOpen) return null;

  const handleAdminLogin = () => {
    onLogin({
      id: 'admin-001',
      name: 'Admin User',
      email: 'admin@autovicente.cv',
      role: 'admin',
      phone: '+238 991 00 00'
    });
    onClose();
  };

  const handleCustomerLogin = () => {
    onLogin({
      id: 'user-001',
      name: 'João Silva',
      email: 'joao@example.com',
      role: 'customer',
      phone: '+238 555 12 34'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">{t.auth.login_title}</h2>

        <div className="space-y-4">
          <button
            onClick={handleCustomerLogin}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-red-600 hover:shadow-md group"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-slate-100 p-3 group-hover:bg-red-50 group-hover:text-red-600">
                <User size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">{t.auth.login_customer}</p>
                <p className="text-xs text-slate-500">Access your bookings and history</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleAdminLogin}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-900 hover:shadow-md group"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-slate-100 p-3 group-hover:bg-slate-900 group-hover:text-white">
                <ShieldCheck size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">{t.auth.login_admin}</p>
                <p className="text-xs text-slate-500">Manage fleet and reservations</p>
              </div>
            </div>
          </button>
        </div>
        
        <p className="mt-6 text-center text-xs text-slate-400">
          * Demo Mode: No password required
        </p>
      </div>
    </div>
  );
};
