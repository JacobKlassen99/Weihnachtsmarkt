import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  Store,
  Tag,
  UserCheck,
  Users,
} from 'lucide-react';
import { translations } from '../../i18n/translations';
import { backendService } from '../../services/backend';
import { Idioma, Invitado, MiAlquilerData } from '../../types';

interface Props {
  initialToken?: string;
  lang: Idioma;
}

export const ClientPortal: React.FC<Props> = ({ initialToken = '', lang }) => {
  const t = translations[lang];

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [activeToken, setActiveToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rentalData, setRentalData] = useState<MiAlquilerData | null>(null);

  // Invitation creation state
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRental = async (token: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await backendService.getMiAlquiler(token);
      setRentalData(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la información del stand');
      setRentalData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      setActiveToken(initialToken);
      fetchRental(initialToken);
    }
  }, [initialToken]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setActiveToken(tokenInput.trim());
    fetchRental(tokenInput.trim());
  };

  const handleCreateInvitation = async () => {
    if (!activeToken) return;
    setCreatingInvite(true);
    setInviteError(null);
    try {
      const res = await backendService.crearInvitacion(activeToken);
      if (!res.ok) {
        throw new Error(res.error || 'No se pudo generar la invitación');
      }
      // Re-fetch rental data to see updated invitation list
      await fetchRental(activeToken);
    } catch (err: any) {
      setInviteError(err.message || 'Error al crear invitación');
    } finally {
      setCreatingInvite(false);
    }
  };

  const getInvitationUrl = (inviteToken: string) => {
    const origin = window.location.origin;
    return `${origin}/#invitacion?token=${encodeURIComponent(inviteToken)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const shareViaWhatsApp = (invitacion: Invitado) => {
    const inviteUrl = getInvitationUrl(invitacion.token_invitacion);
    const msg =
      lang === 'de'
        ? `Hallo! Hier ist deine Einladung zum Weihnachtsmarkt für Stand #${invitacion.stand}. Registriere dich hier, um deinen QR-Einlasscode zu erhalten: ${inviteUrl}`
        : `¡Hola! Aquí tienes tu pase de invitado para el Weihnachtsmarkt (Stand #${invitacion.stand}). Confirma tu asistencia para recibir tu código QR de acceso: ${inviteUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const maxInvitados = rentalData?.max_invitados || 5;
  const invitaciones = rentalData?.invitaciones || [];
  const remainingInvites = maxInvitados - invitaciones.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-amber-300 text-xs font-semibold mb-3">
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.clientPortalTitle}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-serif">
          {t.clientPortalTitle}
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
          {t.clientPortalSubtitle}
        </p>
      </div>

      {/* Token Input Bar if no active rental yet */}
      {!rentalData && (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-950 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">
            {t.accessPortal}
          </h3>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed">
            {t.enterTokenInstructions}
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <input
              type="text"
              required
              placeholder={t.tokenPlaceholder}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.loading}</span>
                </>
              ) : (
                <span>{t.accessPortal}</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Active Rental Content */}
      {rentalData && (
        <div className="space-y-8">
          {/* Top Banner: Stand Info & Entry QR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stand Info Card */}
            <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      {t.yourStand}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white font-serif mt-0.5">
                      Stand #{rentalData.alquiler?.stand}
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {rentalData.alquiler?.estado || t.active}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs">
                  <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80">
                    <span className="text-stone-400 block mb-1">{t.clientName}</span>
                    <span className="text-white font-bold text-sm">
                      {rentalData.alquiler?.cliente}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80">
                    <span className="text-stone-400 block mb-1">{t.phone}</span>
                    <span className="text-white font-bold text-sm font-mono">
                      {rentalData.alquiler?.telefono}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80">
                    <span className="text-stone-400 block mb-1">{t.eventEdition}</span>
                    <span className="text-white font-semibold">
                      {rentalData.alquiler?.gestion || 'Weihnachtsmarkt'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80">
                    <span className="text-stone-400 block mb-1">{t.standCategory}</span>
                    <span className="text-amber-300 font-semibold">
                      {rentalData.alquiler?.categoria || rentalData.stand_info?.categoria || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>{t.dates}: 2026</span>
                <button
                  onClick={() => fetchRental(activeToken)}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-stone-300 hover:text-white"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{t.refreshData}</span>
                </button>
              </div>
            </div>

            {/* Personal Access QR Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-red-950/80 via-stone-900 to-stone-950 border border-red-900/50 shadow-xl text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.personalQRTitle}</span>
              </div>
              <p className="text-[11px] text-stone-300 mb-4 max-w-xs">
                {t.personalQRInstructions}
              </p>

              {/* QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-stone-200 inline-block mb-4">
                <QRCodeSVG
                  value={rentalData.qr_acceso || rentalData.alquiler?.qr_cliente || activeToken}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <span className="text-[11px] font-mono text-stone-400 bg-stone-950 px-3 py-1 rounded-full border border-stone-800">
                Pase Titular: #{rentalData.alquiler?.stand}
              </span>
            </div>
          </div>

          {/* Invitations Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
                    {t.invitationsTitle}
                  </h3>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {t.invitationsSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">{t.invitationsCount}</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {invitaciones.length} / {maxInvitados}
                  </span>
                </div>

                <button
                  onClick={handleCreateInvitation}
                  disabled={remainingInvites <= 0 || creatingInvite}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-semibold text-xs shadow-md transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creatingInvite ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{t.generateInvitation}</span>
                </button>
              </div>
            </div>

            {inviteError && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs">
                {inviteError}
              </div>
            )}

            {invitaciones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invitaciones.map((inv, idx) => {
                  const isRegistered =
                    inv.estado === 'registrado' || Boolean(inv.nombre_invitado);
                  const inviteUrl = getInvitationUrl(inv.token_invitacion);

                  return (
                    <div
                      key={inv.id || inv.token_invitacion || idx}
                      className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            Pase #{idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isRegistered
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            }`}
                          >
                            {isRegistered ? t.confirmed : t.pending}
                          </span>
                        </div>

                        <div className="mb-3">
                          <span className="text-[11px] text-stone-400 block">
                            {t.guestName}:
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {inv.nombre_invitado || t.notRegisteredYet}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => copyToClipboard(inviteUrl, inv.token_invitacion)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 transition active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            {copiedId === inv.token_invitacion ? t.copied : t.copy}
                          </span>
                        </button>

                        <button
                          onClick={() => shareViaWhatsApp(inv)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 text-xs border border-emerald-700/50 transition active:scale-95"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-stone-500 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{lang === 'de' ? 'Noch keine Einladungen erstellt.' : 'Aún no has generado pases de invitado.'}</p>
                <p className="mt-1">
                  {lang === 'de'
                    ? 'Klicken Sie auf den Button oben, um Ihren ersten Gästepass zu erstellen.'
                    : 'Haz clic en el botón de arriba para crear tu primera invitación.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
