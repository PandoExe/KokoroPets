import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { PawPrint, Megaphone, Users, Building, Heart, Lightbulb } from 'lucide-react';
import { mascotaFavoritaService, tipFavoritoService, campanaService } from '../../services/api';

interface DashboardHomeUsuarioProps {
  onNavigate: (modulo: string) => void;
}

export function DashboardHomeUsuario({ onNavigate }: DashboardHomeUsuarioProps) {
  const [estadisticas, setEstadisticas] = useState({
    favoritos: 0,
    campanasActivas: 0,
    tipsGuardados: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Cargar favoritos
      const favoritosPromise = mascotaFavoritaService.listar()
        .then((data: any) => {
          // Manejar tanto arrays directos como respuestas paginadas
          if (Array.isArray(data)) {
            return data.length;
          }
          if (data.results && Array.isArray(data.results)) {
            return data.results.length;
          }
          if (data.count !== undefined) {
            return data.count;
          }
          return 0;
        })
        .catch((error) => {
          console.error('Error al cargar favoritos:', error);
          const favs = localStorage.getItem('favoritos');
          return favs ? JSON.parse(favs).length : 0;
        });

      // Cargar tips guardados
      const tipsPromise = tipFavoritoService.listar()
        .then((data: any) => {
          // Manejar tanto arrays directos como respuestas paginadas
          if (Array.isArray(data)) {
            return data.length;
          }
          if (data.results && Array.isArray(data.results)) {
            return data.results.length;
          }
          if (data.count !== undefined) {
            return data.count;
          }
          return 0;
        })
        .catch((error) => {
          console.error('Error al cargar tips favoritos:', error);
          const tips = localStorage.getItem('tips_favoritos');
          return tips ? JSON.parse(tips).length : 0;
        });

      // Cargar campañas activas
      const campanasPromise = campanaService.listar()
        .then((data: any) => {
          const campanasArray = Array.isArray(data) ? data : (data.results || []);
          return campanasArray.filter((c: any) => c.estado === 'ACTIVA').length;
        })
        .catch(() => 0);

      const [favoritos, tipsGuardados, campanasActivas] = await Promise.all([
        favoritosPromise,
        tipsPromise,
        campanasPromise
      ]);

      setEstadisticas({
        favoritos,
        campanasActivas,
        tipsGuardados
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const accesosRapidos = [
    {
      id: 'adopciones',
      titulo: 'Adopciones',
      descripcion: 'Encuentra tu compañero perfecto',
      icono: PawPrint,
      color: 'from-purple-500 to-purple-600',
      imagen: 'https://images.unsplash.com/photo-1738959921784-8e1b93054929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwcGV0fGVufDF8fHx8MTc1OTk5MTk1NHww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'campanas',
      titulo: 'Campañas',
      descripcion: 'Participa en eventos especiales',
      icono: Megaphone,
      color: 'from-pink-500 to-pink-600',
      imagen: 'https://images.unsplash.com/photo-1590862487549-1432ccfb71e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjBzaGVsdGVyJTIwYWRvcHRpb258ZW58MXx8fHwxNzYwMDQwNTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'voluntariado',
      titulo: 'Voluntariado',
      descripcion: 'Ayuda a las mascotas',
      icono: Users,
      color: 'from-green-500 to-green-600',
      imagen: 'https://images.unsplash.com/photo-1728768996484-ae68066041da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2x1bnRlZXIlMjBoZWxwaW5nJTIwYW5pbWFsc3xlbnwxfHx8fDE3NTk5NTQ1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 'fundaciones',
      titulo: 'Fundaciones',
      descripcion: 'Conoce las organizaciones',
      icono: Building,
      color: 'from-purple-500 to-pink-500',
      imagen: 'https://images.unsplash.com/photo-1563460716037-460a3ad24ba9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBjYXJlJTIwZm91bmRhdGlvbnxlbnwxfHx8fDE3NjAwNDA1NDV8MA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const estadisticasDisplay = [
    { titulo: 'Mis Favoritos', valor: estadisticas.favoritos, icono: Heart, color: 'text-pink-500' },
    { titulo: 'Campañas Activas', valor: estadisticas.campanasActivas, icono: Megaphone, color: 'text-purple-500' },
    { titulo: 'Tips Guardados', valor: estadisticas.tipsGuardados, icono: Lightbulb, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">¡Bienvenido a KokoroPets! 🐾</h1>
        <p className="text-muted-foreground mt-2">Encuentra tu compañero perfecto y ayuda a las mascotas</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {estadisticasDisplay.map((stat, index) => {
          const Icon = stat.icono;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.titulo}</p>
                      <p className="text-3xl mt-1">{stat.valor}</p>
                    </div>
                    <Icon className={`w-10 h-10 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accesosRapidos.map((acceso, index) => {
            const Icon = acceso.icono;
            return (
              <motion.div
                key={acceso.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                  onClick={() => onNavigate(acceso.id)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={acceso.imagen} 
                      alt={acceso.titulo}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-5 h-5" />
                        <h3 className="text-white">{acceso.titulo}</h3>
                      </div>
                      <p className="text-sm text-white/90">{acceso.descripcion}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Call to action */}
      <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
        <CardContent className="p-8 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-white text-2xl mb-2">¿Listo para adoptar?</h2>
          <p className="text-white/90 mb-6">Miles de mascotas están esperando un hogar amoroso como el tuyo</p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => onNavigate('adopciones')}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            Ver Mascotas Disponibles
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
