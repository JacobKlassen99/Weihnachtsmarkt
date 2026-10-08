import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Download,
  Info,
  QrCode,
  RefreshCw,
  Sparkles,
  Store,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { translations } from '../../i18n/translations';
import { backendService } from '../../services/backend';
import { Idioma, InvitacionInfo } from '../../types';

interface Props {
  token: string;
  lang: Idioma;
  onBackToHome: () => void;
}

export const GuestRegistration: React.FC<Props> = ({
  token,
  lang,
  onBackToHome,
}) => {
  const t = translations[lang];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitacionInfo | null>(null);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [registeredQR, setRegisteredQR] = useState<string | null>(null);
  const [registeredName, setRegisteredName] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token) {
        setLoading(false);
        setError(t.guestInvalidToken);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const info = await backendService.consultarInvitacion(token);
        setInvitationInfo(info);

        if (!info.valida) {
          setError(info.error || t.guestInvalidToken);
        } else if (info.registrado) {
          // If already registered, show the QR
          setRegisteredQR(info.qr_acceso || token);
          setRegisteredName(info.nombre_invitado || 'Invitado');
        }
      } catch (err: any) {
        setError(err.message || t.guestInvalidToken);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [token, lang]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await backendService.registrarInvitado(token, guestName.trim());
      if (!res.ok) {
        throw new Error(res.error || 'No se pudo completar el registro');
      }

      setRegisteredQR(res.qr_acceso || token);
      setRegisteredName(guestName.trim());
    } catch (err: any) {
      setError(err.message || 'Error al registrar invitado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-8 shadow-2xl text-stone-100">
        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-stone-300 text-sm font-semibold">{t.loading}</p>
          </div>
        )}

        {/* Error / Invalid Token */}
        {!loading && error && !registeredQR && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-serif">
              {lang === 'de' ? 'Ungültige Einladung' : 'Invitación No Válida'}
            </h3>
            <p className="text-xs text-stone-400 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={onBackToHome}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
            >
              {t.back}
            </button>
          </div>
        )}

        {/* Already or newly Registered State with QR */}
        {!loading && registeredQR && (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              {t.guestQRTitle}
            </span>
            <h3 className="text-xl font-black text-white font-serif mt-0.5 mb-1">
              {t.guestSuccessTitle}
            </h3>
            <p className="text-xs text-stone-300 mb-6 max-w-xs mx-auto">
              {t.guestSuccessText}
            </p>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-3xl shadow-2xl border border-stone-200 inline-block mb-4">
              <QRCodeSVG value={registeredQR} size={180} level="H" includeMargin={false} />
            </div>

            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 mb-6 text-xs text-stone-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-400">{t.guestName}:</span>
                <span className="font-bold text-white">{registeredName}</span>
              </div>
              {invitationInfo?.stand && (
                <div className="flex justify-between">
                  <span className="text-stone-400">{t.standNumber}:</span>
                  <span className="font-mono text-amber-400">#{invitationInfo.stand}</span>
                </div>
              )}
            </div>

            <button
              onClick={onBackToHome}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition"
            >
              {t.navHome}
            </button>
          </div>
        )}

        {/* Registration Form State */}
        {!loading && !error && !registeredQR && invitationInfo?.valida && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-serif">
                {t.guestPortalTitle}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                {t.guestPortalSubtitle}
              </p>
            </div>

            {/* Stand badge info */}
            {invitationInfo.stand && (
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 mb-5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span className="text-stone-300">
                    {t.standNumber} #{invitationInfo.stand}
                  </span>
                </div>
                {invitationInfo.cliente && (
                  <span className="text-stone-400">{invitationInfo.cliente}</span>
                )}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.fullName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.guestNamePlaceholder}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.loading}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{t.registerGuestButton}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
