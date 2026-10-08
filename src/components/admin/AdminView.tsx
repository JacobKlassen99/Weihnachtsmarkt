import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Store,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { translations } from '../../i18n/translations';
import { backendService } from '../../services/backend';
import {
  Acceso,
  AdminData,
  Alquiler,
  Configuracion,
  Gestion,
  Idioma,
  Invitado,
  Solicitud,
  Stand,
  Usuario,
} from '../../types';

interface Props {
  sessionToken: string | null;
  onLoginSuccess: (token: string, user: Usuario) => void;
  onLogout: () => void;
  lang: Idioma;
  onHasUnsavedChange?: (hasUnsaved: boolean) => void;
}

type AdminTab =
  | 'dashboard'
  | 'stands'
  | 'solicitudes'
  | 'alquileres'
  | 'invitados'
  | 'accesos'
  | 'usuarios'
  | 'gestiones'
  | 'config';

export const AdminView: React.FC<Props> = ({
  sessionToken,
  onLoginSuccess,
  onLogout,
  lang,
  onHasUnsavedChange,
}) => {
  const t = translations[lang];

  // Auth state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Admin Data state
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Stand Editor Modal
  const [standModalOpen, setStandModalOpen] = useState(false);
  const [editingStand, setEditingStand] = useState<Partial<Stand>>({
    numero: '',
    categoria: 'Comida',
    precio: '100',
    estado: 'disponible',
    descripcion: '',
  });

  // User Editor Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    usuario: '',
    nombre: '',
    password: '',
    rol: 'admin',
  });

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetUserToChangePass, setTargetUserToChangePass] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // New Edition Modal
  const [editionModalOpen, setEditionModalOpen] = useState(false);
  const [newEditionForm, setNewEditionForm] = useState({
    nombre: '',
    copiarStands: true,
  });

  // Config Form State
  const [configForm, setConfigForm] = useState<Configuracion>({
    NOMBRE_EVENTO: 'Weihnachtsmarkt',
    IDIOMA_PREDETERMINADO: 'es',
    WHATSAPP_ADMIN: '75593587',
    MONEDA: '$us',
    MAX_INVITADOS: '5',
    GESTION_ACTIVA: 'GES-2026',
    MENSAJE_WHATSAPP_ES: '',
    MENSAJE_WHATSAPP_DE: '',
  });

  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Admin Data
  const loadAdminData = async (token: string, force = false) => {
    setLoadingData(true);
    setDataError(null);
    try {
      const data = await backendService.getAdminData(token, force);
      setAdminData(data);
      if (data.configuracion) {
        setConfigForm(data.configuracion);
      }
    } catch (err: any) {
      if (err.message?.includes('Sesion expirada') || err.message?.includes('expirada')) {
        onLogout();
      }
      setDataError(err.message || 'Error al cargar datos administrativos');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (sessionToken) {
      loadAdminData(sessionToken);
    }
  }, [sessionToken]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput) return;

    setLoggingIn(true);
    setLoginError(null);

    try {
      // Do NOT modify or trim password. Send exact password entered.
      const res = await backendService.login(usernameInput.trim(), passwordInput);

      if (!res.ok) {
        throw new Error(res.error || (lang === 'de' ? 'Anmeldung fehlgeschlagen' : 'Inicio de sesión rechazado por el servidor'));
      }

      // Read data.token and data.rol from backend response {ok:true, data:{token, usuario, rol, nombre}}
      const token = res.data?.token || res.token;
      if (!token) {
        throw new Error(res.error || (lang === 'de' ? 'Kein Sitzungstoken erhalten' : 'La respuesta del servidor no incluyó el token de sesión'));
      }

      const rol = res.data?.rol || (typeof res.usuario === 'object' ? res.usuario.rol : res.rol) || 'admin';
      const usuarioNombre = res.data?.usuario || (typeof res.usuario === 'object' ? res.usuario.usuario : res.usuario) || usernameInput.trim();
      const nombreCompleto = res.data?.nombre || (typeof res.usuario === 'object' ? res.usuario.nombre : res.nombre) || usuarioNombre;

      const user: Usuario = {
        usuario: usuarioNombre,
        nombre: nombreCompleto,
        rol: rol,
        estado: 'activo',
      };

      onLoginSuccess(token, user);
      loadAdminData(token);
    } catch (err: any) {
      // Display the REAL error message without revealing passwords or tokens
      setLoginError(err.message || (lang === 'de' ? 'Verbindungsfehler zum Server' : 'Error de conexión con el servidor'));
    } finally {
      setLoggingIn(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Actions
  const handleSaveStand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !editingStand.numero) return;

    try {
      const res = await backendService.saveStand(sessionToken, editingStand);
      if (!res.ok) throw new Error(res.error || 'Error al guardar stand');
      showFeedback('Stand guardado con éxito');
      setStandModalOpen(false);
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleConfirmRental = async (solicitud: Solicitud) => {
    if (!sessionToken) return;
    const confirmMsg = t.confirmRentalPrompt.replace('{name}', solicitud.nombre);
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await backendService.confirmarAlquiler(sessionToken, solicitud.id);
      if (!res.ok) throw new Error(res.error || 'Error al confirmar alquiler');
      showFeedback('Alquiler confirmado con éxito');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleRejectRequest = async (solicitudId: string) => {
    if (!sessionToken) return;
    if (!window.confirm(t.rejectRequestPrompt)) return;

    try {
      const res = await backendService.rechazarSolicitud(sessionToken, solicitudId);
      if (!res.ok) throw new Error(res.error || 'Error al rechazar solicitud');
      showFeedback('Solicitud rechazada');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCancelRental = async (alquilerId: string) => {
    if (!sessionToken) return;
    if (!window.confirm(t.cancelRentalPrompt)) return;

    try {
      const res = await backendService.cancelarAlquiler(sessionToken, alquilerId);
      if (!res.ok) throw new Error(res.error || 'Error al cancelar alquiler');
      showFeedback('Alquiler cancelado');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleRevokeGuest = async (invitadoId: string) => {
    if (!sessionToken) return;
    if (!window.confirm(t.revokePrompt)) return;

    try {
      const res = await backendService.revocarInvitado(sessionToken, invitadoId);
      if (!res.ok) throw new Error(res.error || 'Error al revocar invitado');
      showFeedback('Invitación revocada');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    try {
      const res = await backendService.crearUsuario(sessionToken, newUserForm);
      if (!res.ok) throw new Error(res.error || 'Error al crear usuario');
      showFeedback('Usuario creado con éxito');
      setUserModalOpen(false);
      setNewUserForm({ usuario: '', nombre: '', password: '', rol: 'admin' });
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !targetUserToChangePass || !newPasswordValue.trim()) return;

    try {
      const res = await backendService.cambiarPassword(
        sessionToken,
        targetUserToChangePass,
        newPasswordValue.trim()
      );
      if (!res.ok) throw new Error(res.error || 'Error al cambiar contraseña');
      showFeedback('Contraseña actualizada con éxito');
      setPasswordModalOpen(false);
      setNewPasswordValue('');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleToggleUserStatus = async (user: Usuario) => {
    if (!sessionToken) return;
    const newStatus = user.estado === 'activo' ? 'inactivo' : 'activo';

    try {
      const res = await backendService.cambiarEstadoUsuario(
        sessionToken,
        user.usuario,
        newStatus
      );
      if (!res.ok) throw new Error(res.error || 'Error al cambiar estado');
      showFeedback('Estado de usuario modificado');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCreateEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !newEditionForm.nombre.trim()) return;

    try {
      const res = await backendService.nuevaGestion(sessionToken, newEditionForm);
      if (!res.ok) throw new Error(res.error || 'Error al crear gestión');
      showFeedback('Nueva gestión creada');
      setEditionModalOpen(false);
      setNewEditionForm({ nombre: '', copiarStands: true });
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleActivateEdition = async (gestion: Gestion) => {
    if (!sessionToken) return;
    const msg = t.activatePrompt.replace('{name}', gestion.nombre);
    if (!window.confirm(msg)) return;

    try {
      const res = await backendService.activarGestion(sessionToken, gestion.id);
      if (!res.ok) throw new Error(res.error || 'Error al activar gestión');
      showFeedback('Gestión activada con éxito');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;

    setSavingConfig(true);
    try {
      const res = await backendService.setConfig(sessionToken, configForm);
      if (!res.ok) throw new Error(res.error || 'Error al guardar configuración');
      showFeedback('Configuración guardada con éxito');
      loadAdminData(sessionToken, true);
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const copyClientUrl = (alquiler: Alquiler) => {
    const origin = window.location.origin;
    const url = `${origin}/#cliente?token=${encodeURIComponent(alquiler.token_cliente)}`;
    navigator.clipboard.writeText(url);
    setCopiedId(alquiler.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // If NOT logged in, show Login Form
  if (!sessionToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-8 shadow-2xl text-stone-100">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-800/80 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
              {t.adminLoginTitle}
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              {t.adminLoginSubtitle}
            </p>
          </div>

          {loginError && (
            <div className="p-3 mb-5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                {t.username}
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="usuario"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                {t.password}
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.loggingIn}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.loginButton}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Panel Layout
  const tabs = [
    { id: 'dashboard', label: t.tabDashboard, icon: LayoutDashboard },
    { id: 'stands', label: t.tabStands, icon: Store },
    { id: 'solicitudes', label: t.tabRequests, icon: Clock },
    { id: 'alquileres', label: t.tabRentals, icon: KeyRound },
    { id: 'invitados', label: t.tabGuests, icon: Users },
    { id: 'accesos', label: t.tabAccess, icon: ShieldCheck },
    { id: 'usuarios', label: t.tabUsers, icon: UserCheck },
    { id: 'gestiones', label: t.tabEditions, icon: Calendar },
    { id: 'config', label: t.tabSettings, icon: Settings },
  ] as const;

  // Stats calculation
  const totalStands = adminData?.stands?.length || 0;
  const disponibles = adminData?.stands?.filter((s) => s.estado === 'disponible').length || 0;
  const ocupados = adminData?.stands?.filter((s) => s.estado === 'ocupado').length || 0;
  const solicitudesPendientes =
    adminData?.solicitudes?.filter((s) => s.estado === 'pendiente').length || 0;
  const alquileresActivos =
    adminData?.alquileres?.filter((a) => a.estado === 'activo').length || 0;
  const totalInvitados = adminData?.invitados?.length || 0;
  const totalAccesos = adminData?.accesos?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {adminData?.configuracion?.GESTION_ACTIVA || 'GES-2026'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              {t.navAdmin}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => sessionToken && loadAdminData(sessionToken, true)}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs border border-stone-800 transition active:scale-95 disabled:opacity-50"
            title={t.refreshData}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-amber-400' : ''}`} />
            <span>{t.refreshData}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 text-red-300 text-xs border border-red-800/60 transition active:scale-95"
            title={t.logout}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3.5 mb-6 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
              : 'bg-red-950 border-red-700 text-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Admin Module Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-stone-800/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-850 border border-stone-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Bar */}
      {loadingData && !adminData && (
        <div className="text-center py-16">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-stone-300 text-xs font-semibold">{t.loading}</p>
        </div>
      )}

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && adminData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                {t.statsStands}
              </span>
              <span className="text-2xl font-black text-white font-mono">{totalStands}</span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                {t.statsAvailable}
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {disponibles}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                {t.statsOccupied}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">{ocupados}</span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
              <span className="text-[11px] font-semibold text-red-400 block mb-1">
                {t.statsPendingRequests}
              </span>
              <span className="text-2xl font-black text-red-400 font-mono">
                {solicitudesPendientes}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                {t.statsActiveRentals}
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {alquileresActivos}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                {t.statsGuests}
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {totalInvitados}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-sky-400 block mb-1">
                {t.statsEntries}
              </span>
              <span className="text-2xl font-black text-sky-400 font-mono">
                {totalAccesos}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. STANDS TAB */}
      {activeTab === 'stands' && adminData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-serif">{t.tabStands}</h3>
            <button
              onClick={() => {
                setEditingStand({
                  numero: '',
                  categoria: 'Comida',
                  precio: '100',
                  estado: 'disponible',
                  descripcion: '',
                });
                setStandModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newStand}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">{t.standCategory}</th>
                    <th className="p-3">{t.standPrice}</th>
                    <th className="p-3">{t.standStatus}</th>
                    <th className="p-3">{t.standDescription}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {adminData.stands.map((stand) => (
                    <tr key={stand.id || stand.numero} className="hover:bg-stone-850">
                      <td className="p-3 font-bold font-mono text-white">#{stand.numero}</td>
                      <td className="p-3">{stand.categoria}</td>
                      <td className="p-3 font-mono">
                        {stand.precio} {adminData.configuracion?.MONEDA || '$us'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            stand.estado === 'disponible'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : 'bg-red-950 text-red-300 border border-red-800/50'
                          }`}
                        >
                          {stand.estado}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-stone-400">
                        {stand.descripcion || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingStand(stand);
                            setStandModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
                          title={t.edit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {adminData.stands.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500">
                        {t.noStandsAvailable}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SOLICITUDES TAB */}
      {activeTab === 'solicitudes' && adminData && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white font-serif">{t.tabRequests}</h3>
          <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.fullName}</th>
                    <th className="p-3">{t.phone}</th>
                    <th className="p-3">{t.requestDate}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {adminData.solicitudes.map((sol) => (
                    <tr key={sol.id} className="hover:bg-stone-850">
                      <td className="p-3 font-mono font-bold text-amber-400">#{sol.stand}</td>
                      <td className="p-3 font-semibold text-white">{sol.nombre}</td>
                      <td className="p-3 font-mono">{sol.telefono}</td>
                      <td className="p-3 text-stone-400">{sol.fecha || '-'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sol.estado === 'confirmada'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : sol.estado === 'rechazada'
                              ? 'bg-stone-800 text-stone-400'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          }`}
                        >
                          {sol.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {sol.estado === 'pendiente' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/${sol.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 transition"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleConfirmRental(sol)}
                              className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition"
                              title={t.confirmRental}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(sol.id)}
                              className="p-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-red-200 transition"
                              title={t.rejectRequest}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adminData.solicitudes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500">
                        {lang === 'de' ? 'Keine Anfragen vorhanden.' : 'No hay solicitudes registradas.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ALQUILERES TAB */}
      {activeTab === 'alquileres' && adminData && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white font-serif">{t.tabRentals}</h3>
          <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.clientName}</th>
                    <th className="p-3">{t.phone}</th>
                    <th className="p-3">{t.rentalDate}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {adminData.alquileres.map((alq) => (
                    <tr key={alq.id} className="hover:bg-stone-850">
                      <td className="p-3 font-mono font-bold text-amber-400">#{alq.stand}</td>
                      <td className="p-3 font-semibold text-white">{alq.cliente}</td>
                      <td className="p-3 font-mono">{alq.telefono}</td>
                      <td className="p-3 text-stone-400">{alq.fecha_alquiler || '-'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            alq.estado === 'activo'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : 'bg-red-950 text-red-300 border border-red-800/50'
                          }`}
                        >
                          {alq.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyClientUrl(alq)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition text-[11px]"
                            title={t.copyClientLink}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedId === alq.id ? t.copied : t.clientLink}</span>
                          </button>
                          {alq.estado === 'activo' && (
                            <button
                              onClick={() => handleCancelRental(alq.id)}
                              className="p-1.5 rounded-lg bg-red-950 text-red-300 border border-red-800/60 hover:bg-red-900 transition"
                              title={t.cancelRental}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {adminData.alquileres.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500">
                        {lang === 'de' ? 'Keine Mietverträge vorhanden.' : 'No hay alquileres confirmados aún.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. INVITADOS TAB */}
      {activeTab === 'invitados' && adminData && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white font-serif">{t.tabGuests}</h3>
          <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.guestName}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3">{t.registeredOn}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {adminData.invitados.map((inv) => (
                    <tr key={inv.id || inv.token_invitacion} className="hover:bg-stone-850">
                      <td className="p-3 font-mono font-bold text-amber-400">#{inv.stand}</td>
                      <td className="p-3 font-semibold text-white">
                        {inv.nombre_invitado || t.notRegisteredYet}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.estado === 'registrado'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : inv.estado === 'revocado'
                              ? 'bg-red-950 text-red-300 border border-red-800/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          }`}
                        >
                          {inv.estado}
                        </span>
                      </td>
                      <td className="p-3 text-stone-400">{inv.fecha_registro || '-'}</td>
                      <td className="p-3 text-right">
                        {inv.estado !== 'revocado' && (
                          <button
                            onClick={() => handleRevokeGuest(inv.id)}
                            className="p-1.5 rounded-lg bg-red-950 text-red-300 border border-red-800/60 hover:bg-red-900 transition"
                            title={t.revokeInvitation}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adminData.invitados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-500">
                        {lang === 'de' ? 'Keine Gäste registriert.' : 'No hay invitados registrados aún.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. ACCESOS TAB */}
      {activeTab === 'accesos' && adminData && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white font-serif">{t.tabAccess}</h3>
          <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3">{t.time}</th>
                    <th className="p-3">{t.fullName}</th>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.actions}</th>
                    <th className="p-3">{t.scannedBy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {adminData.accesos.map((acc, idx) => (
                    <tr key={acc.id || idx} className="hover:bg-stone-850">
                      <td className="p-3 font-mono text-stone-400">{acc.fecha_hora}</td>
                      <td className="p-3 font-semibold text-white">{acc.nombre}</td>
                      <td className="p-3 font-mono text-amber-400">#{acc.stand}</td>
                      <td className="p-3 capitalize">{acc.tipo}</td>
                      <td className="p-3 text-stone-400">{acc.portero || 'Portería'}</td>
                    </tr>
                  ))}
                  {adminData.accesos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-500">
                        {lang === 'de' ? 'Noch keine Scans protokolliert.' : 'No hay entradas escaneadas registradas aún.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. USUARIOS TAB */}
      {activeTab === 'usuarios' && adminData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-serif">{t.tabUsers}</h3>
            <button
              onClick={() => setUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition active:scale-95 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.newUser}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="p-3">{t.username}</th>
                    <th className="p-3">{t.fullName}</th>
                    <th className="p-3">{t.userRole}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {adminData.usuarios.map((u) => (
                    <tr key={u.usuario} className="hover:bg-stone-850">
                      <td className="p-3 font-mono font-bold text-white">{u.usuario}</td>
                      <td className="p-3">{u.nombre}</td>
                      <td className="p-3 capitalize">{u.rol}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.estado === 'activo'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setTargetUserToChangePass(u.usuario);
                              setPasswordModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                            title={t.changePassword}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                            title={t.toggleStatus}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. GESTIONES TAB */}
      {activeTab === 'gestiones' && adminData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-serif">{t.editionsTitle}</h3>
            <button
              onClick={() => setEditionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newEdition}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminData.gestiones.map((gest) => (
              <div
                key={gest.id}
                className={`p-5 rounded-2xl border transition ${
                  gest.activa
                    ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/30'
                    : 'bg-stone-900 border-stone-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-base font-bold text-white font-mono">{gest.nombre}</h4>
                  {gest.activa ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-stone-950 shadow-sm">
                      {t.activeBadge}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivateEdition(gest)}
                      className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition active:scale-95"
                    >
                      {t.activateEdition}
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-400">
                  {lang === 'de' ? 'Erstellt am:' : 'Creada:'} {gest.fecha_creacion || '2026'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. CONFIGURACIÓN TAB */}
      {activeTab === 'config' && adminData && (
        <div className="max-w-3xl rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-8 shadow-xl">
          <h3 className="text-base font-bold text-white font-serif mb-6 pb-3 border-b border-stone-800">
            {t.eventSettingsTitle}
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.eventName}
                </label>
                <input
                  type="text"
                  value={configForm.NOMBRE_EVENTO}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, NOMBRE_EVENTO: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.whatsappAdmin}
                </label>
                <input
                  type="text"
                  value={configForm.WHATSAPP_ADMIN}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, WHATSAPP_ADMIN: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.currency}
                </label>
                <input
                  type="text"
                  value={configForm.MONEDA}
                  onChange={(e) => setConfigForm({ ...configForm, MONEDA: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.maxGuestsPerStand}
                </label>
                <input
                  type="number"
                  value={configForm.MAX_INVITADOS}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, MAX_INVITADOS: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                {t.whatsappTemplateEs}
              </label>
              <textarea
                rows={2}
                value={configForm.MENSAJE_WHATSAPP_ES}
                onChange={(e) =>
                  setConfigForm({ ...configForm, MENSAJE_WHATSAPP_ES: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                {t.whatsappTemplateDe}
              </label>
              <textarea
                rows={2}
                value={configForm.MENSAJE_WHATSAPP_DE}
                onChange={(e) =>
                  setConfigForm({ ...configForm, MENSAJE_WHATSAPP_DE: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {savingConfig ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{t.saveSettings}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Stand Editor */}
      {standModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white font-serif">
                {editingStand.id ? t.editStand : t.newStand}
              </h3>
              <button
                onClick={() => setStandModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStand} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.standNumber} *
                </label>
                <input
                  type="text"
                  required
                  value={editingStand.numero}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, numero: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.standCategory} *
                </label>
                <select
                  value={editingStand.categoria}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, categoria: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Comida">{t.categoryComida}</option>
                  <option value="Artesanal">{t.categoryArtesanal}</option>
                  <option value="Games">{t.categoryGames}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.standPrice}
                </label>
                <input
                  type="number"
                  value={editingStand.precio}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, precio: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.standStatus}
                </label>
                <select
                  value={editingStand.estado}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, estado: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="disponible">{t.available}</option>
                  <option value="ocupado">{t.occupied}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.standDescription}
                </label>
                <input
                  type="text"
                  value={editingStand.descripcion || ''}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, descripcion: e.target.value })
                  }
                  placeholder="Detalles opcionales"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStandModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: User Editor */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white font-serif">{t.newUser}</h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.username} *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.usuario}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, usuario: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.nombre}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.password} *
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.userRole} *
                </label>
                <select
                  value={newUserForm.rol}
                  onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="admin">{t.roleAdmin}</option>
                  <option value="portero">{t.roleGate}</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-md"
                >
                  {t.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Change Password */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white font-serif">
                {t.changePassword} ({targetUserToChangePass})
              </h3>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.newPassword} *
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Edition */}
      {editionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-stone-700 p-6 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white font-serif">{t.newEdition}</h3>
              <button
                onClick={() => setEditionModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEdition} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.editionName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="GES-2027"
                  value={newEditionForm.nombre}
                  onChange={(e) =>
                    setNewEditionForm({ ...newEditionForm, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={newEditionForm.copiarStands}
                  onChange={(e) =>
                    setNewEditionForm({
                      ...newEditionForm,
                      copiarStands: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded border-stone-700 text-red-700 focus:ring-0"
                />
                <span>{t.copyPreviousStands}</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-md"
                >
                  {t.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
