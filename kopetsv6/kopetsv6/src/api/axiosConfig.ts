import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenService } from '../services/api';

const API_URL = 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para prevenir múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Agregar token a cada request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Manejar errores y refresh de tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.error('[Axios Error]', error.response?.status, error.response?.data);

    // Si es 401 y no hemos intentado refrescar aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya estamos refrescando, poner en cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        // No hay refresh token, redirigir a login
        console.error('[401] No hay refresh token disponible');
        tokenService.clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Intentar refrescar el token
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;

        // Actualizar tokens en el sistema de multi-sesión
        tokenService.updateActiveSessionTokens(access, refreshToken);

        // Procesar cola de requests fallidos
        processQueue(null, access);

        // Reintentar request original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh falló, cerrar sesión
        console.error('[401] Refresh token inválido o expirado');
        processQueue(error, null);
        tokenService.clearSession();

        // Verificar si quedan otras sesiones
        const sessions = tokenService.getSessionsList();
        if (sessions.length === 0) {
          window.location.href = '/login';
        } else {
          // Recargar para activar otra sesión
          window.location.reload();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Para otros errores, rechazar normalmente
    return Promise.reject(error);
  }
);

export default axiosInstance;