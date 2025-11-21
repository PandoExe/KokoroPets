import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  PawPrint,
  Megaphone,
  Users,
  ClipboardCheck,
  MessageSquare,
  Lightbulb,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  Package
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Dashboard } from './Dashboard';
import { Mascotas } from './Mascotas';
import { Campanas } from './Campanas';
import { Adoptantes } from './Adoptantes';
import { Seguimiento } from './Seguimiento';
import { Feedback } from './Feedback';
import { Tips } from './Tips';
import { Documentos } from './Documentos';
import { Voluntariados } from './Donaciones';
import { Inventario } from './Inventario';
import { Configuracion } from './Configuracion';
import { useApp } from '../context/AppContext';
import { refugioService } from '../services/api';

type Modulo = 'dashboard' | 'mascotas' | 'campanas' | 'donaciones' | 'adoptantes' | 'seguimiento' | 'feedback' | 'tips' | 'documentos' | 'inventario' | 'configuracion';

interface DashboardLayoutProps {
  onCerrarSesion: () => void;
}

export function DashboardLayout({ onCerrarSesion }: DashboardLayoutProps) {
  const { fundaciones } = useApp();
  const fundacionActual = fundaciones[0];

  const [moduloActivo, setModuloActivo] = useState<Modulo>('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [fundacionData, setFundacionData] = useState({
    nombre: '',
    fotoPerfil: ''
  });

  useEffect(() => {
    cargarDatosFundacion();
  }, []);

  const cargarDatosFundacion = async () => {
    try {
      const response = await refugioService.obtenerMiPerfil();
      setFundacionData({
        nombre: response.nombre || 'Fundación',
        fotoPerfil: response.logo || ''
      });
    } catch (error) {
      
      if (fundacionActual) {
        setFundacionData({
          nombre: fundacionActual.nombre || 'Fundación',
          fotoPerfil: fundacionActual.fotoPerfil || ''
        });
      }
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: Heart, label: 'Dashboard' },
    { id: 'mascotas', icon: PawPrint, label: 'Mascotas' },
    { id: 'campanas', icon: Megaphone, label: 'Campañas' },
    { id: 'donaciones', icon: Users, label: 'Voluntariado' },
    { id: 'adoptantes', icon: Users, label: 'Adoptantes' },
    { id: 'seguimiento', icon: ClipboardCheck, label: 'Seguimiento' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
    { id: 'tips', icon: Lightbulb, label: 'Tips' },
    { id: 'documentos', icon: FileText, label: 'Documentos' },
    { id: 'inventario', icon: Package, label: 'Inventario' },
    { id: 'configuracion', icon: Settings, label: 'Configuración' },
  ] as const;

  const renderModulo = () => {
    switch (moduloActivo) {
      case 'dashboard':
        return <Dashboard />;
      case 'mascotas':
        return <Mascotas />;
      case 'campanas':
        return <Campanas />;
      case 'donaciones':
        return <Voluntariados />;
      case 'adoptantes':
        return <Adoptantes />;
      case 'seguimiento':
        return <Seguimiento />;
      case 'feedback':
        return <Feedback />;
      case 'tips':
        return <Tips />;
      case 'documentos':
        return <Documentos />;
      case 'inventario':
        return <Inventario />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header móvil */}
      <div className="lg:hidden bg-white border-b border-border p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium">KokoroPets</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(menuAbierto || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-border z-40 lg:top-0 flex flex-col"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12 border-2 border-purple-200">
                    <AvatarImage src={fundacionData.fotoPerfil} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {fundacionData.nombre ? fundacionData.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'HA'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fundacionData.nombre || 'Fundación'}</p>
                    <p className="text-xs text-muted-foreground truncate">Fundación</p>
                  </div>
                </div>
              </div>
              
              <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = moduloActivo === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setModuloActivo(item.id as Modulo);
                        setMenuAbierto(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
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
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay móvil */}
        {menuAbierto && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMenuAbierto(false)}
          />
        )}

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
