import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Calendar, Users, Edit, Trash2, Upload, Pause, Play, CheckCircle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { campanaService } from '../services/api';
import { Checkbox } from './ui/checkbox';

interface Campana {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_kpi: string;
  meta_kpi: number;
  valor_actual_kpi: number;
  estado: 'ACTIVA' | 'PAUSADA' | 'FINALIZADA';
  refugio_nombre: string;
  progreso_porcentaje: number;
  total_participantes: number;
}

interface Participacion {
  id: number;
  usuario_nombre: string;
  usuario_email: string;
  usuario_nombre_completo: string;
  usuario_telefono: string;
  comentario: string;
  asistio: boolean;
  created_at: string;
}

export function Campanas() {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<Campana | null>(null);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [dialogParticipantes, setDialogParticipantes] = useState(false);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [participantes, setParticipantes] = useState<Participacion[]>([]);
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen: null as File | null,
    fecha_inicio: '',
    fecha_fin: '',
    tipo_kpi: 'PARTICIPANTES',
    meta_kpi: ''
  });
  const [imagenPreview, setImagenPreview] = useState<string>('');

  useEffect(() => {
    cargarCampanas();
  }, []);

  const cargarCampanas = async () => {
    try {
      const data = await campanaService.listar();
      setCampanas(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error('Error al cargar campañas');
      setCampanas([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const campanaData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        imagen: formData.imagen,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        tipo_kpi: formData.tipo_kpi,
        meta_kpi: parseInt(formData.meta_kpi)
      };
      
      if (editando) {
        await campanaService.actualizar(editando.id, campanaData);
        toast.success('Campaña actualizada');
      } else {
        await campanaService.crear(campanaData);
        toast.success('Campaña creada');
      }
      
      await cargarCampanas();
      setDialogAbierto(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar campaña');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      imagen: null,
      fecha_inicio: '',
      fecha_fin: '',
      tipo_kpi: 'PARTICIPANTES',
      meta_kpi: ''
    });
    setImagenPreview('');
    setEditando(null);
  };

  const handleEditar = (campana: Campana) => {
    setEditando(campana);
    setFormData({
      titulo: campana.titulo,
      descripcion: campana.descripcion,
      imagen: null, 
      fecha_inicio: campana.fecha_inicio,
      fecha_fin: campana.fecha_fin,
      tipo_kpi: campana.tipo_kpi,
      meta_kpi: campana.meta_kpi.toString()
    });
    setImagenPreview(campana.imagen); 
    setDialogAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    toast('¿Estás seguro de eliminar esta campaña?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await campanaService.eliminar(id);
            toast.success('Campaña eliminada');
            await cargarCampanas();
          } catch (error) {
            toast.error('Error al eliminar');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handlePausar = async (id: number) => {
    try {
      await campanaService.pausar(id);
      toast.success('Campaña pausada');
      await cargarCampanas();
    } catch (error) {
      toast.error('Error al pausar');
    }
  };

  const handleActivar = async (id: number) => {
    try {
      await campanaService.activar(id);
      toast.success('Campaña activada');
      await cargarCampanas();
    } catch (error) {
      toast.error('Error al activar');
    }
  };

  const handleFinalizar = async (id: number) => {
    toast('¿Estás seguro de finalizar esta campaña?', {
      description: 'Esta acción no se puede deshacer y no podrá reactivarse.',
      action: {
        label: 'Finalizar',
        onClick: async () => {
          try {
            await campanaService.finalizar(id);
            toast.success('Campaña finalizada');
            await cargarCampanas();
          } catch (error) {
            toast.error('Error al finalizar');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handleFileChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 150 * 1024 * 1024) {
          toast.error('La imagen debe ser menor a 150MB');
          return;
        }
        
        setFormData({ ...formData, imagen: file });

        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagenPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      ACTIVA: <Badge className="bg-green-500">Activa</Badge>,
      PAUSADA: <Badge className="bg-yellow-500">Pausada</Badge>,
      FINALIZADA: <Badge className="bg-gray-500">Finalizada</Badge>
    };
    return badges[estado as keyof typeof badges];
  };

  const getTipoKpiLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      PARTICIPANTES: 'Participantes',
      ADOPCIONES: 'Adopciones',
      VISITAS: 'Visitas'
    };
    return labels[tipo] || tipo;
  };

  const handleVerParticipantes = async (campana: Campana) => {
    setCampanaSeleccionada(campana);
    setDialogParticipantes(true);
    setCargandoParticipantes(true);

    try {
      const data = await campanaService.obtenerParticipantes(campana.id);
      setParticipantes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar participantes');
      setParticipantes([]);
    } finally {
      setCargandoParticipantes(false);
    }
  };

  const handleMarcarAsistencia = async (participacionId: number, asistio: boolean) => {
    if (!campanaSeleccionada) return;

    try {
      await campanaService.marcarAsistencia(campanaSeleccionada.id, participacionId, asistio);

      
      setParticipantes(participantes.map(p =>
        p.id === participacionId ? { ...p, asistio } : p
      ));

      toast.success(asistio ? 'Asistencia marcada' : 'Asistencia desmarcada');
    } catch (error: any) {
      toast.error(error.message || 'Error al marcar asistencia');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1>Gestión de Campañas</h1>
          <p className="text-muted-foreground">Administra las campañas de adopción</p>
        </div>
        <Button onClick={() => setDialogAbierto(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Campaña
        </Button>
      </div>

      <Dialog open={dialogAbierto} onOpenChange={(open) => {
        setDialogAbierto(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Campaña' : 'Crear Nueva Campaña'}</DialogTitle>
            <DialogDescription>
              Configura los detalles de la campaña de adopción
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título de la Campaña *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Adopta en Navidad"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Describe la campaña..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen de la Campaña</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-purple-300 transition-colors">
                  {imagenPreview ? (
                    <div className="space-y-2">
                      <img src={imagenPreview} alt="Preview" className="w-full h-32 object-cover rounded" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setFormData({ ...formData, imagen: null });
                          setImagenPreview('');
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleFileChange}
                      >
                        Subir Imagen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_kpi">Tipo de Objetivo *</Label>
                <Select value={formData.tipo_kpi} onValueChange={(value) => setFormData({ ...formData, tipo_kpi: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARTICIPANTES">Número de Participantes</SelectItem>
                    <SelectItem value="ADOPCIONES">Número de Adopciones</SelectItem>
                    <SelectItem value="VISITAS">Número de Visitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_kpi">Meta del Objetivo *</Label>
                <Input
                  id="meta_kpi"
                  type="number"
                  min="1"
                  value={formData.meta_kpi}
                  onChange={(e) => setFormData({ ...formData, meta_kpi: e.target.value })}
                  placeholder="Ej: 50"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                  {editando ? 'Actualizar' : 'Crear Campaña'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogParticipantes} onOpenChange={setDialogParticipantes}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Participantes de la Campaña</DialogTitle>
            <DialogDescription>
              {campanaSeleccionada?.titulo} - {participantes.length} participantes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {cargandoParticipantes ? (
              <div className="py-8 text-center text-muted-foreground">
                Cargando participantes...
              </div>
            ) : participantes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay participantes registrados
              </div>
            ) : (
              <div className="space-y-3">
                {participantes.map((participacion) => (
                  <Card key={participacion.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center pt-1">
                        <Checkbox
                          checked={participacion.asistio}
                          onCheckedChange={(checked) =>
                            handleMarcarAsistencia(participacion.id, checked as boolean)
                          }
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {participacion.usuario_nombre_completo || participacion.usuario_nombre}
                          </p>
                          {participacion.asistio && (
                            <Badge className="bg-green-500 text-xs">Asistió</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{participacion.usuario_email}</p>
                        {participacion.usuario_telefono && (
                          <p className="text-sm text-muted-foreground">
                            Tel: {participacion.usuario_telefono}
                          </p>
                        )}
                        {participacion.comentario && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            {participacion.comentario}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Inscrito: {new Date(participacion.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogParticipantes(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanas.map((campana) => (
          <Card key={campana.id} className="overflow-hidden flex flex-col">
            {campana.imagen && (
              <div className="h-48 relative bg-gray-100 flex-shrink-0">
                <img src={campana.imagen} alt={campana.titulo} className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{campana.titulo}</CardTitle>
                {getEstadoBadge(campana.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{campana.descripcion}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {getTipoKpiLabel(campana.tipo_kpi)}
                  </span>
                  <span className="font-semibold">
                    {campana.valor_actual_kpi} / {campana.meta_kpi}
                  </span>
                </div>
                <Progress value={campana.progreso_porcentaje} />
                <p className="text-xs text-muted-foreground text-right">
                  {campana.progreso_porcentaje.toFixed(1)}% completado
                </p>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(campana.fecha_inicio).toLocaleDateString('es-CL')} - {new Date(campana.fecha_fin).toLocaleDateString('es-CL')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{campana.total_participantes} participantes</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerParticipantes(campana)}
                className="flex-1 min-w-fit"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Ver Asistencia
              </Button>
              {campana.estado === 'ACTIVA' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handlePausar(campana.id)}>
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleFinalizar(campana.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Finalizar
                  </Button>
                </>
              )}
              {campana.estado === 'PAUSADA' && (
                <Button variant="outline" size="sm" onClick={() => handleActivar(campana.id)}>
                  <Play className="w-4 h-4 mr-1" />
                  Activar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handleEditar(campana)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleEliminar(campana.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {campanas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay campañas registradas</p>
        </div>
      )}
    </div>
  );
}