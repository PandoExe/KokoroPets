import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, Building, User, ArrowLeft, Upload, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';
import { authService } from '../services/api';
import LogoPng from '../assets/logo.png';

type TipoUsuario = 'fundacion' | 'usuario';
type Modo = 'login' | 'registro';

interface LoginDobleFactorProps {
  onAutenticado: (tipo: TipoUsuario) => void;
}

export function LoginDobleFactor({ onAutenticado }: LoginDobleFactorProps) {
  const [paso, setPaso] = useState<'seleccion' | 'credenciales' | 'registro' | 'codigo'>('seleccion');
  const [modo, setModo] = useState<Modo>('login');
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('fundacion');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  
  const [nombre, setNombre] = useState('');
  const [nombreFundacion, setNombreFundacion] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [documento, setDocumento] = useState<File | null>(null);
  const [opcionContacto, setOpcionContacto] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = await authService.login({ email, password });
      
      if (data.success) {
        setUserId(data.user_id);
        setPaso('codigo');
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (password !== confirmPassword) {
    toast.error('Las contraseñas no coinciden');
    return;
  }
  
  if (password.length < 8) {
    toast.error('La contraseña debe tener al menos 8 caracteres');
    return;
  }
  
  if (tipoUsuario === 'fundacion' && !opcionContacto && !documento) {
    toast.error('Debes subir un documento o elegir contactar al equipo');
    return;
  }
  
  if (opcionContacto) {
    toast.success('¡Solicitud enviada! Nuestro equipo te contactará pronto.');
    setTimeout(() => {
      setPaso('seleccion');
      setModo('login');
      limpiarFormulario();
    }, 2000);
    return;
  }
  
  try {
    let data;
    
    if (tipoUsuario === 'fundacion') {
      
      const formData = new FormData();
      formData.append('tipo_usuario', 'fundacion');
      formData.append('email', email);
      formData.append('password', password);
      formData.append('nombre_fundacion', nombreFundacion);
      if (documento) {
        formData.append('documento_verificacion', documento);
      }
      
      data = await authService.registro(formData);
    } else {
      
      data = await authService.registro({
        tipo_usuario: 'usuario',
        email,
        password,
        nombre
      });
    }
    
    if (data.success) {
      if (data.requiere_verificacion) {
        toast.success('Cuenta creada. Un administrador verificará tu fundación pronto.');
        setTimeout(() => {
          setPaso('seleccion');
          setModo('login');
          limpiarFormulario();
        }, 3000);
      } else {
        setUserId(data.user_id);
        setPaso('codigo');
        toast.success(data.message);
      }
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error('Error de conexión con el servidor');
  }
};

  const handleVerificarCodigo = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!userId) {
    toast.error('Error: ID de usuario no encontrado');
    return;
  }
  
  try {
    const data = await authService.verificarCodigo({ user_id: userId, codigo });
    
    if (data.success) {
      toast.success(data.message);
      
      
      const tipoParaCallback = data.user.tipo_usuario === 'REFUGIO' ? 'fundacion' : 'usuario';
      onAutenticado(tipoParaCallback);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error('Error de conexión con el servidor');
  }
};

  const limpiarFormulario = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNombre('');
    setNombreFundacion('');
    setCodigo('');
    setDocumento(null);
    setOpcionContacto(false);
    setUserId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumento(e.target.files[0]);
      toast.success('Documento cargado correctamente');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={LogoPng} alt="KokoRo Pets Logo" className="w-24 h-24" />
            </div>
            <CardTitle>KokoroPets</CardTitle>
            <CardDescription>
              {paso === 'seleccion' 
                ? 'Sistema de gestión de adopciones'
                : paso === 'credenciales'
                ? modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
                : paso === 'registro'
                ? 'Completa tu registro'
                : 'Verificación de doble factor'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paso === 'seleccion' ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground mb-6">
                  Selecciona tu tipo de cuenta
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setTipoUsuario('fundacion');
                      setPaso('credenciales');
                    }}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-medium">Fundación</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setTipoUsuario('usuario');
                      setPaso('credenciales');
                    }}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all"
                  >
                    <div className="p-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <span className="font-medium">Usuario</span>
                  </button>
                </div>
              </div>
            ) : paso === 'credenciales' && modo === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={tipoUsuario === 'fundacion' ? 'fundacion@ejemplo.com' : 'usuario@ejemplo.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Iniciar sesión
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setPaso('seleccion')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cambiar tipo de cuenta
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-sm text-muted-foreground">
                      ¿No tienes cuenta?
                    </span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setModo('registro');
                    setPaso('registro');
                    limpiarFormulario();
                  }}
                >
                  Crear cuenta nueva
                </Button>
              </form>
            ) : paso === 'registro' ? (
              <motion.form 
                onSubmit={handleRegistro} 
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tipoUsuario === 'usuario' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input
                        id="nombre"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-registro">Email</Label>
                      <Input
                        id="email-registro"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password-registro">Contraseña</Label>
                      <Input
                        id="password-registro"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirma tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nombre-fundacion">Nombre de la fundación</Label>
                      <Input
                        id="nombre-fundacion"
                        type="text"
                        placeholder="Nombre completo de la fundación"
                        value={nombreFundacion}
                        onChange={(e) => setNombreFundacion(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-registro-fundacion">Email institucional</Label>
                      <Input
                        id="email-registro-fundacion"
                        type="email"
                        placeholder="contacto@fundacion.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password-registro-fundacion">Contraseña</Label>
                      <Input
                        id="password-registro-fundacion"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password-fundacion">Confirmar contraseña</Label>
                      <Input
                        id="confirm-password-fundacion"
                        type="password"
                        placeholder="Confirma tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <Label>Verificación de fundación</Label>
                      
                      {!opcionContacto ? (
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-purple-500 transition-colors">
                            <input
                              type="file"
                              id="documento"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              disabled={opcionContacto}
                            />
                            <label
                              htmlFor="documento"
                              className="flex flex-col items-center gap-2 cursor-pointer"
                            >
                              <Upload className="w-8 h-8 text-muted-foreground" />
                              <span className="text-sm text-center">
                                {documento ? documento.name : 'Subir documento de acreditación'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                PDF, JPG o PNG (máx. 150MB)
                              </span>
                            </label>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center">
                              <span className="bg-card px-2 text-xs text-muted-foreground">
                                O
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      <Button
                        type="button"
                        variant={opcionContacto ? "default" : "outline"}
                        className="w-full"
                        onClick={() => {
                          setOpcionContacto(!opcionContacto);
                          if (!opcionContacto) {
                            setDocumento(null);
                          }
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {opcionContacto ? 'Contacto con equipo seleccionado' : 'Contactar al equipo de KokoroPets'}
                      </Button>
                      
                      {opcionContacto && (
                        <Alert>
                          <AlertDescription>
                            Nuestro equipo revisará tu solicitud y te contactará en las próximas 48 horas.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}
                
                <div className="pt-2">
                  <Button type="submit" className="w-full">
                    {opcionContacto ? 'Enviar solicitud' : 'Crear cuenta'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setPaso('credenciales');
                      setModo('login');
                      limpiarFormulario();
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al inicio de sesión
                  </Button>
                </div>
              </motion.form>
            ) : (
              <form onSubmit={handleVerificarCodigo} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <Shield className="w-12 h-12 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de verificación</Label>
                  <Input
                    id="codigo"
                    type="text"
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingresa el código enviado a tu email
                  </p>
                </div>
                <Button type="submit" className="w-full">
                  Verificar código
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setPaso('seleccion');
                    limpiarFormulario();
                  }}
                >
                  Volver
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Demo: código 123456
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}