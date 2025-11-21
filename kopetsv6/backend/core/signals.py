
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import (
    Notificacion,
    SolicitudAdopcion,
    Tip,
    Campana,
    VisitaSeguimiento,
    EventoVoluntariado,
    Adopcion,
    Mascota
)

User = get_user_model()


def crear_notificacion_segura(usuario, tipo, titulo, mensaje, url=''):
    
    try:
        Notificacion.objects.create(
            usuario=usuario,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            url=url
        )
    except Exception as e:
        print(f"Error al crear notificación: {e}")


@receiver(post_save, sender=SolicitudAdopcion)
def notificar_solicitud_adopcion(sender, instance, created, **kwargs):
    
    if created:
        
        refugio_usuario = instance.mascota.refugio.user
        crear_notificacion_segura(
            usuario=refugio_usuario,
            tipo='SOLICITUD_NUEVA',
            titulo=f'Nueva solicitud de adopción para {instance.mascota.nombre}',
            mensaje=f'{instance.adoptante.get_full_name() or instance.adoptante.username} ha enviado una solicitud para adoptar a {instance.mascota.nombre}.',
            url=f'/solicitudes/{instance.id}'
        )
    else:
        
        try:
            
            solicitud_anterior = SolicitudAdopcion.objects.get(pk=instance.pk)

            
            if instance.estado == 'APROBADA' and solicitud_anterior.estado != 'APROBADA':
                crear_notificacion_segura(
                    usuario=instance.adoptante,
                    tipo='SOLICITUD_APROBADA',
                    titulo=f'¡Solicitud aprobada para {instance.mascota.nombre}!',
                    mensaje=f'Tu solicitud para adoptar a {instance.mascota.nombre} ha sido aprobada. El refugio se pondrá en contacto contigo pronto.',
                    url=f'/adopciones/{instance.id}'
                )

            
            elif instance.estado == 'RECHAZADA' and solicitud_anterior.estado != 'RECHAZADA':
                crear_notificacion_segura(
                    usuario=instance.adoptante,
                    tipo='SOLICITUD_RECHAZADA',
                    titulo=f'Solicitud para {instance.mascota.nombre}',
                    mensaje=f'Lamentablemente tu solicitud para adoptar a {instance.mascota.nombre} no fue aprobada en esta ocasión.',
                    url=f'/mascotas'
                )
        except SolicitudAdopcion.DoesNotExist:
            
            pass


@receiver(pre_save, sender=SolicitudAdopcion)
def guardar_estado_anterior_solicitud(sender, instance, **kwargs):
    
    if instance.pk:
        try:
            instance._estado_anterior = SolicitudAdopcion.objects.get(pk=instance.pk).estado
        except SolicitudAdopcion.DoesNotExist:
            instance._estado_anterior = None


@receiver(post_save, sender=SolicitudAdopcion)
def notificar_cambio_estado_solicitud(sender, instance, created, **kwargs):
    
    if not created and hasattr(instance, '_estado_anterior'):
        estado_anterior = instance._estado_anterior

        if instance.estado == 'APROBADA' and estado_anterior != 'APROBADA':
            crear_notificacion_segura(
                usuario=instance.adoptante,
                tipo='SOLICITUD_APROBADA',
                titulo=f'¡Solicitud aprobada para {instance.mascota.nombre}!',
                mensaje=f'Tu solicitud para adoptar a {instance.mascota.nombre} ha sido aprobada. El refugio se pondrá en contacto contigo pronto.',
                url=f'/adopciones'
            )

        elif instance.estado == 'RECHAZADA' and estado_anterior != 'RECHAZADA':
            crear_notificacion_segura(
                usuario=instance.adoptante,
                tipo='SOLICITUD_RECHAZADA',
                titulo=f'Solicitud para {instance.mascota.nombre}',
                mensaje=f'Lamentablemente tu solicitud para adoptar a {instance.mascota.nombre} no fue aprobada en esta ocasión.',
                url=f'/mascotas'
            )


@receiver(pre_save, sender=Tip)
def guardar_estado_publicacion_anterior(sender, instance, **kwargs):
    
    if instance.pk:
        try:
            instance._publicado_anterior = Tip.objects.get(pk=instance.pk).publicado
        except Tip.DoesNotExist:
            instance._publicado_anterior = False


@receiver(post_save, sender=Tip)
def notificar_nuevo_tip(sender, instance, created, **kwargs):
    
    
    publicado_ahora = False

    if created and instance.publicado:
        publicado_ahora = True
    elif not created and hasattr(instance, '_publicado_anterior'):
        if instance.publicado and not instance._publicado_anterior:
            publicado_ahora = True

    if publicado_ahora:
        
        usuarios = User.objects.filter(tipo_usuario='USUARIO')

        for usuario in usuarios:
            crear_notificacion_segura(
                usuario=usuario,
                tipo='TIP_NUEVO',
                titulo='Nuevo consejo disponible',
                mensaje=f'Nuevo tip: {instance.titulo}',
                url=f'/tips/{instance.id}'
            )


@receiver(post_save, sender=Campana)
def notificar_nueva_campana(sender, instance, created, **kwargs):
    
    if created:
        
        usuarios = User.objects.filter(tipo_usuario='USUARIO')

        for usuario in usuarios:
            crear_notificacion_segura(
                usuario=usuario,
                tipo='CAMPANA_NUEVA',
                titulo='Nueva campaña disponible',
                mensaje=f'{instance.titulo} - ¡Descubre cómo puedes ayudar!',
                url=f'/campanas/{instance.id}'
            )


@receiver(post_save, sender=VisitaSeguimiento)
def notificar_visita_programada(sender, instance, created, **kwargs):
    
    if created:
        crear_notificacion_segura(
            usuario=instance.adopcion.solicitud.adoptante,
            tipo='VISITA_PROGRAMADA',
            titulo='Visita de seguimiento programada',
            mensaje=f'Se ha programado una visita de seguimiento para {instance.fecha_programada.strftime("%d/%m/%Y")}.',
            url=f'/adopciones/{instance.adopcion.id}'
        )


@receiver(post_save, sender=EventoVoluntariado)
def notificar_nuevo_evento_voluntariado(sender, instance, created, **kwargs):
    
    if created:
        
        usuarios = User.objects.filter(tipo_usuario='USUARIO')

        for usuario in usuarios:
            crear_notificacion_segura(
                usuario=usuario,
                tipo='VOLUNTARIADO_NUEVO',
                titulo='Nuevo evento de voluntariado',
                mensaje=f'{instance.titulo} - {instance.fecha_evento.strftime("%d/%m/%Y")} en {instance.refugio.nombre}',
                url=f'/voluntariado/{instance.id}'
            )


@receiver(post_save, sender=Adopcion)
def actualizar_campanas_adopcion(sender, instance, created, **kwargs):
    
    if created:
        from django.utils import timezone
        refugio = instance.solicitud.mascota.refugio
        fecha_adopcion = instance.fecha_adopcion

        
        campanas_activas = Campana.objects.filter(
            refugio=refugio,
            tipo_kpi='ADOPCIONES',
            estado='ACTIVA',
            fecha_inicio__lte=fecha_adopcion,
            fecha_fin__gte=fecha_adopcion
        )

        
        for campana in campanas_activas:
            campana.valor_actual_kpi += 1
            campana.save(update_fields=['valor_actual_kpi'])


@receiver(pre_save, sender=Mascota)
def guardar_estado_anterior_mascota(sender, instance, **kwargs):
    
    if instance.pk:
        try:
            instance._estado_anterior = Mascota.objects.get(pk=instance.pk).estado
        except Mascota.DoesNotExist:
            instance._estado_anterior = None


@receiver(post_save, sender=Mascota)
def actualizar_campanas_por_mascota_adoptada(sender, instance, created, **kwargs):
    
    if not created and hasattr(instance, '_estado_anterior'):
        
        if instance.estado == 'ADOPTADO' and instance._estado_anterior != 'ADOPTADO':
            from django.utils import timezone
            refugio = instance.refugio
            hoy = timezone.now().date()

            
            campanas_activas = Campana.objects.filter(
                refugio=refugio,
                tipo_kpi='ADOPCIONES',
                estado='ACTIVA',
                fecha_inicio__lte=hoy,
                fecha_fin__gte=hoy
            )

            
            for campana in campanas_activas:
                campana.valor_actual_kpi += 1
                campana.save(update_fields=['valor_actual_kpi'])
