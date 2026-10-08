import {
  AdminData,
  Configuracion,
  InvitacionInfo,
  LoginResponse,
  MiAlquilerData,
  PublicData,
  ScanResult,
  Stand,
  Usuario,
} from '../types';

export const BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbzPYXuXu8FSvtmRVaDywv8OxsDZZX45WfxpNBoPmdF29cnezThtfv2bxRxoELdTjUSz/exec';

// Proxy endpoint for Netlify and Vite development server
export const PROXY_URL = '/api/backend';

// Temporal in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class BackendService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL_MS = 30000; // 30 seconds cache

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  public invalidateCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Helper to execute a POST request to Google Apps Script.
   * Tries the local proxy / Netlify function first (avoiding CORS and redirect issues),
   * and falls back to direct Google Apps Script request if proxy is not reachable.
   */
  private async postRequest<T>(payload: Record<string, unknown>): Promise<T> {
    const bodyStr = JSON.stringify(payload);

    // 1. Try via proxy (/api/backend or Netlify function)
    try {
      const proxyResponse = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyStr,
      });

      if (proxyResponse.ok) {
        const text = await proxyResponse.text();
        try {
          const parsed = JSON.parse(text);
          return parsed as T;
        } catch {
          // If not valid JSON, check for HTML error
          if (text.includes('<title>') || text.includes('<!DOCTYPE')) {
            const match = text.match(/<title>(.*?)<\/title>/i);
            throw new Error(`El servidor respondió con HTML (${match ? match[1] : 'Error'}).`);
          }
        }
      }
    } catch {
      // If proxy fetch failed (e.g. 404 or network issue), fall through to direct fetch
    }

    // 2. Direct fetch to Google Apps Script as fallback
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: bodyStr,
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(
          `Error en el servidor (${response.status}: ${response.statusText || 'Sin respuesta'})`
        );
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        if (text.includes('<title>') || text.includes('<!DOCTYPE') || text.includes('<html')) {
          const match = text.match(/<title>(.*?)<\/title>/i);
          const pageTitle = match ? match[1].trim() : 'Página HTML';
          throw new Error(`El servidor respondió con HTML en lugar de JSON (${pageTitle}).`);
        }
        throw new Error(`Respuesta no válida del servidor: ${text.slice(0, 100)}`);
      }

      return data as T;
    } catch (err: any) {
      console.error(`Error en acción ${payload.action}:`, err);
      throw err;
    }
  }

  // 1. PUBLIC AREA: Obtener stands y configuración del evento
  public async getPublicData(forceRefresh = false): Promise<PublicData> {
    const cacheKey = 'public_data';
    if (!forceRefresh) {
      const cached = this.getCached<PublicData>(cacheKey);
      if (cached) return cached;
    }

    let response: Response | null = null;

    // Try proxy first
    try {
      response = await fetch(`${PROXY_URL}?action=public`, {
        method: 'GET',
      });
      if (!response.ok) response = null;
    } catch {
      response = null;
    }

    // Fallback to direct fetch
    if (!response) {
      response = await fetch(`${BACKEND_URL}?action=public`, {
        method: 'GET',
      });
    }

    if (!response.ok) {
      throw new Error(`Error al cargar datos públicos (${response.status})`);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'No se pudieron cargar los datos del evento');
    }

    const publicData: PublicData = {
      configuracion: result.data?.configuracion || {
        NOMBRE_EVENTO: 'Weihnachtsmarkt',
        IDIOMA_PREDETERMINADO: 'es',
        WHATSAPP_ADMIN: '75593587',
        MONEDA: '$us',
        MAX_INVITADOS: '5',
        GESTION_ACTIVA: 'GES-2026',
        MENSAJE_WHATSAPP_ES:
          'Hola, soy {NOMBRE}. Solicité el Stand {STAND} de la categoría {CATEGORIA} para el Weihnachtsmarkt.',
        MENSAJE_WHATSAPP_DE:
          'Hallo, ich bin {NOMBRE}. Ich habe Stand {STAND} in der Kategorie {CATEGORIA} für den Weihnachtsmarkt angefragt.',
      },
      stands: Array.isArray(result.data?.stands) ? result.data.stands : [],
    };

    this.setCache(cacheKey, publicData);
    return publicData;
  }

  // 2. SOLICITUD DE ALQUILER
  public async submitSolicitud(params: {
    stand: string | number;
    categoria: string;
    nombre: string;
    telefono: string;
  }): Promise<{ ok: boolean; error?: string; mensaje?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string; mensaje?: string }>({
      action: 'solicitud',
      stand: params.stand,
      categoria: params.categoria,
      nombre: params.nombre,
      telefono: params.telefono,
    });

    if (res.ok) {
      this.invalidateCache('public_data');
      this.invalidateCache('admin_data');
    }

    return res;
  }

  // 3. ÁREA PRIVADA DEL CLIENTE: miAlquiler
  public async getMiAlquiler(token: string): Promise<MiAlquilerData> {
    const res = await this.postRequest<{ ok: boolean; data?: any; error?: string }>({
      action: 'miAlquiler',
      token,
    });

    if (!res.ok) {
      throw new Error(res.error || 'Enlace de cliente inválido');
    }

    return res.data;
  }

  // 4. CREAR INVITACIÓN (desde área del cliente)
  public async crearInvitacion(
    tokenCliente: string,
    nombreSugerido?: string
  ): Promise<{ ok: boolean; token_invitacion?: string; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; token_invitacion?: string; error?: string }>({
      action: 'crearInvitacion',
      token: tokenCliente,
      nombre: nombreSugerido,
    });

    if (res.ok) {
      this.invalidateCache('admin_data');
    }

    return res;
  }

  // 5. INVITADO: Consultar invitación
  public async consultarInvitacion(tokenInvitacion: string): Promise<InvitacionInfo> {
    const res = await this.postRequest<{ ok: boolean; data?: any; error?: string }>({
      action: 'consultarInvitacion',
      token: tokenInvitacion,
    });

    if (!res.ok) {
      return {
        valida: false,
        error: res.error || 'Invitación no disponible',
      };
    }

    return {
      valida: true,
      ...res.data,
    };
  }

  // 6. INVITADO: Registrar invitado
  public async registrarInvitado(
    tokenInvitacion: string,
    nombreCompleto: string
  ): Promise<{ ok: boolean; error?: string; qr_acceso?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string; qr_acceso?: string }>({
      action: 'registrarInvitado',
      token: tokenInvitacion,
      nombre: nombreCompleto,
    });

    if (res.ok) {
      this.invalidateCache('admin_data');
    }

    return res;
  }

  // 7. LOGIN (Administrador y Portero)
  public async login(
    usuario: string,
    password: string
  ): Promise<LoginResponse> {
    const res = await this.postRequest<LoginResponse>({
      action: 'login',
      usuario,
      password,
    });

    // Normalize so data.token, data.rol and flat token/rol are both available
    if (res.data) {
      if (!res.token && res.data.token) {
        res.token = res.data.token;
      }
      if (!res.rol && res.data.rol) {
        res.rol = res.data.rol;
      }
      if (!res.nombre && res.data.nombre) {
        res.nombre = res.data.nombre;
      }
    }

    return res;
  }

  // 8. ADMIN DATA (Obtener todos los datos administrativos)
  public async getAdminData(token: string, forceRefresh = false): Promise<AdminData> {
    const cacheKey = `admin_data_${token.slice(0, 10)}`;
    if (!forceRefresh) {
      const cached = this.getCached<AdminData>(cacheKey);
      if (cached) return cached;
    }

    const res = await this.postRequest<{ ok: boolean; data?: any; error?: string }>({
      action: 'adminData',
      token,
    });

    if (!res.ok) {
      throw new Error(res.error || 'Sesión expirada o no autorizada');
    }

    const adminData: AdminData = {
      configuracion: res.data?.configuracion || {},
      stands: Array.isArray(res.data?.stands) ? res.data.stands : [],
      solicitudes: Array.isArray(res.data?.solicitudes) ? res.data.solicitudes : [],
      alquileres: Array.isArray(res.data?.alquileres) ? res.data.alquileres : [],
      invitados: Array.isArray(res.data?.invitados) ? res.data.invitados : [],
      accesos: Array.isArray(res.data?.accesos) ? res.data.accesos : [],
      usuarios: Array.isArray(res.data?.usuarios) ? res.data.usuarios : [],
      gestiones: Array.isArray(res.data?.gestiones) ? res.data.gestiones : [],
    };

    this.setCache(cacheKey, adminData);
    return adminData;
  }

  // 9. GUARDAR STAND (Crear o editar)
  public async saveStand(
    token: string,
    stand: Partial<Stand>
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'saveStand',
      token,
      stand,
      id: stand.id || stand.numero,
      id_stand: stand.id || stand.numero,
      numero: stand.numero,
      categoria: stand.categoria,
      precio: stand.precio,
      estado: stand.estado,
      descripcion: stand.descripcion || '',
      posicion_x: stand.posicion_x,
      posicion_y: stand.posicion_y,
      ancho: stand.ancho,
      alto: stand.alto,
      gestion: stand.gestion,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 10. CONFIRMAR ALQUILER (Desde solicitud)
  public async confirmarAlquiler(
    token: string,
    solicitudId: string
  ): Promise<{ ok: boolean; token_cliente?: string; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; token_cliente?: string; error?: string }>({
      action: 'confirmarAlquiler',
      token,
      id: solicitudId,
      id_solicitud: solicitudId,
      solicitudId: solicitudId,
      solicitud_id: solicitudId,
      solicitud: solicitudId,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 11. RECHAZAR SOLICITUD
  public async rechazarSolicitud(
    token: string,
    solicitudId: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'rechazarSolicitud',
      token,
      id: solicitudId,
      id_solicitud: solicitudId,
      solicitudId: solicitudId,
      solicitud_id: solicitudId,
      solicitud: solicitudId,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 12. CANCELAR ALQUILER
  public async cancelarAlquiler(
    token: string,
    alquilerId: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'cancelarAlquiler',
      token,
      id: alquilerId,
      id_alquiler: alquilerId,
      alquilerId: alquilerId,
      alquiler_id: alquilerId,
      alquiler: alquilerId,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 13. REVOCAR INVITADO
  public async revocarInvitado(
    token: string,
    invitadoId: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'revocarInvitado',
      token,
      id: invitadoId,
      id_invitado: invitadoId,
      invitadoId: invitadoId,
      invitado_id: invitadoId,
      invitado: invitadoId,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 14. CREAR USUARIO
  public async crearUsuario(
    token: string,
    usuario: { usuario: string; nombre: string; password: string; rol: string }
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'crearUsuario',
      token,
      usuario: usuario.usuario,
      username: usuario.usuario,
      user: usuario.usuario,
      nombre: usuario.nombre,
      password: usuario.password,
      pass: usuario.password,
      rol: usuario.rol,
      userData: usuario,
    });

    if (res.ok) {
      this.invalidateCache('admin_data');
    }

    return res;
  }

  // 15. CAMBIAR PASSWORD
  public async cambiarPassword(
    token: string,
    usuario: string,
    nuevaPassword: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'cambiarPassword',
      token,
      usuario,
      user: usuario,
      username: usuario,
      password: nuevaPassword,
      nuevaPassword,
      newPassword: nuevaPassword,
      nueva_password: nuevaPassword,
      password_nueva: nuevaPassword,
    });

    return res;
  }

  // 16. CAMBIAR ESTADO USUARIO (activo / inactivo)
  public async cambiarEstadoUsuario(
    token: string,
    usuario: string,
    nuevoEstado: 'activo' | 'inactivo'
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'cambiarEstadoUsuario',
      token,
      usuario,
      user: usuario,
      username: usuario,
      estado: nuevoEstado,
      nuevoEstado,
      nuevo_estado: nuevoEstado,
    });

    if (res.ok) {
      this.invalidateCache('admin_data');
    }

    return res;
  }

  // 17. GUARDAR CONFIGURACIÓN
  public async setConfig(
    token: string,
    config: Partial<Configuracion>
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'setConfig',
      token,
      config,
      configuracion: config,
      data: config,
      NOMBRE_EVENTO: config.NOMBRE_EVENTO,
      IDIOMA_PREDETERMINADO: config.IDIOMA_PREDETERMINADO,
      WHATSAPP_ADMIN: config.WHATSAPP_ADMIN,
      MONEDA: config.MONEDA,
      MAX_INVITADOS: config.MAX_INVITADOS,
      GESTION_ACTIVA: config.GESTION_ACTIVA,
      MENSAJE_WHATSAPP_ES: config.MENSAJE_WHATSAPP_ES,
      MENSAJE_WHATSAPP_DE: config.MENSAJE_WHATSAPP_DE,
      nombre_evento: config.NOMBRE_EVENTO,
      idioma_predeterminado: config.IDIOMA_PREDETERMINADO,
      whatsapp_admin: config.WHATSAPP_ADMIN,
      moneda: config.MONEDA,
      max_invitados: config.MAX_INVITADOS,
      gestion_activa: config.GESTION_ACTIVA,
      mensaje_whatsapp_es: config.MENSAJE_WHATSAPP_ES,
      mensaje_whatsapp_de: config.MENSAJE_WHATSAPP_DE,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 18. NUEVA GESTIÓN ANUAL
  public async nuevaGestion(
    token: string,
    gestion: { nombre: string; copiarStands: boolean }
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'nuevaGestion',
      token,
      nombre: gestion.nombre,
      gestion: gestion.nombre,
      id_gestion: gestion.nombre,
      copiarStands: gestion.copiarStands,
      copiar_stands: gestion.copiarStands,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 19. ACTIVAR GESTIÓN
  public async activarGestion(
    token: string,
    idGestion: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await this.postRequest<{ ok: boolean; error?: string }>({
      action: 'activarGestion',
      token,
      id: idGestion,
      id_gestion: idGestion,
      gestion: idGestion,
      nombre: idGestion,
    });

    if (res.ok) {
      this.invalidateCache();
    }

    return res;
  }

  // 20. SCAN PORTERÍA
  public async scan(token: string, qr: string): Promise<ScanResult> {
    const res = await this.postRequest<ScanResult>({
      action: 'scan',
      token,
      qr,
    });

    // Invalidate access log cache
    this.invalidateCache('admin_data');

    return res;
  }
}

export const backendService = new BackendService();
