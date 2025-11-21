import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { CheckCircle, XCircle, Clock, Heart, Building, Calendar, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { solicitudAdopcionService } from '../../services/api';

interface Solicitud {
  id: number;
  mascota: number;
  mascota_nombre: string;
  mascota_foto: string;
  mascota_tipo: string;
  mascota_raza: string;
  mascota_edad: string;
  refugio_nombre: string;
  refugio_ciudad: string;
  estado: string;
  mensaje: string;
  motivo_rechazo: string;
  created_at: string;
  updated_at: string;
  whatsapp: string;
}

export function MisSolicitudesUsuario() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const data = await solicitudAdopcionService.listar();
      setSolicitudes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error('Error al cargar solicitudes');
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badge: <Badge className="bg-green-500">Aprobada</Badge>,
          mensaje: '¡Felicitaciones! Tu solicitud ha sido aprobada.'
        };
      case 'RECHAZADA':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badge: <Badge className="bg-red-500">Rechazada</Badge>,
          mensaje: 'Tu solicitud no fue aprobada en esta ocasión.'
        };
      case 'CANCELADA':
        return {
          icon: X,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badge: <Badge className="bg-gray-500">Cancelada</Badge>,
          mensaje: 'Cancelaste esta solicitud.'
        };
      case 'EN_REVISION':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badge: <Badge className="bg-blue-500">En Revisión</Badge>,
          mensaje: 'La fundación está revisando tu solicitud.'
        };
      default:
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badge: <Badge className="bg-yellow-500">Pendiente</Badge>,
          mensaje: 'La fundación está evaluando tu solicitud.'
        };
    }
  };

  const contactarFundacion = (solicitud: Solicitud) => {
    if (!solicitud.whatsapp) {
      toast.error('No hay WhatsApp disponible');
      return;
    }
    const mensaje = `Hola, me contacto por mi solicitud de adopción de ${solicitud.mascota_nombre}`;
    window.open(`https://wa.me/${solicitud.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const cancelarSolicitud = async (id: number) => {
    toast('¿Cancelar solicitud?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Sí, cancelar',
        onClick: async () => {
          try {
            await solicitudAdopcionService.cancelar(id);
            toast.success('Solicitud cancelada');
            await cargarSolicitudes();
          } catch (error) {
            toast.error('Error al cancelar solicitud');
          }
        }
      },
      cancel: {
        label: 'No',
        onClick: () => {}
      }
    });
  };

  const getEdadTexto = (edad: string) => {
    const edades: Record<string, string> = {
      CACHORRO: 'Cachorro',
      JOVEN: 'Joven',
      ADULTO: 'Adulto',
      SENIOR: 'Senior'
    };
    return edades[edad] || edad;
  };

  if (cargando) {
    return <div className="text-center py-12">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Mis Solicitudes de Adopción</h1>
        <p className="text-muted-foreground">Revisa el estado de tus solicitudes</p>
      </div>

      {solicitudes.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="mb-2">No tienes solicitudes de adopción</h3>
          <p className="text-muted-foreground mb-4">
            Explora las mascotas disponibles y envía tu primera solicitud
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {solicitudes.map((solicitud, index) => {
            const estadoConfig = getEstadoConfig(solicitud.estado);
            const Icon = estadoConfig.icon;

            return (
              <motion.div
                key={solicitud.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`overflow-hidden border-2 ${estadoConfig.borderColor}`}>
                  <CardHeader className={`${estadoConfig.bgColor}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full bg-white ${estadoConfig.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Solicitud para {solicitud.mascota_nombre}
                            {estadoConfig.badge}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {estadoConfig.mensaje}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    {/* Información de la mascota */}
                    <div className="flex gap-4">
                      {solicitud.mascota_foto ? (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img 
                            src={solicitud.mascota_foto} 
                            alt={solicitud.mascota_nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
                          Sin foto
                        </div>
                      )}
                      <div className="flex-1">
                        <h4>{solicitud.mascota_nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {solicitud.mascota_tipo} • {solicitud.mascota_raza} • {getEdadTexto(solicitud.mascota_edad)}
                        </p>
                        {solicitud.mensaje && (
                          <p className="text-sm mt-2 line-clamp-2 text-muted-foreground italic">
                            "{solicitud.mensaje}"
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Información de la fundación */}
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-purple-600">{solicitud.refugio_nombre}</p>
                        <p className="text-muted-foreground text-xs">{solicitud.refugio_ciudad}</p>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Solicitud enviada:{' '}
                          {solicitud.created_at && solicitud.created_at !== '' && solicitud.created_at !== 'null'
                            ? new Date(solicitud.created_at).toLocaleDateString('es-CL')
                            : 'Fecha no disponible'}
                        </span>
                      </div>
                      {solicitud.updated_at && solicitud.updated_at !== solicitud.created_at && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Actualizada: {new Date(solicitud.updated_at).toLocaleDateString('es-CL')}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones según estado */}
                    {solicitud.estado === 'APROBADA' && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                        <p className="text-sm text-green-900">
                          ¡Excelente noticia! La fundación aprobó tu solicitud. 
                          Contacta con ellos para coordinar la adopción.
                        </p>
                        <Button 
                          className="w-full bg-gradient-to-r from-green-500 to-green-600"
                          onClick={() => contactarFundacion(solicitud)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contactar Fundación
                        </Button>
                      </div>
                    )}

                    {solicitud.estado === 'RECHAZADA' && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-900 mb-2 font-semibold">
                          Motivo del rechazo:
                        </p>
                        <p className="text-sm text-red-700 mb-3">
                          {solicitud.motivo_rechazo || 'No se especificó un motivo'}
                        </p>
                        <p className="text-sm text-red-700">
                          No te desanimes, hay muchas otras mascotas esperando un hogar. 
                          Puedes contactar a la fundación para más información.
                        </p>
                      </div>
                    )}

                    {(solicitud.estado === 'PENDIENTE' || solicitud.estado === 'EN_REVISION') && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                        <p className="text-sm text-yellow-900">
                          La fundación está revisando tu solicitud. Te notificaremos cuando 
                          haya una respuesta. Esto puede tomar entre 24-72 horas.
                        </p>
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => cancelarSolicitud(solicitud.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar Solicitud
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}