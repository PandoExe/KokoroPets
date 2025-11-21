import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { HelpCircle, MessageCircle, Settings, Shield, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export function MasUsuario() {
  const [dialogConfiguracion, setDialogConfiguracion] = useState(false);
  const [dialogAyuda, setDialogAyuda] = useState(false);
  const [dialogPrivacidad, setDialogPrivacidad] = useState(false);
  const [dialogTerminos, setDialogTerminos] = useState(false);

  // Estados de configuración
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true,
    adopciones: true,
    campanas: false,
  });

  const contactarSoporte = () => {
    const mensaje = 'Hola, necesito ayuda con KokoroPets';
    window.open(`https://wa.me/+56987654321?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const guardarConfiguracion = () => {
    toast.success('Configuración guardada correctamente');
    setDialogConfiguracion(false);
  };

  const faqItems = [
    {
      pregunta: '¿Cómo puedo adoptar una mascota?',
      respuesta: 'Para adoptar una mascota, navega a la sección "Adopciones", selecciona la mascota que te interese y haz clic en "Solicitar Adopción". La fundación revisará tu solicitud y te contactará.'
    },
    {
      pregunta: '¿Cuánto tiempo tarda el proceso de adopción?',
      respuesta: 'El proceso generalmente toma entre 24-72 horas. La fundación evaluará tu solicitud y se pondrá en contacto contigo para coordinar una visita o entrevista.'
    },
    {
      pregunta: '¿Puedo ser voluntario en una fundación?',
      respuesta: 'Sí, en la sección "Voluntariado" puedes ver las oportunidades disponibles y postularte a las que te interesen. Las fundaciones buscan constantemente voluntarios comprometidos.'
    },
    {
      pregunta: '¿Cómo funcionan las donaciones?',
      respuesta: 'Puedes hacer donaciones únicas o mensuales a las fundaciones desde la sección "Fundaciones". Todas las donaciones son seguras y ayudan directamente a las mascotas.'
    },
    {
      pregunta: '¿Qué pasa si mi solicitud es rechazada?',
      respuesta: 'Si tu solicitud es rechazada, no te desanimes. Puedes contactar a la fundación para más información o intentar con otra mascota. Cada fundación tiene sus propios criterios de adopción.'
    },
    {
      pregunta: '¿Cómo puedo ver el estado de mi solicitud?',
      respuesta: 'En la sección "Mis Solicitudes" puedes ver todas tus solicitudes de adopción y su estado actual (Pendiente, Aprobada o Rechazada).'
    },
    {
      pregunta: '¿Las mascotas están vacunadas?',
      respuesta: 'Sí, en la ficha de cada mascota puedes ver el detalle completo de sus vacunas y estado de salud. La mayoría de las mascotas están esterilizadas y al día con sus vacunas.'
    },
    {
      pregunta: '¿Hay algún costo por adoptar?',
      respuesta: 'Depende de cada fundación. Algunas cobran una pequeña tarifa de adopción que cubre los gastos veterinarios básicos. Esta información se proporciona durante el proceso de adopción.'
    }
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1>Más</h1>
        <p className="text-muted-foreground">Configuración y ayuda</p>
      </div>

      <div className="space-y-4">
        {/* Configuración */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setDialogConfiguracion(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-purple-500" />
                Configuración
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ajusta tus preferencias y configuración de la cuenta
            </p>
          </CardContent>
        </Card>

        {/* Centro de Ayuda */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setDialogAyuda(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                Centro de Ayuda
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Encuentra respuestas a las preguntas más frecuentes
            </p>
          </CardContent>
        </Card>

        {/* Contactar Soporte */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Contactar Soporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda? Contáctanos directamente a nuestro equipo de Kokoropets
            </p>
            <Button 
              onClick={contactarSoporte}
              className="w-full bg-gradient-to-r from-green-500 to-green-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Privacidad y Seguridad */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setDialogPrivacidad(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-yellow-500" />
                Privacidad y Seguridad
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Administra tu privacidad y seguridad de la cuenta
            </p>
          </CardContent>
        </Card>

        {/* Términos y Condiciones */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setDialogTerminos(true)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                Términos y Condiciones
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lee nuestros términos de servicio y políticas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Configuración */}
      <Dialog open={dialogConfiguracion} onOpenChange={setDialogConfiguracion}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Configuración
            </DialogTitle>
            <DialogDescription>
              Personaliza tu experiencia en KokoroPets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4>Notificaciones</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-email" className="cursor-pointer">
                    Notificaciones por Email
                  </Label>
                  <Switch
                    id="notif-email"
                    checked={notificaciones.email}
                    onCheckedChange={(checked) => 
                      setNotificaciones({ ...notificaciones, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-push" className="cursor-pointer">
                    Notificaciones Push
                  </Label>
                  <Switch
                    id="notif-push"
                    checked={notificaciones.push}
                    onCheckedChange={(checked) => 
                      setNotificaciones({ ...notificaciones, push: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-adopciones" className="cursor-pointer">
                    Actualizaciones de Adopciones
                  </Label>
                  <Switch
                    id="notif-adopciones"
                    checked={notificaciones.adopciones}
                    onCheckedChange={(checked) => 
                      setNotificaciones({ ...notificaciones, adopciones: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-campanas" className="cursor-pointer">
                    Nuevas Campañas
                  </Label>
                  <Switch
                    id="notif-campanas"
                    checked={notificaciones.campanas}
                    onCheckedChange={(checked) => 
                      setNotificaciones({ ...notificaciones, campanas: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              onClick={guardarConfiguracion}
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Centro de Ayuda */}
      <Dialog open={dialogAyuda} onOpenChange={setDialogAyuda}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Centro de Ayuda
            </DialogTitle>
            <DialogDescription>
              Preguntas Frecuentes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.pregunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.respuesta}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 mb-3">
                ¿No encontraste lo que buscabas?
              </p>
              <Button 
                onClick={contactarSoporte}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar Soporte
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog Privacidad y Seguridad */}
      <Dialog open={dialogPrivacidad} onOpenChange={setDialogPrivacidad}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              Privacidad y Seguridad
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div>
                <h4 className="mb-2">Política de Privacidad</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  En KokoroPets, valoramos tu privacidad y estamos comprometidos a proteger tus datos personales.
                </p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <strong className="text-foreground">Información que recopilamos:</strong>
                    <p>Recopilamos información que nos proporcionas al crear una cuenta, solicitar adopciones, y participar en campañas.</p>
                  </div>
                  <div>
                    <strong className="text-foreground">Uso de la información:</strong>
                    <p>Utilizamos tu información para procesar solicitudes de adopción, mejorar nuestros servicios, y contactarte sobre actualizaciones relevantes.</p>
                  </div>
                  <div>
                    <strong className="text-foreground">Protección de datos:</strong>
                    <p>Implementamos medidas de seguridad para proteger tu información personal contra acceso no autorizado.</p>
                  </div>
                  <div>
                    <strong className="text-foreground">Compartir información:</strong>
                    <p>Solo compartimos tu información con las fundaciones cuando solicitas una adopción. Nunca vendemos tus datos a terceros.</p>
                  </div>
                  <div>
                    <strong className="text-foreground">Tus derechos:</strong>
                    <p>Tienes derecho a acceder, modificar o eliminar tu información personal en cualquier momento desde tu perfil.</p>
                  </div>
                </div>
              </div>
              
              <Separator />

              <div>
                <h4 className="mb-2">Seguridad de la Cuenta</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      ✓ Tu cuenta está protegida con autenticación de doble factor
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-900">
                      💡 Consejo: Nunca compartas tu contraseña con nadie
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog Términos y Condiciones */}
      <Dialog open={dialogTerminos} onOpenChange={setDialogTerminos}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Términos y Condiciones
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="text-foreground mb-2">1. Aceptación de Términos</h4>
                <p>
                  Al acceder y utilizar KokoroPets, aceptas estar sujeto a estos términos y condiciones. 
                  Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.
                </p>
              </div>

              <div>
                <h4 className="text-foreground mb-2">2. Uso del Servicio</h4>
                <p>
                  KokoroPets es una plataforma que conecta a usuarios con fundaciones de adopción de mascotas. 
                  El usuario se compromete a utilizar el servicio de manera responsable y ética.
                </p>
              </div>

              <div>
                <h4 className="text-foreground mb-2">3. Adopciones</h4>
                <p>
                  Las solicitudes de adopción son evaluadas por las fundaciones individuales. KokoroPets 
                  actúa como intermediario y no garantiza la aprobación de ninguna solicitud. Cada fundación 
                  tiene sus propios criterios y procesos de adopción.
                </p>
              </div>

              <div>
                <h4 className="text-foreground mb-2">4. Responsabilidades del Usuario</h4>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Proporcionar información veraz y actualizada</li>
                  <li>Mantener la confidencialidad de tu cuenta</li>
                  <li>No utilizar el servicio para fines fraudulentos</li>
                  <li>Respetar a las fundaciones y otros usuarios</li>
                  <li>Cumplir con los compromisos adquiridos en adopciones</li>
                </ul>
              </div>

              <div>
                <h4 className="text-foreground mb-2">5. Donaciones</h4>
                <p>
                  Las donaciones realizadas a través de la plataforma son voluntarias y no son reembolsables. 
                  Los fondos se transfieren directamente a las fundaciones seleccionadas.
                </p>
              </div>

              <div>
                <h4 className="text-foreground mb-2">6. Limitación de Responsabilidad</h4>
                <p>
                  KokoroPets no se hace responsable por disputas entre usuarios y fundaciones, o por 
                  cualquier problema que surja después de completar una adopción. La relación post-adopción 
                  es entre el adoptante y la fundación.
                </p>
              </div>

              <div>
                <h4 className="text-foreground mb-2">7. Modificaciones</h4>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios 
                  serán efectivos inmediatamente después de su publicación en la plataforma.
                </p>
              </div>

              <div>
                <h4 className="text-foreground mb-2">8. Contacto</h4>
                <p>
                  Para cualquier pregunta sobre estos términos, puedes contactarnos a través del 
                  botón "Contactar Soporte" en la sección Más.
                </p>
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-center">
                Última actualización: Octubre 2024
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
