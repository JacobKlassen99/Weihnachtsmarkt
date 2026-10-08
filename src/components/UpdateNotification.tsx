import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { translations } from '../i18n/translations';

interface Props {
  lang: 'es' | 'de';
  hasUnsavedForms?: boolean;
}

export const UpdateNotification: React.FC<Props> = ({ lang, hasUnsavedForms = false }) => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    // Check if navigator.serviceWorker is supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
                setUpdateSW(() => async () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                });
              }
            });
          }
        });
      });
    }
  }, []);

  if (!needRefresh || dismissed) {
    return null;
  }

  // Do not show intrusive blocking modal if user is editing forms; show bottom corner toast
  const handleUpdate = () => {
    if (hasUnsavedForms) {
      const confirmUpdate = window.confirm(
        lang === 'de'
          ? 'Sie haben ungespeicherte Eingaben. Möchten Sie die Seite wirklich aktualisieren?'
          : 'Tienes información sin guardar en el formulario. ¿Deseas actualizar ahora de todos modos?'
      );
      if (!confirmUpdate) return;
    }
    if (updateSW) {
      updateSW();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 max-w-sm rounded-2xl bg-gradient-to-r from-red-900 to-stone-900 border border-amber-500/50 p-4 shadow-2xl text-stone-100 backdrop-blur-md animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            {t.newVersionTitle}
          </h4>
          <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
            {t.newVersionText}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.updateNow}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs transition"
            >
              {t.close}
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-stone-400 hover:text-stone-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
