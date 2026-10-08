import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Gamepad2,
  Gift,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Store,
  Tag,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { translations } from '../../i18n/translations';
import { backendService } from '../../services/backend';
import { Configuracion, Idioma, Stand } from '../../types';

interface Props {
  config: Configuracion;
  stands: Stand[];
  lang: Idioma;
  loading: boolean;
  onRefresh: () => void;
}

export const PublicView: React.FC<Props> = ({
  config,
  stands,
  lang,
  loading,
  onRefresh,
}) => {
  const t = translations[lang];

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedStandToRequest, setSelectedStandToRequest] = useState<Stand | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<string>('Comida');
  const [formStandNumero, setFormStandNumero] = useState<string>('');
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    stand: string;
    categoria: string;
    nombre: string;
    whatsappUrl: string;
  } | null>(null);

  // Available categories
  const categories = [
    { id: 'all', label: t.categoryAll, icon: Sparkles },
    { id: 'Comida', label: t.categoryComida, icon: UtensilsCrossed },
    { id: 'Artesanal', label: t.categoryArtesanal, icon: Gift },
    { id: 'Games', label: t.categoryGames, icon: Gamepad2 },
  ];

  // Filter stands
  const filteredStands = stands.filter((s) => {
    const matchesCat =
      selectedCategory === 'all' ||
      s.categoria?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      String(s.numero).toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const availableStandsForCategory = stands.filter(
    (s) =>
      s.categoria?.toLowerCase() === formCategory.toLowerCase() &&
      s.estado === 'disponible'
  );

  const handleOpenRequest = (stand?: Stand) => {
    setSubmitError(null);
    setSubmittedData(null);
    if (stand) {
      setSelectedStandToRequest(stand);
      setFormCategory(stand.categoria || 'Comida');
      setFormStandNumero(String(stand.numero));
    } else {
      setSelectedStandToRequest(null);
      setFormStandNumero('');
    }
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStandNumero || !formNombre || !formTelefono) {
      setSubmitError(
        lang === 'de'
          ? 'Bitte füllen Sie alle erforderlichen Felder aus.'
          : 'Por favor completa todos los campos requeridos.'
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await backendService.submitSolicitud({
        stand: formStandNumero,
        categoria: formCategory,
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
      });

      if (!res.ok) {
        throw new Error(res.error || 'No se pudo registrar la solicitud');
      }

      // Generate WhatsApp link
      const template =
        lang === 'de' ? config.MENSAJE_WHATSAPP_DE : config.MENSAJE_WHATSAPP_ES;
      const message = (template || 'Hola, solicité el stand {STAND} {CATEGORIA}')
        .replace('{NOMBRE}', formNombre.trim())
        .replace('{STAND}', formStandNumero)
        .replace('{CATEGORIA}', formCategory);

      const cleanPhone = (config.WHATSAPP_ADMIN || '75593587').replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`;

      setSubmittedData({
        stand: formStandNumero,
        categoria: formCategory,
        nombre: formNombre.trim(),
        whatsappUrl,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Error al enviar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 pt-8 pb-14 px-4 sm:px-6 border-b border-red-950/40">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#C41E3A_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-800/60 text-amber-300 text-xs font-semibold mb-4 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{config.NOMBRE_EVENTO || 'Weihnachtsmarkt'}</span>
            <span className="text-red-400">•</span>
            <span className="text-stone-300">{config.GESTION_ACTIVA || 'GES-2026'}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4">
            {lang === 'de' ? 'Der Zauber des' : 'La Magia del'}{' '}
            <span className="bg-gradient-to-r from-red-500 via-amber-300 to-red-400 bg-clip-text text-transparent">
              {config.NOMBRE_EVENTO || 'Weihnachtsmarkt'}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-stone-300 text-sm sm:text-base leading-relaxed mb-8">
            {lang === 'de'
              ? 'Genießen Sie traditionelle Gastronomie, exklusives Kunsthandwerk und festliche Unterhaltung. Mieten Sie jetzt Ihren Stand oder entdecken Sie unsere Aussteller.'
              : 'Disfruta de la mejor gastronomía navideña, artesanías exclusivas y entretenimiento festivo. Alquila tu stand o descubre los espacios disponibles para este año.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleOpenRequest()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-red-700 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-red-950/60 hover:scale-[1.02] active:scale-95 transition"
            >
              <Store className="w-4 h-4 text-amber-300" />
              {t.requestStand}
            </button>

            <a
              href="#stands-section"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-700 font-semibold text-sm transition"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              {t.standsMap}
            </a>
          </div>
        </div>
      </section>

      {/* Stands Section */}
      <section id="stands-section" className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-stone-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
                {t.standsMap}
              </h2>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm mt-1">
              {t.standsMapSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 transition active:scale-95 disabled:opacity-50"
              title={t.refreshData}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{t.refreshData}</span>
            </button>

            <button
              onClick={() => handleOpenRequest()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-950/40 transition active:scale-95"
            >
              <Store className="w-3.5 h-3.5 text-amber-300" />
              {t.requestStand}
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                      : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Stands Grid or Provisional Category View */}
        {loading && stands.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-stone-900/40 border border-stone-800">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-stone-300 text-sm font-medium">{t.loading}</p>
            <p className="text-stone-500 text-xs mt-1">{t.loadingDetails}</p>
          </div>
        ) : filteredStands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStands.map((stand) => {
              const isAvailable = stand.estado === 'disponible';
              return (
                <div
                  key={stand.id || stand.numero}
                  className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                    isAvailable
                      ? 'bg-stone-900/80 border-stone-800 hover:border-amber-500/50 shadow-md'
                      : 'bg-stone-950/60 border-stone-900 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isAvailable
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-red-950 text-red-300 border border-red-800/60'
                          }`}
                        >
                          #{stand.numero}
                        </div>
                        <span className="text-xs font-semibold text-stone-300">
                          {stand.categoria}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAvailable
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {isAvailable ? t.available : t.occupied}
                      </span>
                    </div>

                    {stand.descripcion && (
                      <p className="text-xs text-stone-400 mb-4 line-clamp-2">
                        {stand.descripcion}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-stone-300 mb-4 font-mono font-medium">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {stand.precio ? `${stand.precio} ${config.MONEDA || '$us'}` : 'Consultar'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isAvailable ? (
                      <button
                        onClick={() => handleOpenRequest(stand)}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xs transition active:scale-95 shadow-sm"
                      >
                        {t.requestStand}
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs text-stone-500 font-medium">
                        {t.occupied}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Provisional category view if no stands configured yet */
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-stone-900/40 border border-stone-800/80">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-serif">
              {t.noStandsAvailable}
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
              {lang === 'de'
                ? 'Die Stände für diese Ausgabe werden derzeit vom Organisationsteam vorbereitet. Sie können sich jedoch bereits jetzt über das Formular vormerken lassen.'
                : 'La organización está preparando la distribución de stands para esta gestión. Puedes enviar una solicitud previa seleccionando la categoría deseada.'}
            </p>

            {/* Category Cards preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6 text-left">
              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>{t.categoryComida}</span>
                </div>
                <p className="text-xs text-stone-400">
                  {lang === 'de'
                    ? 'Glühwein, Würstchen, Lebkuchen und traditionelle Speisen.'
                    : 'Gastronomía típica alemana, repostería, bebidas calientes y delicias navideñas.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-sm">
                  <Gift className="w-4 h-4" />
                  <span>{t.categoryArtesanal}</span>
                </div>
                <p className="text-xs text-stone-400">
                  {lang === 'de'
                    ? 'Handgemachte Deko, Holzspielzeug, Kerzen und Geschenke.'
                    : 'Artesanías talladas, adornos navideños hechos a mano y regalos exclusivos.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-sm">
                  <Gamepad2 className="w-4 h-4" />
                  <span>{t.categoryGames}</span>
                </div>
                <p className="text-xs text-stone-400">
                  {lang === 'de'
                    ? 'Spiele, Karussell, Schießbude und Spaß für die ganze Familie.'
                    : 'Atracciones interactivas, juegos tradicionales y diversión familiar.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenRequest()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <Store className="w-4 h-4 text-amber-300" />
              {t.requestStand}
            </button>
          </div>
        )}
      </section>

      {/* Event Info Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border border-stone-800 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
              {t.eventInfoTitle}
            </h3>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm mb-6">
            {t.eventInfoSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                <span>{t.eventEdition}</span>
              </div>
              <p className="text-stone-200 font-semibold text-sm">
                {config.GESTION_ACTIVA || 'GES-2026'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Tag className="w-4 h-4" />
                <span>{t.currency}</span>
              </div>
              <p className="text-stone-200 font-semibold text-sm">
                {config.MONEDA || '$us'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Phone className="w-4 h-4" />
                <span>{t.contactAdmin}</span>
              </div>
              <p className="text-stone-200 font-semibold text-sm font-mono">
                {config.WHATSAPP_ADMIN || '75593587'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>{t.maxGuestsPerStand}</span>
              </div>
              <p className="text-stone-200 font-semibold text-sm">
                {config.MAX_INVITADOS || '5'} {lang === 'de' ? 'Pässe' : 'pases'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stand Rental Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-700 p-6 sm:p-8 shadow-2xl text-stone-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                  {t.requestModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submittedData ? (
              /* Success State */
              <div className="mt-6 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">
                  {t.requestSuccessTitle}
                </h4>
                <p className="text-xs sm:text-sm text-stone-300 mb-6 leading-relaxed">
                  {t.requestSuccessText}
                </p>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 mb-6 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-400">{t.standNumber}:</span>
                    <span className="font-bold text-white">#{submittedData.stand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">{t.standCategory}:</span>
                    <span className="text-stone-200">{submittedData.categoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">{t.fullName}:</span>
                    <span className="text-stone-200">{submittedData.nombre}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={submittedData.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t.openWhatsApp}
                  </a>

                  <button
                    onClick={() => {
                      setRequestModalOpen(false);
                      setSubmittedData(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmitRequest} className="mt-6 space-y-4">
                <p className="text-xs text-stone-400 leading-relaxed mb-4">
                  {t.requestInstructions}
                </p>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs">
                    {submitError}
                  </div>
                )}

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    {t.selectCategory} *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      setFormStandNumero('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Comida">{t.categoryComida}</option>
                    <option value="Artesanal">{t.categoryArtesanal}</option>
                    <option value="Games">{t.categoryGames}</option>
                  </select>
                </div>

                {/* Stand Selection */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    {t.selectStand} *
                  </label>
                  {availableStandsForCategory.length > 0 ? (
                    <select
                      value={formStandNumero}
                      onChange={(e) => setFormStandNumero(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- {t.selectStand} --</option>
                      {availableStandsForCategory.map((s) => (
                        <option key={s.numero} value={String(s.numero)}>
                          Stand #{s.numero} {s.precio ? `(${s.precio} ${config.MONEDA})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Ej. Stand 1"
                        value={formStandNumero}
                        onChange={(e) => setFormStandNumero(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[11px] text-amber-400/80 mt-1">
                        {lang === 'de'
                          ? 'Aktuell keine Stände in der Liste. Sie können die gewünschte Standnummer direkt angeben.'
                          : 'No hay stands automáticos cargados aún. Puedes escribir el número de stand deseado.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Client Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.fullNamePlaceholder}
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    {t.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder={t.phonePlaceholder}
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.sending}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t.sendRequest}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
