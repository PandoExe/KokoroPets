import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { resenaRefugioService } from '../services/api';

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

export function Feedback() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [cargando, setCargando] = useState(true);
  const [dialogRespuesta, setDialogRespuesta] = useState(false);
  const [resenaSeleccionada, setResenaSeleccionada] = useState<Resena | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarResenas();
  }, []);

  const cargarResenas = async () => {
    try {
      setCargando(true);
      const response = await resenaRefugioService.listar();
      const data = Array.isArray(response) ? response : (response.results || []);
      setResenas(data);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
      toast.error('Error al cargar reseñas');
      setResenas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleResponder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resenaSeleccionada) return;
    
    try {
      setEnviando(true);
      await resenaRefugioService.responder(resenaSeleccionada.id, respuesta);
      
      toast.success('Respuesta enviada correctamente');
      setDialogRespuesta(false);
      setResenaSeleccionada(null);
      setRespuesta('');
      await cargarResenas();
    } catch (error) {
      console.error('Error al responder:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setEnviando(false);
    }
  };

  const renderEstrellas = (calificacion: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((estrella) => (
          <Star
            key={estrella}
            className={`w-5 h-5 ${
              estrella <= calificacion
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const promedioCalificacion = resenas.length > 0
    ? resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length
    : 0;
  const totalResenas = resenas.length;
  const resenasRespondidas = resenas.filter(r => r.respondido).length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reseñas de Usuarios</h1>
        <p className="text-muted-foreground">Gestiona las valoraciones y comentarios recibidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calificación Promedio</p>
                <p className="text-3xl font-medium">{promedioCalificacion.toFixed(1)}</p>
              </div>
              <Star className="w-12 h-12 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Reseñas</p>
                <p className="text-3xl font-medium">{totalResenas}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Respuesta</p>
                <p className="text-3xl font-medium">
                  {totalResenas > 0 ? Math.round((resenasRespondidas / totalResenas) * 100) : 0}%
                </p>
              </div>
              <ThumbsUp className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {resenas.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No hay reseñas registradas</h3>
            <p className="text-muted-foreground">Las reseñas aparecerán aquí cuando los usuarios las envíen</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {resenas.map((resena) => (
            <Card key={resena.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{resena.usuario_nombre}</CardTitle>
                      {resena.respondido && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Respondido
                        </span>
                      )}
                    </div>
                  </div>
                  {renderEstrellas(resena.calificacion)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">{resena.comentario}</p>
                </div>

                {resena.respondido && resena.respuesta && (
                  <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm mb-1 text-purple-900 font-medium">Tu respuesta:</p>
                    <p className="text-sm text-purple-700">{resena.respuesta}</p>
                  </div>
                )}

                {!resena.respondido && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResenaSeleccionada(resena);
                      setDialogRespuesta(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Responder
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogRespuesta} onOpenChange={setDialogRespuesta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Reseña</DialogTitle>
            <DialogDescription>
              {resenaSeleccionada && `Responde a la reseña de ${resenaSeleccionada.usuario_nombre}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResponder} className="space-y-4">
            {resenaSeleccionada && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderEstrellas(resenaSeleccionada.calificacion)}
                </div>
                <p className="text-sm">{resenaSeleccionada.comentario}</p>
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar Respuesta'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogRespuesta(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}