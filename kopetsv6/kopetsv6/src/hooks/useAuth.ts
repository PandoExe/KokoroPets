import { useState, useEffect } from 'react';
import { tokenService, authService } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  tipo_usuario: string;
  first_name?: string;
  last_name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUser = async () => {
    try {
      const activeUser = tokenService.getActiveUser();
      if (activeUser) {
        setUser(activeUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = (sessionKey?: string) => {
    authService.logout(sessionKey);
    loadUser();
  };

  const logoutAll = () => {
    authService.logoutAll();
    setUser(null);
    setIsAuthenticated(false);
  };

  const switchSession = (sessionKey: string) => {
    const success = tokenService.switchSession(sessionKey);
    if (success) {
      loadUser();
      return true;
    }
    return false;
  };

  const isRefugio = user?.tipo_usuario === 'REFUGIO';
  const isAdoptante = user?.tipo_usuario === 'ADOPTANTE';

  return {
    user,
    isLoading,
    isAuthenticated,
    isRefugio,
    isAdoptante,
    logout,
    logoutAll,
    switchSession,
    refreshUser: loadUser,
  };
}
