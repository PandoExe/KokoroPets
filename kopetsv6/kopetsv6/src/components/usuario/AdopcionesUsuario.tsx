import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Heart, Search, MessageCircle, ChevronLeft, ChevronRight, Check, X, Syringe, Building, MapPin, Info, Ruler, Palette, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { mascotaPublicaService, solicitudAdopcionService, mascotaFavoritaService } from '../../services/api';

interface VacunaAPI {
  id: number;
  tipo_vacuna: number;
  tipo_vacuna_nombre: string;
  tipo_vacuna_obligatoria: boolean;
  fecha_aplicacion: string;
}

interface Mascota {
  id: number;
  nombre: string;
  tipo_animal: number;
  tipo_animal_nombre: string;
  raza: number | null;
  raza_nombre: string | null;
  sexo: string;
  edad: string;
  descripcion: string;
  foto_principal: string;
  foto_2: string;
  foto_3: string;
  esterilizado: boolean;
  desparasitado: boolean;
  microchip: boolean;
  vacunas_aplicadas: VacunaAPI[];
  vacunas: Record<string, boolean | string>;
  refugio_nombre: string;
  refugio_ciudad: string;
  refugio_region: string;
  whatsapp: string;
  fecha_ingreso: string;
  tamano?: string;
  color?: string;
  nivel_energia?: string;
  nivel_cuidado?: string;
  apto_ninos?: boolean;
  apto_apartamento?: boolean;
  sociable_perros?: boolean;
  sociable_gatos?: boolean;
}

const procesarImagenSrc = (src: string | undefined) => {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('data:')) return src;
  if (src.startsWith('/media/')) return `http://localhost:8000${src}`;
  return `data:image/jpeg;base64,${src}`;
};

// ✅ NUEVO: Mapeo de valores a texto legible
const mapearTamano = (tamano: string) => {
  const tamanos: Record<string, string> = {
    PEQUENO: 'Pequeño',
    MEDIANO: 'Mediano',
    GRANDE: 'Grande',
    GIGANTE: 'Gigante'
  };
  return tamanos[tamano] || tamano;
};

const mapearNivelEnergia = (nivel: string) => {
  const niveles: Record<string, string> = {
    BAJA: 'Baja',
    MEDIA: 'Media',
    ALTA: 'Alta'
  };
  return niveles[nivel] || nivel;
};

export function AdopcionesUsuario() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTamano, setFiltroTamano] = useState<string>('');
  const [filtroColor, setFiltroColor] = useState<string>('');
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [fotoActual, setFotoActual] = useState<{ [key: number]: number }>({});
  const [dialogDetalles, setDialogDetalles] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<Mascota | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);

  // ✅ NUEVO: Extraer colores únicos de las mascotas disponibles
  const coloresDisponibles = useMemo(() => {
    const colores = new Set<string>();
    mascotas.forEach(m => {
      if (m.color && m.color.trim()) {
        colores.add(m.color.trim());
      }
    });
    return Array.from(colores).sort();
  }, [mascotas]);

  useEffect(() => {
    cargarMascotas();
    cargarFavoritos();
  }, []);

  const cargarMascotas = async () => {
    try {
      setCargando(true);
      const data = await mascotaPublicaService.listar();
      setMascotas(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error('Error al cargar mascotas');
      setMascotas([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarFavoritos = async () => {
    try {
      const data = await mascotaFavoritaService.listar();
      const ids = data.map((fav: any) => fav.mascota);
      setFavoritos(ids);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      // Si hay error (ej: no autenticado), intentar cargar desde localStorage como fallback
      const favs = localStorage.getItem('favoritos');
      if (favs) {
        setFavoritos(JSON.parse(favs));
      }
    }
  };

  // ✅ ACTUALIZADO: Filtrado combinado incluyendo tamaño y color
  const mascotasFiltradas = useMemo(() => {
    let resultado = mascotas;

    // Filtro de búsqueda por texto
    const q = busqueda.trim().toLowerCase();
    if (q) {
      resultado = resultado.filter(m =>
        m.nombre.toLowerCase().includes(q) ||
        m.raza_nombre?.toLowerCase().includes(q) ||
        m.tipo_animal_nombre?.toLowerCase().includes(q) ||
        (m.color && m.color.toLowerCase().includes(q)) ||
        (m.tamano && mapearTamano(m.tamano).toLowerCase().includes(q))
      );
    }

    // Filtro de tamaño
    if (filtroTamano) {
      resultado = resultado.filter(m => m.tamano === filtroTamano);
    }

    // Filtro de color
    if (filtroColor) {
      resultado = resultado.filter(m => 
        m.color && m.color.trim().toLowerCase() === filtroColor.toLowerCase()
      );
    }

    return resultado;
  }, [busqueda, filtroTamano, filtroColor, mascotas]);

  // ✅ NUEVO: Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTamano('');
    setFiltroColor('');
  };

  // ✅ NUEVO: Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda || filtroTamano || filtroColor;

  const toggleFavorito = async (id: number) => {
    try {
      const esFavorito = favoritos.includes(id);
      const result = await mascotaFavoritaService.toggle(id);

      // Actualizar el estado local
      if (result.favorito) {
        setFavoritos([...favoritos, id]);
        toast.success('Añadido a favoritos');
      } else {
        setFavoritos(favoritos.filter(f => f !== id));
        toast.success('Eliminado de favoritos');
      }

      // Guardar también en localStorage como backup
      const nuevos = result.favorito
        ? [...favoritos, id]
        : favoritos.filter(f => f !== id);
      localStorage.setItem('favoritos', JSON.stringify(nuevos));
    } catch (error: any) {
      // Si falla la API, usar localStorage como fallback
      const nuevos = favoritos.includes(id)
        ? favoritos.filter(f => f !== id)
        : [...favoritos, id];

      localStorage.setItem('favoritos', JSON.stringify(nuevos));
      setFavoritos(nuevos);
      toast.success(favoritos.includes(id) ? 'Eliminado de favoritos' : 'Añadido a favoritos');
    }
  };

  const cambiarFoto = (mascotaId: number, direccion: 'next' | 'prev', totalFotos: number) => {
    setFotoActual(prev => {
      const actual = prev[mascotaId] || 0;
      let nueva = actual;
      
      if (direccion === 'next') {
        nueva = (actual + 1) % totalFotos;
      } else {
        nueva = actual === 0 ? totalFotos - 1 : actual - 1;
      }
      
      return { ...prev, [mascotaId]: nueva };
    });
  };

  const contactarWhatsApp = (mascota: Mascota) => {
    if (!mascota.whatsapp) {
      toast.error('No hay WhatsApp disponible');
      return;
    }
    const mensaje = `Hola, estoy interesado en adoptar a ${mascota.nombre}`;
    window.open(`https://wa.me/${mascota.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const solicitarAdopcion = async (mascota: Mascota) => {
    try {
      await solicitudAdopcionService.crear({
        mascota: mascota.id,
        mensaje: `Estoy interesado en adoptar a ${mascota.nombre}`
      });
      toast.success(`Solicitud de adopción enviada para ${mascota.nombre}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar solicitud');
    }
  };

  const contarVacunas = (mascota: Mascota) => {
    if (mascota.vacunas_aplicadas && mascota.vacunas_aplicadas.length > 0) {
      return mascota.vacunas_aplicadas.length;
    }
    if (mascota.vacunas) {
      return Object.values(mascota.vacunas).filter(v => v === true).length;
    }
    return 0;
  };

  const getFotos = (mascota: Mascota): string[] => {
    const fotos = [];
    const foto1 = procesarImagenSrc(mascota.foto_principal);
    const foto2 = procesarImagenSrc(mascota.foto_2);
    const foto3 = procesarImagenSrc(mascota.foto_3);
    
    if (foto1) fotos.push(foto1);
    if (foto2) fotos.push(foto2);
    if (foto3) fotos.push(foto3);
    
    return fotos;
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

  const renderMascotaCard = (mascota: Mascota) => {
    const fotos = getFotos(mascota);
    const indiceActual = fotoActual[mascota.id] || 0;
    const esFavorito = favoritos.includes(mascota.id);
    const vacunasAplicadas = contarVacunas(mascota);
    
    const imagenActual = fotos.length > 0 ? fotos[indiceActual] : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="18"%3ESin imagen%3C/text%3E%3C/svg%3E';

    return (
      <motion.div
        key={mascota.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden hover:shadow-xl transition-shadow">
          {/* Carrusel de fotos */}
          <div className="relative aspect-square bg-gray-100 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={`${mascota.id}-${indiceActual}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={imagenActual}
                alt={`${mascota.nombre} - Foto ${indiceActual + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="18"%3EError al cargar%3C/text%3E%3C/svg%3E';
                }}
              />
            </AnimatePresence>

            {/* Botón favorito */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleFavorito(mascota.id)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all z-10 ${
                esFavorito ? 'bg-pink-500 text-white' : 'bg-white/80 text-gray-700'
              }`}
            >
              <Heart className={`w-5 h-5 ${esFavorito ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Controles del carrusel */}
            {fotos.length > 1 && (
              <>
                <button
                  onClick={() => cambiarFoto(mascota.id, 'prev', fotos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-all z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => cambiarFoto(mascota.id, 'next', fotos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-all z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Indicadores */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {fotos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === indiceActual ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badge de fundación */}
            <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-lg">
              <Building className="w-4 h-4" />
              {mascota.refugio_nombre}
            </div>
          </div>

          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {mascota.nombre}
                  <Badge variant="outline">{mascota.sexo === 'MACHO' ? '♂' : '♀'}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {mascota.tipo_animal_nombre} {mascota.raza_nombre && `• ${mascota.raza_nombre}`}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{mascota.refugio_ciudad}, {mascota.refugio_region}</span>
                </div>
              </div>
              <Badge>{getEdadTexto(mascota.edad)}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm line-clamp-2">{mascota.descripcion}</p>

            {/* ✅ NUEVO: Características físicas destacadas */}
            {(mascota.tamano || mascota.color) && (
              <div className="flex flex-wrap gap-2">
                {mascota.tamano && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Ruler className="w-3 h-3 mr-1" />
                    {mapearTamano(mascota.tamano)}
                  </Badge>
                )}
                {mascota.color && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Palette className="w-3 h-3 mr-1" />
                    {mascota.color}
                  </Badge>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado de Salud</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setMascotaSeleccionada(mascota);
                    setDialogDetalles(true);
                  }}
                >
                  <Info className="w-4 h-4 mr-1" />
                  Ver detalles
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {mascota.esterilizado && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    Esterilizado
                  </Badge>
                )}
                {mascota.desparasitado && (
                  <Badge variant="default" className="bg-blue-500">
                    <Check className="w-3 h-3 mr-1" />
                    Desparasitado
                  </Badge>
                )}
                {mascota.microchip && (
                  <Badge variant="default" className="bg-indigo-500">
                    <Check className="w-3 h-3 mr-1" />
                    Microchip
                  </Badge>
                )}
                {vacunasAplicadas > 0 && (
                  <Badge variant="default" className="bg-purple-500">
                    <Syringe className="w-3 h-3 mr-1" />
                    {vacunasAplicadas} vacunas
                  </Badge>
                )}
              </div>
            </div>

            {/* ✅ ACTUALIZADO: Características adicionales con mejor diseño */}
            {mascota.nivel_energia && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Energía: {mapearNivelEnergia(mascota.nivel_energia)}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => contactarWhatsApp(mascota)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
              onClick={() => solicitarAdopcion(mascota)}
            >
              <Heart className="w-4 h-4 mr-2" />
              Adoptar
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Adopciones</h1>
        <p className="text-muted-foreground">Encuentra tu compañero perfecto</p>
      </div>

      {/* ✅ NUEVO: Barra de filtros avanzados */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filtros de búsqueda</h3>
            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="h-8 text-xs"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda por texto */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="         Buscar por nombre, raza, color..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de tamaño */}
            <Select value={filtroTamano} onValueChange={setFiltroTamano}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tamaño" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PEQUENO">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Pequeño
                  </div>
                </SelectItem>
                <SelectItem value="MEDIANO">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Mediano
                  </div>
                </SelectItem>
                <SelectItem value="GRANDE">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Grande
                  </div>
                </SelectItem>
                <SelectItem value="GIGANTE">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Gigante
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de color */}
            <Select value={filtroColor} onValueChange={setFiltroColor}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por color" />
              </SelectTrigger>
              <SelectContent>
                {coloresDisponibles.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay colores registrados
                  </div>
                ) : (
                  coloresDisponibles.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        {color}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Contador de resultados */}
          {hayFiltrosActivos && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                {mascotasFiltradas.length} {mascotasFiltradas.length === 1 ? 'resultado' : 'resultados'}
              </Badge>
              {busqueda && (
                <span>· Búsqueda: "{busqueda}"</span>
              )}
              {filtroTamano && (
                <span>· Tamaño: {mapearTamano(filtroTamano)}</span>
              )}
              {filtroColor && (
                <span>· Color: {filtroColor}</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="todas">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="todas">Todas ({mascotasFiltradas.length})</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos ({favoritos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4 mt-6">
          {mascotasFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mascotasFiltradas.map(renderMascotaCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron mascotas</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favoritos" className="space-y-4 mt-6">
          {mascotasFiltradas.filter(m => favoritos.includes(m.id)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mascotasFiltradas.filter(m => favoritos.includes(m.id)).map(renderMascotaCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-muted-foreground">No tienes favoritos aún</p>
              <p className="text-sm text-muted-foreground mt-2">
                Marca mascotas con ❤️ para verlas aquí
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Detalles */}
      <Dialog open={dialogDetalles} onOpenChange={setDialogDetalles}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Información Completa de {mascotaSeleccionada?.nombre}</DialogTitle>
            <DialogDescription>
              Estado de salud, vacunas y características
            </DialogDescription>
          </DialogHeader>
          {mascotaSeleccionada && (
            <div className="space-y-6">
              {/* Información de la fundación */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="w-6 h-6 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-purple-900">{mascotaSeleccionada.refugio_nombre}</h4>
                    <p className="text-sm text-purple-700">
                      {mascotaSeleccionada.refugio_ciudad}, {mascotaSeleccionada.refugio_region}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ✅ NUEVO: Características físicas */}
              {(mascotaSeleccionada.tamano || mascotaSeleccionada.color || mascotaSeleccionada.nivel_energia) && (
                <>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Características Físicas</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {mascotaSeleccionada.tamano && (
                        <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
                          <Ruler className="w-4 h-4 text-blue-600 mb-1" />
                          <p className="text-xs text-muted-foreground">Tamaño</p>
                          <p className="text-sm font-medium">{mapearTamano(mascotaSeleccionada.tamano)}</p>
                        </div>
                      )}
                      {mascotaSeleccionada.color && (
                        <div className="p-3 rounded-lg border-2 border-amber-200 bg-amber-50">
                          <Palette className="w-4 h-4 text-amber-600 mb-1" />
                          <p className="text-xs text-muted-foreground">Color</p>
                          <p className="text-sm font-medium">{mascotaSeleccionada.color}</p>
                        </div>
                      )}
                      {mascotaSeleccionada.nivel_energia && (
                        <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
                          <span className="text-xl mb-1">⚡</span>
                          <p className="text-xs text-muted-foreground">Energía</p>
                          <p className="text-sm font-medium">{mapearNivelEnergia(mascotaSeleccionada.nivel_energia)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Estado de salud */}
              <div className="space-y-3">
                <h4 className="font-semibold">Estado de Salud</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border-2 ${
                    mascotaSeleccionada.esterilizado ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {mascotaSeleccionada.esterilizado ? (
                      <Check className="w-4 h-4 text-green-600 mb-1" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 mb-1" />
                    )}
                    <span className="text-sm">Esterilizado</span>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    mascotaSeleccionada.desparasitado ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {mascotaSeleccionada.desparasitado ? (
                      <Check className="w-4 h-4 text-green-600 mb-1" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 mb-1" />
                    )}
                    <span className="text-sm">Desparasitado</span>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${
                    mascotaSeleccionada.microchip ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {mascotaSeleccionada.microchip ? (
                      <Check className="w-4 h-4 text-green-600 mb-1" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 mb-1" />
                    )}
                    <span className="text-sm">Microchip</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Vacunas */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-semibold">
                  <Syringe className="w-5 h-5 text-purple-500" />
                  Vacunas Aplicadas
                </h4>
                {mascotaSeleccionada.vacunas_aplicadas && mascotaSeleccionada.vacunas_aplicadas.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {mascotaSeleccionada.vacunas_aplicadas.map((vacuna) => (
                      <div
                        key={vacuna.id}
                        className="p-3 rounded-lg border-2 border-green-500 bg-green-50"
                      >
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">
                              {vacuna.tipo_vacuna_nombre}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              {new Date(vacuna.fecha_aplicacion).toLocaleDateString('es-CL')}
                            </p>
                            {vacuna.tipo_vacuna_obligatoria && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Obligatoria
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                    No hay vacunas registradas
                  </p>
                )}
              </div>

              {/* Compatibilidad */}
              {(mascotaSeleccionada.apto_ninos !== undefined || 
                mascotaSeleccionada.apto_apartamento !== undefined ||
                mascotaSeleccionada.sociable_perros !== undefined ||
                mascotaSeleccionada.sociable_gatos !== undefined) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold">Compatibilidad</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {mascotaSeleccionada.apto_ninos !== undefined && (
                        <div className={`p-3 rounded-lg border-2 ${
                          mascotaSeleccionada.apto_ninos ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          {mascotaSeleccionada.apto_ninos ? (
                            <Check className="w-4 h-4 text-green-600 mb-1" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400 mb-1" />
                          )}
                          <span className="text-sm">Apto para niños</span>
                        </div>
                      )}
                      {mascotaSeleccionada.apto_apartamento !== undefined && (
                        <div className={`p-3 rounded-lg border-2 ${
                          mascotaSeleccionada.apto_apartamento ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          {mascotaSeleccionada.apto_apartamento ? (
                            <Check className="w-4 h-4 text-green-600 mb-1" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400 mb-1" />
                          )}
                          <span className="text-sm">Apto para apartamento</span>
                        </div>
                      )}
                      {mascotaSeleccionada.sociable_perros !== undefined && (
                        <div className={`p-3 rounded-lg border-2 ${
                          mascotaSeleccionada.sociable_perros ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          {mascotaSeleccionada.sociable_perros ? (
                            <Check className="w-4 h-4 text-green-600 mb-1" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400 mb-1" />
                          )}
                          <span className="text-sm">Sociable con perros</span>
                        </div>
                      )}
                      {mascotaSeleccionada.sociable_gatos !== undefined && (
                        <div className={`p-3 rounded-lg border-2 ${
                          mascotaSeleccionada.sociable_gatos ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          {mascotaSeleccionada.sociable_gatos ? (
                            <Check className="w-4 h-4 text-green-600 mb-1" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400 mb-1" />
                          )}
                          <span className="text-sm">Sociable con gatos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Descripción completa */}
              <div className="space-y-2">
                <h4 className="font-semibold">Sobre {mascotaSeleccionada.nombre}</h4>
                <p className="text-sm text-muted-foreground">{mascotaSeleccionada.descripcion}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => contactarWhatsApp(mascotaSeleccionada)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar Fundación
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={() => {
                    solicitarAdopcion(mascotaSeleccionada);
                    setDialogDetalles(false);
                  }}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Solicitar Adopción
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}