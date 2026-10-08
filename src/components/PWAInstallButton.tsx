import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  lang: 'es' | 'de';
}

export const PWAInstallButton: React.FC<Props> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  const textInstall = lang === 'de' ? 'App installieren' : 'Instalar App';
  const textIOS = lang === 'de' ? 'Auf iOS installieren' : 'Instalar en iPhone';

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-md shadow-amber-500/20 active:scale-95"
        title={textInstall}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{textInstall}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 transition-all active:scale-95"
          title={textIOS}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{textIOS}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-700 p-6 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    {lang === 'de' ? 'Auf iPhone/iPad installieren' : 'Instalar en iPhone / iPad'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-stone-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 font-bold text-xs mt-0.5">
                    1
                  </div>
                  <div>
                    {lang === 'de' ? (
                      <>
                        Tippen Sie auf das <strong>Teilen-Symbol</strong>{' '}
                        <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> in Safari.
                      </>
                    ) : (
                      <>
                        Toca el botón <strong>Compartir</strong>{' '}
                        <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> en la barra de
                        Safari.
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/50">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 font-bold text-xs mt-0.5">
                    2
                  </div>
                  <div>
                    {lang === 'de' ? (
                      <>
                        Wählen Sie <strong>«Zum Home-Bildschirm»</strong> aus.
                      </>
                    ) : (
                      <>
                        Desplázate hacia abajo y selecciona{' '}
                        <strong>«Agregar a inicio»</strong>.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-medium text-sm transition"
              >
                {lang === 'de' ? 'Verstanden' : 'Entendido'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
