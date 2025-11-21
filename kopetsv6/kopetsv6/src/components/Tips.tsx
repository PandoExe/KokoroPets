import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Share2, Edit, Trash2, Heart, PawPrint, Scissors, Stethoscope, Apple, Brain, Upload, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { tipService, tipoAnimalService } from '../services/api';

interface Tip {
  id: number;
  titulo: string;
  contenido: string;
  categoria: string;
  imagen: string;
  tipo_animal: number | string | null;
  tipo_animal_nombre?: string;
  refugio_nombre: string;
  publicado: boolean;
  created_at: string;
}

interface TipoAnimal {
  id: number;
  nombre: string;
}

export function Tips() {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [editando, setEditando] = useState<Tip | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [tips, setTips] = useState<Tip[]>([]);
  const [tiposAnimales, setTiposAnimales] = useState<TipoAnimal[]>([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    categoria: 'GENERAL',
    imagen: null as File | null,
    tipo_animal: ''
  });
  const [imagenPreview, setImagenPreview] = useState<string>('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [tipsData, tiposData] = await Promise.all([
        tipService.listar(),
        tipoAnimalService.listar()
      ]);
      
      setTips(Array.isArray(tipsData) ? tipsData : tipsData.results || []);
      setTiposAnimales(Array.isArray(tiposData) ? tiposData : tiposData.results || []);
    } catch (error) {
      toast.error('Error al cargar datos');
      setTips([]);
      setTiposAnimales([]);
    }
  };

  const tipsFiltrados = filtroCategoria === 'todos' 
    ? tips 
    : tips.filter(t => t.categoria === filtroCategoria);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tipData = {
        titulo: formData.titulo,
        contenido: formData.contenido,
        categoria: formData.categoria,
        imagen: formData.imagen,
        tipo_animal: (formData.tipo_animal && formData.tipo_animal !== '0') 
          ? parseInt(formData.tipo_animal) 
          : null
      };
      
      if (editando) {
        await tipService.actualizar(editando.id, tipData);
        toast.success('Tip actualizado');
      } else {
        await tipService.crear(tipData);
        toast.success('Tip creado');
      }
      
      await cargarDatos();
      setDialogAbierto(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar tip');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      contenido: '',
      categoria: 'GENERAL',
      imagen: null,
      tipo_animal: ''
    });
    setImagenPreview('');
    setEditando(null);
  };

  const handleEditar = (tip: Tip) => {
    setEditando(tip);
    setFormData({
      titulo: tip.titulo,
      contenido: tip.contenido,
      categoria: tip.categoria,
      imagen: null, // Al editar, la imagen se mantiene en el servidor
      tipo_animal: tip.tipo_animal?.toString() || ''
    });
    setImagenPreview(tip.imagen); // Mostrar la imagen existente
    setDialogAbierto(true);
  };

  const handleEliminar = async (id: number) => {
    toast('¿Estás seguro de eliminar este tip?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await tipService.eliminar(id);
            toast.success('Tip eliminado');
            await cargarDatos();
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

  const togglePublicar = async (tip: Tip) => {
    try {
      if (tip.publicado) {
        await tipService.despublicar(tip.id);
        toast.success('Tip despublicado');
      } else {
        await tipService.publicar(tip.id);
        toast.success('Tip publicado');
      }
      await cargarDatos();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const compartirTip = (tip: Tip) => {
    const texto = `${tip.titulo}\n\n${tip.contenido}\n\n#KokoroPets #CuidadoMascotas`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWhatsApp, '_blank');
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
        // Guardar el archivo directamente
        setFormData({ ...formData, imagen: file });

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagenPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'HIGIENE':
        return <Scissors className="w-5 h-5" />;
      case 'NUTRICION':
        return <Apple className="w-5 h-5" />;
      case 'SALUD':
        return <Stethoscope className="w-5 h-5" />;
      case 'COMPORTAMIENTO':
        return <Heart className="w-5 h-5" />;
      case 'ADIESTRAMIENTO':
        return <Brain className="w-5 h-5" />;
      default:
        return <PawPrint className="w-5 h-5" />;
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'HIGIENE':
        return 'bg-purple-100 text-purple-800';
      case 'NUTRICION':
        return 'bg-green-100 text-green-800';
      case 'SALUD':
        return 'bg-red-100 text-red-800';
      case 'COMPORTAMIENTO':
        return 'bg-blue-100 text-blue-800';
      case 'ADIESTRAMIENTO':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoriaTexto = (categoria: string) => {
    const textos: Record<string, string> = {
      SALUD: 'Salud',
      NUTRICION: 'Nutrición',
      COMPORTAMIENTO: 'Comportamiento',
      ADIESTRAMIENTO: 'Adiestramiento',
      HIGIENE: 'Higiene',
      GENERAL: 'General'
    };
    return textos[categoria] || categoria;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1>Tips de Cuidado</h1>
          <p className="text-muted-foreground">Comparte consejos útiles con los adoptantes</p>
        </div>
        <Button onClick={() => setDialogAbierto(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tip
        </Button>
      </div>

      <Dialog open={dialogAbierto} onOpenChange={(open) => {
        setDialogAbierto(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Tip' : 'Crear Nuevo Tip'}</DialogTitle>
            <DialogDescription>
              Crea un consejo útil para los adoptantes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Alimentación balanceada para perros"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALUD">Salud</SelectItem>
                      <SelectItem value="NUTRICION">Nutrición</SelectItem>
                      <SelectItem value="COMPORTAMIENTO">Comportamiento</SelectItem>
                      <SelectItem value="ADIESTRAMIENTO">Adiestramiento</SelectItem>
                      <SelectItem value="HIGIENE">Higiene</SelectItem>
                      <SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_animal">Tipo de Animal (opcional)</Label>
                  <Select value={formData.tipo_animal} onValueChange={(value) => setFormData({ ...formData, tipo_animal: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos</SelectItem>
                      {tiposAnimales.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenido">Contenido *</Label>
                <Textarea
                  id="contenido"
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  rows={5}
                  placeholder="Escribe el consejo o tip..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen (opcional)</Label>
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

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                  {editando ? 'Actualizar' : 'Crear Tip'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogAbierto(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filtroCategoria === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroCategoria('todos')}
        >
          Todos
        </Button>
        {['SALUD', 'NUTRICION', 'COMPORTAMIENTO', 'ADIESTRAMIENTO', 'HIGIENE', 'GENERAL'].map(cat => (
          <Button
            key={cat}
            variant={filtroCategoria === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroCategoria(cat)}
          >
            {getCategoriaTexto(cat)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tipsFiltrados.map((tip) => (
          <Card key={tip.id} className="overflow-hidden flex flex-col">
            {tip.imagen && (
              <div className="h-48 relative bg-gray-100 flex-shrink-0">
                <img src={tip.imagen} alt={tip.titulo} className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getCategoriaColor(tip.categoria)}`}>
                    {getCategoriaIcon(tip.categoria)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tip.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getCategoriaTexto(tip.categoria)}
                      {tip.tipo_animal_nombre && ` • ${tip.tipo_animal_nombre}`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  tip.publicado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {tip.publicado ? 'Público' : 'Borrador'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{tip.contenido}</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => compartirTip(tip)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => togglePublicar(tip)}
                >
                  {tip.publicado ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => handleEditar(tip)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="icon" className="text-red-600" onClick={() => handleEliminar(tip.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {tipsFiltrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay tips en esta categoría</p>
        </div>
      )}
    </div>
  );
}