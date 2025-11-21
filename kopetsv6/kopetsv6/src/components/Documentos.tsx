import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Search, FileText, Download, Eye, Trash2, Upload, FolderOpen, FileCheck, FileWarning, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { documentoService } from '../services/api';

interface Documento {
  id: number;
  nombre: string;
  categoria: 'CONTRATOS' | 'POLITICAS' | 'FORMULARIOS' | 'CERTIFICADOS' | 'LEGALES' | 'OTROS';
  tipo_archivo: 'PDF' | 'DOCX' | 'XLSX' | 'TXT';
  descripcion: string;
  tamano: number; 
  fecha_creacion: string;
  fecha_modificacion: string;
  creado_por: number;
  creado_por_nombre: string;
  refugio: number;
  refugio_nombre: string;
  version: string;
  estado: 'ACTIVO' | 'ARCHIVADO' | 'BORRADOR';
  archivo: string; 
  descargas: number;
  usos: number;
}

export function Documentos() {
  const [busqueda, setBusqueda] = useState('');
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogVer, setDialogVer] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<Documento | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'CONTRATOS' as Documento['categoria'],
    tipo_archivo: 'PDF' as Documento['tipo_archivo'],
    descripcion: '',
    version: '1.0',
    estado: 'BORRADOR' as Documento['estado']
  });

  const [stats, setStats] = useState({
    total: 0,
    total_descargas: 0,
    por_categoria: {} as Record<string, number>,
    por_estado: {} as Record<string, number>,
    documento_mas_descargado: null as Documento | null
  });

  useEffect(() => {
    cargarDocumentos();
    cargarEstadisticas();
  }, []);

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      const data = await documentoService.listar();
      setDocumentos(Array.isArray(data) ? data : data.results || []);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const data = await documentoService.estadisticas();
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const categorias = [
    { value: 'CONTRATOS', label: 'Contratos', icon: FileText, color: 'text-purple-500' },
    { value: 'POLITICAS', label: 'Políticas', icon: FileCheck, color: 'text-blue-500' },
    { value: 'FORMULARIOS', label: 'Formularios', icon: FileText, color: 'text-green-500' },
    { value: 'CERTIFICADOS', label: 'Certificados', icon: FileWarning, color: 'text-yellow-500' },
    { value: 'LEGALES', label: 'Legales', icon: FileText, color: 'text-red-500' },
    { value: 'OTROS', label: 'Otros', icon: FolderOpen, color: 'text-gray-500' }
  ];

  const documentosFiltrados = documentos.filter(d => {
    const matchBusqueda =
      d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.descripcion.toLowerCase().includes(busqueda.toLowerCase());

    const matchCategoria = categoriaFiltro === 'todos' || d.categoria === categoriaFiltro;
    const matchEstado = estadoFiltro === 'todos' || d.estado === estadoFiltro;

    return matchBusqueda && matchCategoria && matchEstado;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivoSeleccionado) {
      toast.error('Debes seleccionar un archivo');
      return;
    }

    try {
      setGuardando(true);

      await documentoService.crear({
        ...formData,
        archivo: archivoSeleccionado
      });

      toast.success('Documento creado correctamente');
      setDialogAbierto(false);
      resetForm();
      cargarDocumentos();
      cargarEstadisticas();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear documento');
    } finally {
      setGuardando(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: 'CONTRATOS',
      tipo_archivo: 'PDF',
      descripcion: '',
      version: '1.0',
      estado: 'BORRADOR'
    });
    setArchivoSeleccionado(null);
  };

  const handleEliminar = async (id: number) => {
    toast('¿Estás seguro de eliminar este documento?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await documentoService.eliminar(id);
            toast.success('Documento eliminado');
            cargarDocumentos();
            cargarEstadisticas();
          } catch (error: any) {
            toast.error(error.message || 'Error al eliminar documento');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handleDescargar = async (documento: Documento) => {
    try {
      await documentoService.descargar(documento.id);
      toast.success(`Descargando ${documento.nombre}...`);
      cargarDocumentos(); 
    } catch (error: any) {
      toast.error(error.message || 'Error al descargar documento');
    }
  };

  const getCategoriaConfig = (categoria: string) => {
    return categorias.find(c => c.value === categoria) || categorias[categorias.length - 1];
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const estadisticas = {
    total: stats.total,
    activos: stats.por_estado?.ACTIVO || 0,
    borradores: stats.por_estado?.BORRADOR || 0,
    archivados: stats.por_estado?.ARCHIVADO || 0,
    totalDescargas: stats.total_descargas
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentos Administrativos</h1>
          <p className="text-muted-foreground">Gestiona contratos, formularios y documentos de la fundación</p>
        </div>
        <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Documento</DialogTitle>
              <DialogDescription>
                Sube un documento administrativo para la fundación
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Documento *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Versión *</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_archivo">Tipo de Archivo *</Label>
                  <Select
                    value={formData.tipo_archivo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo_archivo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="DOCX">Word (DOCX)</SelectItem>
                      <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                      <SelectItem value="TXT">Texto (TXT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="archivo">Archivo *</Label>
                <Input
                  id="archivo"
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
                  onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] || null)}
                  required
                />
                {archivoSeleccionado && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {archivoSeleccionado.name} ({formatBytes(archivoSeleccionado.size)})
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Crear Documento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-xs text-muted-foreground">documentos en sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
            <p className="text-xs text-muted-foreground">en uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <FileWarning className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.borradores}</div>
            <p className="text-xs text-muted-foreground">en desarrollo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descargas Totales</CardTitle>
            <Download className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.totalDescargas}</div>
            <p className="text-xs text-muted-foreground">descargas realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="buscar">Buscar Documentos</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="buscar"
                  placeholder="Buscar por nombre o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Categoría</Label>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Estado</Label>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="ARCHIVADO">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : documentosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
            <p className="text-muted-foreground text-center">
              {busqueda || categoriaFiltro !== 'todos' || estadoFiltro !== 'todos'
                ? 'No se encontraron documentos que coincidan con los filtros'
                : 'Comienza creando tu primer documento'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documentosFiltrados.map((doc) => {
            const catConfig = getCategoriaConfig(doc.categoria);
            return (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start">
                      <catConfig.icon className={`h-5 w-5 ${catConfig.color} mt-1`} />
                      <div>
                        <CardTitle className="text-lg">{doc.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{doc.descripcion}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={doc.estado === 'ACTIVO' ? 'default' : doc.estado === 'BORRADOR' ? 'secondary' : 'outline'}>
                        {doc.estado}
                      </Badge>
                      <Badge variant="outline">{doc.tipo_archivo}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Versión</p>
                      <p className="font-medium">v{doc.version}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tamaño</p>
                      <p className="font-medium">{formatBytes(doc.tamano)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Descargas</p>
                      <p className="font-medium">{doc.descargas}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Última modificación</p>
                      <p className="font-medium">{new Date(doc.fecha_modificacion).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Creado por: {doc.creado_por_nombre || 'Sistema'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDescargar(doc)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEliminar(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
