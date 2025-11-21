import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import {
  Save, Upload, User, Mail, Phone, MapPin, Home,
  PawPrint, Loader2, CheckCircle2, Calendar, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { perfilAdoptanteService, authService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface PerfilAdoptante {
  user: number;
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

export function PerfilUsuario() {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fotoPerfil: ''
  });

  const [perfil, setPerfil] = useState<PerfilAdoptante>({
    user: 0,
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

  const inputFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      cargarDatos();
    }
  }, [user]);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      if (!user?.id) {
        toast.error('No se pudo obtener información del usuario');
        return;
      }

      // Cargar datos del usuario completos desde la API
      const userResponse = await authService.obtenerPerfilAuth();
      const userData = userResponse.user || userResponse;

      setUserData({
        nombre: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
        email: userData.email || '',
        telefono: userData.telefono || '',
        fotoPerfil: userData.foto_perfil || ''
      });

      // Cargar perfil de adoptante
      try {
        const perfilResponse = await perfilAdoptanteService.obtener(user.id);
        if (perfilResponse) {
          setPerfil({
            ...perfil,
            ...perfilResponse,
            user: user.id
          });
        }
      } catch (error: any) {
        if (error.message !== 'NOT_FOUND') {
          console.error('Error al cargar perfil:', error);
        }
        setPerfil(prev => ({ ...prev, user: user.id }));
      }
    } catch (error) {
      toast.error('Error al cargar datos del perfil');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    try {
      setGuardando(true);

      // 1. Actualizar datos del usuario (teléfono y foto de perfil)
      const datosUsuario: { telefono?: string; foto_perfil?: string } = {};

      if (userData.telefono) {
        datosUsuario.telefono = userData.telefono;
      }

      // Si hay una foto nueva (base64), enviarla
      if (userData.fotoPerfil && userData.fotoPerfil.startsWith('data:image')) {
        datosUsuario.foto_perfil = userData.fotoPerfil;
      }

      if (Object.keys(datosUsuario).length > 0) {
        await authService.actualizarPerfilAuth(datosUsuario);
      }

      // 2. Actualizar perfil de adoptante
      const datosAGuardar = {
        user: user.id,
        rut: perfil.rut || '',
        fecha_nacimiento: perfil.fecha_nacimiento || null,
        direccion: perfil.direccion || '',
        ciudad: perfil.ciudad || '',
        region: perfil.region || '',
        tipo_vivienda: perfil.tipo_vivienda || 'CASA',
        tiene_patio: perfil.tiene_patio || false,
        es_propietario: perfil.es_propietario || false,
        experiencia_previa: perfil.experiencia_previa || false,
        tiene_mascotas: perfil.tiene_mascotas || false,
        cantidad_mascotas: perfil.cantidad_mascotas || 0
      };

      await perfilAdoptanteService.actualizarOCrear(user.id, datosAGuardar);

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>Perfil actualizado correctamente</span>
        </div>
      );

      // Recargar datos para mostrar la foto actualizada
      await cargarDatos();
    } catch (error: any) {
      console.error('❌ Error al guardar perfil:', error);
      toast.error(error.message || 'Error al guardar perfil');
    } finally {
      setGuardando(false);
    }
  };

  const handleSubirFoto = () => {
    inputFileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona una imagen válida');
        return;
      }

      if (file.size > 150 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 150MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({ ...userData, fotoPerfil: reader.result as string });
        toast.success('Foto seleccionada. Guarda los cambios para aplicar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    if (!userData.nombre) return 'U';
    return userData.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Administra tu información personal y preferencias de adopción</p>
      </div>

      {/* Foto de Perfil */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="w-32 h-32 border-4 border-purple-100">
            <AvatarImage src={userData.fotoPerfil} />
            <AvatarFallback className="text-4xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <input
            ref={inputFileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button onClick={handleSubirFoto} variant="outline" className="border-2">
            <Upload className="w-4 h-4 mr-2" />
            Subir Foto
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o GIF. Max 150MB
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Información de Cuenta */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Información de Cuenta
            </CardTitle>
            <CardDescription>
              Datos de tu cuenta de usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userData.nombre}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userData.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="telefono"
                  placeholder="+56 9 1234 5678"
                  value={userData.telefono}
                  onChange={(e) => setUserData({ ...userData, telefono: e.target.value })}
                  className="pl-10 border-2"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: +56 9 1234 5678
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Datos Personales */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Datos Personales
            </CardTitle>
            <CardDescription>
              Información requerida para el proceso de adopción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="rut"
                    placeholder="12.345.678-9"
                    value={perfil.rut}
                    onChange={(e) => setPerfil({ ...perfil, rut: e.target.value })}
                    className="pl-10 border-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={perfil.fecha_nacimiento}
                    onChange={(e) => setPerfil({ ...perfil, fecha_nacimiento: e.target.value })}
                    className="pl-10 border-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicación
            </CardTitle>
            <CardDescription>
              Tu dirección para coordinar visitas y entregas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="direccion"
                  placeholder="Calle, número, depto..."
                  value={perfil.direccion}
                  onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
                  className="pl-10 border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  placeholder="Tu ciudad"
                  value={perfil.ciudad}
                  onChange={(e) => setPerfil({ ...perfil, ciudad: e.target.value })}
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  placeholder="Tu región"
                  value={perfil.region}
                  onChange={(e) => setPerfil({ ...perfil, region: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vivienda */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Información de Vivienda
            </CardTitle>
            <CardDescription>
              Detalles sobre tu hogar para evaluar compatibilidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_vivienda">Tipo de Vivienda</Label>
              <Select
                value={perfil.tipo_vivienda}
                onValueChange={(value) => setPerfil({ ...perfil, tipo_vivienda: value })}
              >
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASA">Casa</SelectItem>
                  <SelectItem value="DEPARTAMENTO">Departamento</SelectItem>
                  <SelectItem value="PARCELA">Parcela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                <div className="space-y-0.5">
                  <Label>¿Tiene patio?</Label>
                  <p className="text-sm text-muted-foreground">
                    Espacio exterior para la mascota
                  </p>
                </div>
                <Switch
                  checked={perfil.tiene_patio}
                  onCheckedChange={(checked) => setPerfil({ ...perfil, tiene_patio: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border-2 rounded-lg">
                <div className="space-y-0.5">
                  <Label>¿Es propietario de la vivienda?</Label>
                  <p className="text-sm text-muted-foreground">
                    Propietario o arrendatario
                  </p>
                </div>
                <Switch
                  checked={perfil.es_propietario}
                  onCheckedChange={(checked) => setPerfil({ ...perfil, es_propietario: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiencia con Mascotas */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5" />
              Experiencia con Mascotas
            </CardTitle>
            <CardDescription>
              Cuéntanos sobre tu experiencia previa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 rounded-lg">
              <div className="space-y-0.5">
                <Label>¿Tiene experiencia previa con mascotas?</Label>
                <p className="text-sm text-muted-foreground">
                  Has cuidado mascotas anteriormente
                </p>
              </div>
              <Switch
                checked={perfil.experiencia_previa}
                onCheckedChange={(checked) => setPerfil({ ...perfil, experiencia_previa: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border-2 rounded-lg">
              <div className="space-y-0.5">
                <Label>¿Tiene otras mascotas actualmente?</Label>
                <p className="text-sm text-muted-foreground">
                  Vives con otras mascotas
                </p>
              </div>
              <Switch
                checked={perfil.tiene_mascotas}
                onCheckedChange={(checked) => setPerfil({ ...perfil, tiene_mascotas: checked })}
              />
            </div>

            {perfil.tiene_mascotas && (
              <div className="space-y-2">
                <Label htmlFor="cantidad_mascotas">Cantidad de mascotas</Label>
                <Input
                  id="cantidad_mascotas"
                  type="number"
                  min="0"
                  placeholder="¿Cuántas mascotas tienes?"
                  value={perfil.cantidad_mascotas}
                  onChange={(e) => setPerfil({ ...perfil, cantidad_mascotas: parseInt(e.target.value) || 0 })}
                  className="border-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botón Guardar */}
        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg"
          disabled={guardando}
        >
          {guardando ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
