import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Calendar, MapPin, Clock, CheckCircle2, Search, Users, 
  CalendarCheck, XCircle, AlertTriangle, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { eventoVoluntariadoService, inscripcionVoluntariadoService } from '../../services/api';

interface Evento {
  id: number;
  refugio: number;
  refugio_nombre: string;
  refugio_ciudad: string;
  titulo: string;
  descripcion: string;
  fecha_evento: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  cupos_disponibles: number;
  cupos_ocupados: number;
  cupos_restantes: number;
  esta_lleno: boolean;
  ya_paso: boolean;
  estado: string;
  imagen: string | null;
  total_inscritos: number;
  usuario_inscrito: boolean;
}

interface MiVoluntariado {
  id: number;
  evento: number;
  usuario: number;
  usuario_nombre: string;
  usuario_email: string;
  fecha_inscripcion: string;
  estado: string;
  comentario: string;
  notas_refugio: string;
}

export function VoluntariadoUsuario() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [misVoluntariados, setMisVoluntariados] = useState<MiVoluntariado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tabActiva, setTabActiva] = useState('disponibles');
  
  // Dialogs
  const [dialogInscripcion, setDialogInscripcion] = useState(false);
  const [dialogCancelar, setDialogCancelar] = useState(false);
  const [dialogDetalle, setDialogDetalle] = useState(false);
  
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [eventosData, misVoluntariadosData] = await Promise.all([
        eventoVoluntariadoService.listar(),
        inscripcionVoluntariadoService.misVoluntariados()
      ]);
      
      setEventos(Array.isArray(eventosData) ? eventosData : eventosData.results || []);
      setMisVoluntariados(Array.isArray(misVoluntariadosData) ? misVoluntariadosData : misVoluntariadosData.results || []);
    } catch (error) {
      toast.error('Error al cargar datos');
      setEventos([]);
      setMisVoluntariados([]);
    } finally {
      setCargando(false);
    }
  };

  const eventosDisponibles = eventos.filter(e => {
    const matchBusqueda = 
      e.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.ubicacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.refugio_nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    return matchBusqueda && e.estado === 'ACTIVO' && !e.ya_paso;
  });

  const estadisticas = {
    disponibles: eventos.filter(e => e.estado === 'ACTIVO' && !e.ya_paso && !e.usuario_inscrito).length,
    inscritos: misVoluntariados.filter(m => m.estado === 'INSCRITO').length,
    completados: misVoluntariados.filter(m => m.estado === 'ASISTIO').length,
    total: misVoluntariados.length
  };

  const handleInscribirse = async () => {
    if (!eventoSeleccionado) return;
    
    try {
      await eventoVoluntariadoService.inscribirse(eventoSeleccionado.id, comentario);
      toast.success('¡Te has inscrito exitosamente!');
      await cargarDatos();
      setDialogInscripcion(false);
      setEventoSeleccionado(null);
      setComentario('');
    } catch (error: any) {
      toast.error(error.message || 'Error al inscribirse');
    }
  };

  const handleCancelarInscripcion = async () => {
    if (!eventoSeleccionado) return;
    
    try {
      await eventoVoluntariadoService.cancelarInscripcion(eventoSeleccionado.id);
      toast.success('Inscripción cancelada');
      await cargarDatos();
      setDialogCancelar(false);
      setEventoSeleccionado(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar inscripción');
    }
  };

  const getEstadoInscripcionBadge = (estado: string): ReactNode => {
    const badges: Record<string, ReactNode> = {
      INSCRITO: <Badge className="bg-blue-500">Inscrito</Badge>,
      ASISTIO: <Badge className="bg-green-500">Asistió</Badge>,
      NO_ASISTIO: <Badge className="bg-red-500">No Asistió</Badge>,
      CANCELADO: <Badge variant="outline">Cancelado</Badge>
    };
    return badges[estado] || <Badge>{estado}</Badge>;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando voluntariados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Voluntariado</h1>
        <p className="text-muted-foreground mt-1">Ayuda a las mascotas con tu tiempo y dedicación</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <CalendarCheck className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-sm font-medium text-green-700">Disponibles</p>
            <p className="text-2xl font-bold text-green-700">{estadisticas.disponibles}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Inscritos</p>
            <p className="text-2xl font-bold text-blue-700">{estadisticas.inscritos}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <p className="text-sm font-medium text-purple-700">Completados</p>
            <p className="text-2xl font-bold text-purple-700">{estadisticas.completados}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <p className="text-sm font-medium text-orange-700">Total</p>
            <p className="text-2xl font-bold text-orange-700">{estadisticas.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div>
        <Input
          placeholder="Buscar por título, ubicación o refugio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-12 border-2 focus:border-green-500"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="disponibles" onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
          <TabsTrigger value="disponibles" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            Eventos Disponibles
          </TabsTrigger>
          <TabsTrigger value="mis-voluntariados" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Mis Voluntariados
          </TabsTrigger>
        </TabsList>

        {/* Tab Eventos Disponibles */}
        <TabsContent value="disponibles" className="mt-6">
          {eventosDisponibles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventosDisponibles.map((evento) => (
                <Card key={evento.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 relative">
                  {evento.usuario_inscrito && (
                    <Badge className="absolute top-4 right-4 bg-green-500 text-white z-10">
                      Inscrito
                    </Badge>
                  )}
                  {evento.esta_lleno && !evento.usuario_inscrito && (
                    <Badge className="absolute top-4 right-4 bg-orange-500 text-white z-10">
                      Completo
                    </Badge>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{evento.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">🏠 {evento.refugio_nombre}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm line-clamp-2">{evento.descripcion}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(evento.fecha_evento).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{evento.hora_inicio} - {evento.hora_fin}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{evento.ubicacion}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>
                          {evento.cupos_ocupados} / {evento.cupos_disponibles} inscritos
                          {evento.cupos_restantes > 0 && (
                            <span className="text-green-600 ml-1">
                              ({evento.cupos_restantes} disponibles)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    {evento.usuario_inscrito ? (
                      <div className="w-full space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full text-green-600 border-green-600" 
                          disabled
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Ya estás inscrito
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setEventoSeleccionado(evento);
                            setDialogCancelar(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar inscripción
                        </Button>
                      </div>
                    ) : evento.esta_lleno ? (
                      <Button variant="outline" className="w-full" disabled>
                        Sin cupos disponibles
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        onClick={() => {
                          setEventoSeleccionado(evento);
                          setDialogInscripcion(true);
                        }}
                      >
                        Participar
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-16 text-center border-2 border-dashed">
              <CalendarCheck className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No hay eventos disponibles</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Vuelve pronto para ver nuevos voluntariados</p>
            </Card>
          )}
        </TabsContent>

        {/* Tab Mis Voluntariados */}
        <TabsContent value="mis-voluntariados" className="mt-6">
          {misVoluntariados.length > 0 ? (
            <div className="space-y-4">
              {misVoluntariados.map((inscripcion) => {
                const evento = eventos.find(e => e.id === inscripcion.evento);
                
                return (
                  <Card key={inscripcion.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {evento?.titulo || `Evento #${inscripcion.evento}`}
                            </h4>
                            {getEstadoInscripcionBadge(inscripcion.estado)}
                          </div>
                          
                          {evento && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(evento.fecha_evento).toLocaleDateString('es-ES', { 
                                    weekday: 'long', 
                                    day: 'numeric', 
                                    month: 'long' 
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{evento.hora_inicio} - {evento.hora_fin}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{evento.ubicacion}</span>
                              </div>
                              <p className="text-xs mt-2">
                                🏠 {evento.refugio_nombre}
                              </p>
                            </div>
                          )}
                          
                          {inscripcion.comentario && (
                            <p className="text-sm italic text-muted-foreground mt-2">
                              "{inscripcion.comentario}"
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            Inscrito el {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        
                        {inscripcion.estado === 'INSCRITO' && evento && !evento.ya_paso && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setEventoSeleccionado(evento);
                              setDialogCancelar(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-16 text-center border-2 border-dashed">
              <Heart className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No tienes voluntariados</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                ¡Inscríbete en un evento para ayudar a las mascotas!
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Inscripción */}
      <Dialog open={dialogInscripcion} onOpenChange={setDialogInscripcion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participar en Voluntariado</DialogTitle>
            <DialogDescription>
              {eventoSeleccionado && `Inscríbete en "${eventoSeleccionado.titulo}"`}
            </DialogDescription>
          </DialogHeader>
          
          {eventoSeleccionado && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(eventoSeleccionado.fecha_evento).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{eventoSeleccionado.hora_inicio} - {eventoSeleccionado.hora_fin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{eventoSeleccionado.ubicacion}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentario">Comentario o motivación (opcional)</Label>
                <Textarea
                  id="comentario"
                  rows={3}
                  placeholder="Cuéntanos por qué quieres participar..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="border-2"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleInscribirse}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Participación
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDialogInscripcion(false);
                    setComentario('');
                  }}
                  className="border-2"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Cancelar Inscripción */}
      <AlertDialog open={dialogCancelar} onOpenChange={setDialogCancelar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              ¿Cancelar inscripción?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vas a cancelar tu inscripción en
              <span className="font-semibold"> "{eventoSeleccionado?.titulo}"</span>.
              Podrás volver a inscribirte si hay cupos disponibles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelarInscripcion}
              className="bg-red-500 hover:bg-red-600"
            >
              Sí, cancelar inscripción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}