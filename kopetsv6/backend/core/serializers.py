from rest_framework import serializers
from django.db.models import Prefetch
from .models import (
    CustomUser, Refugio, ContactoRefugio, RedSocialRefugio, SolicitudAdopcion, PerfilAdoptante, Adopcion, VisitaSeguimiento, FotoVisita,
    Mascota, TipoAnimal, Raza, TipoVacuna, VacunaMascota,
    Campana, ParticipacionCampana, Tip, ResenaRefugio, EventoVoluntariado, InscripcionVoluntariado, Documento,
    Notificacion, MascotaFavorita, TipFavorito, ItemInventario
)


# =============================================================================
# USUARIOS
# =============================================================================

class CustomUserSerializer(serializers.ModelSerializer):
    foto_perfil = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'tipo_usuario', 'telefono', 'foto_perfil', 'date_joined']
        read_only_fields = ['date_joined']

    def get_foto_perfil(self, obj):
        
        if obj.foto_perfil:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto_perfil.url)
            return obj.foto_perfil.url
        return None


# =============================================================================
# REFUGIO
# =============================================================================

class ContactoRefugioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoRefugio
        fields = ['id', 'tipo', 'valor', 'principal']


class RedSocialRefugioSerializer(serializers.ModelSerializer):
    class Meta:
        model = RedSocialRefugio
        fields = ['id', 'plataforma', 'url']


class RefugioSerializer(serializers.ModelSerializer):
    contactos = ContactoRefugioSerializer(many=True, read_only=True)
    redes_sociales = RedSocialRefugioSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Refugio
        fields = [
            'user', 'nombre', 'descripcion', 'anio_fundacion', 'capacidad',
            'documento_verificacion', 'verificado', 'logo', 'portada',
            'direccion', 'ciudad', 'region', 'horario_atencion',
            'contactos', 'redes_sociales', 'user_email'
        ]
        read_only_fields = ['user', 'verificado']


class RefugioUpdateSerializer(serializers.ModelSerializer):
    contactos = ContactoRefugioSerializer(many=True, required=False)
    redes_sociales = RedSocialRefugioSerializer(many=True, required=False)
    
    class Meta:
        model = Refugio
        fields = [
            'nombre', 'descripcion', 'anio_fundacion', 'capacidad',
            'logo', 'portada', 'direccion', 'ciudad', 'region',
            'horario_atencion', 'contactos', 'redes_sociales'
        ]
    
    def update(self, instance, validated_data):
        contactos_data = validated_data.pop('contactos', None)
        redes_data = validated_data.pop('redes_sociales', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if contactos_data is not None:
            instance.contactos.all().delete()
            for contacto in contactos_data:
                ContactoRefugio.objects.create(refugio=instance, **contacto)
        
        if redes_data is not None:
            instance.redes_sociales.all().delete()
            for red in redes_data:
                RedSocialRefugio.objects.create(refugio=instance, **red)
        
        return instance


class RefugioPublicoSerializer(serializers.ModelSerializer):
    
    contactos = ContactoRefugioSerializer(many=True, read_only=True)
    calificacion_promedio = serializers.SerializerMethodField()
    total_resenas = serializers.SerializerMethodField()
    total_mascotas = serializers.SerializerMethodField()
    
    class Meta:
        model = Refugio
        fields = [
            'user', 'nombre', 'descripcion', 'anio_fundacion',
            'logo', 'portada', 'direccion', 'ciudad', 'region',
            'horario_atencion', 'contactos',
            'calificacion_promedio', 'total_resenas', 'total_mascotas'
        ]
    
    def get_calificacion_promedio(self, obj):
        resenas = obj.resenas.all()
        if resenas.exists():
            from django.db.models import Avg
            return round(resenas.aggregate(Avg('calificacion'))['calificacion__avg'], 1)
        return 0.0
    
    def get_total_resenas(self, obj):
        return obj.resenas.count()
    
    def get_total_mascotas(self, obj):
        return obj.mascotas.count()


# =============================================================================
# MASCOTAS
# =============================================================================

class TipoAnimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoAnimal
        fields = ['id', 'nombre', 'activo']


class RazaSerializer(serializers.ModelSerializer):
    tipo_animal_nombre = serializers.CharField(source='tipo_animal.nombre', read_only=True)
    
    class Meta:
        model = Raza
        fields = ['id', 'nombre', 'tipo_animal', 'tipo_animal_nombre']


class TipoVacunaSerializer(serializers.ModelSerializer):
    tipo_animal_nombre = serializers.CharField(source='tipo_animal.nombre', read_only=True)
    
    class Meta:
        model = TipoVacuna
        fields = ['id', 'nombre', 'descripcion', 'obligatoria', 'tipo_animal', 'tipo_animal_nombre', 'activo']


class VacunaMascotaSerializer(serializers.ModelSerializer):
    tipo_vacuna_nombre = serializers.CharField(source='tipo_vacuna.nombre', read_only=True)
    tipo_vacuna_obligatoria = serializers.BooleanField(source='tipo_vacuna.obligatoria', read_only=True)
    
    class Meta:
        model = VacunaMascota
        fields = [
            'id', 
            'mascota',  
            'tipo_vacuna', 'tipo_vacuna_nombre', 'tipo_vacuna_obligatoria',
            'fecha_aplicacion', 'fecha_proxima', 'lote', 'veterinario', 'notas'
        ]
        read_only_fields = ['id']


class MascotaSerializer(serializers.ModelSerializer):
    tipo_animal_nombre = serializers.CharField(source='tipo_animal.nombre', read_only=True)
    raza_nombre = serializers.CharField(source='raza.nombre', read_only=True, allow_null=True)
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    vacunas_aplicadas = VacunaMascotaSerializer(many=True, read_only=True)

    foto_principal = serializers.ImageField(required=False, allow_null=True)
    foto_2 = serializers.ImageField(required=False, allow_null=True)
    foto_3 = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Mascota
        fields = [
            'id', 'refugio', 'refugio_nombre',
            'tipo_animal', 'tipo_animal_nombre',
            'raza', 'raza_nombre',
            'nombre', 'sexo', 'edad', 'descripcion',


            'tamano', 'color',


            'nivel_energia', 'nivel_cuidado',


            'apto_ninos', 'apto_apartamento', 'sociable_perros', 'sociable_gatos',


            'esterilizado', 'desparasitado', 'microchip',
            'vacunas_aplicadas',
            'necesidades_especiales',


            'foto_principal', 'foto_2', 'foto_3',


            'estado', 'fecha_ingreso'
        ]
        read_only_fields = ['refugio', 'fecha_ingreso']

    def validate(self, data):

        raza = data.get('raza')
        tipo_animal = data.get('tipo_animal')


        if self.instance:
            if raza is None:
                raza = self.instance.raza
            if tipo_animal is None:
                tipo_animal = self.instance.tipo_animal


        if raza and tipo_animal:
            if raza.tipo_animal_id != tipo_animal.id:
                raise serializers.ValidationError({
                    'raza': f'La raza "{raza.nombre}" no corresponde al tipo de animal "{tipo_animal.nombre}"'
                })

        return data
    
    def validate_estado(self, value):
        
        if self.instance:
            transiciones_validas = {
                'BORRADOR': ['DISPONIBLE'],
                'DISPONIBLE': ['RESERVADO', 'ADOPTADO', 'BORRADOR'],
                'RESERVADO': ['DISPONIBLE', 'ADOPTADO'],
                'ADOPTADO': [],
            }
            
            estado_actual = self.instance.estado
            if estado_actual != value:
                estados_permitidos = transiciones_validas.get(estado_actual, [])
                if value not in estados_permitidos:
                    raise serializers.ValidationError(
                        f'No se puede cambiar de "{estado_actual}" a "{value}"'
                    )
        
        return value


class MascotaPublicaSerializer(serializers.ModelSerializer):
    
    tipo_animal_nombre = serializers.CharField(source='tipo_animal.nombre', read_only=True)
    raza_nombre = serializers.CharField(source='raza.nombre', read_only=True)
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    refugio_ciudad = serializers.CharField(source='refugio.ciudad', read_only=True)
    refugio_region = serializers.CharField(source='refugio.region', read_only=True)
    vacunas_aplicadas = VacunaMascotaSerializer(many=True, read_only=True)
    
    whatsapp = serializers.SerializerMethodField()
    
    class Meta:
        model = Mascota
        fields = [
            'id', 'nombre', 'tipo_animal_nombre', 'raza_nombre',
            'sexo', 'edad', 'descripcion',
            'tamano', 'color',
            'nivel_energia', 'nivel_cuidado',
            'apto_ninos', 'apto_apartamento', 'sociable_perros', 'sociable_gatos',
            'foto_principal', 'foto_2', 'foto_3',
            'esterilizado', 'desparasitado', 'microchip',
            'vacunas_aplicadas',
            'refugio_nombre', 'refugio_ciudad', 'refugio_region',
            'whatsapp', 
            'fecha_ingreso'
        ]
    
    def get_whatsapp(self, obj):
        if hasattr(obj, 'whatsapp_principal') and obj.whatsapp_principal:
            return obj.whatsapp_principal[0].valor
        return None


# =============================================================================
# ADOPTANTE
# =============================================================================

class PerfilAdoptanteSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    usuario_email = serializers.SerializerMethodField()
    
    class Meta:
        model = PerfilAdoptante
        fields = [
            'user', 'usuario_nombre', 'usuario_email',
            'rut', 'fecha_nacimiento', 'direccion', 'ciudad', 'region',
            'tipo_vivienda', 'tiene_patio', 'es_propietario',
            'experiencia_previa', 'tiene_mascotas', 'cantidad_mascotas'
        ]
        read_only_fields = ['user', 'usuario_nombre', 'usuario_email']
    
    def get_usuario_nombre(self, obj):
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        elif obj.user.first_name:
            return obj.user.first_name
        return obj.user.username
    
    def get_usuario_email(self, obj):
        return obj.user.email
    
    def validate_rut(self, value):
        
        if not value:
            return value
        
        
        rut_limpio = value.replace('.', '').replace('-', '').replace(' ', '').upper()
        
        
        if len(rut_limpio) < 2:
            raise serializers.ValidationError('RUT inválido')
        
        
        cuerpo = rut_limpio[:-1]
        dv_ingresado = rut_limpio[-1]
        
        
        if not cuerpo.isdigit():
            raise serializers.ValidationError('RUT debe contener solo números')
        
        
        suma = 0
        multiplicador = 2
        for digito in reversed(cuerpo):
            suma += int(digito) * multiplicador
            multiplicador = multiplicador + 1 if multiplicador < 7 else 2
        
        resto = suma % 11
        dv_calculado = str(11 - resto) if resto > 1 else ('0' if resto == 0 else 'K')
        
        
        if dv_ingresado != dv_calculado:
            raise serializers.ValidationError('RUT inválido (dígito verificador incorrecto)')
        
        
        return f"{cuerpo}-{dv_ingresado}"


# =============================================================================
# ADOPCIÓN
# =============================================================================

class SolicitudAdopcionSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    mascota_foto = serializers.ImageField(source='mascota.foto_principal', read_only=True)
    mascota_tipo = serializers.CharField(source='mascota.tipo_animal.nombre', read_only=True)
    mascota_raza = serializers.CharField(source='mascota.raza.nombre', read_only=True)
    mascota_edad = serializers.CharField(source='mascota.edad', read_only=True)
    refugio_nombre = serializers.CharField(source='mascota.refugio.nombre', read_only=True)
    refugio_ciudad = serializers.CharField(source='mascota.refugio.ciudad', read_only=True)
    adoptante_nombre = serializers.CharField(source='adoptante.get_full_name', read_only=True)
    adoptante_email = serializers.CharField(source='adoptante.email', read_only=True)
    whatsapp = serializers.SerializerMethodField()
    
    class Meta:
        model = SolicitudAdopcion
        fields = [
            'id', 'mascota', 'mascota_nombre', 'mascota_foto', 
            'mascota_tipo', 'mascota_raza', 'mascota_edad',
            'adoptante', 'adoptante_nombre', 'adoptante_email',
            'refugio_nombre', 'refugio_ciudad',
            'estado', 'mensaje', 'motivo_rechazo', 'whatsapp',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['adoptante', 'estado', 'created_at', 'updated_at']
    
    def get_whatsapp(self, obj):
        contacto = obj.mascota.refugio.contactos.filter(tipo='WHATSAPP', principal=True).first()
        return contacto.valor if contacto else None


# =============================================================================
# CAMPAÑAS
# =============================================================================

class ParticipacionCampanaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    usuario_id = serializers.IntegerField(source='usuario.id', read_only=True)
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_nombre_completo = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_telefono = serializers.CharField(source='usuario.telefono', read_only=True)

    class Meta:
        model = ParticipacionCampana
        fields = [
            'id', 'campana', 'usuario', 'usuario_id', 'usuario_nombre',
            'usuario_email', 'usuario_nombre_completo', 'usuario_telefono',
            'comentario', 'asistio', 'created_at'
        ]
        read_only_fields = ['usuario', 'created_at']


class CampanaSerializer(serializers.ModelSerializer):
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    progreso_porcentaje = serializers.ReadOnlyField()
    total_participantes = serializers.SerializerMethodField()
    usuario_participa = serializers.SerializerMethodField()
    
    class Meta:
        model = Campana
        fields = [
            'id', 'titulo', 'descripcion', 'imagen',
            'fecha_inicio', 'fecha_fin',
            'tipo_kpi', 'meta_kpi', 'valor_actual_kpi',
            'estado', 'refugio', 'refugio_nombre',
            'progreso_porcentaje', 'total_participantes', 'usuario_participa',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['refugio', 'valor_actual_kpi', 'created_at', 'updated_at']
    
    def validate(self, data):
        
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        
        
        if self.instance:
            if fecha_inicio is None:
                fecha_inicio = self.instance.fecha_inicio
            if fecha_fin is None:
                fecha_fin = self.instance.fecha_fin
        
        
        if fecha_inicio and fecha_fin:
            if fecha_fin < fecha_inicio:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser mayor o igual a la fecha de inicio'
                })
        
        return data
    
    def validate_meta_kpi(self, value):
        
        if value <= 0:
            raise serializers.ValidationError('La meta debe ser mayor a 0')
        return value
    
    def validate_estado(self, value):
        
        if self.instance:
            transiciones_validas = {
                'ACTIVA': ['PAUSADA', 'FINALIZADA'],
                'PAUSADA': ['ACTIVA', 'FINALIZADA'],
                'FINALIZADA': [],
            }
            
            estado_actual = self.instance.estado
            if estado_actual != value:
                estados_permitidos = transiciones_validas.get(estado_actual, [])
                if value not in estados_permitidos:
                    raise serializers.ValidationError(
                        f'No se puede cambiar de "{estado_actual}" a "{value}"'
                    )
        
        return value
    
    def get_total_participantes(self, obj):
        return obj.participaciones.count()
    
    def get_usuario_participa(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participaciones.filter(usuario=request.user).exists()
        return False


# =============================================================================
# TIPS
# =============================================================================

class TipSerializer(serializers.ModelSerializer):
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    tipo_animal_nombre = serializers.CharField(source='tipo_animal.nombre', read_only=True)
    imagen = serializers.SerializerMethodField()

    class Meta:
        model = Tip
        fields = [
            'id', 'titulo', 'contenido', 'categoria', 'imagen',
            'tipo_animal', 'tipo_animal_nombre',
            'refugio', 'refugio_nombre', 'publicado',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['refugio', 'created_at', 'updated_at']

    def get_imagen(self, obj):
        
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None


class TipCreateUpdateSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = Tip
        fields = [
            'id', 'titulo', 'contenido', 'categoria', 'imagen',
            'tipo_animal', 'refugio', 'publicado',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['refugio', 'created_at', 'updated_at']


# =============================================================================
# RESEÑAS
# =============================================================================

class ResenaRefugioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = ResenaRefugio
        fields = [
            'id', 'refugio', 'usuario', 'usuario_nombre', 
            'calificacion', 'comentario',
            'respondido', 'respuesta',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['usuario', 'respondido', 'created_at', 'updated_at']
    
    def get_usuario_nombre(self, obj):
        if obj.usuario.first_name and obj.usuario.last_name:
            return f"{obj.usuario.first_name} {obj.usuario.last_name}"
        return obj.usuario.username


# =============================================================================
# ADOPCIONES-SEGUIMIENTO
# =============================================================================

class FotoVisitaSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = FotoVisita
        fields = [
            'id', 'visita', 'imagen', 'descripcion',
            'orden', 'fecha_subida'
        ]
        read_only_fields = ['fecha_subida']

    def to_representation(self, instance):
        
        data = super().to_representation(instance)
        if instance.imagen:
            request = self.context.get('request')
            if request:
                data['imagen'] = request.build_absolute_uri(instance.imagen.url)
            else:
                data['imagen'] = instance.imagen.url
        return data


class VisitaSeguimientoSerializer(serializers.ModelSerializer):
    fotos = FotoVisitaSerializer(many=True, read_only=True)
    realizada_por_nombre = serializers.CharField(
        source='realizada_por.get_full_name',
        read_only=True
    )

    
    esta_vencida = serializers.BooleanField(read_only=True)

    es_ultima_visita = serializers.SerializerMethodField()

    def get_es_ultima_visita(self, obj):
        return obj.numero_visita == obj.adopcion.visitas_planificadas
    
    def validate_puntuacion(self, value):
        
        if value is not None:
            if value < 1 or value > 5:
                raise serializers.ValidationError('La puntuación debe estar entre 1 y 5')
        return value
    
    def validate_peso_actual(self, value):
        
        if value is not None:
            if value <= 0:
                raise serializers.ValidationError('El peso debe ser mayor a 0')
            if value > 200:
                raise serializers.ValidationError('El peso no puede superar los 200 kg')
        return value

    class Meta:
        model = VisitaSeguimiento
        fields = [
            'id', 'adopcion', 'numero_visita',
            'fecha_programada', 'fecha_realizada',
            'resultado', 'realizada_por', 'realizada_por_nombre',
            'observaciones', 'puntuacion',
            'estado_salud', 'peso_actual',
            'recordatorio_enviado',
            'fotos', 'fecha_creacion', 'fecha_actualizacion',
            'esta_vencida', 'es_ultima_visita',
        ]
        read_only_fields = [
            'fecha_creacion', 'fecha_actualizacion',
            'fotos', 'esta_vencida', 'es_ultima_visita'
        ]


class AdopcionSerializer(serializers.ModelSerializer):
    
    mascota_nombre = serializers.CharField(
        source='solicitud.mascota.nombre',
        read_only=True
    )
    mascota_foto = serializers.ImageField(
        source='solicitud.mascota.foto_principal',
        read_only=True
    )
    adoptante_nombre = serializers.CharField(
        source='solicitud.adoptante.get_full_name',
        read_only=True
    )
    adoptante_email = serializers.EmailField(
        source='solicitud.adoptante.email',
        read_only=True
    )

    
    progreso = serializers.IntegerField(
        source='progreso_seguimiento',
        read_only=True
    )
    visitas_realizadas = serializers.IntegerField(read_only=True)
    proxima_visita = serializers.DateField(read_only=True)
    seguimiento_activo = serializers.BooleanField(read_only=True)

    strikes_restantes = serializers.IntegerField(read_only=True)

    
    puede_agregar_strike = serializers.SerializerMethodField()
    puede_quitar_strike = serializers.SerializerMethodField()
    puede_finalizar = serializers.SerializerMethodField()

    def get_puede_agregar_strike(self, obj):
        return obj.strikes < obj.max_strikes

    def get_puede_quitar_strike(self, obj):
        return obj.strikes > 0

    def get_puede_finalizar(self, obj):
        return obj.progreso_seguimiento >= 100 and obj.strikes == 0

    
    visitas = VisitaSeguimientoSerializer(many=True, read_only=True)

    class Meta:
        model = Adopcion
        fields = [
            'id', 'solicitud',
            
            'mascota_nombre', 'mascota_foto',
            'adoptante_nombre', 'adoptante_email',

            
            'fecha_adopcion', 'fecha_inicio_seguimiento', 'fecha_fin_seguimiento',

            
            'estado',
            'seguimiento_activo',
            'progreso',
            'visitas_realizadas',
            'proxima_visita',

            
            'strikes', 'max_strikes', 'strikes_restantes',
            'puede_agregar_strike', 'puede_quitar_strike', 'puede_finalizar',

            
            'visitas_planificadas',

            
            'contrato_firmado', 'documento_contrato',
            'notas', 'recordatorio_enviado',

        
            'visitas',

            'fecha_creacion', 'fecha_actualizacion',
        ]
        read_only_fields = [
            'fecha_creacion', 'fecha_actualizacion',
            'progreso', 'visitas_realizadas',
            'proxima_visita', 'seguimiento_activo',
            'strikes_restantes',
            'puede_agregar_strike', 'puede_quitar_strike', 'puede_finalizar',
        ]


class AdopcionListSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.CharField(
        source='solicitud.mascota.nombre',
        read_only=True
    )
    mascota_foto = serializers.ImageField(
        source='solicitud.mascota.foto_principal',
        read_only=True
    )
    adoptante_nombre = serializers.CharField(
        source='solicitud.adoptante.get_full_name',
        read_only=True
    )
    adoptante_email = serializers.EmailField(
        source='solicitud.adoptante.email',
        read_only=True
    )

    
    progreso = serializers.IntegerField(
        source='progreso_seguimiento',
        read_only=True
    )
    visitas_realizadas = serializers.IntegerField(read_only=True)
    proxima_visita = serializers.DateField(read_only=True)
    seguimiento_activo = serializers.BooleanField(read_only=True)
    strikes_restantes = serializers.IntegerField(read_only=True)

    
    puede_agregar_strike = serializers.SerializerMethodField()
    puede_quitar_strike = serializers.SerializerMethodField()
    puede_finalizar = serializers.SerializerMethodField()

    def get_puede_agregar_strike(self, obj):
        return obj.strikes < obj.max_strikes

    def get_puede_quitar_strike(self, obj):
        return obj.strikes > 0

    def get_puede_finalizar(self, obj):
        return obj.progreso_seguimiento >= 100 and obj.strikes == 0

    
    visitas = VisitaSeguimientoSerializer(many=True, read_only=True)

    class Meta:
        model = Adopcion
        fields = [
            'id', 'solicitud',
            
            'mascota_nombre', 'mascota_foto',
            'adoptante_nombre', 'adoptante_email',
            
            
            'fecha_adopcion',
            'fecha_inicio_seguimiento',
            'fecha_fin_seguimiento',
            
            
            'estado',
            'seguimiento_activo',
            'progreso',
            'visitas_realizadas',
            'proxima_visita',
            
            
            'strikes', 'max_strikes', 'strikes_restantes',
            'puede_agregar_strike', 'puede_quitar_strike', 'puede_finalizar',
            
            
            'visitas_planificadas',
            
            
            'notas',
            
            
            'visitas',
        ]
        read_only_fields = [
            'progreso', 'visitas_realizadas',
            'proxima_visita', 'seguimiento_activo',
            'strikes_restantes',
            'puede_agregar_strike', 'puede_quitar_strike', 'puede_finalizar',
        ]


# =============================================================================
# VOLUNTARIADO
# =============================================================================

class InscripcionVoluntariadoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_telefono = serializers.CharField(source='usuario.telefono', read_only=True)
    
    class Meta:
        model = InscripcionVoluntariado
        fields = [
            'id', 'evento', 'usuario', 'usuario_nombre', 'usuario_email', 'usuario_telefono',
            'fecha_inscripcion', 'estado', 'comentario', 'notas_refugio'
        ]
        read_only_fields = ['usuario', 'fecha_inscripcion']


class EventoVoluntariadoSerializer(serializers.ModelSerializer):
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    refugio_ciudad = serializers.CharField(source='refugio.ciudad', read_only=True)
    cupos_ocupados = serializers.IntegerField(read_only=True)
    cupos_restantes = serializers.IntegerField(read_only=True)
    esta_lleno = serializers.BooleanField(read_only=True)
    ya_paso = serializers.BooleanField(read_only=True)
    inscripciones = InscripcionVoluntariadoSerializer(many=True, read_only=True)
    usuario_inscrito = serializers.SerializerMethodField()
    
    class Meta:
        model = EventoVoluntariado
        fields = [
            'id', 'refugio', 'refugio_nombre', 'refugio_ciudad',
            'titulo', 'descripcion', 'fecha_evento', 'hora_inicio', 'hora_fin',
            'ubicacion', 'cupos_disponibles', 'cupos_ocupados', 'cupos_restantes',
            'esta_lleno', 'ya_paso', 'estado', 'requisitos', 'imagen',
            'inscripciones', 'usuario_inscrito',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['refugio', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_usuario_inscrito(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            inscripcion = obj.inscripciones.filter(usuario=request.user, estado='INSCRITO').first()
            if inscripcion:
                return {
                    'inscrito': True,
                    'inscripcion_id': inscripcion.id,
                    'fecha_inscripcion': inscripcion.fecha_inscripcion
                }
        return {'inscrito': False, 'inscripcion_id': None, 'fecha_inscripcion': None}


class EventoVoluntariadoListSerializer(serializers.ModelSerializer):
    
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    refugio_ciudad = serializers.CharField(source='refugio.ciudad', read_only=True)
    cupos_ocupados = serializers.IntegerField(read_only=True)
    cupos_restantes = serializers.IntegerField(read_only=True)
    esta_lleno = serializers.BooleanField(read_only=True)
    ya_paso = serializers.BooleanField(read_only=True)
    total_inscritos = serializers.SerializerMethodField()
    usuario_inscrito = serializers.SerializerMethodField()
    
    class Meta:
        model = EventoVoluntariado
        fields = [
            'id', 'refugio', 'refugio_nombre', 'refugio_ciudad',
            'titulo', 'descripcion', 'fecha_evento', 'hora_inicio', 'hora_fin',
            'ubicacion', 'cupos_disponibles', 'cupos_ocupados', 'cupos_restantes',
            'esta_lleno', 'ya_paso', 'estado', 'imagen', 'total_inscritos',
            'usuario_inscrito'
        ]
    
    def get_total_inscritos(self, obj):
        return obj.inscripciones.filter(estado='INSCRITO').count()
    
    def get_usuario_inscrito(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.inscripciones.filter(usuario=request.user, estado='INSCRITO').exists()
        return False


# =============================================================================
# DOCUMENTOS
# =============================================================================

class DocumentoSerializer(serializers.ModelSerializer):
    
    archivo = serializers.FileField(required=False)
    creado_por_nombre = serializers.CharField(
        source='creado_por.get_full_name',
        read_only=True
    )
    refugio_nombre = serializers.CharField(
        source='refugio.nombre',
        read_only=True
    )

    class Meta:
        model = Documento
        fields = [
            'id', 'nombre', 'categoria', 'tipo_archivo', 'descripcion',
            'version', 'estado', 'archivo', 'tamano', 'fecha_creacion',
            'fecha_modificacion', 'creado_por', 'creado_por_nombre',
            'refugio', 'refugio_nombre', 'descargas', 'usos'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion', 'descargas', 'usos', 'creado_por', 'refugio', 'tamano']

    def to_representation(self, instance):
        
        data = super().to_representation(instance)
        if instance.archivo:
            request = self.context.get('request')
            if request:
                data['archivo'] = request.build_absolute_uri(instance.archivo.url)
            else:
                data['archivo'] = instance.archivo.url
        return data


# =============================================================================
# NOTIFICACIONES
# =============================================================================

class NotificacionSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = Notificacion
        fields = [
            'id', 'tipo', 'titulo', 'mensaje', 'leida',
            'url', 'fecha_creacion'
        ]
        read_only_fields = ['fecha_creacion']


# =============================================================================
# FAVORITOS
# =============================================================================

class MascotaFavoritaSerializer(serializers.ModelSerializer):
    

    mascota_nombre = serializers.CharField(source='mascota.nombre', read_only=True)
    mascota_especie = serializers.CharField(source='mascota.tipo_animal.nombre', read_only=True)
    mascota_foto = serializers.SerializerMethodField()
    refugio_nombre = serializers.CharField(source='mascota.refugio.nombre', read_only=True)
    mascota_estado = serializers.CharField(source='mascota.estado', read_only=True)

    class Meta:
        model = MascotaFavorita
        fields = [
            'id', 'mascota', 'mascota_nombre', 'mascota_especie',
            'mascota_foto', 'refugio_nombre', 'mascota_estado',
            'fecha_agregado'
        ]
        read_only_fields = ['fecha_agregado']

    def get_mascota_foto(self, obj):
        if obj.mascota.fotos.exists():
            foto = obj.mascota.fotos.first()
            if foto.imagen:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(foto.imagen.url)
                return foto.imagen.url
        return None


class TipFavoritoSerializer(serializers.ModelSerializer):
    

    tip_titulo = serializers.CharField(source='tip.titulo', read_only=True)
    tip_categoria = serializers.CharField(source='tip.categoria', read_only=True)
    tip_imagen = serializers.SerializerMethodField()
    refugio_nombre = serializers.SerializerMethodField()

    class Meta:
        model = TipFavorito
        fields = [
            'id', 'tip', 'tip_titulo', 'tip_categoria',
            'tip_imagen', 'refugio_nombre', 'fecha_agregado'
        ]
        read_only_fields = ['fecha_agregado']

    def get_tip_imagen(self, obj):
        if obj.tip.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.tip.imagen.url)
            return obj.tip.imagen.url
        return None

    def get_refugio_nombre(self, obj):
        try:
            return obj.tip.refugio.nombre if obj.tip.refugio else None
        except:
            return None


# =============================================================================
# INVENTARIO SERIALIZERS
# =============================================================================

class ItemInventarioSerializer(serializers.ModelSerializer):
    refugio_nombre = serializers.CharField(source='refugio.nombre', read_only=True)
    bajo_stock = serializers.BooleanField(read_only=True)
    valor_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    dias_hasta_vencimiento = serializers.IntegerField(read_only=True)
    proximo_a_vencer = serializers.BooleanField(read_only=True)
    vencido = serializers.BooleanField(read_only=True)

    class Meta:
        model = ItemInventario
        fields = [
            'id',
            'refugio',
            'refugio_nombre',
            'nombre',
            'categoria',
            'cantidad',
            'unidad',
            'stock_minimo',
            'precio_unitario',
            'proveedor',
            'fecha_ultima_compra',
            'fecha_vencimiento',
            'ubicacion',
            'notas',
            'bajo_stock',
            'valor_total',
            'dias_hasta_vencimiento',
            'proximo_a_vencer',
            'vencido',
            'fecha_creacion',
            'fecha_actualizacion',
        ]
        read_only_fields = ['id', 'refugio', 'fecha_creacion', 'fecha_actualizacion']

    def validate(self, data):
        
        
        if 'cantidad' in data and data['cantidad'] < 0:
            raise serializers.ValidationError({
                'cantidad': 'La cantidad no puede ser negativa'
            })

        
        if 'stock_minimo' in data and data['stock_minimo'] < 0:
            raise serializers.ValidationError({
                'stock_minimo': 'El stock mínimo no puede ser negativo'
            })


        if 'precio_unitario' in data and data['precio_unitario'] < 0:
            raise serializers.ValidationError({
                'precio_unitario': 'El precio unitario no puede ser negativo'
            })

        return data