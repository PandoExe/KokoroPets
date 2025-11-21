
from django.contrib import admin
from .models import (
    CustomUser, Refugio, ContactoRefugio, RedSocialRefugio,
    TipoAnimal, Raza, Mascota, TipoVacuna, VacunaMascota,
    PerfilAdoptante, SolicitudAdopcion, Adopcion,
    VisitaSeguimiento, FotoVisita, TwoFactorCode, Campana, ParticipacionCampana,
    Tip, ResenaRefugio, EventoVoluntariado, InscripcionVoluntariado, Documento,
    Notificacion, MascotaFavorita, TipFavorito
)


# =============================================================================
# INLINES
# =============================================================================

class ContactoRefugioInline(admin.TabularInline):
    model = ContactoRefugio
    extra = 1
    min_num = 0


class RedSocialRefugioInline(admin.TabularInline):
    model = RedSocialRefugio
    extra = 0


class VacunaMascotaInline(admin.TabularInline):
    model = VacunaMascota
    extra = 1
    fields = ('tipo_vacuna', 'fecha_aplicacion', 'fecha_proxima', 'lote', 'veterinario')

class FotoVisitaInline(admin.TabularInline):
    model = FotoVisita
    extra = 1
    fields = ('imagen', 'descripcion', 'orden')
    max_num = 3  


class VisitaSeguimientoInline(admin.TabularInline):
    model = VisitaSeguimiento
    extra = 0
    fields = ('numero_visita', 'fecha_programada', 'fecha_realizada', 'resultado', 'puntuacion')
    readonly_fields = ('numero_visita',)


# =============================================================================
# ADMIN MODELS
# =============================================================================

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'tipo_usuario', 'first_name', 'last_name', 'activo')
    list_filter = ('tipo_usuario', 'activo', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'telefono')
    
    fieldsets = (
        ('Información de Usuario', {
            'fields': ('username', 'password', 'email', 'first_name', 'last_name')
        }),
        ('Perfil', {
            'fields': ('tipo_usuario', 'telefono', 'foto_perfil')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Refugio)
class RefugioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ciudad', 'region', 'verificado', 'anio_fundacion', 'capacidad', 'logo_preview')
    list_filter = ('verificado', 'region', 'ciudad')
    search_fields = ('nombre', 'descripcion', 'ciudad', 'region')
    inlines = [ContactoRefugioInline, RedSocialRefugioInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('user', 'nombre', 'descripcion', 'anio_fundacion', 'capacidad')
        }),
        ('Verificación', {
            'fields': ('verificado', 'documento_verificacion')
        }),
        ('Imágenes', {
            'fields': ('logo', 'logo_preview_large', 'portada', 'portada_preview_large'),
            'classes': ('collapse',)
        }),
        ('Ubicación', {
            'fields': ('direccion', 'ciudad', 'region')
        }),
        ('Horario', {
            'fields': ('horario_atencion',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('logo_preview_large', 'portada_preview_large')
    
    def logo_preview(self, obj):
        if obj.logo:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 30px;"/>', obj.logo.url)
        return '-'
    logo_preview.short_description = 'Logo'
    
    def logo_preview_large(self, obj):
        if obj.logo:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 150px;"/>', obj.logo.url)
        return 'Sin logo'
    logo_preview_large.short_description = 'Preview Logo'
    
    def portada_preview_large(self, obj):
        if obj.portada:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 150px;"/>', obj.portada.url)
        return 'Sin portada'
    portada_preview_large.short_description = 'Preview Portada'


@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'tipo_animal', 'raza', 'sexo', 'edad', 
        'tamano', 'nivel_energia', 'estado', 'refugio', 'fecha_ingreso', 'foto_preview'
    )
    list_filter = (
        'estado', 'tipo_animal', 'sexo', 'edad', 'refugio',
        'tamano', 'nivel_energia', 'nivel_cuidado',
        'apto_ninos', 'apto_apartamento',
        'sociable_perros', 'sociable_gatos',
        'esterilizado', 'desparasitado', 'microchip'
    )
    search_fields = ('nombre', 'descripcion', 'color')
    date_hierarchy = 'fecha_ingreso'
    inlines = [VacunaMascotaInline]
    
    fieldsets = (
        ('Refugio', {
            'fields': ('refugio',)
        }),
        ('Información Básica', {
            'fields': ('nombre', 'tipo_animal', 'raza', 'sexo', 'edad', 'descripcion')
        }),
        ('Características Físicas', {
            'fields': ('tamano', 'color')
        }),
        ('Comportamiento y Cuidados', {
            'fields': ('nivel_energia', 'nivel_cuidado')
        }),
        ('Compatibilidad', {
            'fields': ('apto_ninos', 'apto_apartamento', 'sociable_perros', 'sociable_gatos')
        }),
        ('Salud', {
            'fields': ('esterilizado', 'desparasitado', 'microchip', 'necesidades_especiales')
        }),
        ('Fotos', {
            'fields': ('foto_principal', 'foto_principal_preview', 'foto_2', 'foto_3'),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
    )
    
    readonly_fields = ('fecha_ingreso', 'foto_principal_preview')
    
    def foto_preview(self, obj):
        if obj.foto_principal:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 30px;"/>', obj.foto_principal.url)
        return '-'
    foto_preview.short_description = 'Foto'
    
    def foto_principal_preview(self, obj):
        if obj.foto_principal:
            from django.utils.html import format_html
            return format_html('<img src="{}" style="max-height: 200px;"/>', obj.foto_principal.url)
        return 'Sin foto'
    foto_principal_preview.short_description = 'Preview'


@admin.register(TipoAnimal)
class TipoAnimalAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre',)


@admin.register(Raza)
class RazaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo_animal')
    list_filter = ('tipo_animal',)
    search_fields = ('nombre',)


@admin.register(TipoVacuna)
class TipoVacunaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo_animal', 'obligatoria', 'activo')
    list_filter = ('tipo_animal', 'obligatoria', 'activo')
    search_fields = ('nombre', 'descripcion')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'tipo_animal')
        }),
        ('Configuración', {
            'fields': ('obligatoria', 'activo')
        }),
    )


@admin.register(VacunaMascota)
class VacunaMascotaAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'tipo_vacuna', 'fecha_aplicacion', 'fecha_proxima', 'veterinario')
    list_filter = ('tipo_vacuna', 'fecha_aplicacion', 'fecha_proxima')
    search_fields = ('mascota__nombre', 'tipo_vacuna__nombre', 'veterinario', 'lote')
    date_hierarchy = 'fecha_aplicacion'
    
    fieldsets = (
        ('Mascota', {
            'fields': ('mascota',)
        }),
        ('Vacuna', {
            'fields': ('tipo_vacuna', 'fecha_aplicacion', 'fecha_proxima')
        }),
        ('Detalles', {
            'fields': ('lote', 'veterinario', 'notas'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PerfilAdoptante)
class PerfilAdoptanteAdmin(admin.ModelAdmin):
    list_display = ('user', 'rut', 'ciudad', 'region', 'tipo_vivienda', 'tiene_mascotas')
    list_filter = ('region', 'ciudad', 'tipo_vivienda', 'tiene_patio', 'es_propietario', 'experiencia_previa', 'tiene_mascotas')
    search_fields = ('user__username', 'user__email', 'rut', 'direccion')
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Información Personal', {
            'fields': ('rut', 'fecha_nacimiento')
        }),
        ('Ubicación', {
            'fields': ('direccion', 'ciudad', 'region')
        }),
        ('Vivienda', {
            'fields': ('tipo_vivienda', 'tiene_patio', 'es_propietario')
        }),
        ('Experiencia con Mascotas', {
            'fields': ('experiencia_previa', 'tiene_mascotas', 'cantidad_mascotas')
        }),
    )


@admin.register(SolicitudAdopcion)
class SolicitudAdopcionAdmin(admin.ModelAdmin):
    list_display = ('adoptante', 'mascota', 'estado', 'created_at', 'updated_at')
    list_filter = ('estado', 'created_at')
    search_fields = ('adoptante__username', 'mascota__nombre', 'mensaje')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Solicitud', {
            'fields': ('adoptante', 'mascota', 'estado')
        }),
        ('Mensaje', {
            'fields': ('mensaje',)
        }),
        ('Rechazo', {
            'fields': ('motivo_rechazo',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Adopcion)
class AdopcionAdmin(admin.ModelAdmin):
    list_display = (
        'solicitud', 'fecha_adopcion', 'estado', 'strikes', 
        'seguimiento_iniciado', 'visitas_realizadas', 'progreso_seguimiento'
    )
    list_filter = ('estado', 'contrato_firmado', 'fecha_adopcion')
    search_fields = (
        'solicitud__mascota__nombre', 
        'solicitud__adoptante__username',
        'solicitud__adoptante__email'
    )
    date_hierarchy = 'fecha_adopcion'
    inlines = [VisitaSeguimientoInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('solicitud', 'fecha_adopcion', 'estado')
        }),
        ('Seguimiento', {
            'fields': (
                'fecha_inicio_seguimiento', 
                'fecha_fin_seguimiento',
                'visitas_planificadas'
            ),
            'description': 'El seguimiento dura 1 mes desde la fecha de inicio.'
        }),
        ('Control', {
            'fields': ('strikes', 'max_strikes')
        }),
        ('Contrato', {
            'fields': ('contrato_firmado', 'documento_contrato'),
            'classes': ('collapse',)
        }),
        ('Notas', {
            'fields': ('notas',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    
    def seguimiento_iniciado(self, obj):
        return '✅' if obj.fecha_inicio_seguimiento else '❌'
    seguimiento_iniciado.short_description = 'Seguimiento'
    
    def visitas_realizadas(self, obj):
        return f"{obj.visitas_realizadas}/{obj.visitas_planificadas}"
    visitas_realizadas.short_description = 'Visitas'
    
    def progreso_seguimiento(self, obj):
        return f"{obj.progreso_seguimiento}%"
    progreso_seguimiento.short_description = 'Progreso'


@admin.register(VisitaSeguimiento)
class VisitaSeguimientoAdmin(admin.ModelAdmin):
    list_display = (
        'adopcion_mascota', 'numero_visita', 'fecha_programada', 
        'fecha_realizada', 'resultado', 'puntuacion', 'estado_salud'
    )
    list_filter = ('resultado', 'estado_salud', 'fecha_programada')
    search_fields = (
        'adopcion__solicitud__mascota__nombre',
        'adopcion__solicitud__adoptante__username',
        'observaciones'
    )
    date_hierarchy = 'fecha_programada'
    inlines = [FotoVisitaInline]
    
    fieldsets = (
        ('Adopción', {
            'fields': ('adopcion', 'numero_visita')
        }),
        ('Fechas', {
            'fields': ('fecha_programada', 'fecha_realizada', 'realizada_por')
        }),
        ('Resultado', {
            'fields': ('resultado', 'puntuacion', 'observaciones')
        }),
        ('Salud de la Mascota', {
            'fields': ('estado_salud', 'peso_actual'),
            'classes': ('collapse',)
        }),
        ('Control', {
            'fields': ('recordatorio_enviado',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    
    def adopcion_mascota(self, obj):
        return f"{obj.adopcion.solicitud.mascota.nombre} - Visita #{obj.numero_visita}"
    adopcion_mascota.short_description = 'Mascota'


@admin.register(FotoVisita)
class FotoVisitaAdmin(admin.ModelAdmin):
    list_display = ('visita', 'orden', 'descripcion', 'fecha_subida')
    list_filter = ('fecha_subida',)
    search_fields = ('visita__adopcion__solicitud__mascota__nombre', 'descripcion')
    date_hierarchy = 'fecha_subida'
    
    fieldsets = (
        ('Visita', {
            'fields': ('visita', 'orden')
        }),
        ('Foto', {
            'fields': ('imagen', 'descripcion')
        }),
    )
    
    readonly_fields = ('fecha_subida',)


@admin.register(TwoFactorCode)
class TwoFactorCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'expires_at', 'intentos', 'bloqueado', 'is_valid_display')
    list_filter = ('bloqueado',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('code_hash', 'expires_at', 'intentos')
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Estado', {
            'fields': ('expires_at', 'intentos', 'bloqueado')
        }),
    )
    
    def is_valid_display(self, obj):
        return '✅' if obj.is_valid() else '❌'
    is_valid_display.short_description = 'Válido'


@admin.register(Campana)
class CampanaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'refugio', 'tipo_kpi', 'meta_kpi', 'valor_actual_kpi', 'estado', 'fecha_inicio', 'fecha_fin', 'created_at')
    list_filter = ('estado', 'tipo_kpi', 'refugio', 'created_at')
    search_fields = ('titulo', 'descripcion')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('refugio', 'titulo', 'descripcion', 'imagen')
        }),
        ('Fechas', {
            'fields': ('fecha_inicio', 'fecha_fin')
        }),
        ('KPI/Objetivo', {
            'fields': ('tipo_kpi', 'meta_kpi', 'valor_actual_kpi')
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ParticipacionCampana)
class ParticipacionCampanaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'campana', 'comentario', 'created_at')
    list_filter = ('campana', 'created_at')
    search_fields = ('usuario__username', 'campana__titulo', 'comentario')
    date_hierarchy = 'created_at'
    
    readonly_fields = ('created_at',)


@admin.register(Tip)
class TipAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'refugio', 'categoria', 'tipo_animal', 'publicado', 'created_at')
    list_filter = ('categoria', 'tipo_animal', 'publicado', 'refugio', 'created_at')
    search_fields = ('titulo', 'contenido')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('refugio', 'titulo', 'contenido', 'imagen')
        }),
        ('Clasificación', {
            'fields': ('categoria', 'tipo_animal')
        }),
        ('Estado', {
            'fields': ('publicado',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ResenaRefugio)
class ResenaRefugioAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'refugio', 'calificacion', 'respondido', 'created_at')
    list_filter = ('calificacion', 'respondido', 'refugio', 'created_at')
    search_fields = ('usuario__username', 'refugio__nombre', 'comentario', 'respuesta')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Reseña', {
            'fields': ('usuario', 'refugio', 'calificacion', 'comentario')
        }),
        ('Respuesta del Refugio', {
            'fields': ('respondido', 'respuesta'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')

# =============================================================================
# VOLUNTARIADO
# =============================================================================

class InscripcionVoluntariadoInline(admin.TabularInline):
    model = InscripcionVoluntariado
    extra = 0
    fields = ('usuario', 'estado', 'fecha_inscripcion', 'comentario', 'notas_refugio')
    readonly_fields = ('fecha_inscripcion',)


@admin.register(EventoVoluntariado)
class EventoVoluntariadoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'refugio', 'fecha_evento', 'hora_inicio', 'cupos_disponibles', 'estado')
    list_filter = ('estado', 'fecha_evento', 'refugio')
    search_fields = ('titulo', 'descripcion', 'ubicacion', 'refugio__nombre')
    date_hierarchy = 'fecha_evento'
    inlines = [InscripcionVoluntariadoInline]
    
    fieldsets = (
        ('Información del Evento', {
            'fields': ('refugio', 'titulo', 'descripcion', 'imagen')
        }),
        ('Fecha y Hora', {
            'fields': ('fecha_evento', 'hora_inicio', 'hora_fin')
        }),
        ('Ubicación y Cupos', {
            'fields': ('ubicacion', 'cupos_disponibles')
        }),
        ('Requisitos', {
            'fields': ('requisitos',),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('estado',)
        }),
    )


@admin.register(InscripcionVoluntariado)
class InscripcionVoluntariadoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'evento', 'estado', 'fecha_inscripcion')
    list_filter = ('estado', 'fecha_inscripcion', 'evento__refugio')
    search_fields = ('usuario__username', 'usuario__email', 'evento__titulo')
    date_hierarchy = 'fecha_inscripcion'

    fieldsets = (
        ('Inscripción', {
            'fields': ('evento', 'usuario', 'estado')
        }),
        ('Comentarios', {
            'fields': ('comentario', 'notas_refugio'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'tipo_archivo', 'version', 'estado', 'refugio', 'descargas', 'fecha_modificacion')
    list_filter = ('categoria', 'tipo_archivo', 'estado', 'refugio', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion', 'creado_por__username')
    date_hierarchy = 'fecha_creacion'
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'descargas', 'usos', 'tamano')

    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'categoria', 'tipo_archivo', 'version', 'estado')
        }),
        ('Contenido', {
            'fields': ('descripcion', 'archivo', 'tamano')
        }),
        ('Metadatos', {
            'fields': ('refugio', 'creado_por', 'fecha_creacion', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
        ('Estadísticas', {
            'fields': ('descargas', 'usos'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  
            obj.creado_por = request.user
            if hasattr(request.user, 'perfil_refugio'):
                obj.refugio = request.user.perfil_refugio

            if obj.archivo:
                obj.tamano = obj.archivo.size
        super().save_model(request, obj, form, change)


# =============================================================================
# NOTIFICACIONES
# =============================================================================

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'tipo', 'titulo', 'leida', 'fecha_creacion')
    list_filter = ('tipo', 'leida', 'fecha_creacion')
    search_fields = ('usuario__username', 'titulo', 'mensaje')
    readonly_fields = ('fecha_creacion',)
    date_hierarchy = 'fecha_creacion'


# =============================================================================
# FAVORITOS
# =============================================================================

@admin.register(MascotaFavorita)
class MascotaFavoritaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'mascota', 'fecha_agregado')
    list_filter = ('fecha_agregado',)
    search_fields = ('usuario__username', 'mascota__nombre')
    readonly_fields = ('fecha_agregado',)
    date_hierarchy = 'fecha_agregado'


@admin.register(TipFavorito)
class TipFavoritoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'tip', 'fecha_agregado')
    list_filter = ('fecha_agregado',)
    search_fields = ('usuario__username', 'tip__titulo')
    readonly_fields = ('fecha_agregado',)
    date_hierarchy = 'fecha_agregado'