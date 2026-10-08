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
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm text-gray-900">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t.adminLoginTitle}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {t.adminLoginSubtitle}
            </p>
          </div>

          {loginError && (
            <div className="p-3 mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t.username}
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="usuario"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t.password}
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 bg-white text-gray-900">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200 font-mono">
              {adminData?.configuracion?.GESTION_ACTIVA || 'GES-2026'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {t.navAdmin}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => sessionToken && loadAdminData(sessionToken, true)}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 text-xs border border-gray-300 transition active:scale-95 disabled:opacity-50 shadow-xs"
            title={t.refreshData}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-red-700' : ''}`} />
            <span>{t.refreshData}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-700 text-xs border border-gray-300 hover:border-red-200 transition active:scale-95"
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
          className={`p-3.5 mb-6 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Admin Module Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-red-700 text-white border-red-700 shadow-xs'
                  : 'bg-white text-gray-700 hover:text-red-700 hover:bg-gray-50 border-gray-200'
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
          <RefreshCw className="w-8 h-8 text-red-700 animate-spin mx-auto mb-3" />
          <p className="text-gray-700 text-xs font-semibold">{t.loading}</p>
        </div>
      )}

      {/* 1. DASHBOARD TAB */}
      {activeTab === 'dashboard' && adminData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                {t.statsStands}
              </span>
              <span className="text-2xl font-black text-gray-900 font-mono">{totalStands}</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-green-700 block mb-1">
                {t.statsAvailable}
              </span>
              <span className="text-2xl font-black text-green-700 font-mono">
                {disponibles}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-600 block mb-1">
                {t.statsOccupied}
              </span>
              <span className="text-2xl font-black text-gray-700 font-mono">{ocupados}</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-red-700 block mb-1">
                {t.statsPendingRequests}
              </span>
              <span className="text-2xl font-black text-red-700 font-mono">
                {solicitudesPendientes}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                {t.statsActiveRentals}
              </span>
              <span className="text-2xl font-black text-gray-900 font-mono">
                {alquileresActivos}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                {t.statsGuests}
              </span>
              <span className="text-2xl font-black text-gray-900 font-mono">
                {totalInvitados}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-red-700 block mb-1">
                {t.statsEntries}
              </span>
              <span className="text-2xl font-black text-red-700 font-mono">
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
            <h3 className="text-base font-bold text-gray-900">{t.tabStands}</h3>
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newStand}</span>
            </button>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">{t.standCategory}</th>
                    <th className="p-3">{t.standPrice}</th>
                    <th className="p-3">{t.standStatus}</th>
                    <th className="p-3">{t.standDescription}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.stands.map((stand) => (
                    <tr key={stand.id || stand.numero} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-bold font-mono text-gray-900">#{stand.numero}</td>
                      <td className="p-3">{stand.categoria}</td>
                      <td className="p-3 font-mono font-medium">
                        {stand.precio} {adminData.configuracion?.MONEDA || '$us'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            stand.estado === 'disponible'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {stand.estado}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-gray-500">
                        {stand.descripcion || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingStand(stand);
                            setStandModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition shadow-xs"
                          title={t.edit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {adminData.stands.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
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
          <h3 className="text-base font-bold text-gray-900">{t.tabRequests}</h3>
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.fullName}</th>
                    <th className="p-3">{t.phone}</th>
                    <th className="p-3">{t.requestDate}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.solicitudes.map((sol) => (
                    <tr key={sol.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono font-bold text-red-700">#{sol.stand}</td>
                      <td className="p-3 font-semibold text-gray-900">{sol.nombre}</td>
                      <td className="p-3 font-mono">{sol.telefono}</td>
                      <td className="p-3 text-gray-500">{sol.fecha || '-'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sol.estado === 'confirmada'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : sol.estado === 'rechazada'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                              className="p-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition shadow-xs"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleConfirmRental(sol)}
                              className="p-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white transition shadow-xs"
                              title={t.confirmRental}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(sol.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                              title={t.rejectRequest}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adminData.solicitudes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
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
          <h3 className="text-base font-bold text-gray-900">{t.tabRentals}</h3>
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.clientName}</th>
                    <th className="p-3">{t.phone}</th>
                    <th className="p-3">{t.rentalDate}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.alquileres.map((alq) => (
                    <tr key={alq.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono font-bold text-red-700">#{alq.stand}</td>
                      <td className="p-3 font-semibold text-gray-900">{alq.cliente}</td>
                      <td className="p-3 font-mono">{alq.telefono}</td>
                      <td className="p-3 text-gray-500">{alq.fecha_alquiler || '-'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            alq.estado === 'activo'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {alq.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyClientUrl(alq)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition text-[11px] shadow-xs"
                            title={t.copyClientLink}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedId === alq.id ? t.copied : t.clientLink}</span>
                          </button>
                          {alq.estado === 'activo' && (
                            <button
                              onClick={() => handleCancelRental(alq.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
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
                      <td colSpan={6} className="p-8 text-center text-gray-500">
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
          <h3 className="text-base font-bold text-gray-900">{t.tabGuests}</h3>
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.guestName}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3">{t.registeredOn}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.invitados.map((inv) => (
                    <tr key={inv.id || inv.token_invitacion} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono font-bold text-red-700">#{inv.stand}</td>
                      <td className="p-3 font-semibold text-gray-900">
                        {inv.nombre_invitado || t.notRegisteredYet}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.estado === 'registrado'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : inv.estado === 'revocado'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inv.estado}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{inv.fecha_registro || '-'}</td>
                      <td className="p-3 text-right">
                        {inv.estado !== 'revocado' && (
                          <button
                            onClick={() => handleRevokeGuest(inv.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition shadow-xs"
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
                      <td colSpan={5} className="p-8 text-center text-gray-500">
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
          <h3 className="text-base font-bold text-gray-900">{t.tabAccess}</h3>
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">{t.time}</th>
                    <th className="p-3">{t.fullName}</th>
                    <th className="p-3">Stand</th>
                    <th className="p-3">{t.actions}</th>
                    <th className="p-3">{t.scannedBy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.accesos.map((acc, idx) => (
                    <tr key={acc.id || idx} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono text-gray-500">{acc.fecha_hora}</td>
                      <td className="p-3 font-semibold text-gray-900">{acc.nombre}</td>
                      <td className="p-3 font-mono font-bold text-red-700">#{acc.stand}</td>
                      <td className="p-3 capitalize">{acc.tipo}</td>
                      <td className="p-3 text-gray-500">{acc.portero || 'Portería'}</td>
                    </tr>
                  ))}
                  {adminData.accesos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
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
            <h3 className="text-base font-bold text-gray-900">{t.tabUsers}</h3>
            <button
              onClick={() => setUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition active:scale-95 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.newUser}</span>
            </button>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">{t.username}</th>
                    <th className="p-3">{t.fullName}</th>
                    <th className="p-3">{t.userRole}</th>
                    <th className="p-3">{t.status}</th>
                    <th className="p-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.usuarios.map((u) => (
                    <tr key={u.usuario} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono font-bold text-gray-900">{u.usuario}</td>
                      <td className="p-3">{u.nombre}</td>
                      <td className="p-3 capitalize">{u.rol}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.estado === 'activo'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
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
                            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition shadow-xs"
                            title={t.changePassword}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition shadow-xs"
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
            <h3 className="text-base font-bold text-gray-900">{t.editionsTitle}</h3>
            <button
              onClick={() => setEditionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs transition active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newEdition}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminData.gestiones.map((gest) => (
              <div
                key={gest.id}
                className={`p-5 rounded-xl border transition ${
                  gest.activa
                    ? 'bg-red-50/50 border-red-300 shadow-xs'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-base font-bold text-gray-900 font-mono">{gest.nombre}</h4>
                  {gest.activa ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-700 text-white shadow-xs">
                      {t.activeBadge}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivateEdition(gest)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[11px] font-semibold transition active:scale-95 shadow-xs"
                    >
                      {t.activateEdition}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {lang === 'de' ? 'Erstellt am:' : 'Creada:'} {gest.fecha_creacion || '2026'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. CONFIGURACIÓN TAB */}
      {activeTab === 'config' && adminData && (
        <div className="max-w-3xl rounded-xl bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
            {t.eventSettingsTitle}
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t.eventName}
                </label>
                <input
                  type="text"
                  value={configForm.NOMBRE_EVENTO}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, NOMBRE_EVENTO: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t.whatsappAdmin}
                </label>
                <input
                  type="text"
                  value={configForm.WHATSAPP_ADMIN}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, WHATSAPP_ADMIN: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t.currency}
                </label>
                <input
                  type="text"
                  value={configForm.MONEDA}
                  onChange={(e) => setConfigForm({ ...configForm, MONEDA: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t.maxGuestsPerStand}
                </label>
                <input
                  type="number"
                  value={configForm.MAX_INVITADOS}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, MAX_INVITADOS: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t.whatsappTemplateEs}
              </label>
              <textarea
                rows={2}
                value={configForm.MENSAJE_WHATSAPP_ES}
                onChange={(e) =>
                  setConfigForm({ ...configForm, MENSAJE_WHATSAPP_ES: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {t.whatsappTemplateDe}
              </label>
              <textarea
                rows={2}
                value={configForm.MENSAJE_WHATSAPP_DE}
                onChange={(e) =>
                  setConfigForm({ ...configForm, MENSAJE_WHATSAPP_DE: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 text-gray-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {editingStand.id ? t.editStand : t.newStand}
              </h3>
              <button
                onClick={() => setStandModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStand} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.standNumber} *
                </label>
                <input
                  type="text"
                  required
                  value={editingStand.numero}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, numero: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.standCategory} *
                </label>
                <select
                  value={editingStand.categoria}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, categoria: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                >
                  <option value="Comida">{t.categoryComida}</option>
                  <option value="Artesanal">{t.categoryArtesanal}</option>
                  <option value="Games">{t.categoryGames}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.standPrice}
                </label>
                <input
                  type="number"
                  value={editingStand.precio}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, precio: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.standStatus}
                </label>
                <select
                  value={editingStand.estado}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, estado: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                >
                  <option value="disponible">{t.available}</option>
                  <option value="ocupado">{t.occupied}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.standDescription}
                </label>
                <input
                  type="text"
                  value={editingStand.descripcion || ''}
                  onChange={(e) =>
                    setEditingStand({ ...editingStand, descripcion: e.target.value })
                  }
                  placeholder="Detalles opcionales"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStandModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 text-gray-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">{t.newUser}</h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.username} *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.usuario}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, usuario: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.nombre}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.password} *
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.userRole} *
                </label>
                <select
                  value={newUserForm.rol}
                  onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                >
                  <option value="admin">{t.roleAdmin}</option>
                  <option value="portero">{t.roleGate}</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-gray-200 p-6 text-gray-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {t.changePassword} ({targetUserToChangePass})
              </h3>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.newPassword} *
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 text-gray-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">{t.newEdition}</h3>
              <button
                onClick={() => setEditionModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEdition} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 font-mono"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={newEditionForm.copiarStands}
                  onChange={(e) =>
                    setNewEditionForm({
                      ...newEditionForm,
                      copiarStands: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded border-gray-300 text-red-700 focus:ring-0"
                />
                <span>{t.copyPreviousStands}</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
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
