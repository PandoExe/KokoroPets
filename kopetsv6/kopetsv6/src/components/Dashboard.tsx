import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PawPrint, Users, TrendingUp, Heart, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import {
  mascotaService,
  solicitudAdopcionService,
  adopcionService,
  resenaRefugioService,
  notificacionService,
  refugioService
} from '../services/api';

interface Estadistica {
  titulo: string;
  valor: number;
  cambio?: string;
  positivo?: boolean;
  icono: any;
  color: string;
  bgColor: string;
}

export function Dashboard() {
  const { donaciones } = useApp();
  const [estadisticas, setEstadisticas] = useState<Estadistica[]>([]);
  const [distribucionMascotas, setDistribucionMascotas] = useState<any[]>([]);
  const [estadoMascotas, setEstadoMascotas] = useState<any[]>([]);
  const [actividadesRecientes, setActividadesRecientes] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    tasaAdopcion: 0,
    satisfaccion: 0,
    totalResenas: 0,
    tiempoPromedio: 0
  });
  const [datosAdopciones, setDatosAdopciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      setCargando(true);

      
      const [
        mascotasData,
        solicitudesData,
        adopcionesData,
        resenasData,
        notificacionesData,
        estadisticasMensuales
      ] = await Promise.all([
        mascotaService.listar().catch(() => ({ results: [] })),
        solicitudAdopcionService.listar().catch(() => []),
        adopcionService.listar().catch(() => []),
        resenaRefugioService.listar().catch(() => []),
        notificacionService.listar().catch(() => []),
        refugioService.obtenerEstadisticasMensuales().catch(() => [])
      ]);

    
      const mascotas = Array.isArray(mascotasData) ? mascotasData : (mascotasData.results || []);
      const totalMascotas = mascotas.length;

      
      const solicitudes = Array.isArray(solicitudesData) ? solicitudesData : (solicitudesData.results || []);

      
      const adopciones = Array.isArray(adopcionesData) ? adopcionesData : (adopcionesData.results || []);
      const adopcionesEsteMes = adopciones.filter((a: any) => {
        const fecha = new Date(a.fecha_adopcion);
        const hoy = new Date();
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      }).length;

      
      const resenas = Array.isArray(resenasData) ? resenasData : (resenasData.results || []);
      const promedioCalificacion = resenas.length > 0
        ? resenas.reduce((sum: number, r: any) => sum + r.calificacion, 0) / resenas.length
        : 0;

      
      setEstadisticas([
        {
          titulo: 'Mascotas Totales',
          valor: totalMascotas,
          icono: PawPrint,
          color: 'text-purple-500',
          bgColor: 'bg-purple-100'
        },
        {
          titulo: 'Adopciones Este Mes',
          valor: adopcionesEsteMes,
          icono: Heart,
          color: 'text-pink-500',
          bgColor: 'bg-pink-100'
        },
        {
          titulo: 'Solicitudes Pendientes',
          valor: solicitudes.filter((s: any) => s.estado === 'PENDIENTE').length,
          icono: Users,
          color: 'text-green-500',
          bgColor: 'bg-green-100'
        },
      ]);

      
      const distribucion: any = {};
      mascotas.forEach((m: any) => {
        const tipo = m.tipo_animal || 'Otro';
        distribucion[tipo] = (distribucion[tipo] || 0) + 1;
      });

      const colores = ['#a855f7', '#ec4899', '#22c55e', '#3b82f6', '#f59e0b'];
      setDistribucionMascotas(
        Object.entries(distribucion).map(([nombre, valor], index) => ({
          nombre,
          valor,
          color: colores[index % colores.length]
        }))
      );

      
      const estadosDist: any = {
        'Disponibles': 0,
        'En Proceso': 0,
        'Adoptados': 0
      };

      mascotas.forEach((m: any) => {
        if (m.estado === 'DISPONIBLE') estadosDist['Disponibles']++;
        else if (m.estado === 'ADOPTADO') estadosDist['Adoptados']++;
        else estadosDist['En Proceso']++;
      });

      setEstadoMascotas(
        Object.entries(estadosDist).map(([estado, cantidad]) => ({
          estado,
          cantidad
        }))
      );

      
      const notificaciones = Array.isArray(notificacionesData) ? notificacionesData : (notificacionesData.results || []);
      setActividadesRecientes(
        notificaciones.slice(0, 4).map((n: any) => ({
          id: n.id,
          tipo: n.tipo,
          texto: n.mensaje,
          tiempo: formatearTiempo(n.fecha_creacion),
          icono: getIconoActividad(n.tipo),
          color: getColorActividad(n.tipo)
        }))
      );

      
      const tasaAdopcion = totalMascotas > 0
        ? Math.round((adopciones.length / totalMascotas) * 100)
        : 0;

      setMetricas({
        tasaAdopcion,
        satisfaccion: Math.round(promedioCalificacion * 10) / 10,
        totalResenas: resenas.length,
        tiempoPromedio: 45 
      });

      
      if (Array.isArray(estadisticasMensuales) && estadisticasMensuales.length > 0) {
        setDatosAdopciones(estadisticasMensuales);
      } else {
        
        setDatosAdopciones([
          { mes: 'Ene', adopciones: 0, solicitudes: 0 },
          { mes: 'Feb', adopciones: 0, solicitudes: 0 },
          { mes: 'Mar', adopciones: 0, solicitudes: 0 },
          { mes: 'Abr', adopciones: 0, solicitudes: 0 },
          { mes: 'May', adopciones: 0, solicitudes: 0 },
          { mes: 'Jun', adopciones: 0, solicitudes: 0 },
        ]);
      }

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearTiempo = (fecha: string) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diff = ahora.getTime() - fechaNotif.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias > 0) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return 'Hace unos momentos';
  };

  const getIconoActividad = (tipo: string) => {
    switch (tipo) {
      case 'ADOPCION': return CheckCircle;
      case 'SOLICITUD': return Clock;
      case 'MASCOTA': return PawPrint;
      default: return AlertCircle;
    }
  };

  const getColorActividad = (tipo: string) => {
    switch (tipo) {
      case 'ADOPCION': return 'text-green-500';
      case 'SOLICITUD': return 'text-blue-500';
      case 'MASCOTA': return 'text-purple-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de la fundación</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icono;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.titulo}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl">{stat.valor}</span>
                      <span className={`text-sm ${stat.positivo ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.cambio}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Adopciones Mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Adopciones vs Solicitudes</CardTitle>
            <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosAdopciones}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="adopciones" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  name="Adopciones"
                />
                <Line 
                  type="monotone" 
                  dataKey="solicitudes" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  name="Solicitudes"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Distribución de Mascotas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Mascotas</CardTitle>
            <p className="text-sm text-muted-foreground">Por tipo de animal</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribucionMascotas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nombre, valor }) => `${nombre}: ${valor}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {distribucionMascotas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Estado de Mascotas */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Mascotas</CardTitle>
            <p className="text-sm text-muted-foreground">Distribución actual</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={estadoMascotas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Actividades Recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <p className="text-sm text-muted-foreground">Últimas actualizaciones</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actividadesRecientes.length > 0 ? (
                actividadesRecientes.map((actividad) => {
                  const Icon = actividad.icono;
                  return (
                    <div key={actividad.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg bg-muted ${actividad.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{actividad.texto}</p>
                        <p className="text-xs text-muted-foreground">{actividad.tiempo}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/90">Tasa de Adopción</p>
                <p className="text-3xl mt-1">{metricas.tasaAdopcion}%</p>
                <p className="text-xs text-white/80 mt-1">Del total de mascotas</p>
              </div>
              <TrendingUp className="w-12 h-12 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/90">Satisfacción</p>
                <p className="text-3xl mt-1">{metricas.satisfaccion > 0 ? `${metricas.satisfaccion}/5` : 'N/A'}</p>
                <p className="text-xs text-white/80 mt-1">{metricas.totalResenas} reseñas</p>
              </div>
              <Heart className="w-12 h-12 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/90">Tiempo Promedio</p>
                <p className="text-3xl mt-1">{metricas.tiempoPromedio} días</p>
                <p className="text-xs text-white/80 mt-1">Hasta adopción</p>
              </div>
              <Clock className="w-12 h-12 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
