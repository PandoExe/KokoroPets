import { useState, useEffect } from 'react';
import { tokenService } from '../services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ChevronDown, LogOut, Users, User } from 'lucide-react';

interface SessionInfo {
  key: string;
  user: {
    id: number;
    username: string;
    email: string;
    tipo_usuario: string;
    first_name?: string;
    last_name?: string;
  };
  isActive: boolean;
  lastActivity: Date;
}

interface SessionSwitcherProps {
  onSessionChange?: () => void;
}

export function SessionSwitcher({ onSessionChange }: SessionSwitcherProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);

  const loadSessions = () => {
    const sessionsList = tokenService.getSessionsList();
    setSessions(sessionsList);
    const active = sessionsList.find(s => s.isActive);
    setActiveSession(active || null);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSwitchSession = (sessionKey: string) => {
    const success = tokenService.switchSession(sessionKey);
    if (success) {
      loadSessions();
      onSessionChange?.();
      // Recargar la página para actualizar el contexto
      window.location.reload();
    }
  };

  const handleLogoutSession = (sessionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    tokenService.clearSession(sessionKey);
    loadSessions();

    // Si cerramos la sesión activa y no quedan más, redirigir al login
    const remainingSessions = tokenService.getSessionsList();
    if (remainingSessions.length === 0) {
      window.location.href = '/login';
    } else if (sessionKey === activeSession?.key) {
      // Si cerramos la sesión activa, recargar para activar otra
      window.location.reload();
    }
  };

  const handleLogoutAll = () => {
    toast('¿Cerrar todas las sesiones?', {
      description: 'Se cerrarán todas las sesiones activas y serás redirigido al login.',
      action: {
        label: 'Cerrar todas',
        onClick: () => {
          tokenService.clearAllSessions();
          window.location.href = '/login';
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const getInitials = (user: SessionInfo['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: SessionInfo['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.username || user.email;
  };

  const getTipoUsuarioLabel = (tipo: string) => {
    switch (tipo) {
      case 'REFUGIO':
        return 'Refugio';
      case 'ADOPTANTE':
        return 'Adoptante';
      default:
        return tipo;
    }
  };

  const getTipoUsuarioIcon = (tipo: string) => {
    switch (tipo) {
      case 'REFUGIO':
        return '🏠';
      case 'ADOPTANTE':
        return '👤';
      default:
        return '•';
    }
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {activeSession ? getInitials(activeSession.user) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium">
              {activeSession ? getDisplayName(activeSession.user) : 'Sin sesión'}
            </span>
            {activeSession && (
              <span className="text-xs text-muted-foreground">
                {getTipoUsuarioLabel(activeSession.user.tipo_usuario)}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cuentas activas</span>
            {sessions.length > 1 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {sessions.length} sesiones
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Lista de sesiones */}
        {sessions.map((session) => (
          <DropdownMenuItem
            key={session.key}
            className={`flex items-center gap-3 cursor-pointer py-3 ${
              session.isActive ? 'bg-muted' : ''
            }`}
            onClick={() => !session.isActive && handleSwitchSession(session.key)}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className={session.isActive ? 'bg-primary text-primary-foreground' : ''}>
                {getInitials(session.user)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {getDisplayName(session.user)}
                </p>
                {session.isActive && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Activa
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{getTipoUsuarioIcon(session.user.tipo_usuario)}</span>
                <span>{getTipoUsuarioLabel(session.user.tipo_usuario)}</span>
                <span>•</span>
                <span className="truncate">{session.user.email}</span>
              </div>
            </div>

            {!session.isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleLogoutSession(session.key, e)}
                className="h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Opciones adicionales */}
        <DropdownMenuItem
          onClick={() => handleLogoutSession(activeSession?.key || '', {} as any)}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión actual</span>
        </DropdownMenuItem>

        {sessions.length > 1 && (
          <DropdownMenuItem
            onClick={handleLogoutAll}
            className="text-red-600 cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Cerrar todas las sesiones</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
