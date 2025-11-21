import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Calendar, Users, Share2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { campanaService } from '../../services/api';

interface Campana {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_kpi: 'PARTICIPANTES' | 'ADOPCIONES' | 'DONACIONES' | 'VISITAS';
  meta_kpi: number;
  valor_actual_kpi: number;
  estado: 'ACTIVA' | 'PAUSADA' | 'FINALIZADA';
  refugio: number;
  refugio_nombre: string;
  progreso_porcentaje: number;
  total_participantes: number;
  usuario_participa: boolean;
  created_at: string;
  updated_at: string;
}

export function CampanasUsuario() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [cargando, setCargando] = useState(true);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [dialogCompartir, setDialogCompartir] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarCampanas();
  }, []);

  const cargarCampanas = async () => {
  try {
    setCargando(true);
    const response = await campanaService.listar();
    
    // El backend puede retornar { results: [...] } o directamente [...]
    const data = Array.isArray(response) ? response : (response.results || []);

    setCampanas(data);
  } catch (error) {
    toast.error('Error al cargar campañas');
    setCampanas([]); // Asegurar que sea array vacío en caso de error
  } finally {
    setCargando(false);
  }
};

  const handleParticipar = async (campana: Campana) => {
    try {
      setProcesando(true);
      const resultado = await campanaService.participar(campana.id);

      if (resultado.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>¡Participación registrada exitosamente!</span>
          </div>
        );
        await cargarCampanas();
      } else if (resultado.message === 'Ya participas en esta campaña') {
        toast.info('Ya estás participando en esta campaña');
      }
    } catch (error: any) {
      console.error('Error al participar:', error);
      if (error.error === 'La campaña no está activa') {
        toast.error('Esta campaña ya no está activa');
      } else {
        toast.error('Error al registrar participación');
      }
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarParticipacion = async (campana: Campana) => {
    toast('¿Cancelar participación?', {
      description: 'Podrás participar nuevamente más tarde.',
      action: {
        label: 'Sí, cancelar',
        onClick: async () => {
          try {
            setProcesando(true);
            const resultado = await campanaService.cancelarParticipacion(campana.id);

            if (resultado.success) {
              toast.success('Participación cancelada');
              await cargarCampanas();
            }
          } catch (error: any) {
            console.error('Error al cancelar participación:', error);
            toast.error(error.message || 'Error al cancelar');
          } finally {
            setProcesando(false);
          }
        }
      },
      cancel: {
        label: 'No',
        onClick: () => {}
      }
    });
  };

  const compartirCampana = (campana: Campana) => {
    const texto = `¡Mira esta campaña de adopción!\n\n${campana.titulo}\n${campana.descripcion}\n\nParticipa en KokoroPets`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWhatsApp, '_blank');
    setDialogCompartir(false);
    toast.success('Compartido exitosamente');
  };

  const estaLlena = (campana: Campana) => {
    if (campana.tipo_kpi === 'PARTICIPANTES') {
      return campana.valor_actual_kpi >= campana.meta_kpi;
    }
    return false;
  };

  const calcularPorcentaje = (campana: Campana) => {
    if (campana.tipo_kpi === 'PARTICIPANTES' && campana.meta_kpi > 0) {
      return (campana.valor_actual_kpi / campana.meta_kpi) * 100;
    }
    return campana.progreso_porcentaje;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campañas Activas</h1>
        <p className="text-muted-foreground">Participa en eventos especiales de adopción</p>
      </div>

      {campanas.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay campañas activas</h3>
            <p className="text-muted-foreground">
              Por el momento no hay campañas disponibles. Vuelve pronto para participar.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campanas.map((campana, index) => {
            const porcentaje = calcularPorcentaje(campana);
            const llena = estaLlena(campana);
            
            return (
              <motion.div
                key={campana.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {campana.imagen && (
                    <div className="relative h-48">
                      <img 
                        src={campana.imagen} 
                        alt={campana.titulo}
                        className="w-full h-full object-cover"
                      />
                      {llena && (
                        <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center">
                          <span className="text-white text-xl font-semibold">Aforo Máximo</span>
                        </div>
                      )}
                      {campana.usuario_participa && !llena && (
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                          Inscrito
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{campana.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      📍 {campana.refugio_nombre}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {campana.descripcion}
                    </p>
                    
                    {campana.tipo_kpi === 'PARTICIPANTES' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            Participantes
                          </span>
                          <span className={llena ? 'text-red-600 font-semibold' : ''}>
                            {campana.valor_actual_kpi} / {campana.meta_kpi}
                          </span>
                        </div>
                        <Progress 
                          value={porcentaje} 
                          className={llena ? '[&>div]:bg-red-500' : '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500'} 
                        />
                      </div>
                    )}

                    {campana.tipo_kpi !== 'PARTICIPANTES' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {campana.tipo_kpi === 'ADOPCIONES' && '🐾 Objetivo: Adopciones'}
                            {campana.tipo_kpi === 'DONACIONES' && '💝 Objetivo: Donaciones'}
                            {campana.tipo_kpi === 'VISITAS' && '👥 Objetivo: Visitas'}
                          </span>
                          <span>
                            {campana.valor_actual_kpi} / {campana.meta_kpi}
                          </span>
                        </div>
                        <Progress 
                          value={porcentaje} 
                          className="[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(campana.fecha_inicio).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })} - {new Date(campana.fecha_fin).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2">
                    {!campana.usuario_participa && !llena && (
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onClick={() => handleParticipar(campana)}
                        disabled={procesando}
                      >
                        {procesando ? 'Procesando...' : 'Participar'}
                      </Button>
                    )}
                    {campana.usuario_participa && (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                          disabled
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ya estás inscrito
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleCancelarParticipacion(campana)}
                          disabled={procesando}
                          title="Cancelar participación"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {llena && !campana.usuario_participa && (
                      <Button variant="outline" className="flex-1 text-red-600 border-red-600" disabled>
                        Aforo Completo
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCampanaSeleccionada(campana);
                        setDialogCompartir(true);
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogCompartir} onOpenChange={setDialogCompartir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir Campaña</DialogTitle>
            <DialogDescription>
              Ayuda a difundir esta campaña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              onClick={() => campanaSeleccionada && compartirCampana(campanaSeleccionada)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir por WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setDialogCompartir(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}