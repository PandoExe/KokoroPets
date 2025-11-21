import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Share2, PawPrint, Scissors, Stethoscope, Dumbbell, BookOpen, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { tipService, tipFavoritoService } from '../../services/api';

interface Tip {
  id: number;
  titulo: string;
  contenido: string;
  categoria: 'SALUD' | 'NUTRICION' | 'COMPORTAMIENTO' | 'ADIESTRAMIENTO' | 'HIGIENE' | 'GENERAL';
  imagen: string;
  tipo_animal: number | string | null;
  tipo_animal_nombre?: string | null;
  refugio: number;
  refugio_nombre: string;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

export function TipsUsuario() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<string>('todos');
  const [dialogCompartir, setDialogCompartir] = useState(false);
  const [tipSeleccionado, setTipSeleccionado] = useState<Tip | null>(null);
  const [favoritos, setFavoritos] = useState<number[]>([]);

  useEffect(() => {
    cargarTips();
    cargarFavoritos();
  }, []);

  const cargarTips = async () => {
    try {
      setCargando(true);
      const response = await tipService.listar();
      const data = Array.isArray(response) ? response : (response.results || []);
      setTips(data);
    } catch (error) {
      console.error('Error al cargar tips:', error);
      toast.error('Error al cargar tips');
      setTips([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarFavoritos = async () => {
    try {
      const data = await tipFavoritoService.listar();
      const ids = data.map((fav: any) => fav.tip);
      setFavoritos(ids);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      // Si hay error (ej: no autenticado), intentar cargar desde localStorage como fallback
      const favs = localStorage.getItem('tips_favoritos');
      if (favs) {
        setFavoritos(JSON.parse(favs));
      }
    }
  };

  const toggleFavorito = async (id: number) => {
    try {
      const result = await tipFavoritoService.toggle(id);

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
      localStorage.setItem('tips_favoritos', JSON.stringify(nuevos));
    } catch (error: any) {
      // Si falla la API, usar localStorage como fallback
      const nuevos = favoritos.includes(id)
        ? favoritos.filter(f => f !== id)
        : [...favoritos, id];

      localStorage.setItem('tips_favoritos', JSON.stringify(nuevos));
      setFavoritos(nuevos);
      toast.success(favoritos.includes(id) ? 'Eliminado de favoritos' : 'Añadido a favoritos');
    }
  };

  const compartirTip = (tip: Tip) => {
    const texto = `💡 ${tip.titulo}\n\n${tip.contenido}\n\n📍 ${tip.refugio_nombre} - KokoroPets`;
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWhatsApp, '_blank');
    setDialogCompartir(false);
    toast.success('Compartido exitosamente');
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'SALUD': return <Stethoscope className="w-4 h-4" />;
      case 'NUTRICION': return <PawPrint className="w-4 h-4" />;
      case 'COMPORTAMIENTO': return <Dumbbell className="w-4 h-4" />;
      case 'ADIESTRAMIENTO': return <Dumbbell className="w-4 h-4" />;
      case 'HIGIENE': return <Scissors className="w-4 h-4" />;
      case 'GENERAL': return <BookOpen className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCategoriaLabel = (categoria: string): string => {
    const labels: Record<string, string> = {
      'SALUD': 'Salud',
      'NUTRICION': 'Nutrición',
      'COMPORTAMIENTO': 'Comportamiento',
      'ADIESTRAMIENTO': 'Adiestramiento',
      'HIGIENE': 'Higiene',
      'GENERAL': 'General'
    };
    return labels[categoria] || categoria;
  };

  const tipsFiltrados = filtro === 'todos' 
    ? tips 
    : tips.filter(t => t.categoria === filtro);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando tips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tips de Cuidado</h1>
        <p className="text-muted-foreground">Aprende a cuidar mejor de tu mascota</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filtro === 'todos' ? 'default' : 'outline'}
          onClick={() => setFiltro('todos')}
          className={filtro === 'todos' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
        >
          Todos
        </Button>
        <Button
          variant={filtro === 'SALUD' ? 'default' : 'outline'}
          onClick={() => setFiltro('SALUD')}
          className={filtro === 'SALUD' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
        >
          Salud
        </Button>
        <Button
          variant={filtro === 'NUTRICION' ? 'default' : 'outline'}
          onClick={() => setFiltro('NUTRICION')}
          className={filtro === 'NUTRICION' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
        >
          Nutrición
        </Button>
        <Button
          variant={filtro === 'COMPORTAMIENTO' ? 'default' : 'outline'}
          onClick={() => setFiltro('COMPORTAMIENTO')}
          className={filtro === 'COMPORTAMIENTO' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
        >
          Comportamiento
        </Button>
        <Button
          variant={filtro === 'ADIESTRAMIENTO' ? 'default' : 'outline'}
          onClick={() => setFiltro('ADIESTRAMIENTO')}
          className={filtro === 'ADIESTRAMIENTO' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
        >
          Adiestramiento
        </Button>
        <Button
          variant={filtro === 'HIGIENE' ? 'default' : 'outline'}
          onClick={() => setFiltro('HIGIENE')}
          className={filtro === 'HIGIENE' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
        >
          Higiene
        </Button>
      </div>

      <Tabs defaultValue="todos">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="todos">Todos ({tipsFiltrados.length})</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos ({favoritos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-6">
          {tipsFiltrados.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay tips disponibles</h3>
                <p className="text-muted-foreground">No hay tips en esta categoría.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tipsFiltrados.map((tip, index) => {
                const esFavorito = favoritos.includes(tip.id);
                return (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-purple-100">
                              {getCategoriaIcon(tip.categoria)}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{tip.titulo}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                📍 {tip.refugio_nombre}
                              </p>
                              {tip.tipo_animal_nombre && (
                                <Badge variant="secondary" className="mt-2">
                                  {tip.tipo_animal_nombre}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {getCategoriaLabel(tip.categoria)}
                            </Badge>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleFavorito(tip.id)}
                              className={`p-2 rounded-full transition-all ${
                                esFavorito ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${esFavorito ? 'fill-current' : ''}`} />
                            </motion.button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        {tip.imagen && (
                          <img
                            src={tip.imagen}
                            alt={tip.titulo}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">{tip.contenido}</p>
                      </CardContent>

                      <CardFooter className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTipSeleccionado(tip);
                            setDialogCompartir(true);
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favoritos" className="mt-6">
          {tipsFiltrados.filter(t => favoritos.includes(t.id)).length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes tips favoritos</h3>
                <p className="text-muted-foreground">
                  Marca tips con ❤️ para guardarlos aquí
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tipsFiltrados.filter(t => favoritos.includes(t.id)).map((tip, index) => {
                const esFavorito = true; // Siempre es favorito en esta tab
                return (
                  <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-purple-100">
                              {getCategoriaIcon(tip.categoria)}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{tip.titulo}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                📍 {tip.refugio_nombre}
                              </p>
                              {tip.tipo_animal_nombre && (
                                <Badge variant="secondary" className="mt-2">
                                  {tip.tipo_animal_nombre}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {getCategoriaLabel(tip.categoria)}
                            </Badge>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleFavorito(tip.id)}
                              className="p-2 rounded-full bg-pink-500 text-white transition-all"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </motion.button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        {tip.imagen && (
                          <img
                            src={tip.imagen}
                            alt={tip.titulo}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                          />
                        )}
                        <p className="text-sm text-muted-foreground">{tip.contenido}</p>
                      </CardContent>

                      <CardFooter className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTipSeleccionado(tip);
                            setDialogCompartir(true);
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogCompartir} onOpenChange={setDialogCompartir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compartir Tip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              onClick={() => tipSeleccionado && compartirTip(tipSeleccionado)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir por WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setDialogCompartir(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}