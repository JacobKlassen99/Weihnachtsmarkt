import React from 'react';
import {
  Calendar,
  Compass,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogOut,
  QrCode,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { translations } from '../i18n/translations';
import { Idioma } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type NavView = 'public' | 'client' | 'porteria' | 'admin' | 'guest';

interface Props {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  lang: Idioma;
  onLangChange: (lang: Idioma) => void;
  gestionActiva?: string;
  adminLoggedIn?: boolean;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentView,
  onNavigate,
  lang,
  onLangChange,
  gestionActiva = 'GES-2026',
  adminLoggedIn = false,
  onAdminLogout,
}) => {
  const t = translations[lang];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-stone-950/85 border-b border-red-900/40 text-stone-100 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Event Title */}
          <button
            onClick={() => onNavigate('public')}
            className="flex items-center gap-3 group text-left transition"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-amber-700 p-0.5 shadow-md shadow-red-900/50 group-hover:scale-105 transition">
              <div className="w-full h-full rounded-[10px] bg-stone-950/40 flex items-center justify-center overflow-hidden">
                <img src="/icon.svg" alt="Weihnachtsmarkt" className="w-7 h-7 object-contain drop-shadow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wide text-base sm:text-lg bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  {t.appName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/60">
                  {gestionActiva}
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-stone-400 tracking-wider font-light">
                {t.tagline}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-900/70 p-1.5 rounded-2xl border border-stone-800/80">
            <button
              onClick={() => onNavigate('public')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'public'
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white shadow-sm border border-red-700/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              {t.navHome}
            </button>

            <button
              onClick={() => onNavigate('client')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'client'
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white shadow-sm border border-red-700/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              {t.navClient}
            </button>

            <button
              onClick={() => onNavigate('porteria')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'porteria'
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white shadow-sm border border-red-700/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              {t.navGate}
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentView === 'admin'
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white shadow-sm border border-red-700/50'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              {t.navAdmin}
            </button>
          </nav>

          {/* Action buttons: Language, Install & Logout */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-full p-0.5">
              <button
                onClick={() => onLangChange('es')}
                className={`px-2 py-1 rounded-full text-[11px] font-bold transition ${
                  lang === 'es'
                    ? 'bg-red-800 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Español"
              >
                ES
              </button>
              <button
                onClick={() => onLangChange('de')}
                className={`px-2 py-1 rounded-full text-[11px] font-bold transition ${
                  lang === 'de'
                    ? 'bg-red-800 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Deutsch"
              >
                DE
              </button>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton lang={lang} />

            {/* Admin Logout button if logged in */}
            {adminLoggedIn && currentView === 'admin' && (
              <button
                onClick={onAdminLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-300 hover:text-red-400 bg-stone-900 hover:bg-red-950/40 border border-stone-800 hover:border-red-800/50 transition"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-red-950/60 px-2 py-1 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onNavigate('public')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
            currentView === 'public'
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t.navHome}</span>
        </button>

        <button
          onClick={() => onNavigate('client')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
            currentView === 'client'
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <KeyRound className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t.navClient}</span>
        </button>

        <button
          onClick={() => onNavigate('porteria')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
            currentView === 'porteria'
              ? 'text-emerald-400 font-bold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <QrCode className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t.navGate}</span>
        </button>

        <button
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
            currentView === 'admin'
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t.navAdmin}</span>
        </button>
      </nav>
    </>
  );
};
