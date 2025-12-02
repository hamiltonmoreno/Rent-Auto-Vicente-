import React, { useState } from 'react';
import { Menu, X, Globe, User, LogOut, LogIn } from 'lucide-react';
import { Language, Translation, User as UserType } from '../types';
import { COMPANY_LOGO } from '../constants';

interface HeaderProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  t: Translation;
  onNavigate: (view: 'home' | 'admin' | 'customer') => void;
  currentView: 'home' | 'admin' | 'customer';
  currentUser: UserType | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentLang, 
  setLang, 
  t, 
  onNavigate, 
  currentView,
  currentUser,
  onLoginClick,
  onLogoutClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLang = () => {
    setLang(currentLang === 'pt' ? 'en' : 'pt');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
            <img src={COMPANY_LOGO} alt="Auto Vicente" className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Auto Vicente</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          <nav className="flex gap-6">
            <button 
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-red-600' : 'text-slate-600 hover:text-red-600'}`}
            >
              {t.nav.home}
            </button>
            
            {currentUser?.role === 'customer' && (
              <button 
                onClick={() => onNavigate('customer')}
                className={`text-sm font-medium transition-colors ${currentView === 'customer' ? 'text-red-600' : 'text-slate-600 hover:text-red-600'}`}
              >
                {t.nav.my_reservations}
              </button>
            )}
            
            {currentUser?.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')}
                className={`text-sm font-medium transition-colors ${currentView === 'admin' ? 'text-red-600' : 'text-slate-600 hover:text-red-600'}`}
              >
                {t.nav.admin}
              </button>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Globe size={12} />
              {currentLang.toUpperCase()}
            </button>
            
            {currentUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-slate-500">{t.nav.welcome},</p>
                  <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                </div>
                <button 
                  onClick={onLogoutClick}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 hover:text-red-600 transition-colors"
                  title={t.nav.logout}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 shadow-md"
              >
                <LogIn size={16} />
                {t.nav.login}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            <button onClick={() => { onNavigate('home'); setIsOpen(false); }} className="text-left text-base font-medium text-slate-600 hover:text-red-600">
              {t.nav.home}
            </button>
            
            {currentUser?.role === 'customer' && (
              <button onClick={() => { onNavigate('customer'); setIsOpen(false); }} className="text-left text-base font-medium text-slate-600 hover:text-red-600">
                {t.nav.my_reservations}
              </button>
            )}
            
            {currentUser?.role === 'admin' && (
              <button onClick={() => { onNavigate('admin'); setIsOpen(false); }} className="text-left text-base font-medium text-slate-600 hover:text-red-600">
                {t.nav.admin}
              </button>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button onClick={toggleLang} className="flex items-center gap-2 text-sm text-slate-600">
                <Globe size={16} /> {currentLang === 'pt' ? 'Português' : 'English'}
              </button>
              
              {currentUser ? (
                 <button onClick={() => { onLogoutClick(); setIsOpen(false); }} className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <LogOut size={16} /> {t.nav.logout}
                 </button>
              ) : (
                <button onClick={() => { onLoginClick(); setIsOpen(false); }} className="flex items-center gap-2 text-sm font-medium text-red-600">
                   <LogIn size={16} /> {t.nav.login}
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};