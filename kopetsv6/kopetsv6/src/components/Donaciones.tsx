import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Calendar, MapPin, Clock, Plus, Edit, Trash2, Users, CalendarCheck, 
  Eye, CheckCircle, XCircle, Search, AlertTriangle, UserCheck, UserX,
  CalendarX, CalendarClock
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
} from './ui/alert-dialog';
import { eventoVoluntariadoService, inscripcionVoluntariadoService } from '../services/api';

interface Inscripcion {
  id: number;
  usuario: number;
  usuario_nombre: string;
  usuario_email: string;
  usuario_telefono: string;
  fecha_inscripcion: string;
  estado: string;
  comentario: string;
  notas_refugio: string;
}

interface Evento {
  id: number;
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
  requisitos: string;
  imagen: string | null;
  inscripciones: Inscripcion[];
  fecha_creacion: string;
}

export function Voluntariados() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  
  const [dialogCrear, setDialogCrear] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [dialogInscritos, setDialogInscritos] = useState(false);
  const [dialogEliminar, setDialogEliminar] = useState(false);
  const [dialogAsistencia, setDialogAsistencia] = useState(false);
  
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [inscripcionSeleccionada, setInscripcionSeleccionada] = useState<Inscripcion | null>(null);
  
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_evento: '',
    hora_inicio: '',
    hora_fin: '',
    ubicacion: '',
    cupos_disponibles: '',
    requisitos: '',
    imagen: null as File | null
  });

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setCargando(true);
      const data = await eventoVoluntariadoService.listar();
      setEventos(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error('Error al cargar eventos');
      setEventos([]);
    } finally {
      setCargando(false);
    }
  };

  const eventosFiltrados = eventos.filter(e => {
    const matchBusqueda = 
      e.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.ubicacion.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchEstado = filtroEstado === 'todos' || e.estado === filtroEstado.toUpperCase();
    
    return matchBusqueda && matchEstado;
  });

  const estadisticas = {
    total: eventos.length,
    activos: eventos.filter(e => e.estado === 'ACTIVO').length,
    finalizados: eventos.filter(e => e.estado === 'FINALIZADO').length,
    cancelados: eventos.filter(e => e.estado === 'CANCELADO').length,
    totalInscritos: eventos.reduce((sum, e) => sum + e.cupos_ocupados, 0),
    cuposDisponibles: eventos.filter(e => e.estado === 'ACTIVO').reduce((sum, e) => sum + e.cupos_restantes, 0)
  };

  const limpiarFormulario = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_evento: '',
      hora_inicio: '',
      hora_fin: '',
      ubicacion: '',
      cupos_disponibles: '',
      requisitos: '',
      imagen: null
    });
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await eventoVoluntariadoService.crear(formData);
      toast.success('Evento creado exitosamente');
      await cargarEventos();
      setDialogCrear(false);
      limpiarFormulario();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear evento');
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoSeleccionado) return;
    
    try {
      await eventoVoluntariadoService.actualizar(eventoSeleccionado.id, formData);
      toast.success('Evento actualizado exitosamente');
      await cargarEventos();
      setDialogEditar(false);
      limpiarFormulario();
      setEventoSeleccionado(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar evento');
    }
  };

  const handleEliminar = async () => {
    if (!eventoSeleccionado) return;
    
    try {
      await eventoVoluntariadoService.eliminar(eventoSeleccionado.id);
      toast.success('Evento eliminado');
      await cargarEventos();
      setDialogEliminar(false);
      setEventoSeleccionado(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar evento');
    }
  };

  const handleCancelarEvento = async (evento: Evento) => {
    toast('¿Estás seguro de cancelar este evento?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Cancelar evento',
        onClick: async () => {
          try {
            await eventoVoluntariadoService.cancelar(evento.id);
            toast.success('Evento cancelado');
            await cargarEventos();
          } catch (error: any) {
            toast.error(error.message || 'Error al cancelar evento');
          }
        }
      },
      cancel: {
        label: 'Volver',
        onClick: () => {}
      }
    });
  };

  const handleFinalizarEvento = async (evento: Evento) => {
    toast('¿Estás seguro de finalizar este evento?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Finalizar',
        onClick: async () => {
          try {
            await eventoVoluntariadoService.finalizar(evento.id);
            toast.success('Evento finalizado');
            await cargarEventos();
          } catch (error: any) {
            toast.error(error.message || 'Error al finalizar evento');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handleMarcarAsistencia = async (asistio: boolean) => {
    if (!inscripcionSeleccionada) return;
    
    try {
      await inscripcionVoluntariadoService.marcarAsistencia(
        inscripcionSeleccionada.id,
        asistio
      );
      toast.success(`Marcado como: ${asistio ? 'Asistió' : 'No asistió'}`);
      await cargarEventos();
      setDialogAsistencia(false);
      
      
      if (eventoSeleccionado) {
        const eventoActualizado = eventos.find(e => e.id === eventoSeleccionado.id);
        if (eventoActualizado) {
          setEventoSeleccionado(eventoActualizado);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar asistencia');
    }
  };

  const abrirDialogEditar = (evento: Evento) => {
    setEventoSeleccionado(evento);
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha_evento: evento.fecha_evento,
      hora_inicio: evento.hora_inicio,
      hora_fin: evento.hora_fin,
      ubicacion: evento.ubicacion,
      cupos_disponibles: evento.cupos_disponibles.toString(),
      requisitos: evento.requisitos || '',
      imagen: null
    });
    setDialogEditar(true);
  };

  const abrirDialogInscritos = async (evento: Evento) => {
    try {
      const eventoDetalle = await eventoVoluntariadoService.obtener(evento.id);
      setEventoSeleccionado(eventoDetalle);
      setDialogInscritos(true);
    } catch (error) {
      toast.error('Error al cargar inscritos');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, ReactNode> = {
      ACTIVO: <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>,
      FINALIZADO: <Badge className="bg-blue-500 hover:bg-blue-600">Finalizado</Badge>,
      CANCELADO: <Badge className="bg-red-500 hover:bg-red-600">Cancelado</Badge>
    };
    return badges[estado] || <Badge>{estado}</Badge>;
  };

  const getEstadoInscripcionBadge = (estado: string) => {
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Voluntariado</h1>
          <p className="text-muted-foreground mt-1">Crea y administra eventos de voluntariado</p>
        </div>
        <Button 
          onClick={() => setDialogCrear(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Voluntariado
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <CalendarCheck className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-purple-600">{estadisticas.total}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-sm font-medium text-green-700">Activos</p>
            <p className="text-2xl font-bold text-green-700">{estadisticas.activos}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <CalendarClock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-sm font-medium text-blue-700">Finalizados</p>
            <p className="text-2xl font-bold text-blue-700">{estadisticas.finalizados}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <CalendarX className="w-5 h-5 mx-auto mb-1 text-red-600" />
            <p className="text-sm font-medium text-red-700">Cancelados</p>
            <p className="text-2xl font-bold text-red-700">{estadisticas.cancelados}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <p className="text-sm font-medium text-orange-700">Inscritos</p>
            <p className="text-2xl font-bold text-orange-700">{estadisticas.totalInscritos}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-cyan-200 bg-cyan-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
            <p className="text-sm font-medium text-cyan-700">Cupos Disp.</p>
            <p className="text-2xl font-bold text-cyan-700">{estadisticas.cuposDisponibles}</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="         Buscar por título o ubicación..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-12 h-12 border-2 focus:border-purple-500"
        />
      </div>

      {/* Tabs de filtro */}
      <Tabs defaultValue="todos" onValueChange={setFiltroEstado}>
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger value="todos" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Todos
          </TabsTrigger>
          <TabsTrigger value="activo" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            Activos
          </TabsTrigger>
          <TabsTrigger value="finalizado" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Finalizados
          </TabsTrigger>
          <TabsTrigger value="cancelado" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            Cancelados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filtroEstado} className="mt-6">
          {eventosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {eventosFiltrados.map((evento) => (
                <Card key={evento.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {evento.titulo}
                        </CardTitle>
                        <div className="flex gap-2">
                          {getEstadoBadge(evento.estado)}
                          {evento.esta_lleno && evento.estado === 'ACTIVO' && (
                            <Badge className="bg-orange-500">Completo</Badge>
                          )}
                          {evento.ya_paso && evento.estado === 'ACTIVO' && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              Ya pasó
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {evento.estado === 'ACTIVO' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDialogEditar(evento)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEventoSeleccionado(evento);
                                setDialogEliminar(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{evento.descripcion}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(evento.fecha_evento).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
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
                          {evento.cupos_restantes > 0 && evento.estado === 'ACTIVO' && (
                            <span className="text-green-600 ml-1">
                              ({evento.cupos_restantes} disponibles)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 flex-wrap pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => abrirDialogInscritos(evento)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Inscritos ({evento.cupos_ocupados})
                    </Button>
                    
                    {evento.estado === 'ACTIVO' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFinalizarEvento(evento)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Finalizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelarEvento(evento)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-16 text-center border-2 border-dashed">
              <CalendarCheck className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No hay eventos en esta categoría</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Crea tu primer evento de voluntariado</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Crear */}
      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Crear nuevo voluntariado</DialogTitle>
            <DialogDescription>
              Completa la información del evento de voluntariado
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del evento *</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Jornada de Limpieza del Refugio"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  className="border-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe las actividades y lo que harán los voluntarios..."
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_evento">Fecha *</Label>
                  <Input
                    id="fecha_evento"
                    type="date"
                    value={formData.fecha_evento}
                    onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                    required
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora inicio *</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    required
                    className="border-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_fin">Hora fin *</Label>
                  <Input
                    id="hora_fin"
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                    required
                    className="border-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación *</Label>
                <Input
                  id="ubicacion"
                  placeholder="Dirección completa del evento"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  required
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cupos_disponibles">Cupos disponibles *</Label>
                <Input
                  id="cupos_disponibles"
                  type="number"
                  min="1"
                  placeholder="Número de voluntarios necesarios"
                  value={formData.cupos_disponibles}
                  onChange={(e) => setFormData({ ...formData, cupos_disponibles: e.target.value })}
                  required
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requisitos">Requisitos (opcional)</Label>
                <Textarea
                  id="requisitos"
                  placeholder="Requisitos para participar: edad mínima, habilidades, etc."
                  rows={3}
                  value={formData.requisitos}
                  onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                  className="border-2"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Crear Voluntariado
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setDialogCrear(false);
                  limpiarFormulario();
                }} className="border-2">
                  Cancelar
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogEditar} onOpenChange={setDialogEditar}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar voluntariado</DialogTitle>
            <DialogDescription>
              Modifica la información del evento
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <form onSubmit={handleEditar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-titulo">Título del evento *</Label>
                <Input
                  id="edit-titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  className="border-2"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-descripcion">Descripción *</Label>
                <Textarea
                  id="edit-descripcion"
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fecha_evento">Fecha *</Label>
                  <Input
                    id="edit-fecha_evento"
                    type="date"
                    value={formData.fecha_evento}
                    onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                    required
                    className="border-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-hora_inicio">Hora inicio *</Label>
                  <Input
                    id="edit-hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    required
                    className="border-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hora_fin">Hora fin *</Label>
                  <Input
                    id="edit-hora_fin"
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                    required
                    className="border-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ubicacion">Ubicación *</Label>
                <Input
                  id="edit-ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  required
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cupos_disponibles">Cupos totales *</Label>
                <Input
                  id="edit-cupos_disponibles"
                  type="number"
                  min={eventoSeleccionado?.cupos_ocupados || 1}
                  value={formData.cupos_disponibles}
                  onChange={(e) => setFormData({ ...formData, cupos_disponibles: e.target.value })}
                  required
                  className="border-2"
                />
                {eventoSeleccionado && eventoSeleccionado.cupos_ocupados > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {eventoSeleccionado.cupos_ocupados} (inscritos actuales)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-requisitos">Requisitos (opcional)</Label>
                <Textarea
                  id="edit-requisitos"
                  rows={3}
                  value={formData.requisitos}
                  onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                  className="border-2"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Guardar Cambios
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setDialogEditar(false);
                  limpiarFormulario();
                  setEventoSeleccionado(null);
                }} className="border-2">
                  Cancelar
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog Inscritos */}
      <Dialog open={dialogInscritos} onOpenChange={setDialogInscritos}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Voluntarios Inscritos</DialogTitle>
            <DialogDescription>
              {eventoSeleccionado?.titulo}
            </DialogDescription>
          </DialogHeader>
          
          {eventoSeleccionado && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">
                      {eventoSeleccionado.cupos_ocupados} de {eventoSeleccionado.cupos_disponibles} cupos ocupados
                    </span>
                  </div>
                  {eventoSeleccionado.cupos_restantes > 0 ? (
                    <Badge className="bg-green-500">
                      {eventoSeleccionado.cupos_restantes} disponibles
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-500">Completo</Badge>
                  )}
                </div>

                {(!eventoSeleccionado.inscripciones || eventoSeleccionado.inscripciones.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No hay voluntarios inscritos aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventoSeleccionado.inscripciones
                      .filter(i => i.estado !== 'CANCELADO')
                      .map((inscripcion) => (
                      <Card key={inscripcion.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{inscripcion.usuario_nombre || 'Sin nombre'}</h4>
                                {getEstadoInscripcionBadge(inscripcion.estado)}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>📧 {inscripcion.usuario_email}</p>
                                {inscripcion.usuario_telefono && (
                                  <p>📱 {inscripcion.usuario_telefono}</p>
                                )}
                                {inscripcion.comentario && (
                                  <p className="mt-2 italic">"{inscripcion.comentario}"</p>
                                )}
                                <p className="text-xs">
                                  Inscrito el {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                            </div>
                            
                            {inscripcion.estado === 'INSCRITO' && eventoSeleccionado.estado !== 'CANCELADO' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setInscripcionSeleccionada(inscripcion);
                                    setDialogAsistencia(true);
                                  }}
                                  className="text-xs"
                                >
                                  Marcar Asistencia
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Marcar Asistencia */}
      <Dialog open={dialogAsistencia} onOpenChange={setDialogAsistencia}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar Asistencia</DialogTitle>
            <DialogDescription>
              {inscripcionSeleccionada?.usuario_nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿El voluntario asistió al evento?
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => handleMarcarAsistencia(true)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Sí Asistió
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleMarcarAsistencia(false)}
              >
                <UserX className="w-4 h-4 mr-2" />
                No Asistió
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <AlertDialog open={dialogEliminar} onOpenChange={setDialogEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              ¿Eliminar voluntariado?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el evento
              <span className="font-semibold"> "{eventoSeleccionado?.titulo}"</span>
              {eventoSeleccionado && eventoSeleccionado.cupos_ocupados > 0 && (
                <span className="block mt-2 text-orange-600">
                  ⚠️ Hay {eventoSeleccionado.cupos_ocupados} voluntario(s) inscrito(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEliminar}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}