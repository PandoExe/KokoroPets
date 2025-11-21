import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  PawPrint,
  Megaphone,
  Users,
  Building,
  User as UserIcon,
  Lightbulb,
  MoreHorizontal,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DashboardHomeUsuario } from './DashboardHomeUsuario';
import { AdopcionesUsuario } from './AdopcionesUsuario';
import { MisSolicitudesUsuario } from './MisSolicitudesUsuario';
import { CampanasUsuario } from './CampanasUsuario';
import { VoluntariadoUsuario } from './VoluntariadoUsuario';
import { FundacionesUsuario } from './FundacionesUsuario';
import { PerfilUsuario } from './PerfilUsuario';
import { TipsUsuario } from './TipsUsuario';
import { MasUsuario } from './MasUsuario';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';

type Modulo = 'home' | 'adopciones' | 'mis-solicitudes' | 'campanas' | 'voluntariado' | 'fundaciones' | 'perfil' | 'tips' | 'mas';

interface DashboardUsuarioProps {
  onCerrarSesion: () => void;
}

export function DashboardUsuario({ onCerrarSesion }: DashboardUsuarioProps) {
  const [moduloActivo, setModuloActivo] = useState<Modulo>('home');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    fotoPerfil: ''
  });

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      const response = await authService.obtenerPerfilAuth();
      const data = response.user || response;

      setUserData({
        nombre: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'Usuario',
        email: data.email || '',
        fotoPerfil: data.foto_perfil || ''
      });
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      // Usar datos del contexto como fallback
      if (user) {
        setUserData({
          nombre: user.username || 'Usuario',
          email: user.email || '',
          fotoPerfil: ''
        });
      }
    }
  };

  const menuItems = [
    { id: 'home', icon: Heart, label: 'Inicio', color: 'from-pink-500 to-pink-600' },
    { id: 'adopciones', icon: PawPrint, label: 'Adopciones', color: 'from-purple-500 to-purple-600' },
    { id: 'mis-solicitudes', icon: MoreHorizontal, label: 'Mis Solicitudes', color: 'from-blue-500 to-blue-600' },
    { id: 'campanas', icon: Megaphone, label: 'Campañas', color: 'from-pink-500 to-purple-500' },
    { id: 'voluntariado', icon: Users, label: 'Voluntariado', color: 'from-green-500 to-green-600' },
    { id: 'fundaciones', icon: Building, label: 'Fundaciones', color: 'from-purple-500 to-pink-500' },
    { id: 'tips', icon: Lightbulb, label: 'Tips', color: 'from-green-400 to-green-500' },
    { id: 'perfil', icon: UserIcon, label: 'Perfil', color: 'from-pink-400 to-pink-500' },
    { id: 'mas', icon: MoreHorizontal, label: 'Más', color: 'from-gray-500 to-gray-600' },
  ] as const;

  const renderModulo = () => {
    switch (moduloActivo) {
      case 'home':
        return <DashboardHomeUsuario onNavigate={setModuloActivo} />;
      case 'adopciones':
        return <AdopcionesUsuario />;
      case 'mis-solicitudes':
        return <MisSolicitudesUsuario />;
      case 'campanas':
        return <CampanasUsuario />;
      case 'voluntariado':
        return <VoluntariadoUsuario />;
      case 'fundaciones':
        return <FundacionesUsuario />;
      case 'perfil':
        return <PerfilUsuario />;
      case 'tips':
        return <TipsUsuario />;
      case 'mas':
        return <MasUsuario />;
      default:
        return <DashboardHomeUsuario onNavigate={setModuloActivo} />;
    }
  };

  const itemActivo = menuItems.find(item => item.id === moduloActivo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white">
      {/* Header móvil */}
      <div className="lg:hidden bg-white border-b border-border p-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`bg-gradient-to-r ${itemActivo?.color || 'from-pink-500 to-purple-500'} p-2 rounded-xl shadow-lg`}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium">KokoroPets</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="rounded-full"
        >
          {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex sticky top-0 left-0 h-screen w-64 bg-white border-r border-border shadow-sm flex-col">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-pink-200">
              <AvatarImage src={userData.fotoPerfil} />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                {userData.nombre ? userData.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userData.nombre || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground truncate">{userData.email || 'KokoroPets'}</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = moduloActivo === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setModuloActivo(item.id as Modulo)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Botón Cerrar Sesión */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={onCerrarSesion}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </aside>

        {/* Menú móvil */}
        <AnimatePresence>
          {menuAbierto && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setMenuAbierto(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed top-0 left-0 h-screen w-64 bg-white z-50 lg:hidden shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-pink-200">
                    <AvatarImage src={userData.fotoPerfil} />
                    <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                      {userData.nombre ? userData.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{userData.nombre || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground truncate">{userData.email || 'KokoroPets'}</p>
                  </div>
                </div>
                
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = moduloActivo === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setModuloActivo(item.id as Modulo);
                          setMenuAbierto(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </motion.button>
                    );
                  })}
                </nav>

                {/* Botón Cerrar Sesión Móvil */}
                <div className="p-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={onCerrarSesion}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Contenido principal */}
        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={moduloActivo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderModulo()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
