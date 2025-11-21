import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { inventarioService } from '../services/api';

interface ItemInventario {
  id: number;
  nombre: string;
  categoria: 'ALIMENTO' | 'MEDICAMENTO' | 'EQUIPO' | 'HIGIENE' | 'JUGUETE' | 'OTRO';
  cantidad: number;
  unidad: 'unidad' | 'kg' | 'litro' | 'caja' | 'bolsa';
  stock_minimo: number;
  precio_unitario: number;
  proveedor: string;
  fecha_ultima_compra: string;
  fecha_vencimiento?: string;
  ubicacion: string;
  notas?: string;
}

export function Inventario() {
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemInventario | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [tabActiva, setTabActiva] = useState('todos');
  const [cargando, setCargando] = useState(false);

  const [form, setForm] = useState<any>({
    nombre: '',
    categoria: 'ALIMENTO',
    cantidad: 0,
    unidad: 'unidad',
    stock_minimo: 5,
    precio_unitario: '',
    proveedor: '',
    fecha_ultima_compra: new Date().toISOString().split('T')[0],
    ubicacion: '',
    notas: ''
  });

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      setCargando(true);
      const data = await inventarioService.listar();
      const items = Array.isArray(data) ? data : (data.results || []);
      setItems(items);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      toast.error('Error al cargar el inventario');
      setItems([]);
    } finally {
      setCargando(false);
    }
  };

  const abrirDialogNuevo = () => {
    setItemEditando(null);
    setForm({
      nombre: '',
      categoria: 'ALIMENTO',
      cantidad: 0,
      unidad: 'unidad',
      stock_minimo: 5,
      precio_unitario: '',
      proveedor: '',
      fecha_ultima_compra: new Date().toISOString().split('T')[0],
      ubicacion: '',
      notas: ''
    });
    setDialogAbierto(true);
  };

  const abrirDialogEditar = (item: ItemInventario) => {
    setItemEditando(item);
    setForm({
      ...item,
      precio_unitario: String(item.precio_unitario)
    });
    setDialogAbierto(true);
  };

  const guardarItem = async () => {
    try {
      if (!form.nombre || !form.proveedor || !form.ubicacion) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      
      const dataToSend = {
        ...form,
        precio_unitario: parseInt(form.precio_unitario) || 0
      };

      if (itemEditando) {
        
        await inventarioService.actualizar(itemEditando.id, dataToSend);
        toast.success('Item actualizado correctamente');
      } else {
        
        await inventarioService.crear(dataToSend);
        toast.success('Item agregado correctamente');
      }

      setDialogAbierto(false);
      await cargarInventario();
    } catch (error) {
      console.error('Error al guardar item:', error);
      toast.error('Error al guardar el item');
    }
  };

  const eliminarItem = async (id: number) => {
    toast('¿Estás seguro de eliminar este item?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await inventarioService.eliminar(id);
            toast.success('Item eliminado correctamente');
            await cargarInventario();
          } catch (error) {
            console.error('Error al eliminar item:', error);
            toast.error('Error al eliminar el item');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const itemsFiltrados = items.filter(item => {
    const matchBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          item.proveedor.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = filtroCategoria === 'todos' || item.categoria === filtroCategoria;

    let matchTab = true;
    if (tabActiva === 'bajo-stock') {
      matchTab = item.cantidad <= item.stock_minimo;
    } else if (tabActiva === 'por-vencer') {
      if (item.fecha_vencimiento) {
        const diasHastaVencimiento = Math.floor(
          (new Date(item.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        matchTab = diasHastaVencimiento <= 30;
      } else {
        matchTab = false;
      }
    }

    return matchBusqueda && matchCategoria && matchTab;
  });

  const estadisticas = {
    totalItems: items.length,
    valorTotal: items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0),
    itemsBajoStock: items.filter(item => item.cantidad <= item.stock_minimo).length,
    itemsPorVencer: items.filter(item => {
      if (!item.fecha_vencimiento) return false;
      const dias = Math.floor(
        (new Date(item.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return dias <= 30 && dias >= 0;
    }).length
  };

  const getCategoriaColor = (categoria: string) => {
    const colores = {
      ALIMENTO: 'bg-green-100 text-green-700',
      MEDICAMENTO: 'bg-red-100 text-red-700',
      EQUIPO: 'bg-blue-100 text-blue-700',
      HIGIENE: 'bg-purple-100 text-purple-700',
      JUGUETE: 'bg-yellow-100 text-yellow-700',
      OTRO: 'bg-gray-100 text-gray-700'
    };
    return colores[categoria as keyof typeof colores] || colores.OTRO;
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const exportarExcel = () => {
    toast.info('Función de exportación en desarrollo');
    
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Gestión de Inventario</h1>
          <p className="text-muted-foreground mt-2">
            Administra el stock de suministros, alimentos y medicamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={abrirDialogNuevo}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Item
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-3xl mt-1">{estadisticas.totalItems}</p>
              </div>
              <Package className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl mt-1">{formatearMonto(estadisticas.valorTotal)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bajo Stock</p>
                <p className="text-3xl mt-1">{estadisticas.itemsBajoStock}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
                <p className="text-3xl mt-1">{estadisticas.itemsPorVencer}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                <SelectItem value="ALIMENTO">Alimentos</SelectItem>
                <SelectItem value="MEDICAMENTO">Medicamentos</SelectItem>
                <SelectItem value="EQUIPO">Equipamiento</SelectItem>
                <SelectItem value="HIGIENE">Higiene</SelectItem>
                <SelectItem value="JUGUETE">Juguetes</SelectItem>
                <SelectItem value="OTRO">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos">
            Todos ({items.length})
          </TabsTrigger>
          <TabsTrigger value="bajo-stock">
            Bajo Stock ({estadisticas.itemsBajoStock})
          </TabsTrigger>
          <TabsTrigger value="por-vencer">
            Por Vencer ({estadisticas.itemsPorVencer})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tabActiva} className="mt-6">
          {cargando ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando inventario...</p>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Archive className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay items</h3>
                <p className="text-muted-foreground mb-4">
                  {busqueda || filtroCategoria !== 'todos'
                    ? 'No se encontraron items con los filtros aplicados'
                    : 'Comienza agregando items a tu inventario'}
                </p>
                {!busqueda && filtroCategoria === 'todos' && (
                  <Button onClick={abrirDialogNuevo}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Item
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsFiltrados.map((item, index) => {
                const bajoStock = item.cantidad <= item.stock_minimo;
                const porcentajeStock = (item.cantidad / item.stock_minimo) * 100;

                let diasHastaVencimiento = null;
                if (item.fecha_vencimiento) {
                  diasHastaVencimiento = Math.floor(
                    (new Date(item.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{item.nombre}</CardTitle>
                            <Badge className={`mt-2 ${getCategoriaColor(item.categoria)}`}>
                              {item.categoria}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirDialogEditar(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminarItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stock</span>
                            <span className={bajoStock ? 'text-red-500 font-semibold' : 'font-medium'}>
                              {item.cantidad} {item.unidad}
                            </span>
                          </div>

                          {/* Barra de progreso de stock */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                porcentajeStock > 100 ? 'bg-green-500' :
                                porcentajeStock > 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(porcentajeStock, 100)}%` }}
                            />
                          </div>

                          {bajoStock && (
                            <div className="flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle className="w-3 h-3" />
                              Stock bajo - Mínimo: {item.stock_minimo}
                            </div>
                          )}
                        </div>

                        {diasHastaVencimiento !== null && diasHastaVencimiento <= 30 && (
                          <div className={`text-xs p-2 rounded ${
                            diasHastaVencimiento <= 7 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            {diasHastaVencimiento <= 0
                              ? 'Vencido'
                              : `Vence en ${diasHastaVencimiento} días`}
                          </div>
                        )}

                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            Proveedor: <span className="text-foreground">{item.proveedor}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Ubicación: <span className="text-foreground">{item.ubicacion}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Valor: <span className="text-foreground font-semibold">
                              {formatearMonto(item.precio_unitario * item.cantidad)}
                            </span>
                          </p>
                        </div>

                        {item.notas && (
                          <p className="text-xs text-muted-foreground italic border-t pt-2">
                            {item.notas}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para crear/editar */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {itemEditando ? 'Editar Item' : 'Nuevo Item'}
            </DialogTitle>
            <DialogDescription>
              {itemEditando
                ? 'Modifica los datos del item de inventario'
                : 'Agrega un nuevo item al inventario'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="nombre">Nombre del Item *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Alimento para perros"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={form.categoria}
                onValueChange={(value: any) => setForm({ ...form, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALIMENTO">Alimento</SelectItem>
                  <SelectItem value="MEDICAMENTO">Medicamento</SelectItem>
                  <SelectItem value="EQUIPO">Equipamiento</SelectItem>
                  <SelectItem value="HIGIENE">Higiene</SelectItem>
                  <SelectItem value="JUGUETE">Juguete</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unidad">Unidad de Medida *</Label>
              <Select
                value={form.unidad}
                onValueChange={(value: any) => setForm({ ...form, unidad: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidad">Unidad</SelectItem>
                  <SelectItem value="kg">Kilogramos</SelectItem>
                  <SelectItem value="litro">Litros</SelectItem>
                  <SelectItem value="caja">Caja</SelectItem>
                  <SelectItem value="bolsa">Bolsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cantidad">Cantidad Actual *</Label>
              <Input
                id="cantidad"
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
              <Input
                id="stock_minimo"
                type="number"
                value={form.stock_minimo}
                onChange={(e) => setForm({ ...form, stock_minimo: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="precio_unitario">Precio Unitario (CLP) *</Label>
              <Input
                id="precio_unitario"
                type="text"
                inputMode="numeric"
                value={form.precio_unitario}
                onChange={(e) => {
                  const value = e.target.value;
                  
                  if (value === '' || /^\d+$/.test(value)) {
                    setForm({ ...form, precio_unitario: value });
                  }
                }}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="proveedor">Proveedor *</Label>
              <Input
                id="proveedor"
                value={form.proveedor}
                onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>

            <div>
              <Label htmlFor="fecha_ultima_compra">Fecha Última Compra *</Label>
              <Input
                id="fecha_ultima_compra"
                type="date"
                value={form.fecha_ultima_compra}
                onChange={(e) => setForm({ ...form, fecha_ultima_compra: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="fecha_vencimiento">Fecha Vencimiento (Opcional)</Label>
              <Input
                id="fecha_vencimiento"
                type="date"
                value={form.fecha_vencimiento || ''}
                onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="ubicacion">Ubicación *</Label>
              <Input
                id="ubicacion"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                placeholder="Ej: Bodega A - Estante 1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notas">Notas (Opcional)</Label>
              <Input
                id="notas"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Observaciones adicionales"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarItem}>
              {itemEditando ? 'Actualizar' : 'Crear Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
