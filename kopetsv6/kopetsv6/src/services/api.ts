// =============================================================================
// 1. CONFIGURACIÓN GLOBAL Y TIPOS
// =============================================================================
import axiosInstance from '../api/axiosConfig';
const API_URL = 'http://localhost:8000/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegistroData {
  tipo_usuario: string;
  email: string;
  password: string;
  nombre?: string;
  nombre_fundacion?: string;
}

export interface VerificarCodigoData {
  user_id: number;
  codigo: string;
}

// =============================================================================
// 2. SERVICIO DE TOKENS (JWT) - MULTI-SESIÓN
// =============================================================================

export interface UserSession {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    tipo_usuario: string;
    first_name?: string;
    last_name?: string;
  };
  timestamp: number; // Para ordenar por última actividad
}

export const tokenService = {
  // Obtener todas las sesiones guardadas
  getSessions: (): Record<string, UserSession> => {
    const sessions = localStorage.getItem('user_sessions');
    return sessions ? JSON.parse(sessions) : {};
  },

  // Guardar una nueva sesión o actualizar existente
  setSession: (access: string, refresh: string, user: any) => {
    const sessions = tokenService.getSessions();
    const sessionKey = `${user.tipo_usuario}_${user.id}`; // Ej: "REFUGIO_1" o "ADOPTANTE_5"

    sessions[sessionKey] = {
      access,
      refresh,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        first_name: user.first_name,
        last_name: user.last_name
      },
      timestamp: Date.now()
    };

    localStorage.setItem('user_sessions', JSON.stringify(sessions));
    localStorage.setItem('active_session', sessionKey);
  },

  // Obtener la sesión activa actual
  getActiveSession: (): UserSession | null => {
    const activeKey = localStorage.getItem('active_session');
    if (!activeKey) return null;

    const sessions = tokenService.getSessions();
    return sessions[activeKey] || null;
  },

  // Obtener el access token de la sesión activa
  getAccessToken: (): string | null => {
    const session = tokenService.getActiveSession();
    return session?.access || null;
  },

  // Obtener el refresh token de la sesión activa
  getRefreshToken: (): string | null => {
    const session = tokenService.getActiveSession();
    return session?.refresh || null;
  },

  // Cambiar entre sesiones existentes
  switchSession: (sessionKey: string): boolean => {
    const sessions = tokenService.getSessions();
    if (sessions[sessionKey]) {
      localStorage.setItem('active_session', sessionKey);
      // Actualizar timestamp de última actividad
      sessions[sessionKey].timestamp = Date.now();
      localStorage.setItem('user_sessions', JSON.stringify(sessions));
      return true;
    }
    return false;
  },

  // Obtener información del usuario activo
  getActiveUser: () => {
    const session = tokenService.getActiveSession();
    return session?.user || null;
  },

  // Cerrar sesión específica
  clearSession: (sessionKey?: string) => {
    const sessions = tokenService.getSessions();

    if (sessionKey) {
      // Eliminar sesión específica
      delete sessions[sessionKey];
      localStorage.setItem('user_sessions', JSON.stringify(sessions));

      // Si era la sesión activa, limpiarla
      if (localStorage.getItem('active_session') === sessionKey) {
        localStorage.removeItem('active_session');

        // Auto-cambiar a otra sesión si existe
        const remainingSessions = Object.keys(sessions);
        if (remainingSessions.length > 0) {
          // Activar la sesión más reciente
          const mostRecent = remainingSessions.reduce((prev, curr) =>
            sessions[curr].timestamp > sessions[prev].timestamp ? curr : prev
          );
          localStorage.setItem('active_session', mostRecent);
        }
      }
    } else {
      // Cerrar solo la sesión activa
      const activeKey = localStorage.getItem('active_session');
      if (activeKey) {
        tokenService.clearSession(activeKey);
      }
    }
  },

  // Cerrar todas las sesiones
  clearAllSessions: () => {
    localStorage.removeItem('user_sessions');
    localStorage.removeItem('active_session');
  },

  // Actualizar tokens de la sesión activa (para refresh)
  updateActiveSessionTokens: (access: string, refresh: string) => {
    const activeKey = localStorage.getItem('active_session');
    if (!activeKey) return false;

    const sessions = tokenService.getSessions();
    if (sessions[activeKey]) {
      sessions[activeKey].access = access;
      sessions[activeKey].refresh = refresh;
      sessions[activeKey].timestamp = Date.now();
      localStorage.setItem('user_sessions', JSON.stringify(sessions));
      return true;
    }
    return false;
  },

  // Obtener lista de sesiones para UI (sin tokens sensibles)
  getSessionsList: () => {
    const sessions = tokenService.getSessions();
    return Object.keys(sessions).map(key => ({
      key,
      user: sessions[key].user,
      isActive: localStorage.getItem('active_session') === key,
      lastActivity: new Date(sessions[key].timestamp)
    }));
  },

  // Métodos legacy para compatibilidad con código existente
  setTokens: (access: string, refresh: string) => {
    console.warn('⚠️ tokenService.setTokens() está deprecado. Usa setSession() en su lugar.');
    // Para mantener compatibilidad temporal
    const activeSession = tokenService.getActiveSession();
    if (activeSession) {
      tokenService.updateActiveSessionTokens(access, refresh);
    }
  },

  clearTokens: () => {
    console.warn('⚠️ tokenService.clearTokens() está deprecado. Usa clearSession() en su lugar.');
    tokenService.clearSession();
  }
};

// =============================================================================
// 3. SERVICIO DE AUTENTICACIÓN (Auth)
// =============================================================================

export const authService = {
  login: async (data: LoginData) => {
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  registro: async (data: RegistroData | FormData) => {
    const isFormData = data instanceof FormData;
    
    const response = await fetch(`${API_URL}/auth/registro/`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });
    return response.json();
  },

  verificarCodigo: async (data: VerificarCodigoData) => {
    const response = await fetch(`${API_URL}/auth/verificar_codigo/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.success && result.access && result.refresh && result.user) {
      // ✅ Usar el nuevo sistema de multi-sesión
      tokenService.setSession(result.access, result.refresh, result.user);
    }

    return result;
  },

  logout: (sessionKey?: string) => {
    // Si se proporciona sessionKey, cierra esa sesión específica
    // Si no, cierra la sesión activa
    tokenService.clearSession(sessionKey);
  },

  logoutAll: () => {
    // Cerrar todas las sesiones
    tokenService.clearAllSessions();
  },

  obtenerPerfilAuth: async () => {
    const token = tokenService.getAccessToken();

    const response = await fetch(`${API_URL}/auth/perfil/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  },

  actualizarPerfilAuth: async (data: { telefono?: string; first_name?: string; last_name?: string; foto_perfil?: string }) => {
    const token = tokenService.getAccessToken();

    const response = await fetch(`${API_URL}/auth/perfil/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar perfil de usuario');
    }

    return response.json();
  }
};

// =============================================================================
// 4. SERVICIOS DE REFUGIOS
// =============================================================================

export const refugioService = {
  obtenerMiPerfil: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/refugios/mi_perfil/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });
    return response.json();
  },

  actualizarPerfil: async (data: any) => {
    const token = tokenService.getAccessToken();
    
    const formData = new FormData();
    
    // Campos simples
    formData.append('nombre', data.nombre);
    formData.append('descripcion', data.descripcion);
    if (data.anio_fundacion) formData.append('anio_fundacion', data.anio_fundacion.toString());
    if (data.capacidad) formData.append('capacidad', data.capacidad.toString());
    formData.append('direccion', data.direccion);
    formData.append('ciudad', data.ciudad);
    formData.append('region', data.region);
    formData.append('horario_atencion', data.horario_atencion);
    
    // Manejo de imágenes - soporta File, base64 o URL existente
    if (data.logo) {
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      } else if (data.logo.startsWith('data:image')) {
        const logoBlob = await fetch(data.logo).then(r => r.blob());
        formData.append('logo', logoBlob, 'logo.jpg');
      }
      // Si es URL existente, no la enviamos (se mantiene en el backend)
    }
    
    if (data.portada) {
      if (data.portada instanceof File) {
        formData.append('portada', data.portada);
      } else if (data.portada.startsWith('data:image')) {
        const portadaBlob = await fetch(data.portada).then(r => r.blob());
        formData.append('portada', portadaBlob, 'portada.jpg');
      }
    }
    
    // Contactos y redes sociales como JSON strings
    formData.append('contactos', JSON.stringify(data.contactos));
    formData.append('redes_sociales', JSON.stringify(data.redes_sociales));
    
    const response = await fetch(`${API_URL}/refugios/actualizar_perfil/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar perfil');
    }
    
    return response.json();
  },

  obtenerEstadisticasMensuales: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/refugios/estadisticas_mensuales/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }

    return response.json();
  }
};

export const refugioPublicoService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/refugios-publicos/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  obtener: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/refugios-publicos/${id}/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export const resenaRefugioService = {
  listar: async (refugioId?: number) => {
    const token = tokenService.getAccessToken();
    const url = refugioId 
      ? `${API_URL}/resenas-refugios/?refugio=${refugioId}`
      : `${API_URL}/resenas-refugios/`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  crear: async (data: { refugio: number; calificacion: number; comentario: string }) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/resenas-refugios/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  responder: async (id: number, respuesta: string) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/resenas-refugios/${id}/responder/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ respuesta })
    });
    return response.json();
  }
};


// =============================================================================
// 5. SERVICIOS DE MASCOTAS (Gestión y Vista Pública)
// =============================================================================

const buildMascotaFormData = (data: any) => {
  const formData = new FormData();
  
  formData.append('nombre', data.nombre);
  formData.append('edad', data.edad);
  formData.append('tipo_animal', data.tipo_animal);
  formData.append('raza', data.raza);
  formData.append('sexo', data.sexo);
  formData.append('esterilizado', data.esterilizado.toString());
  formData.append('desparasitado', data.desparasitado.toString());
  formData.append('microchip', data.microchip.toString());
  formData.append('descripcion', data.descripcion);
  formData.append('necesidades_especiales', data.necesidades_especiales);
  formData.append('estado', data.estado);
  formData.append('tamano', data.tamano);
  formData.append('color', data.color);
  formData.append('nivel_energia', data.nivel_energia);
  formData.append('nivel_cuidado', data.nivel_cuidado);
  formData.append('apto_ninos', data.apto_ninos.toString());
  formData.append('apto_apartamento', data.apto_apartamento.toString());
  formData.append('sociable_perros', data.sociable_perros.toString());
  formData.append('sociable_gatos', data.sociable_gatos.toString());

  if (data.foto_principal instanceof File) {
    formData.append('foto_principal', data.foto_principal);
  }
  if (data.foto_2 instanceof File) {
    formData.append('foto_2', data.foto_2);
  }
  if (data.foto_3 instanceof File) {
    formData.append('foto_3', data.foto_3);
  }

  return formData;
};


export const mascotaService = {
  listar: async (filtros?: Record<string, any>) => {
    const token = tokenService.getAccessToken();
    let url = `${API_URL}/mascotas/`;
    
    if (filtros) {
      const filtrosLimpios = Object.fromEntries(
        Object.entries(filtros).filter(([_, v]) => v != null && v !== '')
      );
      
      const params = new URLSearchParams(filtrosLimpios as Record<string, string>);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const formData = buildMascotaFormData(data);

    const response = await fetch(`${API_URL}/mascotas/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  },

  actualizar: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const formData = buildMascotaFormData(data);

    const response = await fetch(`${API_URL}/mascotas/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/mascotas/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  },

  publicar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/mascotas/${id}/publicar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export const mascotaPublicaService = {
  listar: async (filtros?: Record<string, any>) => {
    const token = tokenService.getAccessToken();
    let url = `${API_URL}/mascotas-publicas/`;
    
    if (filtros) {
      const filtrosLimpios = Object.fromEntries(
        Object.entries(filtros).filter(([_, v]) => v != null && v !== '')
      );
      
      const params = new URLSearchParams(filtrosLimpios as Record<string, string>);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  obtener: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/mascotas-publicas/${id}/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};



// =============================================================================
// 6. SERVICIOS DE CATÁLOGOS (Animales, Razas, Vacunas)
// =============================================================================

export const tipoAnimalService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tipos-animales/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export const razaService = {
  listar: async (tipoAnimalId?: number) => {
    const token = tokenService.getAccessToken();
    const url = tipoAnimalId 
      ? `${API_URL}/razas/?tipo_animal=${tipoAnimalId}`
      : `${API_URL}/razas/`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export const tipoVacunaService = {
  listar: async (tipoAnimalId?: number) => {
    const token = tokenService.getAccessToken();
    const url = tipoAnimalId 
      ? `${API_URL}/tipos-vacunas/?tipo_animal=${tipoAnimalId}`
      : `${API_URL}/tipos-vacunas/`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export const vacunaMascotaService = {
  crear: async (data: { mascota: number; tipo_vacuna: number; fecha_aplicacion: string; }) => {
    try {
      const response = await axiosInstance.post('/vacunas-mascotas/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al agregar vacuna');
    }
  },

  eliminar: async (id: number) => {
    try {
      await axiosInstance.delete(`/vacunas-mascotas/${id}/`);
      return true;
    } catch (error: any) {
      throw new Error('Error al eliminar vacuna');
    }
  }
};


// =============================================================================
// 7. SERVICIOS DE ADOPCIÓN (Solicitudes y Perfil)
// =============================================================================

export const solicitudAdopcionService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/solicitudes-adopcion/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/solicitudes-adopcion/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear solicitud');
    }
    return response.json();
  },

  aprobar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/solicitudes-adopcion/${id}/aprobar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al aprobar solicitud');
    }
    return response.json();
  },

  rechazar: async (id: number, motivo: string) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/solicitudes-adopcion/${id}/rechazar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motivo_rechazo: motivo })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al rechazar solicitud');
    }
    return response.json();
  },

  marcarPendiente: async (id: number) => {
    const response = await axiosInstance.post(`/solicitudes-adopcion/${id}/marcar_pendiente/`);
    return response.data;
  },

  cancelar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/solicitudes-adopcion/${id}/cancelar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export const perfilAdoptanteService = {
  obtener: async (userId: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/perfiles-adoptantes/${userId}/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('NOT_FOUND');
      }
      throw new Error('Error al obtener perfil');
    }
    return response.json();
  },

  actualizarOCrear: async (userId: number, data: any) => {
    const token = tokenService.getAccessToken();
    
    const payload = {
      ...data,
      user: userId
    };
    
    try {
      const checkResponse = await fetch(`${API_URL}/perfiles-adoptantes/${userId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkResponse.ok) {
        const updateResponse = await fetch(`${API_URL}/perfiles-adoptantes/${userId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.detail || 'Error al actualizar perfil');
        }
        
        return updateResponse.json();
      }
    } catch (error) {
      // Perfil no existe, crear nuevo
    }
    
    const createResponse = await fetch(`${API_URL}/perfiles-adoptantes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.detail || 'Error al crear perfil');
    }
    
    return createResponse.json();
  }
};

// =============================================================================
// 8. SERVICIOS MISCELÁNEOS (Campañas, Tips)
// =============================================================================

export const campanaService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();
    
    // Campos de texto
    formData.append('titulo', data.titulo);
    formData.append('descripcion', data.descripcion);
    formData.append('fecha_inicio', data.fecha_inicio);
    formData.append('fecha_fin', data.fecha_fin);
    formData.append('tipo_kpi', data.tipo_kpi);
    formData.append('meta_kpi', data.meta_kpi.toString());
    if (data.estado) formData.append('estado', data.estado);
    
    // Imagen como File
    if (data.imagen instanceof File) {
      formData.append('imagen', data.imagen);
    }
    
    const response = await fetch(`${API_URL}/campanas/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear campaña');
    }
    
    return response.json();
  },

  actualizar: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();
    
    // Campos de texto
    formData.append('titulo', data.titulo);
    formData.append('descripcion', data.descripcion);
    formData.append('fecha_inicio', data.fecha_inicio);
    formData.append('fecha_fin', data.fecha_fin);
    formData.append('tipo_kpi', data.tipo_kpi);
    formData.append('meta_kpi', data.meta_kpi.toString());
    if (data.estado) formData.append('estado', data.estado);
    
    // Imagen como File
    if (data.imagen instanceof File) {
      formData.append('imagen', data.imagen);
    }
    
    const response = await fetch(`${API_URL}/campanas/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar campaña');
    }
    
    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  },

  pausar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/pausar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  activar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/activar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  finalizar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/finalizar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  participar: async (id: number, comentario?: string) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/participar/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comentario: comentario || '' })
    });
    return response.json();
  },

  cancelarParticipacion: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/cancelar_participacion/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cancelar participación');
    }

    return response.json();
  },

  obtenerParticipantes: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${id}/participantes/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al obtener participantes');
    }

    return response.json();
  },

  marcarAsistencia: async (campanaId: number, participacionId: number, asistio: boolean) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/campanas/${campanaId}/marcar_asistencia/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participacion_id: participacionId,
        asistio
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al marcar asistencia');
    }

    return response.json();
  }
};

export const tipService = {
  listar: async (categoria?: string, tipoAnimal?: number) => {
    const token = tokenService.getAccessToken();
    let url = `${API_URL}/tips/`;
    
    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria);
    if (tipoAnimal) params.append('tipo_animal', tipoAnimal.toString());
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();
    
    // Campos de texto
    formData.append('titulo', data.titulo);
    formData.append('contenido', data.contenido);
    formData.append('categoria', data.categoria);
    if (data.tipo_animal) formData.append('tipo_animal', data.tipo_animal.toString());
    formData.append('publicado', (data.publicado || false).toString());
    
    // Imagen como File
    if (data.imagen instanceof File) {
      formData.append('imagen', data.imagen);
    }
    
    const response = await fetch(`${API_URL}/tips/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear tip');
    }
    
    return response.json();
  },

  actualizar: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();
    
    // Campos de texto
    formData.append('titulo', data.titulo);
    formData.append('contenido', data.contenido);
    formData.append('categoria', data.categoria);
    if (data.tipo_animal) formData.append('tipo_animal', data.tipo_animal.toString());
    formData.append('publicado', (data.publicado || false).toString());
    
    // Imagen como File
    if (data.imagen instanceof File) {
      formData.append('imagen', data.imagen);
    }
    
    const response = await fetch(`${API_URL}/tips/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar tip');
    }
    
    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tips/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  },

  publicar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tips/${id}/publicar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  despublicar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tips/${id}/despublicar/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// =============================================================================
// 9. SERVICIOS DE POST ADOPCIÓN
// =============================================================================

export const adopcionService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al listar adopciones'
      );
    }

    return response.json();
  },

  obtener: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al obtener adopción'
      );
    }

    return response.json();
  },

  crear: async (data: { solicitud: number; fecha_adopcion: string; contrato_firmado: boolean }) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al crear adopción'
      );
    }

    return response.json();
  },

  iniciarSeguimiento: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/${id}/iniciar_seguimiento/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al iniciar seguimiento'
      );
    }

    return response.json();
  },

  finalizarSeguimiento: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/${id}/finalizar_seguimiento/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al finalizar seguimiento'
      );
    }

    return response.json();
  },

  agregarStrike: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/${id}/agregar_strike/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al agregar strike'
      );
    }

    return response.json();
  },

  quitarStrike: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/adopciones/${id}/quitar_strike/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al quitar strike'
      );
    }

    return response.json();
  }
};

export const visitaSeguimientoService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al listar visitas'
      );
    }

    return response.json();
  },

  obtener: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al obtener visita'
      );
    }

    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message ||
        error?.detail ||
        error?.non_field_errors?.[0] ||
        'Error al crear visita'
      );
    }

    return response.json();
  },

  actualizar: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al actualizar visita'
      );
    }

    return response.json();
  },

  marcarRealizada: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/${id}/marcar_realizada/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al marcar visita como realizada'
      );
    }

    return response.json();
  },

  marcarNoRealizada: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/${id}/marcar_no_realizada/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al marcar visita como no realizada'
      );
    }

    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/visitas-seguimiento/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar visita');
    }

    return true;
  }
};

export const fotoVisitaService = {
  subir: async (data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();

    formData.append('visita', data.visita.toString());
    formData.append('imagen', data.imagen);
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }

    const response = await fetch(`${API_URL}/fotos-visitas/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.message || error?.detail || 'Error al subir foto'
      );
    }

    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/fotos-visitas/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar foto');
    }

    return true;
  }
};

// =============================================================================
// 10. VOLUNTARIADO
// =============================================================================

export const eventoVoluntariadoService = {
  listar: async (filtros?: { estado?: string; fecha_desde?: string; fecha_hasta?: string }) => {
    const token = tokenService.getAccessToken();
    let url = `${API_URL}/eventos-voluntariado/`;
    
    if (filtros) {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      if (params.toString()) url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar eventos');
    }
    
    return response.json();
  },

  obtener: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener evento');
    }
    
    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_URL}/eventos-voluntariado/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al crear evento');
    }
    
    return response.json();
  },

  actualizar: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al actualizar evento');
    }
    
    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar evento');
    }
    
    return true;
  },

  cancelar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/cancelar/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al cancelar evento');
    }
    
    return response.json();
  },

  finalizar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/finalizar/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al finalizar evento');
    }
    
    return response.json();
  },

  inscribirse: async (id: number, comentario?: string) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/inscribirse/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comentario: comentario || '' })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al inscribirse');
    }
    
    return response.json();
  },

  cancelarInscripcion: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/cancelar_inscripcion/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al cancelar inscripción');
    }
    
    return response.json();
  },

  obtenerInscritos: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/eventos-voluntariado/${id}/inscritos/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener inscritos');
    }
    
    return response.json();
  }
};

export const inscripcionVoluntariadoService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inscripciones-voluntariado/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar inscripciones');
    }
    
    return response.json();
  },

  marcarAsistencia: async (id: number, asistio: boolean, notas?: string) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inscripciones-voluntariado/${id}/marcar_asistencia/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ asistio, notas: notas || '' })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al marcar asistencia');
    }
    
    return response.json();
  },

  misVoluntariados: async (estado?: string) => {
    const token = tokenService.getAccessToken();
    let url = `${API_URL}/inscripciones-voluntariado/mis_voluntariados/`;
    
    if (estado) {
      url += `?estado=${estado}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar historial');
    }

    return response.json();
  }
};

// =============================================================================
// 11. DOCUMENTOS
// =============================================================================

export const documentoService = {
  listar: async (filtros?: { categoria?: string; estado?: string; search?: string }) => {
    const token = tokenService.getAccessToken();
    let url = `${API_URL}/documentos/`;

    if (filtros) {
      const params = new URLSearchParams();
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.search) params.append('search', filtros.search);
      if (params.toString()) url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar documentos');
    }

    return response.json();
  },

  obtener: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/documentos/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener documento');
    }

    return response.json();
  },

  crear: async (data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();

    // Agregar campos al FormData
    if (data.nombre) formData.append('nombre', data.nombre);
    if (data.categoria) formData.append('categoria', data.categoria);
    if (data.tipo_archivo) formData.append('tipo_archivo', data.tipo_archivo);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.version) formData.append('version', data.version);
    if (data.estado) formData.append('estado', data.estado);
    if (data.archivo) formData.append('archivo', data.archivo);

    const response = await fetch(`${API_URL}/documentos/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al crear documento');
    }

    return response.json();
  },

  actualizar: async (id: number, data: any) => {
    const token = tokenService.getAccessToken();
    const formData = new FormData();

    // Agregar solo los campos que se van a actualizar
    if (data.nombre !== undefined) formData.append('nombre', data.nombre);
    if (data.categoria !== undefined) formData.append('categoria', data.categoria);
    if (data.tipo_archivo !== undefined) formData.append('tipo_archivo', data.tipo_archivo);
    if (data.descripcion !== undefined) formData.append('descripcion', data.descripcion);
    if (data.version !== undefined) formData.append('version', data.version);
    if (data.estado !== undefined) formData.append('estado', data.estado);
    if (data.archivo) formData.append('archivo', data.archivo);

    const response = await fetch(`${API_URL}/documentos/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || error?.message || 'Error al actualizar documento');
    }

    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/documentos/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar documento');
    }

    return true;
  },

  descargar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/documentos/${id}/descargar/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al descargar documento');
    }

    const data = await response.json();

    // Abrir el documento en una nueva pestaña
    window.open(data.url, '_blank');

    return data;
  },

  incrementarUso: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/documentos/${id}/incrementar_uso/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al incrementar uso');
    }

    return response.json();
  },

  estadisticas: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/documentos/estadisticas/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }

    return response.json();
  }
};

// =============================================================================
// 12. NOTIFICACIONES
// =============================================================================

export const notificacionService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/notificaciones/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar notificaciones');
    }

    return response.json();
  },

  marcarLeida: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/notificaciones/${id}/marcar_leida/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al marcar notificación como leída');
    }

    return response.json();
  },

  marcarTodasLeidas: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/notificaciones/marcar_todas_leidas/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al marcar todas como leídas');
    }

    return response.json();
  },

  obtenerNoLeidas: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/notificaciones/no_leidas/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener contador');
    }

    return response.json();
  },

  eliminar: async (id: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/notificaciones/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al eliminar notificación');
    }

    return true;
  }
};

// =============================================================================
// 13. FAVORITOS
// =============================================================================

export const mascotaFavoritaService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/mascotas-favoritas/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar mascotas favoritas');
    }

    return response.json();
  },

  toggle: async (mascotaId: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/mascotas-favoritas/toggle/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mascota_id: mascotaId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar favorito');
    }

    return response.json();
  },

  verificar: async (mascotaId: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/mascotas-favoritas/verificar/?mascota_id=${mascotaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al verificar favorito');
    }

    return response.json();
  }
};

export const tipFavoritoService = {
  listar: async () => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tips-favoritos/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar tips favoritos');
    }

    return response.json();
  },

  toggle: async (tipId: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tips-favoritos/toggle/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tip_id: tipId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar favorito');
    }

    return response.json();
  },

  verificar: async (tipId: number) => {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/tips-favoritos/verificar/?tip_id=${tipId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al verificar favorito');
    }

    return response.json();
  }
};

// =============================================================================
// INVENTARIO
// =============================================================================

export const inventarioService = {
  async listar(params?: { categoria?: string; bajo_stock?: boolean; proximo_vencer?: boolean }) {
    const token = tokenService.getAccessToken();
    const queryParams = new URLSearchParams();
    if (params?.categoria) queryParams.append('categoria', params.categoria);
    if (params?.bajo_stock !== undefined) queryParams.append('bajo_stock', String(params.bajo_stock));
    if (params?.proximo_vencer !== undefined) queryParams.append('proximo_vencer', String(params.proximo_vencer));

    const url = queryParams.toString()
      ? `${API_URL}/inventario/?${queryParams.toString()}`
      : `${API_URL}/inventario/`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Error al listar inventario');
    return response.json();
  },

  async obtener(id: number) {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inventario/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Error al obtener item');
    return response.json();
  },

  async crear(data: any) {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inventario/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear item');
    }
    return response.json();
  },

  async actualizar(id: number, data: any) {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inventario/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar item');
    }
    return response.json();
  },

  async eliminar(id: number) {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inventario/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Error al eliminar item');
  },

  async estadisticas() {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inventario/estadisticas/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Error al obtener estadísticas');
    return response.json();
  },

  async vencidos() {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${API_URL}/inventario/vencidos/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Error al obtener items vencidos');
    return response.json();
  },
};