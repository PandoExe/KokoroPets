from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.db.models import F, Q
from django.core.exceptions import ValidationError


# =============================================================================
# USUARIOS
# =============================================================================

class CustomUser(AbstractUser):
    
    
    TIPO_USUARIO_CHOICES = [
        ('ADOPTANTE', 'Adoptante'),
        ('REFUGIO', 'Refugio'),
    ]
    
    tipo_usuario = models.CharField(
        max_length=10,
        choices=TIPO_USUARIO_CHOICES,
        default='ADOPTANTE'
    )
    telefono = models.CharField(max_length=15, blank=True)
    foto_perfil = models.ImageField(upload_to='perfiles/', null=True, blank=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'


# =============================================================================
# REFUGIO
# =============================================================================

class Refugio(models.Model):
    
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='perfil_refugio'
    )
    
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    anio_fundacion = models.IntegerField(null=True, blank=True)
    capacidad = models.IntegerField(null=True, blank=True)
    
    documento_verificacion = models.FileField(
        upload_to='documentos_refugios/',
        null=True,
        blank=True
    )
    verificado = models.BooleanField(default=False)
    
    logo = models.ImageField(upload_to='refugios/logos/', blank=True, null=True)
    portada = models.ImageField(upload_to='refugios/portadas/', blank=True, null=True)
    
    direccion = models.CharField(max_length=250)
    ciudad = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    
    horario_atencion = models.TextField(blank=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = 'Refugio'
        verbose_name_plural = 'Refugios'
        constraints = [
            
            models.CheckConstraint(
                check=Q(anio_fundacion__isnull=True) | Q(anio_fundacion__gte=1900, anio_fundacion__lte=2100),
                name='refugio_anio_fundacion_valido'
            ),
            
            models.CheckConstraint(
                check=Q(capacidad__isnull=True) | Q(capacidad__gte=0),
                name='refugio_capacidad_positiva'
            ),
        ]


class ContactoRefugio(models.Model):
    
    
    TIPO_CONTACTO_CHOICES = [
        ('TELEFONO', 'Teléfono'),
        ('WHATSAPP', 'WhatsApp'),
        ('EMAIL', 'Email'),
        ('SITIO_WEB', 'Sitio Web'),
    ]
    
    refugio = models.ForeignKey(
        Refugio,
        on_delete=models.CASCADE,
        related_name='contactos'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CONTACTO_CHOICES, blank=True)
    valor = models.CharField(max_length=250, blank=True)
    principal = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.refugio.nombre} - {self.get_tipo_display()}"
    
    class Meta:
        verbose_name = 'Contacto'
        verbose_name_plural = 'Contactos'


class RedSocialRefugio(models.Model):
    
    
    PLATAFORMA_CHOICES = [
        ('FACEBOOK', 'Facebook'),
        ('INSTAGRAM', 'Instagram'),
    ]
    
    refugio = models.ForeignKey(
        Refugio,
        on_delete=models.CASCADE,
        related_name='redes_sociales'
    )
    plataforma = models.CharField(max_length=20, choices=PLATAFORMA_CHOICES)
    url = models.URLField(max_length=250)
    
    def __str__(self):
        return f"{self.refugio.nombre} - {self.get_plataforma_display()}"
    
    class Meta:
        verbose_name = 'Red Social'
        verbose_name_plural = 'Redes Sociales'


# =============================================================================
# MASCOTAS
# =============================================================================

class TipoAnimal(models.Model):
    
    
    nombre = models.CharField(max_length=50, unique=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = 'Tipo de Animal'
        verbose_name_plural = 'Tipos de Animales'
        ordering = ['nombre']


class Raza(models.Model):
    
    
    tipo_animal = models.ForeignKey(
        TipoAnimal,
        on_delete=models.CASCADE,
        related_name='razas'
    )
    nombre = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.tipo_animal.nombre} - {self.nombre}"
    
    class Meta:
        verbose_name = 'Raza'
        verbose_name_plural = 'Razas'
        ordering = ['tipo_animal', 'nombre']


class Mascota(models.Model):
    
    
    SEXO_CHOICES = [
        ('MACHO', 'Macho'),
        ('HEMBRA', 'Hembra'),
    ]
    
    EDAD_CHOICES = [
        ('CACHORRO', 'Cachorro (0-1 año)'),
        ('JOVEN', 'Joven (1-3 años)'),
        ('ADULTO', 'Adulto (3-8 años)'),
        ('SENIOR', 'Senior (8 años o más)'),
    ]
    
    ESTADO_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('RESERVADO', 'Reservado'),
        ('ADOPTADO', 'Adoptado'),
        ('BORRADOR', 'Borrador'),
    ]
    
    TAMANO_CHOICES = [
        ('PEQUENO', 'Pequeño (0-10 kg)'),
        ('MEDIANO', 'Mediano (10-25 kg)'),
        ('GRANDE', 'Grande (25-45 kg)'),
        ('GIGANTE', 'Gigante (45+ kg)'),
    ]
    
    ENERGIA_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
    ]
    
    CUIDADO_CHOICES = [
        ('BAJO', 'Bajo'),
        ('MEDIO', 'Medio'),
        ('ALTO', 'Alto'),
    ]
    
    refugio = models.ForeignKey(
        'Refugio',
        on_delete=models.CASCADE,
        related_name='mascotas'
    )
    tipo_animal = models.ForeignKey(
        TipoAnimal,
        on_delete=models.PROTECT,
        related_name='mascotas'
    )
    raza = models.ForeignKey(
        Raza,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mascotas'
    )
    

    nombre = models.CharField(max_length=100)
    sexo = models.CharField(max_length=10, choices=SEXO_CHOICES)
    edad = models.CharField(max_length=20, choices=EDAD_CHOICES)
    descripcion = models.TextField()
    

    tamano = models.CharField(
        max_length=10,
        choices=TAMANO_CHOICES,
        blank=True,
        help_text="Tamaño aproximado del animal"
    )
    color = models.CharField(
        max_length=100,
        blank=True,
        help_text="Color predominante del pelaje"
    )
    
    
    esterilizado = models.BooleanField(default=False)
    desparasitado = models.BooleanField(default=False)
    microchip = models.BooleanField(default=False)
    
    necesidades_especiales = models.TextField(blank=True)
    
    
    nivel_energia = models.CharField(
        max_length=10,
        choices=ENERGIA_CHOICES,
        blank=True,
        help_text="Nivel de actividad física requerida"
    )
    nivel_cuidado = models.CharField(
        max_length=10,
        choices=CUIDADO_CHOICES,
        blank=True,
        help_text="Nivel de cuidados necesarios"
    )
    
    
    apto_ninos = models.BooleanField(
        default=False,
        help_text="Apto para convivir con niños"
    )
    apto_apartamento = models.BooleanField(
        default=False,
        help_text="Se adapta bien a espacios pequeños"
    )
    sociable_perros = models.BooleanField(
        default=False,
        help_text="Se lleva bien con otros perros"
    )
    sociable_gatos = models.BooleanField(
        default=False,
        help_text="Se lleva bien con gatos"
    )
    foto_principal = models.ImageField(upload_to='mascotas/', null=True, blank=True)
    foto_2 = models.ImageField(upload_to='mascotas/', null=True, blank=True)
    foto_3 = models.ImageField(upload_to='mascotas/', null=True, blank=True)
    
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='DISPONIBLE'
    )
    fecha_ingreso = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.tipo_animal.nombre})"

    def clean(self):

        super().clean()


        if self.raza and self.tipo_animal:
            if self.raza.tipo_animal_id != self.tipo_animal_id:
                raise ValidationError({
                    'raza': f'La raza "{self.raza.nombre}" no corresponde al tipo de animal "{self.tipo_animal.nombre}"'
                })


        if self.pk:  
            old_instance = Mascota.objects.get(pk=self.pk)
            transiciones_validas = {
                'BORRADOR': ['DISPONIBLE'],
                'DISPONIBLE': ['RESERVADO', 'ADOPTADO', 'BORRADOR'],
                'RESERVADO': ['DISPONIBLE', 'ADOPTADO'],
                'ADOPTADO': [],
            }
            
            if old_instance.estado != self.estado:
                estados_permitidos = transiciones_validas.get(old_instance.estado, [])
                if self.estado not in estados_permitidos:
                    raise ValidationError({
                        'estado': f'No se puede cambiar de "{old_instance.estado}" a "{self.estado}"'
                    })
    
    class Meta:
        verbose_name = 'Mascota'
        verbose_name_plural = 'Mascotas'
        ordering = ['-fecha_ingreso']
        
        
        constraints = [
            
            models.CheckConstraint(
                check=~models.Q(nombre=''),
                name='mascota_nombre_no_vacio'
            ),
            
            models.CheckConstraint(
                check=~models.Q(descripcion=''),
                name='mascota_descripcion_no_vacia'
            ),
        ]
        
        
        indexes = [
            models.Index(fields=['estado', 'tipo_animal']),
            models.Index(fields=['refugio', 'estado']),
            models.Index(fields=['tamano', 'nivel_energia']),
            models.Index(fields=['-fecha_ingreso']),
        ]


# =============================================================================
# VACUNAS - MODELOS NORMALIZADOS (Reemplazan el JSONField)
# =============================================================================

class TipoVacuna(models.Model):
    
    
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    obligatoria = models.BooleanField(
        default=False,
        help_text="Indica si es una vacuna obligatoria"
    )
    tipo_animal = models.ForeignKey(
        TipoAnimal,
        on_delete=models.CASCADE,
        related_name='vacunas_disponibles',
        help_text="Tipo de animal al que aplica esta vacuna"
    )
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.tipo_animal.nombre})"
    
    class Meta:
        verbose_name = 'Tipo de Vacuna'
        verbose_name_plural = 'Tipos de Vacunas'
        ordering = ['tipo_animal', 'nombre']
        unique_together = [['nombre', 'tipo_animal']]


class VacunaMascota(models.Model):
    
    
    mascota = models.ForeignKey(
        Mascota,
        on_delete=models.CASCADE,
        related_name='vacunas_aplicadas'
    )
    tipo_vacuna = models.ForeignKey(
        TipoVacuna,
        on_delete=models.PROTECT,
        related_name='aplicaciones'
    )
    fecha_aplicacion = models.DateField(
        help_text="Fecha en que se aplicó la vacuna"
    )
    fecha_proxima = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de la próxima dosis o refuerzo"
    )
    lote = models.CharField(
        max_length=50,
        blank=True,
        help_text="Número de lote de la vacuna"
    )
    veterinario = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nombre del veterinario que aplicó la vacuna"
    )
    notas = models.TextField(
        blank=True,
        help_text="Observaciones adicionales"
    )
    
    def __str__(self):
        return f"{self.mascota.nombre} - {self.tipo_vacuna.nombre} ({self.fecha_aplicacion})"
    
    class Meta:
        verbose_name = 'Vacuna de Mascota'
        verbose_name_plural = 'Vacunas de Mascotas'
        ordering = ['-fecha_aplicacion']
        unique_together = [['mascota', 'tipo_vacuna', 'fecha_aplicacion']]
        indexes = [
            models.Index(fields=['mascota', '-fecha_aplicacion']),
            models.Index(fields=['fecha_proxima']),
        ]


# =============================================================================
# ADOPTANTE
# =============================================================================

class PerfilAdoptante(models.Model):
    
    
    TIPO_VIVIENDA_CHOICES = [
        ('CASA', 'Casa'),
        ('DEPARTAMENTO', 'Departamento'),
        ('PARCELA', 'Parcela'),
    ]
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='perfil_adoptante'
    )
    
    
    rut = models.CharField(max_length=12, unique=True, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    direccion = models.CharField(max_length=250, blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    
    tipo_vivienda = models.CharField(max_length=50, choices=TIPO_VIVIENDA_CHOICES, blank=True)
    tiene_patio = models.BooleanField(default=False)
    es_propietario = models.BooleanField(default=False)
    
    experiencia_previa = models.BooleanField(default=False)
    tiene_mascotas = models.BooleanField(default=False)
    cantidad_mascotas = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.get_full_name()}"
    
    class Meta:
        verbose_name = 'Perfil Adoptante'
        verbose_name_plural = 'Perfiles Adoptantes'
        constraints = [

            models.CheckConstraint(
                check=Q(cantidad_mascotas__gte=0),
                name='adoptante_cantidad_mascotas_positiva'
            ),
        ]

# =============================================================================
# ADOPCIÓN
# =============================================================================

class SolicitudAdopcion(models.Model):
    

    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('CANCELADA', 'Cancelada'),
    ]

    adoptante = models.ForeignKey(
        settings.AUTH_USER_MODEL,  
        on_delete=models.CASCADE,
        related_name='solicitudes'
    )
    mascota = models.ForeignKey(
        'Mascota',
        on_delete=models.CASCADE,
        related_name='solicitudes'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE'
    )
    mensaje = models.TextField()
    motivo_rechazo = models.TextField(blank=True)
    
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.adoptante.username} - {self.mascota.nombre}"

    class Meta:
        verbose_name = 'Solicitud de Adopción'
        verbose_name_plural = 'Solicitudes de Adopción'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['adoptante']),
            models.Index(fields=['mascota']),
            models.Index(fields=['-created_at']),
        ]


class Adopcion(models.Model):
    

    ESTADO_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('ALERTA', 'Alerta'),
        ('COMPLETADA', 'Completada'),
        ('DEVUELTA', 'Devuelta'),
        ('CANCELADA', 'Cancelada'),
    ]

    
    solicitud = models.OneToOneField(
        'SolicitudAdopcion',
        on_delete=models.CASCADE,
        related_name='adopcion'
    )

    
    fecha_adopcion = models.DateField()
    fecha_inicio_seguimiento = models.DateField(null=True, blank=True)
    fecha_fin_seguimiento = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ACTIVA'
    )

    
    contrato_firmado = models.BooleanField(default=False)
    documento_contrato = models.FileField(
        upload_to='contratos/',
        null=True,
        blank=True
    )


    strikes = models.PositiveSmallIntegerField(default=0)
    max_strikes = models.PositiveSmallIntegerField(default=3)


    visitas_planificadas = models.PositiveSmallIntegerField(default=0)


    notas = models.TextField(blank=True)
    recordatorio_enviado = models.BooleanField(default=False)



    @property
    def visitas_realizadas(self):
        
        return self.visitas.filter(fecha_realizada__isnull=False).count()

    @property
    def progreso_seguimiento(self):
        
        if self.visitas_planificadas > 0:
            pct = int((self.visitas_realizadas / self.visitas_planificadas) * 100)
            return min(max(pct, 0), 100)
        return 0

    @property
    def proxima_visita(self):
        
        visita = self.visitas.filter(
            resultado='PENDIENTE'
        ).order_by('fecha_programada').first()
        return visita.fecha_programada if visita else None

    @property
    def seguimiento_activo(self):
        
        if not self.fecha_inicio_seguimiento or not self.fecha_fin_seguimiento:
            return False
        hoy = timezone.now().date()
        return self.fecha_inicio_seguimiento <= hoy <= self.fecha_fin_seguimiento

    @property
    def strikes_restantes(self):
        
        return max(self.max_strikes - self.strikes, 0)


    def clean(self):

        if self.fecha_inicio_seguimiento and self.fecha_fin_seguimiento:
            if self.fecha_fin_seguimiento < self.fecha_inicio_seguimiento:
                raise ValidationError("La fecha fin de seguimiento no puede ser menor a la fecha de inicio.")


        if self.max_strikes > 3:
            raise ValidationError("max_strikes no puede ser mayor a 3.")
        if self.strikes > self.max_strikes:
            raise ValidationError("Los strikes no pueden superar el max_strikes.")


        if self.visitas_planificadas < 0:
            raise ValidationError("visitas_planificadas no puede ser negativo.")



    def __str__(self):
        mascota = self.solicitud.mascota.nombre
        adoptante = self.solicitud.adoptante.get_full_name() or self.solicitud.adoptante.username
        return f"{mascota} - Adoptado por {adoptante}"

    def iniciar_seguimiento(self, dias=30):
        
        if self.fecha_inicio_seguimiento and self.fecha_fin_seguimiento:
            return
        hoy = timezone.now().date()
        self.fecha_inicio_seguimiento = hoy
        self.fecha_fin_seguimiento = hoy + timedelta(days=dias)
        self.save(update_fields=['fecha_inicio_seguimiento', 'fecha_fin_seguimiento', 'fecha_actualizacion'])

    def _sync_estado_por_strikes(self):
        
        if self.strikes > 0 and self.estado == 'ACTIVA':
            self.estado = 'ALERTA'
        if self.strikes == 0 and self.estado == 'ALERTA':
            self.estado = 'ACTIVA'

    def agregar_strike(self):
        
        if self.strikes >= self.max_strikes:
            self.strikes = self.max_strikes
            self._sync_estado_por_strikes()
            self.save(update_fields=['strikes', 'estado', 'fecha_actualizacion'])
            return False
        self.strikes += 1
        self._sync_estado_por_strikes()
        self.save(update_fields=['strikes', 'estado', 'fecha_actualizacion'])
        return True

    def quitar_strike(self):
        
        if self.strikes == 0:
            return False
        self.strikes -= 1
        self._sync_estado_por_strikes()
        self.save(update_fields=['strikes', 'estado', 'fecha_actualizacion'])
        return True

    def finalizar_seguimiento(self):
        
        if self.progreso_seguimiento >= 100 and self.strikes == 0:
            self.estado = 'COMPLETADA'
            self.save(update_fields=['estado', 'fecha_actualizacion'])
            return True
        return False

    class Meta:
        verbose_name = 'Adopción'
        verbose_name_plural = 'Adopciones'
        ordering = ['-fecha_adopcion']
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_adopcion']),
            models.Index(fields=['solicitud']),
        ]
        constraints = [
            models.CheckConstraint(check=Q(strikes__gte=0), name='adopcion_strikes_gte_0'),
            models.CheckConstraint(check=Q(max_strikes__lte=3), name='adopcion_max_strikes_lte_3'),
            models.CheckConstraint(check=Q(strikes__lte=F('max_strikes')), name='adopcion_strikes_lte_max'),
            models.CheckConstraint(check=Q(visitas_planificadas__gte=0), name='adopcion_visitas_planificadas_gte_0'),
        ]


class VisitaSeguimiento(models.Model):
    

    RESULTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EXITOSO', 'Exitoso'),
        ('REQUIERE_ATENCION', 'Requiere Atención'),
        ('PROBLEMATICO', 'Problemático'),
        ('NO_REALIZADA', 'No Realizada'),
    ]

    ESTADO_SALUD_CHOICES = [
        ('EXCELENTE', 'Excelente'),
        ('BUENO', 'Bueno'),
        ('REGULAR', 'Regular'),
        ('PREOCUPANTE', 'Preocupante'),
    ]

    adopcion = models.ForeignKey(
        Adopcion,
        on_delete=models.CASCADE,
        related_name='visitas'
    )

    numero_visita = models.PositiveSmallIntegerField()

    fecha_programada = models.DateField()
    fecha_realizada = models.DateField(null=True, blank=True)

    resultado = models.CharField(
        max_length=30,
        choices=RESULTADO_CHOICES,
        default='PENDIENTE'
    )

    realizada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitas_realizadas'
    )

    observaciones = models.TextField(blank=True)
    puntuacion = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Puntuación de 1 a 5"
    )

    estado_salud = models.CharField(
        max_length=20,
        choices=ESTADO_SALUD_CHOICES,
        null=True,
        blank=True
    )
    peso_actual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Peso en kg (máximo 200)"
    )

    recordatorio_enviado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visita #{self.numero_visita} - {self.adopcion.solicitud.mascota.nombre}"

    def clean(self):
        if self.numero_visita == 0:
            raise ValidationError("numero_visita debe iniciar en 1.")

    @property
    def esta_vencida(self):
        
        return self.resultado == 'PENDIENTE' and self.fecha_programada < timezone.now().date()

    def marcar_realizada(self, usuario=None, resultado_si_pendiente='EXITOSO'):
        
        if not self.fecha_realizada:
            self.fecha_realizada = timezone.now().date()
            self.realizada_por = usuario

            if self.resultado == 'PENDIENTE':
                self.resultado = resultado_si_pendiente

            self.save(update_fields=['fecha_realizada', 'realizada_por', 'resultado', 'fecha_actualizacion'])

            if self.numero_visita == self.adopcion.visitas_planificadas:
                self.adopcion.finalizar_seguimiento()

    def marcar_no_realizada(self):
        
        if self.resultado != 'NO_REALIZADA':
            self.resultado = 'NO_REALIZADA'
            self.save(update_fields=['resultado', 'fecha_actualizacion'])
            self.adopcion.agregar_strike()

    class Meta:
        verbose_name = 'Visita de Seguimiento'
        verbose_name_plural = 'Visitas de Seguimiento'
        ordering = ['adopcion', 'numero_visita']
        unique_together = [['adopcion', 'numero_visita']]
        indexes = [
            models.Index(fields=['adopcion', 'numero_visita']),
            models.Index(fields=['resultado']),
            models.Index(fields=['fecha_programada']),
        ]
        constraints = [
            
            models.CheckConstraint(
                check=Q(puntuacion__isnull=True) | Q(puntuacion__gte=1, puntuacion__lte=5),
                name='visita_puntuacion_rango_valido'
            ),
            
            models.CheckConstraint(
                check=Q(peso_actual__isnull=True) | Q(peso_actual__gt=0, peso_actual__lte=200),
                name='visita_peso_actual_valido'
            ),
        ]


class FotoVisita(models.Model):
    

    visita = models.ForeignKey(
        VisitaSeguimiento,
        on_delete=models.CASCADE,
        related_name='fotos'
    )

    imagen = models.ImageField(upload_to='visitas/')
    descripcion = models.CharField(max_length=200, blank=True)
    orden = models.PositiveSmallIntegerField(default=1)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto {self.orden} - {self.visita}"

    class Meta:
        verbose_name = 'Foto de Visita'
        verbose_name_plural = 'Fotos de Visitas'
        ordering = ['visita', 'orden']
        unique_together = [['visita', 'orden']]
        indexes = [
            models.Index(fields=['visita', 'orden']),
        ]


# =============================================================================
# DOCUMENTOS
# =============================================================================

class Documento(models.Model):
    

    CATEGORIA_CHOICES = [
        ('CONTRATOS', 'Contratos'),
        ('POLITICAS', 'Políticas'),
        ('FORMULARIOS', 'Formularios'),
        ('CERTIFICADOS', 'Certificados'),
        ('LEGALES', 'Legales'),
        ('OTROS', 'Otros'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('BORRADOR', 'Borrador'),
        ('ARCHIVADO', 'Archivado'),
    ]

    TIPO_ARCHIVO_CHOICES = [
        ('PDF', 'PDF'),
        ('DOCX', 'Word'),
        ('XLSX', 'Excel'),
        ('TXT', 'Texto'),
    ]

    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    tipo_archivo = models.CharField(max_length=10, choices=TIPO_ARCHIVO_CHOICES)
    descripcion = models.TextField(blank=True)
    version = models.CharField(max_length=20, default='1.0')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')

    archivo = models.FileField(upload_to='documentos/')
    tamano = models.PositiveIntegerField(help_text='Tamaño del archivo en bytes')

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documentos_creados'
    )

    refugio = models.ForeignKey(
        'Refugio',
        on_delete=models.CASCADE,
        related_name='documentos'
    )

    descargas = models.PositiveIntegerField(default=0)
    usos = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        ordering = ['-fecha_modificacion']
        indexes = [
            models.Index(fields=['refugio', 'categoria']),
            models.Index(fields=['estado', 'fecha_modificacion']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.version})"

    def incrementar_descargas(self):
        
        self.descargas += 1
        self.save(update_fields=['descargas'])

    def incrementar_usos(self):
        
        self.usos += 1
        self.save(update_fields=['usos'])


# =============================================================================
# CODIGO DE AUTENTICACION
# =============================================================================


class TwoFactorCode(models.Model):
    
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='codigo_2fa'
    )
    code_hash = models.CharField(max_length=128, help_text="Hash SHA256 del código")
    expires_at = models.DateTimeField()
    intentos = models.PositiveSmallIntegerField(default=0)
    bloqueado = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_expired() and not self.bloqueado and self.intentos < 3
    
    def verificar_codigo(self, codigo_ingresado):
        
        import hashlib
        hash_ingresado = hashlib.sha256(codigo_ingresado.encode()).hexdigest()
        return self.code_hash == hash_ingresado
    
    @staticmethod
    def generar_codigo(user):

        import random
        import hashlib
        from django.utils import timezone
        from datetime import timedelta
        from django.core.mail import send_mail
        from django.conf import settings

        codigo = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        codigo_hash = hashlib.sha256(codigo.encode()).hexdigest()
        expiracion = timezone.now() + timedelta(minutes=10)

        obj, created = TwoFactorCode.objects.update_or_create(
            user=user,
            defaults={
                'code_hash': codigo_hash,
                'expires_at': expiracion,
                'intentos': 0,
                'bloqueado': False
            }
        )

        # Enviar código por email
        try:
            tipo_usuario = 'Refugio' if user.tipo_usuario == 'REFUGIO' else 'Adoptante'
            asunto = f'🔐 Tu código de verificación - Kokoropets'

            mensaje_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }}
                    .header h1 {{ margin: 0; font-size: 28px; }}
                    .content {{ padding: 40px 30px; }}
                    .code-box {{ background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }}
                    .code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }}
                    .info {{ background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                    .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
                    .warning {{ color: #dc3545; font-weight: bold; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🐾 Kokoropets</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Código de Verificación</p>
                    </div>

                    <div class="content">
                        <h2>Hola, {user.first_name or user.username}!</h2>
                        <p>Has solicitado iniciar sesión como <strong>{tipo_usuario}</strong> en Kokoropets.</p>
                        <p>Para completar el proceso, ingresa el siguiente código de verificación:</p>

                        <div class="code-box">
                            <div class="code">{codigo}</div>
                        </div>

                        <div class="info">
                            <strong>⏰ Importante:</strong> Este código expira en <strong>10 minutos</strong>.
                        </div>

                        <p>Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>

                        <p class="warning">⚠️ Nunca compartas este código con nadie.</p>
                    </div>

                    <div class="footer">
                        <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
                        <p>© 2025 Kokoropets - Sistema de Gestión de Adopciones</p>
                    </div>
                </div>
            </body>
            </html>
            """

            mensaje_texto = f"""
            Hola {user.first_name or user.username},

            Has solicitado iniciar sesión como {tipo_usuario} en Kokoropets.

            Tu código de verificación es: {codigo}

            Este código expira en 10 minutos.

            Si no solicitaste este código, puedes ignorar este mensaje.

            Nunca compartas este código con nadie.

            - Equipo Kokoropets
            """

            send_mail(
                subject=asunto,
                message=mensaje_texto,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=mensaje_html,
                fail_silently=False,
            )

            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Email enviado exitosamente a {user.email}")

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al enviar email: {str(e)}")
            # No lanzamos excepción para que el login continúe aunque falle el email

        return codigo  # Retorna el código en texto plano para enviarlo por email
    
    class Meta:
        verbose_name = 'Código 2FA'
        verbose_name_plural = 'Códigos 2FA'
        constraints = [
            models.CheckConstraint(
                check=Q(intentos__gte=0, intentos__lte=3),
                name='twofactor_intentos_validos'
            )
        ]

# =============================================================================
# CAMPAÑA
# =============================================================================

class Campana(models.Model):
    
    
    ESTADO_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('PAUSADA', 'Pausada'),
        ('FINALIZADA', 'Finalizada'),
    ]
    
    TIPO_KPI_CHOICES = [
        ('PARTICIPANTES', 'Número de Participantes'),
        ('ADOPCIONES', 'Número de Adopciones'),
        ('DONACIONES', 'Monto de Donaciones'),
        ('VISITAS', 'Número de Visitas'),
    ]
    
    refugio = models.ForeignKey(Refugio, on_delete=models.CASCADE, related_name='campanas')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='campanas/', blank=True, null=True)
    
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    
    
    tipo_kpi = models.CharField(max_length=20, choices=TIPO_KPI_CHOICES)
    meta_kpi = models.IntegerField(help_text="Meta a alcanzar")
    valor_actual_kpi = models.IntegerField(default=0, help_text="Valor actual alcanzado")
    
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='ACTIVA')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Campaña'
        verbose_name_plural = 'Campañas'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['estado']),
            models.Index(fields=['refugio', 'estado']),
            models.Index(fields=['fecha_inicio']),
            models.Index(fields=['fecha_fin']),
        ]
        constraints = [
            
            models.CheckConstraint(
                check=Q(fecha_fin__gte=F('fecha_inicio')),
                name='campana_fechas_validas'
            ),
            
            models.CheckConstraint(
                check=Q(meta_kpi__gt=0),
                name='campana_meta_kpi_positiva'
            ),
            
            models.CheckConstraint(
                check=Q(valor_actual_kpi__gte=0),
                name='campana_valor_kpi_no_negativo'
            ),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.refugio.nombre}"
    
    def clean(self):
        
        super().clean()
        
        
        if self.fecha_inicio and self.fecha_fin:
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser mayor o igual a la fecha de inicio'
                })
        
        
        if self.pk:  
            old_instance = Campana.objects.get(pk=self.pk)
            transiciones_validas = {
                'ACTIVA': ['PAUSADA', 'FINALIZADA'],
                'PAUSADA': ['ACTIVA', 'FINALIZADA'],
                'FINALIZADA': [],  
            }
            
            if old_instance.estado != self.estado:
                estados_permitidos = transiciones_validas.get(old_instance.estado, [])
                if self.estado not in estados_permitidos:
                    raise ValidationError({
                        'estado': f'No se puede cambiar de "{old_instance.estado}" a "{self.estado}"'
                    })
    
    @property
    def progreso_porcentaje(self):
        
        if self.meta_kpi == 0:
            return 0
        return min(100, (self.valor_actual_kpi / self.meta_kpi) * 100)


class ParticipacionCampana(models.Model):
    

    campana = models.ForeignKey(Campana, on_delete=models.CASCADE, related_name='participaciones')
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='participaciones_campanas')
    comentario = models.TextField(blank=True)
    asistio = models.BooleanField(default=False, help_text='Indica si el usuario asistió a la campaña')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Participación en Campaña'
        verbose_name_plural = 'Participaciones en Campañas'
        unique_together = [['campana', 'usuario']]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.usuario.username} - {self.campana.titulo}"

# =============================================================================
# TIPS
# =============================================================================


class Tip(models.Model):
    
    
    CATEGORIA_CHOICES = [
        ('SALUD', 'Salud'),
        ('NUTRICION', 'Nutrición'),
        ('COMPORTAMIENTO', 'Comportamiento'),
        ('ADIESTRAMIENTO', 'Adiestramiento'),
        ('HIGIENE', 'Higiene'),
        ('GENERAL', 'General'),
    ]
    
    refugio = models.ForeignKey(Refugio, on_delete=models.CASCADE, related_name='tips')
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    imagen = models.ImageField(upload_to='tips/', blank=True, null=True)
    
    tipo_animal = models.ForeignKey(
        TipoAnimal, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='tips'
    )
    
    publicado = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tip'
        verbose_name_plural = 'Tips'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['categoria']),
            models.Index(fields=['publicado']),
            models.Index(fields=['refugio', 'publicado']),
            models.Index(fields=['tipo_animal']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.refugio.nombre}"

# =============================================================================
# RESEÑAS
# =============================================================================

class ResenaRefugio(models.Model):
    
    
    refugio = models.ForeignKey(
        Refugio, 
        on_delete=models.CASCADE, 
        related_name='resenas'
    )
    usuario = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='resenas_refugios'
    )
    calificacion = models.PositiveSmallIntegerField(
        help_text="Calificación de 1 a 5 estrellas"
    )
    comentario = models.TextField(blank=True)
    respondido = models.BooleanField(default=False)
    respuesta = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Reseña de Refugio'
        verbose_name_plural = 'Reseñas de Refugios'
        ordering = ['-created_at']
        unique_together = [['refugio', 'usuario']]
        constraints = [
            models.CheckConstraint(
                check=models.Q(calificacion__gte=1, calificacion__lte=5),
                name='calificacion_valida'
            )
        ]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.refugio.nombre} ({self.calificacion}★)"


# =============================================================================
# VOLUNTARIADO
# =============================================================================

class EventoVoluntariado(models.Model):
    
    
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('CANCELADO', 'Cancelado'),
        ('FINALIZADO', 'Finalizado'),
    ]
    
    refugio = models.ForeignKey(
        Refugio,
        on_delete=models.CASCADE,
        related_name='eventos_voluntariado'
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_evento = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    ubicacion = models.CharField(max_length=300)
    cupos_disponibles = models.PositiveIntegerField(default=10)
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='ACTIVO'
    )
    requisitos = models.TextField(
        blank=True,
        help_text="Requisitos para participar en el voluntariado"
    )
    imagen = models.ImageField(
        upload_to='voluntariados/',
        null=True,
        blank=True
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    @property
    def cupos_ocupados(self):
        return self.inscripciones.filter(estado='INSCRITO').count()
    
    @property
    def cupos_restantes(self):
        return max(0, self.cupos_disponibles - self.cupos_ocupados)
    
    @property
    def esta_lleno(self):
        return self.cupos_restantes == 0
    
    @property
    def ya_paso(self):
        from datetime import datetime
        evento_datetime = datetime.combine(self.fecha_evento, self.hora_fin)
        return timezone.make_aware(evento_datetime) < timezone.now()
    
    def __str__(self):
        return f"{self.titulo} - {self.refugio.nombre} ({self.fecha_evento})"
    
    class Meta:
        verbose_name = 'Evento de Voluntariado'
        verbose_name_plural = 'Eventos de Voluntariado'
        ordering = ['-fecha_evento', '-hora_inicio']
        indexes = [
            models.Index(fields=['fecha_evento']),
            models.Index(fields=['estado']),
            models.Index(fields=['refugio', 'estado']),
        ]


class InscripcionVoluntariado(models.Model):
    
    
    ESTADO_CHOICES = [
        ('INSCRITO', 'Inscrito'),
        ('CANCELADO', 'Cancelado'),
        ('ASISTIO', 'Asistió'),
        ('NO_ASISTIO', 'No Asistió'),
    ]
    
    evento = models.ForeignKey(
        EventoVoluntariado,
        on_delete=models.CASCADE,
        related_name='inscripciones'
    )
    usuario = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='inscripciones_voluntariado'
    )
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='INSCRITO'
    )
    comentario = models.TextField(
        blank=True,
        help_text="Comentario o motivación del voluntario"
    )
    notas_refugio = models.TextField(
        blank=True,
        help_text="Notas del refugio sobre el voluntario"
    )
    
    def __str__(self):
        return f"{self.usuario.username} - {self.evento.titulo} ({self.estado})"
    
    class Meta:
        verbose_name = 'Inscripción Voluntariado'
        verbose_name_plural = 'Inscripciones Voluntariado'
        ordering = ['-fecha_inscripcion']
        unique_together = [['evento', 'usuario']]
        indexes = [
            models.Index(fields=['evento', 'estado']),
            models.Index(fields=['usuario', 'estado']),
        ]


# =============================================================================
# NOTIFICACIONES
# =============================================================================

class Notificacion(models.Model):
    

    TIPO_CHOICES = [
        ('SOLICITUD_NUEVA', 'Nueva Solicitud de Adopción'),
        ('SOLICITUD_APROBADA', 'Solicitud Aprobada'),
        ('SOLICITUD_RECHAZADA', 'Solicitud Rechazada'),
        ('VISITA_PROGRAMADA', 'Visita de Seguimiento Programada'),
        ('CAMPANA_NUEVA', 'Nueva Campaña Disponible'),
        ('TIP_NUEVO', 'Nuevo Tip Publicado'),
        ('VOLUNTARIADO_NUEVO', 'Nuevo Evento de Voluntariado'),
        ('MENSAJE_GENERAL', 'Mensaje General'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificaciones'
    )
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    url = models.CharField(max_length=500, blank=True, help_text='URL de redirección al hacer clic')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.titulo}"

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'leida']),
            models.Index(fields=['fecha_creacion']),
        ]


# =============================================================================
# FAVORITOS
# =============================================================================

class MascotaFavorita(models.Model):
    

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mascotas_favoritas'
    )
    mascota = models.ForeignKey(
        'Mascota',
        on_delete=models.CASCADE,
        related_name='favoritos'
    )
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.mascota.nombre}"

    class Meta:
        verbose_name = 'Mascota Favorita'
        verbose_name_plural = 'Mascotas Favoritas'
        unique_together = [['usuario', 'mascota']]
        ordering = ['-fecha_agregado']
        indexes = [
            models.Index(fields=['usuario', 'fecha_agregado']),
        ]


class TipFavorito(models.Model):
    

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tips_favoritos'
    )
    tip = models.ForeignKey(
        'Tip',
        on_delete=models.CASCADE,
        related_name='favoritos'
    )
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.tip.titulo}"

    class Meta:
        verbose_name = 'Tip Favorito'
        verbose_name_plural = 'Tips Favoritos'
        unique_together = [['usuario', 'tip']]
        ordering = ['-fecha_agregado']
        indexes = [
            models.Index(fields=['usuario', 'fecha_agregado']),
        ]


# =============================================================================
# INVENTARIO
# =============================================================================

class ItemInventario(models.Model):
    

    CATEGORIA_CHOICES = [
        ('ALIMENTO', 'Alimento'),
        ('MEDICAMENTO', 'Medicamento'),
        ('EQUIPO', 'Equipo'),
        ('HIGIENE', 'Higiene'),
        ('JUGUETE', 'Juguete'),
        ('OTRO', 'Otro'),
    ]

    UNIDAD_CHOICES = [
        ('unidad', 'Unidad'),
        ('kg', 'Kilogramo'),
        ('litro', 'Litro'),
        ('caja', 'Caja'),
        ('bolsa', 'Bolsa'),
    ]

    refugio = models.ForeignKey(
        Refugio,
        on_delete=models.CASCADE,
        related_name='inventario'
    )
    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    cantidad = models.PositiveIntegerField(default=0)
    unidad = models.CharField(max_length=20, choices=UNIDAD_CHOICES)
    stock_minimo = models.PositiveIntegerField(
        default=1,
        help_text="Cantidad mínima antes de alertar por bajo stock"
    )
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Precio en pesos chilenos (CLP)"
    )
    proveedor = models.CharField(max_length=200, blank=True)
    fecha_ultima_compra = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de la última compra o reposición"
    )
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de vencimiento del producto (si aplica)"
    )
    ubicacion = models.CharField(
        max_length=200,
        blank=True,
        help_text="Ubicación física del item (ej: Bodega A, Estante 3)"
    )
    notas = models.TextField(
        blank=True,
        help_text="Notas adicionales sobre el item"
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    @property
    def bajo_stock(self):
        
        return self.cantidad <= self.stock_minimo

    @property
    def valor_total(self):
        
        return self.cantidad * self.precio_unitario

    @property
    def dias_hasta_vencimiento(self):
        
        if not self.fecha_vencimiento:
            return None
        from datetime import date
        delta = self.fecha_vencimiento - date.today()
        return delta.days

    @property
    def proximo_a_vencer(self):
        
        if self.dias_hasta_vencimiento is None:
            return False
        return 0 <= self.dias_hasta_vencimiento <= 30

    @property
    def vencido(self):
        
        if self.dias_hasta_vencimiento is None:
            return False
        return self.dias_hasta_vencimiento < 0

    def clean(self):
        
        super().clean()

        
        if self.cantidad < 0:
            raise ValidationError({
                'cantidad': 'La cantidad no puede ser negativa'
            })

        
        if self.stock_minimo < 0:
            raise ValidationError({
                'stock_minimo': 'El stock mínimo no puede ser negativo'
            })

        
        if self.precio_unitario < 0:
            raise ValidationError({
                'precio_unitario': 'El precio unitario no puede ser negativo'
            })

    def __str__(self):
        return f"{self.nombre} ({self.refugio.nombre}) - {self.cantidad} {self.unidad}"

    class Meta:
        verbose_name = 'Item de Inventario'
        verbose_name_plural = 'Items de Inventario'
        ordering = ['-fecha_actualizacion', 'nombre']
        indexes = [
            models.Index(fields=['refugio', 'categoria']),
            models.Index(fields=['refugio', 'cantidad']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['-fecha_actualizacion']),
        ]
        constraints = [
            
            models.CheckConstraint(
                check=Q(cantidad__gte=0),
                name='inventario_cantidad_no_negativa'
            ),
            
            models.CheckConstraint(
                check=Q(stock_minimo__gte=0),
                name='inventario_stock_minimo_no_negativo'
            ),
            
            models.CheckConstraint(
                check=Q(precio_unitario__gte=0),
                name='inventario_precio_no_negativo'
            ),
        ]