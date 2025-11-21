import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Save, Upload, Building, Mail, Phone, MapPin, Globe, Facebook, Instagram, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { refugioService } from '../services/api';

export function Configuracion() {
  const [perfil, setPerfil] = useState({
    nombre: '',
    descripcion: '',
    email: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
    ciudad: '',
    region: '',
    sitioWeb: '',
    facebook: '',
    instagram: '',
    fotoPerfil: '',
    fotoPortada: '',
    horarioAtencion: '',
    capacidadRefugio: '',
    anioFundacion: '',
  });

  const inputPerfilRef = useRef<HTMLInputElement>(null);
  const inputPortadaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const data = await refugioService.obtenerMiPerfil();
        setPerfil({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          email: data.contactos?.find((c: any) => c.tipo === 'EMAIL')?.valor || '',
          telefono: data.contactos?.find((c: any) => c.tipo === 'TELEFONO')?.valor || '',
          whatsapp: data.contactos?.find((c: any) => c.tipo === 'WHATSAPP')?.valor || '',
          direccion: data.direccion || '',
          ciudad: data.ciudad || '',
          region: data.region || '',
          sitioWeb: data.contactos?.find((c: any) => c.tipo === 'SITIO_WEB')?.valor || '',
          facebook: data.redes_sociales?.find((r: any) => r.plataforma === 'FACEBOOK')?.url || '',
          instagram: data.redes_sociales?.find((r: any) => r.plataforma === 'INSTAGRAM')?.url || '',
          fotoPerfil: data.logo || '',
          fotoPortada: data.portada || '',
          horarioAtencion: data.horario_atencion || '',
          capacidadRefugio: data.capacidad?.toString() || '',
          anioFundacion: data.anio_fundacion?.toString() || '',
        });
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar el perfil');
      }
    };
    
    cargarPerfil();
  }, []);
      
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = await refugioService.actualizarPerfil({
        nombre: perfil.nombre,
        descripcion: perfil.descripcion,
        anio_fundacion: parseInt(perfil.anioFundacion) || null,
        capacidad: parseInt(perfil.capacidadRefugio) || null,
        direccion: perfil.direccion,
        ciudad: perfil.ciudad,
        region: perfil.region,
        horario_atencion: perfil.horarioAtencion,
        logo: perfil.fotoPerfil,
        portada: perfil.fotoPortada,
        contactos: [
          { tipo: 'EMAIL', valor: perfil.email, principal: true },
          { tipo: 'TELEFONO', valor: perfil.telefono, principal: false },
          { tipo: 'WHATSAPP', valor: perfil.whatsapp, principal: false },
          ...(perfil.sitioWeb ? [{ tipo: 'SITIO_WEB', valor: perfil.sitioWeb, principal: false }] : [])
        ],
        redes_sociales: [
          ...(perfil.facebook ? [{ 
            plataforma: 'FACEBOOK', 
            url: perfil.facebook.startsWith('http') ? perfil.facebook : `https://${perfil.facebook}` 
          }] : []),
          ...(perfil.instagram ? [{ 
            plataforma: 'INSTAGRAM', 
            url: perfil.instagram.startsWith('http') ? perfil.instagram : `https://instagram.com/${perfil.instagram.replace('@', '')}` 
          }] : [])
        ]
      });
      
      if (data.success) {
        toast.success(data.message);
      }
    } catch (error) {
      toast.error('Error al guardar la configuración');
    }
  };

  const handleSubirFoto = (tipo: 'perfil' | 'portada') => {
    if (tipo === 'perfil') {
      inputPerfilRef.current?.click();
    } else {
      inputPortadaRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'perfil' | 'portada') => {
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
        if (tipo === 'perfil') {
          setPerfil({ ...perfil, fotoPerfil: reader.result as string });
          toast.success('Logo actualizado correctamente');
        } else {
          setPerfil({ ...perfil, fotoPortada: reader.result as string });
          toast.success('Foto de portada actualizada correctamente');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1>Configuración de la Fundación</h1>
        <p className="text-muted-foreground">Administra la información pública de tu fundación</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-500" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGuardar} className="space-y-6">
            <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/30">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={perfil.fotoPerfil} />
                <AvatarFallback className="text-4xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {perfil.nombre.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <input
                ref={inputPerfilRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'perfil')}
                className="hidden"
              />
              <div className="text-center space-y-2">
                <h3>{perfil.nombre}</h3>
                <Button onClick={() => handleSubirFoto('perfil')} variant="outline" size="sm" type="button">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Logo
                </Button>
                <p className="text-xs text-muted-foreground">Recomendado: 500x500px, formato PNG o JPG</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Foto de Portada</Label>
              <div className="aspect-video relative bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
                {perfil.fotoPortada ? (
                  <img src={perfil.fotoPortada} alt="Portada" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay portada</p>
                  </div>
                )}
              </div>
              <input
                ref={inputPortadaRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'portada')}
                className="hidden"
              />
              <Button onClick={() => handleSubirFoto('portada')} variant="outline" size="sm" className="w-full" type="button">
                <Upload className="w-4 h-4 mr-2" />
                Subir Foto de Portada
              </Button>
              <p className="text-xs text-muted-foreground">Recomendado: 1920x1080px, formato JPG</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="nombre">Nombre de la Fundación *</Label>
                <Input
                  id="nombre"
                  value={perfil.nombre}
                  onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  rows={5}
                  value={perfil.descripcion}
                  onChange={(e) => setPerfil({ ...perfil, descripcion: e.target.value })}
                  placeholder="Describe la misión, visión y actividades de tu fundación..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Esta información se mostrará en tu perfil público
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anioFundacion">Año de Fundación</Label>
                <Input
                  id="anioFundacion"
                  type="number"
                  value={perfil.anioFundacion}
                  onChange={(e) => setPerfil({ ...perfil, anioFundacion: e.target.value })}
                  placeholder="2014"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad del Refugio</Label>
                <Input
                  id="capacidad"
                  type="number"
                  value={perfil.capacidadRefugio}
                  onChange={(e) => setPerfil({ ...perfil, capacidadRefugio: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-500" />
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={perfil.email}
                      onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      type="tel"
                      value={perfil.telefono}
                      onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={perfil.whatsapp}
                      onChange={(e) => setPerfil({ ...perfil, whatsapp: e.target.value })}
                      className="pl-10"
                      placeholder="+56 9 8765 4321"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sitioWeb">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="sitioWeb"
                      value={perfil.sitioWeb}
                      onChange={(e) => setPerfil({ ...perfil, sitioWeb: e.target.value })}
                      className="pl-10"
                      placeholder="www.ejemplo.cl"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="direccion"
                      value={perfil.direccion}
                      onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    value={perfil.ciudad}
                    onChange={(e) => setPerfil({ ...perfil, ciudad: e.target.value })}
                    placeholder="La Serena"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Región *</Label>
                  <Input
                    id="region"
                    value={perfil.region}
                    onChange={(e) => setPerfil({ ...perfil, region: e.target.value })}
                    placeholder="Coquimbo"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-500" />
                Redes Sociales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="facebook"
                      value={perfil.facebook}
                      onChange={(e) => setPerfil({ ...perfil, facebook: e.target.value })}
                      className="pl-10"
                      placeholder="facebook.com/tupagina"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      value={perfil.instagram}
                      onChange={(e) => setPerfil({ ...perfil, instagram: e.target.value })}
                      className="pl-10"
                      placeholder="@tuusuario"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="horario">Horario de Atención</Label>
              <Textarea
                id="horario"
                rows={3}
                value={perfil.horarioAtencion}
                onChange={(e) => setPerfil({ ...perfil, horarioAtencion: e.target.value })}
                placeholder="Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 10:00 - 14:00"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}