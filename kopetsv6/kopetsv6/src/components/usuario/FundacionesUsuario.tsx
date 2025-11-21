import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Star, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { refugioPublicoService, resenaRefugioService } from '../../services/api';

interface Refugio {
  user: number;
  nombre: string;
  descripcion: string;
  anio_fundacion: number | null;
  logo: string;
  portada: string;
  direccion: string;
  ciudad: string;
  region: string;
  horario_atencion: string;
  contactos: Array<{
    id: number;
    tipo: string;
    valor: string;
    principal: boolean;
  }>;
  calificacion_promedio: number;
  total_resenas: number;
  total_mascotas: number;
}

interface Resena {
  id: number;
  refugio: number;
  usuario: number;
  usuario_nombre: string;
  calificacion: number;
  comentario: string;
  respondido: boolean;
  respuesta: string;
}

export function FundacionesUsuario() {
  const [refugios, setRefugios] = useState<Refugio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogResena, setDialogResena] = useState(false);
  const [dialogVerResenas, setDialogVerResenas] = useState(false);
  const [refugioSeleccionado, setRefugioSeleccionado] = useState<Refugio | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargandoResenas, setCargandoResenas] = useState(false);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarRefugios();
  }, []);

  const cargarRefugios = async () => {
    try {
      setCargando(true);
      const response = await refugioPublicoService.listar();
      const data = Array.isArray(response) ? response : (response.results || []);
      setRefugios(data);
    } catch (error) {
      console.error('Error al cargar refugios:', error);
      toast.error('Error al cargar refugios');
      setRefugios([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarResenas = async (refugioId: number) => {
    try {
      setCargandoResenas(true);
      const response = await resenaRefugioService.listar(refugioId);
      const data = Array.isArray(response) ? response : (response.results || []);
      setResenas(data);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
      toast.error('Error al cargar reseñas');
      setResenas([]);
    } finally {
      setCargandoResenas(false);
    }
  };

  const handleSubmitResena = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (calificacion === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    if (!refugioSeleccionado) return;

    try {
      setEnviando(true);
      await resenaRefugioService.crear({
        refugio: refugioSeleccionado.user,
        calificacion,
        comentario
      });
      
      toast.success('¡Gracias por tu reseña!');
      setDialogResena(false);
      setCalificacion(0);
      setComentario('');
      await cargarRefugios();
    } catch (error: any) {
      console.error('Error al enviar reseña:', error);
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        toast.error('Ya has dejado una reseña para este refugio');
      } else {
        toast.error('Error al enviar reseña');
      }
    } finally {
      setEnviando(false);
    }
  };

  const renderEstrellas = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <Star
            key={estrella}
            className={`w-5 h-5 ${interactive ? 'cursor-pointer' : ''} ${
              estrella <= (interactive ? calificacion : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
            onClick={() => interactive && setCalificacion(estrella)}
          />
        ))}
      </div>
    );
  };

  const getTelefono = (refugio: Refugio) => {
    const telefono = refugio.contactos.find(c => c.tipo === 'TELEFONO' || c.tipo === 'WHATSAPP');
    return telefono?.valor || 'No disponible';
  };

  const getEmail = (refugio: Refugio) => {
    const email = refugio.contactos.find(c => c.tipo === 'EMAIL');
    return email?.valor || 'No disponible';
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando refugios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Refugios</h1>
        <p className="text-muted-foreground">Conoce las organizaciones que hacen posible las adopciones</p>
      </div>

      {refugios.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay refugios disponibles</h3>
            <p className="text-muted-foreground">Vuelve pronto para conocer nuevas organizaciones.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {refugios.map((refugio, index) => (
            <motion.div
              key={refugio.user}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {refugio.portada && (
                  <div className="h-48 relative">
                    <img 
                      src={refugio.portada} 
                      alt={refugio.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-white text-xl font-bold mb-1">{refugio.nombre}</h3>
                      <div className="flex items-center gap-2">
                        {renderEstrellas(refugio.calificacion_promedio)}
                        <button 
                          className="text-sm hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRefugioSeleccionado(refugio);
                            cargarResenas(refugio.user);
                            setDialogVerResenas(true);
                          }}
                        >
                          ({refugio.total_resenas} reseñas)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <CardHeader>
                  <CardTitle>{refugio.nombre}</CardTitle>
                  <p className="text-sm text-muted-foreground">{refugio.descripcion}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{refugio.ciudad}, {refugio.region}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{getTelefono(refugio)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{getEmail(refugio)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-2xl text-purple-600 font-bold">{refugio.total_mascotas}</p>
                      <p className="text-xs text-muted-foreground">Mascotas</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl text-green-600 font-bold">{refugio.calificacion_promedio.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Calificación</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setRefugioSeleccionado(refugio);
                      setDialogResena(true);
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Dejar Reseña
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog Reseña */}
      <Dialog open={dialogResena} onOpenChange={setDialogResena}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dejar una Reseña</DialogTitle>
            <DialogDescription>
              Comparte tu experiencia con {refugioSeleccionado?.nombre}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitResena} className="space-y-4">
            <div className="space-y-2">
              <Label>Calificación *</Label>
              <div className="flex justify-center">
                {renderEstrellas(0, true)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comentario">Comentario</Label>
              <Textarea
                id="comentario"
                rows={4}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Comparte tu experiencia..."
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar Reseña'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogResena(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Reseñas */}
      <Dialog open={dialogVerResenas} onOpenChange={setDialogVerResenas}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Reseñas de {refugioSeleccionado?.nombre}
            </DialogTitle>
            <DialogDescription>
              Calificación promedio: {refugioSeleccionado?.calificacion_promedio.toFixed(1)} ★ 
              ({refugioSeleccionado?.total_resenas} reseñas)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {cargandoResenas ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : resenas.length > 0 ? (
              <div className="space-y-4">
                {resenas.map((resena) => (
                  <div key={resena.id} className="p-4 border rounded-lg space-y-2 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{resena.usuario_nombre}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {renderEstrellas(resena.calificacion)}
                        </div>
                      </div>
                    </div>
                    {resena.comentario && (
                      <p className="text-sm text-muted-foreground">{resena.comentario}</p>
                    )}
                    
                    {/* Mostrar respuesta del refugio si existe */}
                    {resena.respondido && resena.respuesta && (
                      <div className="mt-3 pl-4 border-l-2 border-purple-500 bg-purple-50 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 mb-1">
                          Respuesta del refugio:
                        </p>
                        <p className="text-sm text-purple-800">{resena.respuesta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Aún no hay reseñas para este refugio</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}