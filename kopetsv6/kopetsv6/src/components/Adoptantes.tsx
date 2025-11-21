import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { 
  Search, Eye, UserCheck, UserX, Mail, MessageCircle, 
  Heart, CheckCircle, XCircle, Edit, Clock, Home, Users, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { solicitudAdopcionService, perfilAdoptanteService, adopcionService } from '../services/api';

interface Solicitud {
  id: number;
  mascota: number;
  mascota_nombre: string;
  mascota_foto: string;
  mascota_tipo: string;
  mascota_raza: string;
  mascota_edad: string;
  adoptante: number;
  adoptante_nombre: string;
  adoptante_email: string;
  estado: string;
  mensaje: string;
  motivo_rechazo: string;
  whatsapp: string;
}

interface PerfilAdoptante {
  user: number;
  usuario_nombre: string;
  usuario_email: string;
  rut: string;
  fecha_nacimiento: string;
  direccion: string;
  ciudad: string;
  region: string;
  tipo_vivienda: string;
  tiene_patio: boolean;
  es_propietario: boolean;
  experiencia_previa: boolean;
  tiene_mascotas: boolean;
  cantidad_mascotas: number;
}

function AdoptanteInfoCard({ adoptanteId }: { adoptanteId: number }) {
  const [perfil, setPerfil] = useState<PerfilAdoptante | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, [adoptanteId]);

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const data = await perfilAdoptanteService.obtener(adoptanteId);
      setPerfil(data);
    } catch (error) {
      setPerfil(null);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <XCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 mb-1">
              Información Incompleta
            </p>
            <p className="text-sm text-amber-700">
              No hay información completa del adoptante.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 p-5 bg-muted/50 rounded-xl border-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Nombre Completo</p>
          <p className="text-sm font-semibold text-gray-900">{perfil.usuario_nombre || 'No especificado'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{perfil.usuario_email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">RUT</p>
          <p className="text-sm font-semibold text-gray-900">{perfil.rut || 'No especificado'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Fecha de Nacimiento</p>
          <p className="text-sm font-semibold text-gray-900">
            {perfil.fecha_nacimiento 
              ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-CL')
              : 'No especificado'}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Información de Vivienda</h4>
        </div>
        <div className="space-y-4 p-4 bg-muted/50 rounded-xl border-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Dirección</p>
              <p className="text-sm font-medium text-gray-900">{perfil.direccion || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Ciudad</p>
              <p className="text-sm font-medium text-gray-900">{perfil.ciudad || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Región</p>
              <p className="text-sm font-medium text-gray-900">{perfil.region || 'No especificado'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Tipo de Vivienda</p>
              <Badge variant="outline" className="text-xs">
                {perfil.tipo_vivienda || 'No especificado'}
              </Badge>
            </div>
          </div>
          
          {(perfil.tiene_patio || perfil.es_propietario) && (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
              {perfil.tiene_patio && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Tiene patio
                </Badge>
              )}
              {perfil.es_propietario && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Propietario
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Heart className="w-4 h-4 text-pink-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Experiencia con Mascotas</h4>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl border-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Experiencia Previa</p>
            <div className="flex items-center gap-2">
              {perfil.experiencia_previa ? (
                <>
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-700">Sí tiene experiencia</span>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-gray-100 rounded-full">
                    <XCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Sin experiencia</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Tiene Mascotas Actualmente</p>
            <div className="flex items-center gap-2">
              {perfil.tiene_mascotas ? (
                <>
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-700">
                    Sí ({perfil.cantidad_mascotas} {perfil.cantidad_mascotas === 1 ? 'mascota' : 'mascotas'})
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-gray-100 rounded-full">
                    <XCircle className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">No tiene mascotas</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Adoptantes() {
  const [busqueda, setBusqueda] = useState('');
  const [dialogDetalles, setDialogDetalles] = useState(false);
  const [dialogRechazo, setDialogRechazo] = useState(false);
  const [dialogEditar, setDialogEditar] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  
  const [perfilForm, setPerfilForm] = useState({
    rut: '',
    fecha_nacimiento: '',
    direccion: '',
    ciudad: '',
    region: '',
    tipo_vivienda: 'CASA',
    tiene_patio: false,
    es_propietario: false,
    experiencia_previa: false,
    tiene_mascotas: false,
    cantidad_mascotas: 0
  });

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

  const solicitudesFiltradas = solicitudes.filter(s => {
    const matchBusqueda = 
      s.adoptante_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.adoptante_email.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchEstado = filtroEstado === 'todos' || s.estado === filtroEstado.toUpperCase();
    
    return matchBusqueda && matchEstado;
  });

  const estadisticas = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
    enRevision: solicitudes.filter(s => s.estado === 'EN_REVISION').length,
    aprobadas: solicitudes.filter(s => s.estado === 'APROBADA').length,
    rechazadas: solicitudes.filter(s => s.estado === 'RECHAZADA').length,
  };

  const aprobarSolicitud = async (id: number) => {
    toast('¿Estás seguro de aprobar esta solicitud?', {
      description: 'La mascota será reservada y las demás solicitudes serán rechazadas.',
      action: {
        label: 'Aprobar',
        onClick: async () => {
          try {
            await solicitudAdopcionService.aprobar(id);
            toast.success('Solicitud aprobada correctamente');
            await cargarSolicitudes();
            setDialogDetalles(false);
          } catch (error: any) {
            toast.error(error.message || 'Error al aprobar solicitud');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const rechazarSolicitud = async () => {
    if (!solicitudSeleccionada) return;
    
    if (!motivoRechazo.trim()) {
      toast.error('Debes proporcionar un motivo de rechazo');
      return;
    }
    
    try {
      await solicitudAdopcionService.rechazar(solicitudSeleccionada.id, motivoRechazo);
      toast.success('Solicitud rechazada');
      await cargarSolicitudes();
      setDialogRechazo(false);
      setDialogDetalles(false);
      setMotivoRechazo('');
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar solicitud');
    }
  };

  const marcarPendiente = async (id: number) => {
    toast('¿Estás seguro de marcar como pendiente?', {
      description: 'Si estaba aprobada, la mascota quedará disponible nuevamente.',
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await solicitudAdopcionService.marcarPendiente(id);
            toast.success('Solicitud marcada como pendiente');
            await cargarSolicitudes();
            setDialogDetalles(false);
          } catch (error: any) {
            toast.error(error.message || 'Error al marcar como pendiente');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const cargarPerfilAdoptante = async (userId: number) => {
    try {
      const perfil = await perfilAdoptanteService.obtener(userId);
      setPerfilForm({
        rut: perfil.rut || '',
        fecha_nacimiento: perfil.fecha_nacimiento || '',
        direccion: perfil.direccion || '',
        ciudad: perfil.ciudad || '',
        region: perfil.region || '',
        tipo_vivienda: perfil.tipo_vivienda || 'CASA',
        tiene_patio: perfil.tiene_patio || false,
        es_propietario: perfil.es_propietario || false,
        experiencia_previa: perfil.experiencia_previa || false,
        tiene_mascotas: perfil.tiene_mascotas || false,
        cantidad_mascotas: perfil.cantidad_mascotas || 0
      });
      setDialogEditar(true);
    } catch (error) {
      setDialogEditar(true);
    }
  };

  const guardarPerfilAdoptante = async (userId: number) => {
    const errores: string[] = [];
    
    if (!perfilForm.rut.trim()) errores.push('El RUT es obligatorio');
    if (!perfilForm.fecha_nacimiento) errores.push('La fecha de nacimiento es obligatoria');
    if (!perfilForm.direccion.trim()) errores.push('La dirección es obligatoria');
    if (!perfilForm.ciudad.trim()) errores.push('La ciudad es obligatoria');
    if (!perfilForm.region.trim()) errores.push('La región es obligatoria');
    
    if (errores.length > 0) {
      errores.forEach(error => toast.error(error));
      return;
    }
    
    try {
      await perfilAdoptanteService.actualizarOCrear(userId, perfilForm);
      toast.success('Información del adoptante guardada correctamente');
      setDialogEditar(false);
      
      if (solicitudSeleccionada) {
        setSolicitudSeleccionada({ ...solicitudSeleccionada });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar información');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      PENDIENTE: <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>,
      EN_REVISION: <Badge className="bg-blue-500 hover:bg-blue-600">En Revisión</Badge>,
      APROBADA: <Badge className="bg-green-500 hover:bg-green-600">Aprobada</Badge>,
      RECHAZADA: <Badge className="bg-red-500 hover:bg-red-600">Rechazada</Badge>,
      CANCELADA: <Badge className="bg-gray-500 hover:bg-gray-600">Cancelada</Badge>,
    };
    return badges[estado as keyof typeof badges] || <Badge>{estado}</Badge>;
  };

  const getEstadoIcon = (estado: string) => {
    const icons = {
      APROBADA: <CheckCircle className="w-5 h-5 text-green-600" />,
      RECHAZADA: <XCircle className="w-5 h-5 text-red-600" />,
      CANCELADA: <XCircle className="w-5 h-5 text-gray-600" />,
      EN_REVISION: <Clock className="w-5 h-5 text-blue-600" />,
      PENDIENTE: <Clock className="w-5 h-5 text-yellow-600" />,
    };
    return icons[estado as keyof typeof icons] || <Clock className="w-5 h-5 text-gray-600" />;
  };

  const contactarAdoptante = (solicitud: Solicitud) => {
    const mensaje = `Hola ${solicitud.adoptante_nombre}, gracias por tu interés en adoptar a ${solicitud.mascota_nombre}`;
    window.open(`https://wa.me/${solicitud.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
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
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Solicitudes de Adopción
        </h1>
        <p className="text-muted-foreground mt-1">Gestiona las solicitudes de adopción de tus mascotas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="text-3xl font-bold mt-2 text-purple-600">
              {estadisticas.total}
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200 bg-yellow-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-yellow-700">Pendientes</p>
            <p className="text-3xl font-bold mt-1 text-yellow-700">{estadisticas.pendientes}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-blue-700">En Revisión</p>
            <p className="text-3xl font-bold mt-1 text-blue-700">{estadisticas.enRevision}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-700">Aprobadas</p>
            <p className="text-3xl font-bold mt-1 text-green-700">{estadisticas.aprobadas}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-red-700">Rechazadas</p>
            <p className="text-3xl font-bold mt-1 text-red-700">{estadisticas.rechazadas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="       Buscar por nombre de adoptante, mascota o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-12 h-12 border-2 focus:border-purple-500 transition-colors"
        />
      </div>

      <Tabs defaultValue="todos" onValueChange={setFiltroEstado}>
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50">
          <TabsTrigger value="todos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
            Todos
          </TabsTrigger>
          <TabsTrigger value="pendiente" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="en_revision" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            En Revisión
          </TabsTrigger>
          <TabsTrigger value="aprobada" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            Aprobadas
          </TabsTrigger>
          <TabsTrigger value="rechazada" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            Rechazadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filtroEstado} className="space-y-4 mt-6">
          {solicitudesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {solicitudesFiltradas.map((solicitud) => (
                <Card key={solicitud.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                              {solicitud.adoptante_nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg border-2 border-white">
                            {getEstadoIcon(solicitud.estado)}
                          </div>
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            {solicitud.adoptante_nombre}
                            {getEstadoBadge(solicitud.estado)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-pink-500" />
                            Solicitud para: <strong className="text-purple-600">{solicitud.mascota_nombre}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            {solicitud.mascota_tipo} • {solicitud.mascota_raza} • {getEdadTexto(solicitud.mascota_edad)}
                          </p>
                        </div>
                      </div>
                      {solicitud.whatsapp && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => contactarAdoptante(solicitud)}
                          className="border-2 hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm truncate">{solicitud.adoptante_email}</span>
                      </div>
                    </div>

                    {solicitud.mensaje && (
                      <>
                        <Separator />
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                          <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Mensaje del adoptante:
                          </p>
                          <p className="text-sm italic text-blue-800 line-clamp-2">"{solicitud.mensaje}"</p>
                        </div>
                      </>
                    )}

                    {solicitud.motivo_rechazo && (
                      <>
                        <Separator />
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                          <p className="text-xs font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Motivo de rechazo:
                          </p>
                          <p className="text-sm text-red-700">{solicitud.motivo_rechazo}</p>
                        </div>
                      </>
                    )}
                  </CardContent>

                  <CardFooter className="flex gap-2 flex-wrap pt-4 border-t-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSolicitudSeleccionada(solicitud);
                        setDialogDetalles(true);
                      }}
                      className="border-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    {solicitud.estado !== 'CANCELADA' && (
                      <>
                        {solicitud.estado === 'APROBADA' && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                            onClick={async () => {
                              try {
                                await adopcionService.crear({
                                  solicitud: solicitud.id,
                                  fecha_adopcion: new Date().toISOString().split('T')[0],
                                  contrato_firmado: true
                                });
                                toast.success('✅ Adopción creada. Ve al módulo de Seguimiento.');
                                await cargarSolicitudes();
                              } catch (error: any) {
                                toast.error(error.message || 'Error al crear adopción');
                              }
                            }}
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Crear Adopción
                          </Button>
                        )}
                        {solicitud.estado !== 'PENDIENTE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500"
                            onClick={() => marcarPendiente(solicitud.id)}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Pendiente
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                          onClick={() => aprobarSolicitud(solicitud.id)}
                          disabled={solicitud.estado === 'APROBADA'}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          {solicitud.estado === 'APROBADA' ? 'Aprobada' : 'Aprobar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500"
                          onClick={() => {
                            setSolicitudSeleccionada(solicitud);
                            setDialogRechazo(true);
                          }}
                          disabled={solicitud.estado === 'RECHAZADA'}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          {solicitud.estado === 'RECHAZADA' ? 'Rechazada' : 'Rechazar'}
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-16 text-center border-2 border-dashed">
              <Heart className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">No hay solicitudes en esta categoría</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Las solicitudes aparecerán aquí cuando los usuarios se interesen en tus mascotas</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Detalles */}
      <Dialog open={dialogDetalles} onOpenChange={setDialogDetalles}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Detalles de la Solicitud
            </DialogTitle>
          </DialogHeader>
          {solicitudSeleccionada && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Heart className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Mascota Solicitada</h3>
                  </div>
                  <div className="flex gap-4 p-4 bg-muted/50 rounded-xl border-2">
                    {solicitudSeleccionada.mascota_foto ? (
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                        <img 
                          src={solicitudSeleccionada.mascota_foto} 
                          alt={solicitudSeleccionada.mascota_nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-400 border-2 border-white shadow-md">
                        <Heart className="w-10 h-10" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{solicitudSeleccionada.mascota_nombre}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {solicitudSeleccionada.mascota_tipo} • {solicitudSeleccionada.mascota_raza}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getEdadTexto(solicitudSeleccionada.mascota_edad)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Información del Adoptante</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        cargarPerfilAdoptante(solicitudSeleccionada.adoptante);
                        setDialogDetalles(false);
                      }}
                      className="border-2 hover:bg-purple-50 hover:border-purple-500"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                  <AdoptanteInfoCard adoptanteId={solicitudSeleccionada.adoptante} />
                </div>

                <Separator className="my-6" />

                {solicitudSeleccionada.mensaje && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-lg">Mensaje del Adoptante</h3>
                      </div>
                      <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl">
                        <p className="text-sm italic text-green-900">"{solicitudSeleccionada.mensaje}"</p>
                      </div>
                    </div>
                    <Separator className="my-6" />
                  </>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      {getEstadoIcon(solicitudSeleccionada.estado)}
                    </div>
                    <h3 className="font-semibold text-lg">Estado de la Solicitud</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {getEstadoBadge(solicitudSeleccionada.estado)}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Rechazo */}
      <Dialog open={dialogRechazo} onOpenChange={setDialogRechazo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Por favor proporciona un motivo detallado del rechazo. El adoptante recibirá esta información.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-base font-semibold">Motivo del Rechazo *</Label>
              <Textarea
                id="motivo"
                rows={5}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Explica por qué se rechaza la solicitud..."
                className="border-2 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 border-2"
                onClick={() => {
                  setDialogRechazo(false);
                  setMotivoRechazo('');
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg"
                onClick={rechazarSolicitud}
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={dialogEditar} onOpenChange={setDialogEditar}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Completar Datos del Adoptante
            </DialogTitle>
            <DialogDescription>
              Completa la información del adoptante para evaluar la solicitud. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              if (solicitudSeleccionada) {
                guardarPerfilAdoptante(solicitudSeleccionada.adoptante);
              }
            }}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Datos Personales</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut" className="font-semibold">RUT *</Label>
                    <Input
                      id="rut"
                      value={perfilForm.rut}
                      onChange={(e) => setPerfilForm({ ...perfilForm, rut: e.target.value })}
                      placeholder="12.345.678-9"
                      required
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento" className="font-semibold">Fecha de Nacimiento *</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={perfilForm.fecha_nacimiento}
                      onChange={(e) => setPerfilForm({ ...perfilForm, fecha_nacimiento: e.target.value })}
                      required
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Home className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Información de Vivienda</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccion" className="font-semibold">Dirección *</Label>
                    <Input
                      id="direccion"
                      value={perfilForm.direccion}
                      onChange={(e) => setPerfilForm({ ...perfilForm, direccion: e.target.value })}
                      placeholder="Calle y número"
                      required
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad" className="font-semibold">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={perfilForm.ciudad}
                      onChange={(e) => setPerfilForm({ ...perfilForm, ciudad: e.target.value })}
                      placeholder="Santiago"
                      required
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="font-semibold">Región *</Label>
                    <Input
                      id="region"
                      value={perfilForm.region}
                      onChange={(e) => setPerfilForm({ ...perfilForm, region: e.target.value })}
                      placeholder="Región Metropolitana"
                      required
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_vivienda" className="font-semibold">Tipo de Vivienda</Label>
                    <Select value={perfilForm.tipo_vivienda} onValueChange={(value) => setPerfilForm({ ...perfilForm, tipo_vivienda: value })}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASA">Casa</SelectItem>
                        <SelectItem value="DEPARTAMENTO">Departamento</SelectItem>
                        <SelectItem value="PARCELA">Parcela</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cantidad_mascotas" className="font-semibold">Cantidad de Mascotas</Label>
                    <Input
                      id="cantidad_mascotas"
                      type="number"
                      min="0"
                      value={perfilForm.cantidad_mascotas}
                      onChange={(e) => setPerfilForm({ ...perfilForm, cantidad_mascotas: parseInt(e.target.value) || 0 })}
                      className="border-2"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-xl">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Características</h3>
                </div>
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl border-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="tiene_patio"
                      checked={perfilForm.tiene_patio}
                      onCheckedChange={(checked) => setPerfilForm({ ...perfilForm, tiene_patio: checked as boolean })}
                      className="border-2"
                    />
                    <label htmlFor="tiene_patio" className="cursor-pointer font-medium">
                      Tiene patio o espacio exterior
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="es_propietario"
                      checked={perfilForm.es_propietario}
                      onCheckedChange={(checked) => setPerfilForm({ ...perfilForm, es_propietario: checked as boolean })}
                      className="border-2"
                    />
                    <label htmlFor="es_propietario" className="cursor-pointer font-medium">
                      Es propietario de la vivienda
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="experiencia_previa"
                      checked={perfilForm.experiencia_previa}
                      onCheckedChange={(checked) => setPerfilForm({ ...perfilForm, experiencia_previa: checked as boolean })}
                      className="border-2"
                    />
                    <label htmlFor="experiencia_previa" className="cursor-pointer font-medium">
                      Tiene experiencia previa con mascotas
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="tiene_mascotas"
                      checked={perfilForm.tiene_mascotas}
                      onCheckedChange={(checked) => setPerfilForm({ ...perfilForm, tiene_mascotas: checked as boolean })}
                      className="border-2"
                    />
                    <label htmlFor="tiene_mascotas" className="cursor-pointer font-medium">
                      Tiene otras mascotas actualmente
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg">
                  Guardar Información
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogEditar(false)} className="border-2">
                  Cancelar
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}