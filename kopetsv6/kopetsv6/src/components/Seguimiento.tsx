import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { 
  Plus, AlertTriangle, CheckCircle, XCircle, Eye, Upload, Clock, 
  Image as ImageIcon, Edit, Trash2, Check, Shield, ShieldAlert, 
  CalendarCheck, TrendingUp 
} from 'lucide-react';
import { toast } from 'sonner';
import { adopcionService, visitaSeguimientoService, fotoVisitaService } from '../services/api';

interface Adopcion {
  id: number;
  mascota_nombre: string;
  mascota_foto: string;
  adoptante_nombre: string;
  adoptante_email: string;
  fecha_adopcion: string;
  fecha_inicio_seguimiento: string | null;
  fecha_fin_seguimiento: string | null;
  estado: 'ACTIVA' | 'ALERTA' | 'COMPLETADA' | 'DEVUELTA' | 'CANCELADA';
  strikes: number;
  max_strikes: number;
  strikes_restantes: number;
  visitas_planificadas: number;
  visitas_realizadas: number;
  progreso: number;
  proxima_visita: string | null;
  seguimiento_activo: boolean;
  notas: string;
  visitas: Visita[];
  puede_agregar_strike: boolean;
  puede_quitar_strike: boolean;
  puede_finalizar: boolean;
}

interface Visita {
  id: number;
  numero_visita: number;
  fecha_programada: string;
  fecha_realizada: string | null;
  resultado: 'PENDIENTE' | 'EXITOSO' | 'REQUIERE_ATENCION' | 'PROBLEMATICO' | 'NO_REALIZADA';
  observaciones: string;
  puntuacion: number | null;
  estado_salud: string | null;
  peso_actual: number | null;
  fotos: FotoVisita[];
  esta_vencida: boolean;
  es_ultima_visita: boolean;
}

interface FotoVisita {
  id: number;
  imagen: string;
  descripcion: string;
  fecha_subida: string;
}

export function Seguimiento() {
  const [dialogVisita, setDialogVisita] = useState(false);
  const [dialogDetalles, setDialogDetalles] = useState(false);
  const [dialogFotos, setDialogFotos] = useState(false);
  const [dialogEditarVisita, setDialogEditarVisita] = useState(false);
  const [dialogMarcarRealizada, setDialogMarcarRealizada] = useState(false);
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<Adopcion | null>(null);
  const [visitaEditando, setVisitaEditando] = useState<Visita | null>(null);
  const [visitaMarcarRealizada, setVisitaMarcarRealizada] = useState<Visita | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [adopciones, setAdopciones] = useState<Adopcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [visitaSeleccionadaFoto, setVisitaSeleccionadaFoto] = useState<number | null>(null);
  const [descripcionFoto, setDescripcionFoto] = useState('');

  const [formVisita, setFormVisita] = useState({
    fecha_programada: '',
  });

  const [formEditarVisita, setFormEditarVisita] = useState({
    fecha_programada: '',
    observaciones: '',
  });

  const [formRealizada, setFormRealizada] = useState({
    resultado: 'EXITOSO' as 'EXITOSO' | 'REQUIERE_ATENCION' | 'PROBLEMATICO',
    observaciones: '',
    puntuacion: 5,
    estado_salud: 'EXCELENTE' as 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'PREOCUPANTE',
    peso_actual: 0
  });

  useEffect(() => {
    cargarAdopciones();
  }, []);

  const cargarAdopciones = async () => {
    try {
      setLoading(true);
      const data = await adopcionService.listar();
      const adopcionesArray = Array.isArray(data) ? data : (data.results || []);

      setAdopciones(adopcionesArray);
    } catch (error) {
      toast.error('Error al cargar adopciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const mapearEstado = (estado: string): 'activo' | 'alerta' | 'completado' | 'critico' => {
    if (estado === 'COMPLETADA') return 'completado';
    if (estado === 'ALERTA' || estado === 'DEVUELTA') return estado === 'DEVUELTA' ? 'critico' : 'alerta';
    return 'activo';
  };

  const adopcionesFiltradas = adopciones.filter(a => {
    if (filtroEstado === 'todos') return true;
    return mapearEstado(a.estado) === filtroEstado;
  });

  const estadisticas = {
    total: adopciones.length,
    activos: adopciones.filter(a => a.estado === 'ACTIVA').length,
    alertas: adopciones.filter(a => a.estado === 'ALERTA').length,
    criticos: adopciones.filter(a => a.estado === 'DEVUELTA').length,
    completados: adopciones.filter(a => a.estado === 'COMPLETADA').length,
  };

  const handleAgregarVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seguimientoSeleccionado) return;
    
    try {
      await visitaSeguimientoService.crear({
        adopcion: seguimientoSeleccionado.id,
        fecha_programada: formVisita.fecha_programada,
        numero_visita: (seguimientoSeleccionado.visitas_planificadas || 0) + 1
      });
      
      toast.success('Visita programada correctamente');
      setDialogVisita(false);
      cargarAdopciones();
      setFormVisita({ fecha_programada: '' });
    } catch (error: any) {
      toast.error(error.message || 'Error al crear visita');
    }
  };

  const handleEditarVisita = (visita: Visita) => {
    setVisitaEditando(visita);
    setFormEditarVisita({
      fecha_programada: visita.fecha_programada,
      observaciones: visita.observaciones || '',
    });
    setDialogEditarVisita(true);
  };

  const handleActualizarVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitaEditando) return;
    
    try {
      await visitaSeguimientoService.actualizar(visitaEditando.id, {
        fecha_programada: formEditarVisita.fecha_programada,
        observaciones: formEditarVisita.observaciones,
      });
      
      toast.success('Visita actualizada correctamente');
      setDialogEditarVisita(false);
      setVisitaEditando(null);
      cargarAdopciones();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar visita');
    }
  };

  const handleEliminarVisita = async (visitaId: number) => {
    toast('¿Estás seguro de eliminar esta visita?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await visitaSeguimientoService.eliminar(visitaId);
            toast.success('Visita eliminada correctamente');
            cargarAdopciones();
          } catch (error) {
            toast.error('Error al eliminar visita');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const abrirDialogMarcarRealizada = (visita: Visita) => {
    setVisitaMarcarRealizada(visita);
    setFormRealizada({
      resultado: 'EXITOSO',
      observaciones: '',
      puntuacion: 5,
      estado_salud: 'EXCELENTE',
      peso_actual: 0
    });
    setDialogMarcarRealizada(true);
  };

  const handleMarcarRealizada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitaMarcarRealizada) return;

    try {
      const response = await visitaSeguimientoService.marcarRealizada(visitaMarcarRealizada.id, {
        resultado: formRealizada.resultado,
        observaciones: formRealizada.observaciones,
        puntuacion: formRealizada.puntuacion,
        estado_salud: formRealizada.estado_salud,
        peso_actual: formRealizada.peso_actual
      });

      // Mensajes personalizados según el resultado
      if (formRealizada.resultado === 'PROBLEMATICO') {
        toast.error(
          <div>
            <p className="font-semibold">⚠️ Visita con problemas detectados</p>
            <p className="text-sm">Strike agregado. Total: {response.strikes}/{seguimientoSeleccionado?.max_strikes || 3}</p>
          </div>
        );
      } else if (formRealizada.resultado === 'EXITOSO') {
        toast.success(
          <div>
            <p className="font-semibold">✅ Visita exitosa registrada</p>
            {response.strikes > 0 && <p className="text-sm">Strike removido. Quedan: {response.strikes}</p>}
          </div>
        );
      } else if (formRealizada.resultado === 'REQUIERE_ATENCION') {
        toast.warning(
          <div>
            <p className="font-semibold">⚠️ Visita requiere atención</p>
            <p className="text-sm">Se recomienda seguimiento cercano</p>
          </div>
        );
      }

      setDialogMarcarRealizada(false);
      setVisitaMarcarRealizada(null);
      cargarAdopciones();
    } catch (error) {
      toast.error('Error al marcar visita como realizada');
    }
  };

  const handleSubirFoto = async () => {
    if (!archivoFoto || !seguimientoSeleccionado || !visitaSeleccionadaFoto) {
      toast.error('Selecciona una visita para la foto');
      return;
    }

    try {
      await fotoVisitaService.subir({
        visita: visitaSeleccionadaFoto,
        imagen: archivoFoto,
        descripcion: descripcionFoto || `Foto de ${seguimientoSeleccionado.mascota_nombre}`
      });

      toast.success('Foto subida correctamente');
      setArchivoFoto(null);
      setFotoPreview(null);
      setVisitaSeleccionadaFoto(null);
      setDescripcionFoto('');
      cargarAdopciones();
    } catch (error) {
      toast.error('Error al subir foto');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoFoto(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setArchivoFoto(null);
      setFotoPreview(null);
    }
  };

  const handleIniciarSeguimiento = async (adopcionId: number) => {
    try {
      await adopcionService.iniciarSeguimiento(adopcionId);
      toast.success('Seguimiento iniciado por 30 días');
      cargarAdopciones();
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar seguimiento');
    }
  };

  const handleAgregarStrike = async (adopcionId: number) => {
    toast('¿Agregar un strike?', {
      description: 'Esto puede afectar el estado del seguimiento.',
      action: {
        label: 'Agregar',
        onClick: async () => {
          try {
            await adopcionService.agregarStrike(adopcionId);
            toast.success('Strike agregado');
            cargarAdopciones();
          } catch (error: any) {
            toast.error(error.message || 'Error al agregar strike');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handleQuitarStrike = async (adopcionId: number) => {
    try {
      await adopcionService.quitarStrike(adopcionId);
      toast.success('Strike eliminado');
      cargarAdopciones();
    } catch (error: any) {
      toast.error(error.message || 'Error al quitar strike');
    }
  };

  const handleFinalizarSeguimiento = async (adopcionId: number) => {
    toast('¿Finalizar seguimiento?', {
      description: 'Solo posible con 100% visitas y 0 strikes.',
      action: {
        label: 'Finalizar',
        onClick: async () => {
          try {
            // Llamar al endpoint correcto según tu API
            const response = await fetch(`http://localhost:8000/api/adopciones/${adopcionId}/finalizar_seguimiento/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              const error = await response.json().catch(() => null);
              throw new Error(error?.message || error?.detail || 'Error al finalizar seguimiento');
            }

            toast.success('Seguimiento finalizado exitosamente');
            cargarAdopciones();
          } catch (error: any) {
            toast.error(error.message || 'Error al finalizar seguimiento');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estadoMapeado = mapearEstado(estado);
    const badges = {
      activo: { component: <Badge className="bg-green-500">Activo</Badge> },
      alerta: { component: <Badge className="bg-yellow-500">Alerta</Badge> },
      critico: { component: <Badge className="bg-red-500">Crítico</Badge> },
      completado: { component: <Badge className="bg-blue-500">Completado</Badge> },
    };
    return badges[estadoMapeado];
  };

  const getResultadoIcon = (resultado: string) => {
    switch (resultado) {
      case 'EXITOSO': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REQUIERE_ATENCION': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'PROBLEMATICO':
      case 'NO_REALIZADA': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento Post-Adopción</h1>
          <p className="text-muted-foreground">Monitorea el bienestar de las mascotas adoptadas</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold mt-1">{estadisticas.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-green-700">Activos</p>
              <p className="text-2xl font-bold mt-1 text-green-700">{estadisticas.activos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-yellow-700">Alertas</p>
              <p className="text-2xl font-bold mt-1 text-yellow-700">{estadisticas.alertas}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-700">Críticos</p>
              <p className="text-2xl font-bold mt-1 text-red-700">{estadisticas.criticos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-700">Completados</p>
              <p className="text-2xl font-bold mt-1 text-blue-700">{estadisticas.completados}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Tabs defaultValue="todos" onValueChange={setFiltroEstado}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="activo">Activos</TabsTrigger>
          <TabsTrigger value="alerta">Alertas</TabsTrigger>
          <TabsTrigger value="critico">Críticos</TabsTrigger>
          <TabsTrigger value="completado">Completados</TabsTrigger>
        </TabsList>

        <TabsContent value={filtroEstado} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {adopcionesFiltradas.map((adopcion) => {
              const estadoBadge = getEstadoBadge(adopcion.estado);
              const estadoMapeado = mapearEstado(adopcion.estado);

              return (
                <Card key={adopcion.id} className={`hover:shadow-lg transition-all border-l-4 ${
                  estadoMapeado === 'critico' ? 'border-l-red-500' :
                  estadoMapeado === 'alerta' ? 'border-l-yellow-500' :
                  estadoMapeado === 'completado' ? 'border-l-blue-500' :
                  'border-l-green-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {adopcion.mascota_nombre}
                          {estadoBadge.component}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Adoptado por: {adopcion.adoptante_nombre}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSeguimientoSeleccionado(adopcion);
                            setDialogDetalles(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fecha Adopción</p>
                        <p className="font-medium">{new Date(adopcion.fecha_adopcion).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Próxima Visita</p>
                        <p className="font-medium">
                          {adopcion.proxima_visita 
                            ? new Date(adopcion.proxima_visita).toLocaleDateString('es-ES')
                            : 'Sin programar'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Visitas</p>
                        <p className="font-medium">{adopcion.visitas_realizadas} / {adopcion.visitas_planificadas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Strikes</p>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${adopcion.strikes > 0 ? 'text-red-600' : ''}`}>
                            {adopcion.strikes} / {adopcion.max_strikes}
                          </p>
                          {adopcion.strikes > 0 && <AlertTriangle className="w-4 h-4 text-red-600" />}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso de Seguimiento</span>
                        <span className="font-medium">{adopcion.progreso}%</span>
                      </div>
                      <Progress value={adopcion.progreso} />
                    </div>

                    {adopcion.notas && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{adopcion.notas}</p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-wrap gap-2">
                    {!adopcion.seguimiento_activo ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleIniciarSeguimiento(adopcion.id)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Iniciar Seguimiento
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSeguimientoSeleccionado(adopcion);
                            setDialogVisita(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Programar Visita
                        </Button>
                        
                        {(adopcion.puede_agregar_strike === true || adopcion.strikes < 3) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAgregarStrike(adopcion.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            +Strike
                          </Button>
                        )}
                        
                        {(adopcion.puede_quitar_strike === true || adopcion.strikes > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuitarStrike(adopcion.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            -Strike
                          </Button>
                        )}
                        
                        {(adopcion.puede_finalizar === true || (adopcion.progreso >= 100 && adopcion.strikes === 0)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFinalizarSeguimiento(adopcion.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <CalendarCheck className="w-4 h-4 mr-2" />
                            Finalizar
                          </Button>
                        )}
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSeguimientoSeleccionado(adopcion);
                        setDialogFotos(true);
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Fotos
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {adopcionesFiltradas.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No hay seguimientos en esta categoría</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Programar Visita */}
      <Dialog open={dialogVisita} onOpenChange={setDialogVisita}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Visita de Seguimiento</DialogTitle>
            <DialogDescription>
              {seguimientoSeleccionado && `${seguimientoSeleccionado.mascota_nombre} - Visita #${(seguimientoSeleccionado.visitas_planificadas || 0) + 1}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAgregarVisita} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_programada">Fecha de Visita *</Label>
              <Input
                id="fecha_programada"
                type="date"
                value={formVisita.fecha_programada}
                onChange={(e) => setFormVisita({ fecha_programada: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                Programar Visita
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogVisita(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Visita */}
      <Dialog open={dialogEditarVisita} onOpenChange={setDialogEditarVisita}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Visita</DialogTitle>
            <DialogDescription>
              {visitaEditando && `Visita #${visitaEditando.numero_visita}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActualizarVisita} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_fecha_programada">Fecha Programada *</Label>
              <Input
                id="edit_fecha_programada"
                type="date"
                value={formEditarVisita.fecha_programada}
                onChange={(e) => setFormEditarVisita({ ...formEditarVisita, fecha_programada: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_observaciones">Observaciones</Label>
              <Textarea
                id="edit_observaciones"
                value={formEditarVisita.observaciones}
                onChange={(e) => setFormEditarVisita({ ...formEditarVisita, observaciones: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Actualizar Visita
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setDialogEditarVisita(false);
                  setVisitaEditando(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Marcar como Realizada */}
      <Dialog open={dialogMarcarRealizada} onOpenChange={setDialogMarcarRealizada}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar Visita como Realizada</DialogTitle>
            <DialogDescription>
              {visitaMarcarRealizada && `Visita #${visitaMarcarRealizada.numero_visita}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarcarRealizada} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado *</Label>
              <Select
                value={formRealizada.resultado}
                onValueChange={(value: any) => setFormRealizada({ ...formRealizada, resultado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXITOSO">
                    ✅ Exitoso - Quita 1 strike si hay
                  </SelectItem>
                  <SelectItem value="REQUIERE_ATENCION">
                    ⚠️ Requiere Atención - Sin cambios
                  </SelectItem>
                  <SelectItem value="PROBLEMATICO">
                    ❌ Problemático - Agrega 1 strike
                  </SelectItem>
                </SelectContent>
              </Select>
              {formRealizada.resultado === 'PROBLEMATICO' && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Esta visita agregará un strike al seguimiento
                </p>
              )}
              {formRealizada.resultado === 'EXITOSO' && seguimientoSeleccionado && seguimientoSeleccionado.strikes > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ✅ Esta visita quitará un strike ({seguimientoSeleccionado.strikes} → {seguimientoSeleccionado.strikes - 1})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formRealizada.observaciones}
                onChange={(e) => setFormRealizada({ ...formRealizada, observaciones: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="puntuacion">Puntuación (1-5)</Label>
                <Input
                  id="puntuacion"
                  type="number"
                  min="1"
                  max="5"
                  value={formRealizada.puntuacion}
                  onChange={(e) => setFormRealizada({ ...formRealizada, puntuacion: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formRealizada.peso_actual}
                  onChange={(e) => setFormRealizada({ ...formRealizada, peso_actual: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado_salud">Estado de Salud</Label>
              <Select
                value={formRealizada.estado_salud}
                onValueChange={(value: any) => setFormRealizada({ ...formRealizada, estado_salud: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCELENTE">Excelente</SelectItem>
                  <SelectItem value="BUENO">Bueno</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="PREOCUPANTE">Preocupante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Marcar como Realizada
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setDialogMarcarRealizada(false);
                  setVisitaMarcarRealizada(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalles */}
      <Dialog open={dialogDetalles} onOpenChange={setDialogDetalles}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalles del Seguimiento</DialogTitle>
          </DialogHeader>
          {seguimientoSeleccionado && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Mascota</p>
                    <p className="font-medium">{seguimientoSeleccionado.mascota_nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Adoptante</p>
                    <p className="font-medium">{seguimientoSeleccionado.adoptante_nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-xs">{seguimientoSeleccionado.adoptante_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    {getEstadoBadge(seguimientoSeleccionado.estado).component}
                  </div>
                  {seguimientoSeleccionado.fecha_inicio_seguimiento && (
                    <div>
                      <p className="text-sm text-muted-foreground">Inicio Seguimiento</p>
                      <p className="font-medium text-xs">
                        {new Date(seguimientoSeleccionado.fecha_inicio_seguimiento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                  {seguimientoSeleccionado.fecha_fin_seguimiento && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fin Seguimiento</p>
                      <p className="font-medium text-xs">
                        {new Date(seguimientoSeleccionado.fecha_fin_seguimiento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Historial de Visitas</h3>
                  <div className="space-y-3">
                    {seguimientoSeleccionado.visitas?.length > 0 ? (
                      seguimientoSeleccionado.visitas.map((visita) => (
                        <div key={visita.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getResultadoIcon(visita.resultado)}
                              <span className="font-medium">
                                Visita #{visita.numero_visita}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(visita.fecha_programada).toLocaleDateString('es-ES')}
                              </span>
                              {visita.esta_vencida && <Badge variant="destructive">Vencida</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{visita.resultado}</Badge>
                              {visita.resultado === 'PENDIENTE' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => abrirDialogMarcarRealizada(visita)}
                                    title="Marcar como realizada"
                                  >
                                    <Check className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditarVisita(visita)}
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEliminarVisita(visita.id)}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {visita.fecha_realizada && (
                            <p className="text-sm text-muted-foreground">
                              Realizada: {new Date(visita.fecha_realizada).toLocaleDateString('es-ES')}
                            </p>
                          )}
                          
                          {visita.observaciones && (
                            <p className="text-sm bg-muted/50 p-2 rounded">{visita.observaciones}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {visita.puntuacion && <span>⭐ {visita.puntuacion}/5</span>}
                            {visita.estado_salud && <span>❤️ {visita.estado_salud}</span>}
                            {visita.peso_actual && <span>⚖️ {visita.peso_actual} kg</span>}
                            {visita.fotos?.length > 0 && <span>📷 {visita.fotos.length} fotos</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No hay visitas programadas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Fotos */}
      <Dialog open={dialogFotos} onOpenChange={setDialogFotos}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Galería de Fotos</DialogTitle>
            <DialogDescription>
              {seguimientoSeleccionado && `${seguimientoSeleccionado.mascota_nombre} en su nuevo hogar`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {seguimientoSeleccionado && seguimientoSeleccionado.visitas?.some(v => v.fotos?.length > 0) ? (
              <ScrollArea className="max-h-96">
                <div className="grid grid-cols-2 gap-4">
                  {seguimientoSeleccionado.visitas.map((visita) => (
                    visita.fotos?.map((foto) => {
                      const visitaNum = seguimientoSeleccionado.visitas.indexOf(visita) + 1;
                      return (
                        <div key={foto.id} className="space-y-2">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img
                              src={foto.imagen}
                              alt={foto.descripcion}
                              className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                            />
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="font-semibold text-xs">
                              Visita #{visitaNum} - {new Date(visita.fecha_programada).toLocaleDateString('es-ES')}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Subida: {new Date(foto.fecha_subida).toLocaleDateString('es-ES')}
                            </p>
                            {foto.descripcion && (
                              <p className="text-xs">{foto.descripcion}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay fotos disponibles</p>
              </div>
            )}
            <Separator />
            <div className="space-y-3">
              <Label>Subir Nueva Foto</Label>

              {/* Selector de visita */}
              <div className="space-y-2">
                <Label htmlFor="visita-select">Selecciona la visita *</Label>
                <Select
                  value={visitaSeleccionadaFoto?.toString() || ''}
                  onValueChange={(value) => setVisitaSeleccionadaFoto(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una visita..." />
                  </SelectTrigger>
                  <SelectContent>
                    {seguimientoSeleccionado?.visitas.map((visita, index) => (
                      <SelectItem key={visita.id} value={visita.id.toString()}>
                        Visita #{index + 1} - {new Date(visita.fecha_programada).toLocaleDateString('es-ES')}
                        {visita.fecha_realizada ? ' ✅' : ' ⏳'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Input de archivo */}
              <div className="space-y-2">
                <Label htmlFor="foto-input">Selecciona la imagen</Label>
                <Input
                  id="foto-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* Preview de la foto */}
              {fotoPreview && (
                <div className="space-y-2">
                  <Label>Vista previa</Label>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Descripción opcional */}
              <div className="space-y-2">
                <Label htmlFor="descripcion-foto">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion-foto"
                  placeholder="Describe la foto..."
                  value={descripcionFoto}
                  onChange={(e) => setDescripcionFoto(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                variant="default"
                className="w-full"
                onClick={handleSubirFoto}
                disabled={!archivoFoto || !visitaSeleccionadaFoto}
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir Foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}