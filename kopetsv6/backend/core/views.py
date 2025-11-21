from rest_framework import viewsets, status, permissions
import logging
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Max, Sum, Count
from django.db.models import Prefetch
from django.db import transaction
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings

from .models import (
    CustomUser, Refugio, TwoFactorCode, Adopcion, VisitaSeguimiento, FotoVisita,
    Mascota, TipoAnimal, Raza, TipoVacuna, VacunaMascota,
    Campana, ParticipacionCampana,
    Tip,
    SolicitudAdopcion, PerfilAdoptante,
    ResenaRefugio, ContactoRefugio, RedSocialRefugio, EventoVoluntariado, InscripcionVoluntariado,
    Documento, Notificacion, MascotaFavorita, TipFavorito, ItemInventario
)

from .serializers import (
    AdopcionSerializer, AdopcionListSerializer,
    VisitaSeguimientoSerializer, FotoVisitaSerializer,
    CustomUserSerializer, PerfilAdoptanteSerializer,
    RefugioSerializer, RefugioPublicoSerializer, RefugioUpdateSerializer,
    ResenaRefugioSerializer,
    MascotaSerializer, MascotaPublicaSerializer,
    TipoAnimalSerializer, RazaSerializer,
    TipoVacunaSerializer, VacunaMascotaSerializer,
    SolicitudAdopcionSerializer,
    CampanaSerializer, ParticipacionCampanaSerializer,
    TipSerializer, TipCreateUpdateSerializer, EventoVoluntariadoSerializer, EventoVoluntariadoListSerializer, InscripcionVoluntariadoSerializer,
    DocumentoSerializer, NotificacionSerializer, MascotaFavoritaSerializer, TipFavoritoSerializer, ItemInventarioSerializer
)

logger = logging.getLogger(__name__)
# =============================================================================
# AUTENTICACIÓN
# =============================================================================

class AuthViewSet(viewsets.ViewSet):
    
    permission_classes = [AllowAny]
    queryset = CustomUser.objects.none()
    serializer_class = CustomUserSerializer
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def perfil(self, request):
        
        if request.method == 'GET':
            serializer = CustomUserSerializer(request.user, context={'request': request})
            return Response({
                'success': True,
                'user': serializer.data
            })

        elif request.method == 'PATCH':
            
            user = request.user

            
            if 'telefono' in request.data:
                user.telefono = request.data['telefono']

            if 'first_name' in request.data:
                user.first_name = request.data['first_name']

            if 'last_name' in request.data:
                user.last_name = request.data['last_name']

            
            if 'foto_perfil' in request.data:
                import base64
                from django.core.files.base import ContentFile

                foto_data = request.data['foto_perfil']

                
                if foto_data and foto_data.startswith('data:image'):
                    
                    format, imgstr = foto_data.split(';base64,')
                    ext = format.split('/')[-1]  

                    
                    data = ContentFile(base64.b64decode(imgstr), name=f'perfil_{user.id}.{ext}')

                    
                    user.foto_perfil = data

            user.save()

            serializer = CustomUserSerializer(user, context={'request': request})
            return Response({
                'success': True,
                'user': serializer.data,
                'message': 'Perfil actualizado correctamente'
            })
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        
        email = request.data.get('email')
        password = request.data.get('password')
        
        
        mensaje_error_generico = 'Credenciales incorrectas'
        
        try:
            user = CustomUser.objects.get(email=email)
            
        
            if user.tipo_usuario == 'REFUGIO':
                try:
                    refugio = user.perfil_refugio
                    if not refugio.verificado:
                        return Response({
                            'success': False,
                            'message': 'Tu cuenta está pendiente de verificación por un administrador'
                        }, status=status.HTTP_403_FORBIDDEN)
                except Refugio.DoesNotExist:
                    pass
            
            user_auth = authenticate(username=user.username, password=password)
            
            if user_auth:

                codigo = TwoFactorCode.generar_codigo(user)
                
                # TODO: Enviar código por email en producción
                # send_mail(
                #     'Código de verificación - KokoroPets',
                #     f'Tu código de verificación es: {codigo}',
                #     settings.DEFAULT_FROM_EMAIL,
                #     [user.email],
                # )

                logger.debug(f"Código 2FA generado para {email}")

                return Response({
                    'success': True,
                    'message': 'Código enviado a tu email',
                    'user_id': user.id,
                    'tipo_usuario': user.tipo_usuario,
                })
            else:
                return Response({
                    'success': False,
                    'message': mensaje_error_generico
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except CustomUser.DoesNotExist:
            
            return Response({
                'success': False,
                'message': mensaje_error_generico
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def registro(self, request):
        
        tipo_usuario = request.data.get('tipo_usuario')
        email = request.data.get('email')
        password = request.data.get('password')
        
        
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return Response({
                'success': False,
                'message': 'Formato de email inválido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        
        if len(password) < 8:
            return Response({
                'success': False,
                'message': 'La contraseña debe tener al menos 8 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not re.search(r'[A-Z]', password):
            return Response({
                'success': False,
                'message': 'La contraseña debe contener al menos una mayúscula'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not re.search(r'[a-z]', password):
            return Response({
                'success': False,
                'message': 'La contraseña debe contener al menos una minúscula'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not re.search(r'[0-9]', password):
            return Response({
                'success': False,
                'message': 'La contraseña debe contener al menos un número'
            }, status=status.HTTP_400_BAD_REQUEST)
    
        if CustomUser.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'message': 'El email ya está registrado'
            }, status=status.HTTP_400_BAD_REQUEST)
    
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        tipo = 'REFUGIO' if tipo_usuario == 'fundacion' else 'ADOPTANTE'
    
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            tipo_usuario=tipo
        )
        
        if tipo_usuario == 'fundacion':
            nombre_fundacion = request.data.get('nombre_fundacion')
            
            refugio = Refugio.objects.create(
                user=user,
                nombre=nombre_fundacion,
                direccion='Por completar',
                ciudad='Por completar',
                region='Por completar',
                verificado=False
            )
            
            if 'documento_verificacion' in request.FILES:
                refugio.documento_verificacion = request.FILES['documento_verificacion']
                refugio.save()
            
            return Response({
                'success': True,
                'message': 'Cuenta creada. Pendiente de verificación por administrador.',
                'requiere_verificacion': True
            }, status=status.HTTP_201_CREATED)
                
        elif tipo_usuario == 'usuario':
            nombre = request.data.get('nombre', '')
            
            if nombre:
                partes = nombre.split(' ', 1)
                user.first_name = partes[0]
                if len(partes) > 1:
                    user.last_name = partes[1]
                user.save()
            
            codigo = TwoFactorCode.generar_codigo(user)

            logger.debug(f"Código 2FA generado para registro de {email}")

            return Response({
                'success': True,
                'message': 'Código de verificación enviado',
                'user_id': user.id,
                'requiere_verificacion': False,
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verificar_codigo(self, request):
        
        user_id = request.data.get('user_id')
        codigo = request.data.get('codigo')
        
        try:
            user = CustomUser.objects.get(id=user_id)
            codigo_2fa = TwoFactorCode.objects.get(user=user)
            
            if not codigo_2fa.is_valid():
                return Response({
                    'success': False,
                    'message': 'Código expirado o bloqueado'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            
            if codigo_2fa.verificar_codigo(codigo):
                
                codigo_2fa.delete()
                
                refresh = RefreshToken.for_user(user)
                serializer = CustomUserSerializer(user)
                return Response({
                    'success': True,
                    'message': 'Autenticación exitosa',
                    'user': serializer.data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                })
            else:
                codigo_2fa.intentos += 1
                if codigo_2fa.intentos >= 3:
                    codigo_2fa.bloqueado = True
                codigo_2fa.save()
                
                return Response({
                    'success': False,
                    'message': f'Código incorrecto. Intentos restantes: {3 - codigo_2fa.intentos}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (CustomUser.DoesNotExist, TwoFactorCode.DoesNotExist):
            return Response({
                'success': False,
                'message': 'Código inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
            

# =============================================================================
# REFUGIO
# =============================================================================

class RefugioViewSet(viewsets.ModelViewSet):
    
    queryset = Refugio.objects.all()
    serializer_class = RefugioSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return RefugioUpdateSerializer
        return RefugioSerializer
    
    @action(detail=False, methods=['get'])
    def mi_perfil(self, request):
        
        try:
            refugio = request.user.perfil_refugio
            serializer = self.get_serializer(refugio)
            return Response(serializer.data)
        except Refugio.DoesNotExist:
            return Response({
                'error': 'No tienes un perfil de refugio'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['patch'])
    def actualizar_perfil(self, request):
        
        try:
            refugio = request.user.perfil_refugio
            
            refugio.nombre = request.data.get('nombre', refugio.nombre)
            refugio.descripcion = request.data.get('descripcion', refugio.descripcion)
            refugio.anio_fundacion = request.data.get('anio_fundacion', refugio.anio_fundacion)
            refugio.capacidad = request.data.get('capacidad', refugio.capacidad)
            refugio.direccion = request.data.get('direccion', refugio.direccion)
            refugio.ciudad = request.data.get('ciudad', refugio.ciudad)
            refugio.region = request.data.get('region', refugio.region)
            refugio.horario_atencion = request.data.get('horario_atencion', refugio.horario_atencion)
            
            
            if 'logo' in request.FILES:
                refugio.logo = request.FILES['logo']
            
            if 'portada' in request.FILES:
                refugio.portada = request.FILES['portada']
            
            refugio.save()
            
            if 'contactos' in request.data:
                import json
                contactos = json.loads(request.data['contactos'])
                refugio.contactos.all().delete()
                for contacto_data in contactos:
                    if contacto_data.get('valor'):
                        ContactoRefugio.objects.create(refugio=refugio, **contacto_data)
            
            if 'redes_sociales' in request.data:
                import json
                redes = json.loads(request.data['redes_sociales'])
                refugio.redes_sociales.all().delete()
                for red_data in redes:
                    if red_data.get('url'):
                        RedSocialRefugio.objects.create(refugio=refugio, **red_data)
            
            return Response({
                'success': True,
                'message': 'Perfil actualizado correctamente',
                'data': RefugioSerializer(refugio).data
            })
            
        except Refugio.DoesNotExist:
            return Response({
                'error': 'No tienes un perfil de refugio'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def estadisticas_mensuales(self, request):
        
        from django.db.models.functions import TruncMonth
        from datetime import datetime, timedelta
        from collections import defaultdict

        try:
            refugio = request.user.perfil_refugio

            
            fecha_fin = datetime.now()
            fecha_inicio = fecha_fin - timedelta(days=365)

            
            adopciones = Adopcion.objects.filter(
                solicitud__mascota__refugio=refugio,
                fecha_adopcion__gte=fecha_inicio
            ).annotate(
                mes=TruncMonth('fecha_adopcion')
            ).values('mes').annotate(
                total=Count('id')
            ).order_by('mes')

            
            solicitudes = SolicitudAdopcion.objects.filter(
                mascota__refugio=refugio,
                created_at__gte=fecha_inicio
            ).annotate(
                mes=TruncMonth('created_at')
            ).values('mes').annotate(
                total=Count('id')
            ).order_by('mes')

            
            meses_es = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            resultado = []

            for i in range(12):
                mes_fecha = fecha_fin - timedelta(days=30 * (11 - i))
                mes_key = mes_fecha.strftime('%Y-%m-01')
                mes_nombre = meses_es[mes_fecha.month - 1]

                
                adopciones_mes = next((a['total'] for a in adopciones if a['mes'].strftime('%Y-%m-01') == mes_key), 0)
                solicitudes_mes = next((s['total'] for s in solicitudes if s['mes'].strftime('%Y-%m-01') == mes_key), 0)

                resultado.append({
                    'mes': mes_nombre,
                    'adopciones': adopciones_mes,
                    'solicitudes': solicitudes_mes
                })

            return Response(resultado)

        except Refugio.DoesNotExist:
            return Response({
                'error': 'No tienes un perfil de refugio'
            }, status=status.HTTP_404_NOT_FOUND)


class RefugioPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    
    queryset = Refugio.objects.filter(verificado=True)
    serializer_class = RefugioPublicoSerializer
    permission_classes = [IsAuthenticated]


# =============================================================================
# MASCOTAS
# =============================================================================

class TipoAnimalViewSet(viewsets.ReadOnlyModelViewSet):
    
    queryset = TipoAnimal.objects.filter(activo=True)
    serializer_class = TipoAnimalSerializer
    permission_classes = [IsAuthenticated]


class RazaViewSet(viewsets.ReadOnlyModelViewSet):
    
    serializer_class = RazaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Raza.objects.all()
        tipo_animal_id = self.request.query_params.get('tipo_animal')
        if tipo_animal_id:
            queryset = queryset.filter(tipo_animal_id=tipo_animal_id)
        return queryset


class TipoVacunaViewSet(viewsets.ReadOnlyModelViewSet):
    
    serializer_class = TipoVacunaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = TipoVacuna.objects.filter(activo=True)
        tipo_animal_id = self.request.query_params.get('tipo_animal')
        if tipo_animal_id:
            queryset = queryset.filter(tipo_animal_id=tipo_animal_id)
        return queryset


class VacunaMascotaViewSet(viewsets.ModelViewSet):
    
    serializer_class = VacunaMascotaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        
        if hasattr(self.request.user, 'perfil_refugio'):
            return VacunaMascota.objects.filter(
                mascota__refugio=self.request.user.perfil_refugio
            ).select_related('mascota', 'tipo_vacuna')
        return VacunaMascota.objects.none()
    
    def perform_create(self, serializer):
        
        if not hasattr(self.request.user, 'perfil_refugio'):
            raise PermissionDenied("Solo los refugios pueden agregar vacunas")
        
        mascota_id = self.request.data.get('mascota')
        try:
            mascota = Mascota.objects.get(
                id=mascota_id,
                refugio=self.request.user.perfil_refugio
            )
        except Mascota.DoesNotExist:
            raise PermissionDenied("No tienes permiso para agregar vacunas a esta mascota")
        
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def por_mascota(self, request):
        
        mascota_id = request.query_params.get('mascota_id')
        if not mascota_id:
            return Response(
                {'error': 'mascota_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vacunas = self.get_queryset().filter(mascota_id=mascota_id)
        serializer = self.get_serializer(vacunas, many=True)
        return Response(serializer.data)


class MascotaViewSet(viewsets.ModelViewSet):
    
    serializer_class = MascotaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        
        if hasattr(self.request.user, 'perfil_refugio'):
            queryset = Mascota.objects.filter(
                refugio=self.request.user.perfil_refugio
            ).select_related('tipo_animal', 'raza', 'refugio')
            
            estado = self.request.query_params.get('estado')
            if estado:
                queryset = queryset.filter(estado=estado)
            
            tipo_animal = self.request.query_params.get('tipo_animal')
            if tipo_animal:
                queryset = queryset.filter(tipo_animal_id=tipo_animal)
            
            tamano = self.request.query_params.get('tamano')
            if tamano:
                queryset = queryset.filter(tamano=tamano)
            
            nivel_energia = self.request.query_params.get('nivel_energia')
            if nivel_energia:
                queryset = queryset.filter(nivel_energia=nivel_energia)
            
            nivel_cuidado = self.request.query_params.get('nivel_cuidado')
            if nivel_cuidado:
                queryset = queryset.filter(nivel_cuidado=nivel_cuidado)
            
            apto_ninos = self.request.query_params.get('apto_ninos')
            if apto_ninos and apto_ninos.lower() == 'true':
                queryset = queryset.filter(apto_ninos=True)
            
            apto_apartamento = self.request.query_params.get('apto_apartamento')
            if apto_apartamento and apto_apartamento.lower() == 'true':
                queryset = queryset.filter(apto_apartamento=True)
            
            sociable_perros = self.request.query_params.get('sociable_perros')
            if sociable_perros and sociable_perros.lower() == 'true':
                queryset = queryset.filter(sociable_perros=True)
            
            sociable_gatos = self.request.query_params.get('sociable_gatos')
            if sociable_gatos and sociable_gatos.lower() == 'true':
                queryset = queryset.filter(sociable_gatos=True)
            
            busqueda = self.request.query_params.get('search')
            if busqueda:
                queryset = queryset.filter(
                    Q(nombre__icontains=busqueda) |
                    Q(descripcion__icontains=busqueda) |
                    Q(raza__nombre__icontains=busqueda) |
                    Q(color__icontains=busqueda)
                )
            
            return queryset.order_by('-fecha_ingreso')
        
        return Mascota.objects.none()
    
    def perform_create(self, serializer):
        
        serializer.save(refugio=self.request.user.perfil_refugio)
    
    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        
        mascota = self.get_object()
        mascota.estado = 'DISPONIBLE'
        mascota.save()
        return Response({'success': True, 'message': 'Mascota publicada'})
    
    @action(detail=True, methods=['post'])
    def marcar_adoptado(self, request, pk=None):
        
        mascota = self.get_object()
        mascota.estado = 'ADOPTADO'
        mascota.save()
        return Response({'success': True, 'message': 'Mascota marcada como adoptada'})


class MascotaPublicaViewSet(viewsets.ReadOnlyModelViewSet):
    
    serializer_class = MascotaPublicaSerializer
    
    permission_classes = [IsAuthenticated]

    
    def get_queryset(self):
        
        
        prefetch_whatsapp = Prefetch(
            'refugio__contactos',  
            queryset=ContactoRefugio.objects.filter(tipo='WHATSAPP', principal=True),
            to_attr='whatsapp_principal' 
        )
        
        queryset = Mascota.objects.filter(estado='DISPONIBLE').select_related(
            'tipo_animal', 'raza', 'refugio'
        ).prefetch_related(
            prefetch_whatsapp,  
            'vacunas_aplicadas__tipo_vacuna' 
        )
        
        tipo_animal = self.request.query_params.get('tipo_animal')
        if tipo_animal:
            queryset = queryset.filter(tipo_animal_id=tipo_animal)
        
        raza = self.request.query_params.get('raza')
        if raza:
            queryset = queryset.filter(raza_id=raza)
        
        sexo = self.request.query_params.get('sexo')
        if sexo:
            queryset = queryset.filter(sexo=sexo)
        
        edad = self.request.query_params.get('edad')
        if edad:
            queryset = queryset.filter(edad=edad)
        
        tamano = self.request.query_params.get('tamano')
        if tamano:
            queryset = queryset.filter(tamano=tamano)
        
        nivel_energia = self.request.query_params.get('nivel_energia')
        if nivel_energia:
            queryset = queryset.filter(nivel_energia=nivel_energia)
        
        nivel_cuidado = self.request.query_params.get('nivel_cuidado')
        if nivel_cuidado:
            queryset = queryset.filter(nivel_cuidado=nivel_cuidado)
        
        apto_ninos = self.request.query_params.get('apto_ninos')
        if apto_ninos and apto_ninos.lower() == 'true':
            queryset = queryset.filter(apto_ninos=True)
        
        apto_apartamento = self.request.query_params.get('apto_apartamento')
        if apto_apartamento and apto_apartamento.lower() == 'true':
            queryset = queryset.filter(apto_apartamento=True)
        
        sociable_perros = self.request.query_params.get('sociable_perros')
        if sociable_perros and sociable_perros.lower() == 'true':
            queryset = queryset.filter(sociable_perros=True)
        
        sociable_gatos = self.request.query_params.get('sociable_gatos')
        if sociable_gatos and sociable_gatos.lower() == 'true':
            queryset = queryset.filter(sociable_gatos=True)
        
        busqueda = self.request.query_params.get('search')
        if busqueda:
            queryset = queryset.filter(
                Q(nombre__icontains=busqueda) |
                Q(descripcion__icontains=busqueda) |
                Q(raza__nombre__icontains=busqueda) |
                Q(color__icontains=busqueda)
            )
        
        return queryset.order_by('-fecha_ingreso')


# =============================================================================
# ADOPTANTE
# =============================================================================

class PerfilAdoptanteViewSet(viewsets.ModelViewSet):
    
    serializer_class = PerfilAdoptanteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            adoptantes_ids = SolicitudAdopcion.objects.filter(
                mascota__refugio=user.perfil_refugio
            ).values_list('adoptante', flat=True).distinct()
            
            return PerfilAdoptante.objects.filter(user__in=adoptantes_ids)
        
        if hasattr(user, 'perfil_adoptante'):
            return PerfilAdoptante.objects.filter(user=user)
        
        return PerfilAdoptante.objects.none()
    
    def get_object(self):
        
        user_id = self.kwargs.get('pk')
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            adoptantes_ids = SolicitudAdopcion.objects.filter(
                mascota__refugio=user.perfil_refugio
            ).values_list('adoptante', flat=True).distinct()
            
            if int(user_id) not in adoptantes_ids:
                raise PermissionDenied("No tienes permiso para ver este perfil")
        
        elif user.id != int(user_id):
            raise PermissionDenied("No tienes permiso para ver este perfil")
        
        try:
            return PerfilAdoptante.objects.get(user_id=user_id)
        except PerfilAdoptante.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        
        instance = self.get_object()
        if instance is None:
            return Response(
                {'detail': 'Perfil no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        
        instance = self.get_object()
        if instance is None:
            return self.create(request, *args, **kwargs)
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        
        user_id = request.data.get('user')
        
        if not user_id:
            return Response(
                {'detail': 'El campo user es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if PerfilAdoptante.objects.filter(user=user).exists():
            perfil = PerfilAdoptante.objects.get(user=user)
            serializer = self.get_serializer(perfil, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# =============================================================================
# ADOPCIÓN
# =============================================================================

class SolicitudAdopcionViewSet(viewsets.ModelViewSet):
    
    serializer_class = SolicitudAdopcionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            return SolicitudAdopcion.objects.filter(
                mascota__refugio=user.perfil_refugio
            ).select_related(
                'mascota', 'adoptante', 'mascota__refugio', 'mascota__tipo_animal', 'mascota__raza'
            ).order_by('-created_at')

        return SolicitudAdopcion.objects.filter(
            adoptante=user
        ).select_related(
            'mascota', 'mascota__refugio', 'mascota__tipo_animal', 'mascota__raza'
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        
        mascota = serializer.validated_data['mascota']
        
        if mascota.estado != 'DISPONIBLE':
            raise ValidationError("Esta mascota no está disponible para adopción")
        
        existe = SolicitudAdopcion.objects.filter(
            adoptante=self.request.user,
            mascota=mascota,
            estado__in=['PENDIENTE', 'EN_REVISION', 'APROBADA']
        ).exists()
        
        if existe:
            raise ValidationError("Ya tienes una solicitud activa para esta mascota")
        
        if not hasattr(self.request.user, 'perfil_adoptante'):
            try:
                PerfilAdoptante.objects.create(
                    user=self.request.user,
                    rut='',
                    fecha_nacimiento=None,
                    direccion='',
                    ciudad='',
                    region='',
                    tipo_vivienda='CASA',
                    tiene_patio=False,
                    es_propietario=False,
                    experiencia_previa=False,
                    tiene_mascotas=False,
                    cantidad_mascotas=0
                )
            except Exception as e:
                logger.error(f"Error al crear perfil de adoptante: {str(e)}")
                raise
        
        serializer.save(
            adoptante=self.request.user,
            estado='PENDIENTE'
        )
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        
        solicitud = self.get_object()
        
        logger.info(f"🔍 DEBUG APROBAR - User ID: {request.user.id}")
        logger.info(f"🔍 DEBUG APROBAR - User email: {request.user.email}")
        logger.info(f"🔍 DEBUG APROBAR - Has perfil_refugio: {hasattr(request.user, 'perfil_refugio')}")
        
        if hasattr(request.user, 'perfil_refugio'):
            logger.info(f"🔍 DEBUG APROBAR - Perfil refugio PK: {request.user.perfil_refugio.pk}")
            logger.info(f"🔍 DEBUG APROBAR - Refugio de mascota PK: {solicitud.mascota.refugio.pk}")
            logger.info(f"🔍 DEBUG APROBAR - Son iguales: {solicitud.mascota.refugio == request.user.perfil_refugio}")
        else:
            logger.error(f"❌ DEBUG APROBAR - Usuario NO tiene perfil_refugio")
        
        if not hasattr(request.user, 'perfil_refugio'):
            logger.error(f"❌ APROBAR - Usuario {request.user.id} no tiene perfil_refugio")
            raise PermissionDenied("No tienes permiso para aprobar esta solicitud. No eres un refugio.")
        
        if solicitud.mascota.refugio != request.user.perfil_refugio:
            logger.error(f"❌ APROBAR - Refugio {request.user.perfil_refugio.pk} no es dueño de mascota {solicitud.mascota.id}")
            raise PermissionDenied("No tienes permiso para aprobar esta solicitud. No eres el dueño de esta mascota.")
        
        solicitud.estado = 'APROBADA'
        solicitud.motivo_rechazo = ''
        solicitud.save()
        
        solicitud.mascota.estado = 'RESERVADO'
        solicitud.mascota.save()
        
        SolicitudAdopcion.objects.filter(
            mascota=solicitud.mascota,
            estado__in=['PENDIENTE', 'EN_REVISION']
        ).exclude(id=solicitud.id).update(
            estado='RECHAZADA',
            motivo_rechazo='La mascota ya fue asignada a otro adoptante',
        )
        
        logger.info(f"✅ APROBAR - Solicitud {solicitud.id} aprobada exitosamente")
        return Response({'success': True, 'message': 'Solicitud aprobada'})
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        
        solicitud = self.get_object()
        
        logger.info(f"🔍 DEBUG RECHAZAR - User ID: {request.user.id}")
        logger.info(f"🔍 DEBUG RECHAZAR - User email: {request.user.email}")
        logger.info(f"🔍 DEBUG RECHAZAR - Has perfil_refugio: {hasattr(request.user, 'perfil_refugio')}")
        
        if hasattr(request.user, 'perfil_refugio'):
            logger.info(f"🔍 DEBUG RECHAZAR - Perfil refugio PK: {request.user.perfil_refugio.pk}")
            logger.info(f"🔍 DEBUG RECHAZAR - Refugio de mascota PK: {solicitud.mascota.refugio.pk}")
            logger.info(f"🔍 DEBUG RECHAZAR - Son iguales: {solicitud.mascota.refugio == request.user.perfil_refugio}")
        else:
            logger.error(f"❌ DEBUG RECHAZAR - Usuario NO tiene perfil_refugio")
        
        if not hasattr(request.user, 'perfil_refugio'):
            logger.error(f"❌ RECHAZAR - Usuario {request.user.id} no tiene perfil_refugio")
            raise PermissionDenied("No tienes permiso para rechazar esta solicitud. No eres un refugio.")
        
        if solicitud.mascota.refugio != request.user.perfil_refugio:
            logger.error(f"❌ RECHAZAR - Refugio {request.user.perfil_refugio.pk} no es dueño de mascota {solicitud.mascota.id}")
            raise PermissionDenied("No tienes permiso para rechazar esta solicitud. No eres el dueño de esta mascota.")
        
        motivo = request.data.get('motivo_rechazo', '')
        if not motivo:
            raise ValidationError("Debes proporcionar un motivo de rechazo")
        
        estado_anterior = solicitud.estado
        solicitud.estado = 'RECHAZADA'
        solicitud.motivo_rechazo = motivo
        solicitud.save()

        if estado_anterior == 'APROBADA':
            solicitud.mascota.estado = 'DISPONIBLE'
            solicitud.mascota.save()
        
        logger.info(f"✅ RECHAZAR - Solicitud {solicitud.id} rechazada exitosamente")
        return Response({'success': True, 'message': 'Solicitud rechazada'})
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        
        solicitud = self.get_object()
        
        if solicitud.adoptante != request.user:
            raise PermissionDenied("No tienes permiso para cancelar esta solicitud")
        
        if solicitud.estado not in ['PENDIENTE', 'EN_REVISION']:
            raise ValidationError("Solo puedes cancelar solicitudes pendientes")
        
        solicitud.estado = 'CANCELADA'
        solicitud.save()
        
        logger.info(f"✅ CANCELAR - Solicitud {solicitud.id} cancelada exitosamente")
        return Response({'success': True, 'message': 'Solicitud cancelada'})

    @action(detail=True, methods=['post'])
    def marcar_pendiente(self, request, pk=None):
        
        solicitud = self.get_object()
    
        if not hasattr(request.user, 'perfil_refugio'):
            raise PermissionDenied("No tienes permiso para modificar esta solicitud.")
    
        if solicitud.mascota.refugio != request.user.perfil_refugio:
            raise PermissionDenied("No eres el dueño de esta mascota.")
    
        estado_anterior = solicitud.estado

        solicitud.estado = 'PENDIENTE'
        solicitud.motivo_rechazo = ''
        solicitud.save()

        if estado_anterior == 'APROBADA':
            solicitud.mascota.estado = 'DISPONIBLE'
            solicitud.mascota.save()
    
        logger.info(f"✅ Solicitud {solicitud.id} marcada como pendiente")
        return Response({'success': True, 'message': 'Solicitud marcada como pendiente'})


# =============================================================================
# CAMPAÑAS
# =============================================================================

class CampanaViewSet(viewsets.ModelViewSet):
    
    serializer_class = CampanaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            return Campana.objects.filter(refugio=user.perfil_refugio)
        
        return Campana.objects.filter(estado='ACTIVA')
    
    def perform_create(self, serializer):
        if hasattr(self.request.user, 'perfil_refugio'):
            serializer.save(refugio=self.request.user.perfil_refugio)
        else:
            raise PermissionDenied("Solo los refugios pueden crear campañas")
    
    @action(detail=True, methods=['post'])
    def participar(self, request, pk=None):
        
        campana = self.get_object()
        
        if campana.estado != 'ACTIVA':
            return Response(
                {'error': 'La campaña no está activa'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participacion, created = ParticipacionCampana.objects.get_or_create(
            campana=campana,
            usuario=request.user,
            defaults={'comentario': request.data.get('comentario', '')}
        )
        
        if not created:
            return Response(
                {'message': 'Ya participas en esta campaña'}, 
                status=status.HTTP_200_OK
            )
        
        if campana.tipo_kpi == 'PARTICIPANTES':
            campana.valor_actual_kpi += 1
            campana.save()
        
        return Response(
            {'success': True, 'message': 'Participación registrada'},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancelar_participacion(self, request, pk=None):
        
        campana = self.get_object()

        try:
            participacion = ParticipacionCampana.objects.get(
                campana=campana,
                usuario=request.user
            )
            participacion.delete()

            
            if campana.tipo_kpi == 'PARTICIPANTES' and campana.valor_actual_kpi > 0:
                campana.valor_actual_kpi -= 1
                campana.save()

            return Response(
                {'success': True, 'message': 'Participación cancelada'},
                status=status.HTTP_200_OK
            )
        except ParticipacionCampana.DoesNotExist:
            return Response(
                {'error': 'No estás participando en esta campaña'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def pausar(self, request, pk=None):
        campana = self.get_object()
        if not hasattr(request.user, 'perfil_refugio') or campana.refugio != request.user.perfil_refugio:
            raise PermissionDenied()
        campana.estado = 'PAUSADA'
        campana.save()
        return Response({'success': True})
    
    @action(detail=True, methods=['post'])
    def activar(self, request, pk=None):
        campana = self.get_object()
        if not hasattr(request.user, 'perfil_refugio') or campana.refugio != request.user.perfil_refugio:
            raise PermissionDenied()
        campana.estado = 'ACTIVA'
        campana.save()
        return Response({'success': True})
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        campana = self.get_object()
        if not hasattr(request.user, 'perfil_refugio') or campana.refugio != request.user.perfil_refugio:
            raise PermissionDenied()
        campana.estado = 'FINALIZADA'
        campana.save()
        return Response({'success': True})
    
    @action(detail=True, methods=['get'])
    def participantes(self, request, pk=None):
        
        campana = self.get_object()

        if not hasattr(request.user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden ver participantes")

        if campana.refugio != request.user.perfil_refugio:
            raise PermissionDenied("No puedes ver participantes de campañas de otro refugio")

        participaciones = campana.participaciones.all()
        serializer = ParticipacionCampanaSerializer(participaciones, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def marcar_asistencia(self, request, pk=None):
        
        campana = self.get_object()

        if not hasattr(request.user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden marcar asistencia")

        if campana.refugio != request.user.perfil_refugio:
            raise PermissionDenied("No puedes marcar asistencia de campañas de otro refugio")

        participacion_id = request.data.get('participacion_id')
        asistio = request.data.get('asistio', True)

        if not participacion_id:
            return Response(
                {'error': 'Se requiere participacion_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            participacion = ParticipacionCampana.objects.get(
                id=participacion_id,
                campana=campana
            )
        except ParticipacionCampana.DoesNotExist:
            return Response(
                {'error': 'Participación no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        participacion.asistio = asistio
        participacion.save()

        serializer = ParticipacionCampanaSerializer(participacion)
        return Response(serializer.data)


# =============================================================================
# TIPS
# =============================================================================

class TipViewSet(viewsets.ModelViewSet):
    
    serializer_class = TipSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        
        if self.action in ['create', 'update', 'partial_update']:
            return TipCreateUpdateSerializer
        return TipSerializer

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, 'perfil_refugio'):
            return Tip.objects.filter(refugio=user.perfil_refugio)

        queryset = Tip.objects.filter(publicado=True)

        categoria = self.request.query_params.get('categoria')
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        tipo_animal = self.request.query_params.get('tipo_animal')
        if tipo_animal:
            queryset = queryset.filter(tipo_animal_id=tipo_animal)

        return queryset

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'perfil_refugio'):
            serializer.save(refugio=self.request.user.perfil_refugio)
        else:
            raise PermissionDenied("Solo los refugios pueden crear tips")
    
    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        tip = self.get_object()
        if not hasattr(request.user, 'perfil_refugio') or tip.refugio != request.user.perfil_refugio:
            raise PermissionDenied()
        tip.publicado = True
        tip.save()
        return Response({'success': True})
    
    @action(detail=True, methods=['post'])
    def despublicar(self, request, pk=None):
        tip = self.get_object()
        if not hasattr(request.user, 'perfil_refugio') or tip.refugio != request.user.perfil_refugio:
            raise PermissionDenied()
        tip.publicado = False
        tip.save()
        return Response({'success': True})


# =============================================================================
# RESEÑAS
# =============================================================================

class ResenaRefugioViewSet(viewsets.ModelViewSet):
    serializer_class = ResenaRefugioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            return ResenaRefugio.objects.filter(refugio=user.perfil_refugio)
        
        refugio_id = self.request.query_params.get('refugio')
        if refugio_id:
            return ResenaRefugio.objects.filter(refugio_id=refugio_id)
        
        return ResenaRefugio.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
    
    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        
        resena = self.get_object()
        
        if not hasattr(request.user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden responder reseñas")
        
        if resena.refugio != request.user.perfil_refugio:
            raise PermissionDenied("No tienes permiso para responder esta reseña")
        
        respuesta = request.data.get('respuesta', '')
        if not respuesta:
            return Response({'error': 'La respuesta no puede estar vacía'}, status=400)
        
        resena.respuesta = respuesta
        resena.respondido = True
        resena.save()
        
        return Response({'success': True, 'message': 'Respuesta enviada correctamente'})


# =============================================================================
# ADOPCIONES-SEGUIMIENTO
# =============================================================================

class AdopcionViewSet(viewsets.ModelViewSet):
    
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_serializer_class(self):
        if self.action == 'list':
            return AdopcionListSerializer
        return AdopcionSerializer

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, 'perfil_refugio'):
            return (
                Adopcion.objects
                .filter(solicitud__mascota__refugio=user.perfil_refugio)
                .select_related(
                    'solicitud__mascota',
                    'solicitud__adoptante'
                )
                .prefetch_related('visitas')
                .order_by('-fecha_adopcion')
            )

        return (
            Adopcion.objects
            .filter(solicitud__adoptante=user)
            .select_related(
                'solicitud__mascota',
                'solicitud__mascota__refugio'
            )
            .prefetch_related('visitas')
            .order_by('-fecha_adopcion')
        )

    def _validar_es_refugio_duenio(self, request, adopcion):
        
        user = request.user

        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden realizar esta acción.")

        if adopcion.solicitud.mascota.refugio != user.perfil_refugio:
            raise PermissionDenied("No eres el dueño de esta mascota.")

    @action(detail=True, methods=['post'])
    def iniciar_seguimiento(self, request, pk=None):
        adopcion = self.get_object()
        self._validar_es_refugio_duenio(request, adopcion)

        if adopcion.seguimiento_activo:
            raise ValidationError("El seguimiento ya está activo.")

        with transaction.atomic():
            adopcion.iniciar_seguimiento()

        return Response({
            'success': True,
            'message': 'Seguimiento iniciado por 30 días.',
            'adopcion': AdopcionSerializer(adopcion).data
        })

    @action(detail=True, methods=['post'])
    def finalizar_seguimiento(self, request, pk=None):
        adopcion = self.get_object()
        self._validar_es_refugio_duenio(request, adopcion)

        with transaction.atomic():
            exito = adopcion.finalizar_seguimiento()
            if not exito:
                return Response({
                    'success': False,
                    'message': 'Debe tener 100% de visitas realizadas y 0 strikes.'
                }, status=400)

        return Response({
            'success': True,
            'message': 'Seguimiento finalizado.',
            'estado': adopcion.estado,
            'adopcion': AdopcionSerializer(adopcion).data
        })

    @action(detail=True, methods=['post'])
    def agregar_strike(self, request, pk=None):
        adopcion = self.get_object()
        self._validar_es_refugio_duenio(request, adopcion)

        with transaction.atomic():
            exito = adopcion.agregar_strike()
            if not exito:
                return Response({
                    'success': False,
                    'message': 'Esta adopción ya tiene el máximo de strikes (3).'
                }, status=400)

        return Response({
            'success': True,
            'message': 'Strike agregado.',
            'adopcion': AdopcionSerializer(adopcion).data
        })

    @action(detail=True, methods=['post'])
    def quitar_strike(self, request, pk=None):
        adopcion = self.get_object()
        self._validar_es_refugio_duenio(request, adopcion)

        with transaction.atomic():
            exito = adopcion.quitar_strike()
            if not exito:
                return Response({
                    'success': False,
                    'message': 'La adopción no tiene strikes para quitar.'
                }, status=400)

        return Response({
            'success': True,
            'message': 'Strike quitado.',
            'adopcion': AdopcionSerializer(adopcion).data
        })


class VisitaSeguimientoViewSet(viewsets.ModelViewSet):
    
    serializer_class = VisitaSeguimientoSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, 'perfil_refugio'):
            return (
                VisitaSeguimiento.objects
                .filter(adopcion__solicitud__mascota__refugio=user.perfil_refugio)
                .select_related(
                    'adopcion__solicitud__mascota',
                    'adopcion__solicitud__adoptante',
                    'realizada_por'
                )
                .prefetch_related('fotos')
                .order_by('adopcion', 'numero_visita')
            )

        return (
            VisitaSeguimiento.objects
            .filter(adopcion__solicitud__adoptante=user)
            .select_related(
                'adopcion__solicitud__mascota',
                'realizada_por'
            )
            .prefetch_related('fotos')
            .order_by('adopcion', 'numero_visita')
        )

    def _validar_es_duenio(self, request, visita):
        
        user = request.user
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden realizar esta acción.")
        if visita.adopcion.solicitud.mascota.refugio != user.perfil_refugio:
            raise PermissionDenied("No eres el dueño de esta mascota.")

    def perform_create(self, serializer):
        user = self.request.user

        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden crear visitas.")

        adopcion_id = self.request.data.get('adopcion')
        try:
            adopcion = Adopcion.objects.get(id=adopcion_id)
        except Adopcion.DoesNotExist:
            raise ValidationError("Adopción no encontrada.")

        if adopcion.solicitud.mascota.refugio != user.perfil_refugio:
            raise PermissionDenied("No eres el dueño de esta mascota.")

        if not adopcion.seguimiento_activo:
            raise ValidationError("El seguimiento no está activo.")

        
        numero_visita = adopcion.visitas.count() + 1

        fecha_programada = serializer.validated_data.get('fecha_programada')
        if fecha_programada:
            if fecha_programada < adopcion.fecha_inicio_seguimiento:
                raise ValidationError("La fecha programada está antes del inicio del seguimiento.")
            if fecha_programada > adopcion.fecha_fin_seguimiento:
                raise ValidationError("La fecha programada excede el fin del seguimiento.")

        
        adopcion.visitas_planificadas = adopcion.visitas.count() + 1
        adopcion.save()

        serializer.save(numero_visita=numero_visita)

    def perform_destroy(self, instance):
        
        user = self.request.user

        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden eliminar visitas.")

        if instance.adopcion.solicitud.mascota.refugio != user.perfil_refugio:
            raise PermissionDenied("No eres el dueño de esta mascota.")

        adopcion = instance.adopcion
        numero_eliminado = instance.numero_visita

        
        instance.delete()

        
        visitas_posteriores = adopcion.visitas.filter(numero_visita__gt=numero_eliminado).order_by('numero_visita')
        for visita in visitas_posteriores:
            visita.numero_visita -= 1
            visita.save(update_fields=['numero_visita'])

        
        adopcion.visitas_planificadas = adopcion.visitas.count()
        adopcion.save(update_fields=['visitas_planificadas'])

    @action(detail=True, methods=['post'])
    def marcar_realizada(self, request, pk=None):
        visita = self.get_object()
        self._validar_es_duenio(request, visita)

        
        resultado = request.data.get('resultado', 'EXITOSO')
        observaciones = request.data.get('observaciones', '')
        puntuacion = request.data.get('puntuacion')
        estado_salud = request.data.get('estado_salud')
        peso_actual = request.data.get('peso_actual')

        
        visita.resultado = resultado
        visita.observaciones = observaciones

        if puntuacion is not None:
            visita.puntuacion = int(puntuacion)

        if estado_salud:
            visita.estado_salud = estado_salud

        if peso_actual is not None:
            visita.peso_actual = float(peso_actual)

        
        visita.marcar_realizada(usuario=request.user, resultado_si_pendiente=resultado)

        
        if resultado == 'PROBLEMATICO':
            visita.adopcion.agregar_strike()

    
        elif resultado == 'EXITOSO' and visita.adopcion.strikes > 0:
            visita.adopcion.quitar_strike()

        return Response({
            'success': True,
            'message': 'Visita marcada como realizada.',
            'visita': VisitaSeguimientoSerializer(visita).data,
            'strikes': visita.adopcion.strikes,
            'estado': visita.adopcion.estado
        })

    @action(detail=True, methods=['post'])
    def marcar_no_realizada(self, request, pk=None):
        visita = self.get_object()
        self._validar_es_duenio(request, visita)

        visita.marcar_no_realizada()

        return Response({
            'success': True,
            'message': 'Visita marcada como NO realizada. Strike agregado.',
            'strikes': visita.adopcion.strikes
        })


class FotoVisitaViewSet(viewsets.ModelViewSet):
    serializer_class = FotoVisitaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, 'perfil_refugio'):
            return FotoVisita.objects.filter(
                visita__adopcion__solicitud__mascota__refugio=user.perfil_refugio
            )

        return FotoVisita.objects.filter(
            visita__adopcion__solicitud__adoptante=user
        )

    def get_serializer_context(self):
        
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user

        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden subir fotos.")

        visita_id = self.request.data.get('visita')
        try:
            visita = VisitaSeguimiento.objects.get(id=visita_id)
        except VisitaSeguimiento.DoesNotExist:
            raise ValidationError("Visita no encontrada.")

        if visita.adopcion.solicitud.mascota.refugio != user.perfil_refugio:
            raise PermissionDenied("No eres el dueño de esta mascota.")

        if visita.fotos.count() >= 3:
            raise ValidationError("Máximo 3 fotos por visita.")

        serializer.save()


# =============================================================================
# VOLUNTARIADO
# =============================================================================

class EventoVoluntariadoViewSet(viewsets.ModelViewSet):
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventoVoluntariadoListSerializer
        return EventoVoluntariadoSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            queryset = EventoVoluntariado.objects.filter(refugio=user.perfil_refugio)
        else:
            queryset = EventoVoluntariado.objects.filter(estado='ACTIVO')
        
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        
        fecha_desde = self.request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(fecha_evento__gte=fecha_desde)
        
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(fecha_evento__lte=fecha_hasta)
        
        return queryset.order_by('-fecha_evento')
    
    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden crear eventos de voluntariado.")
        serializer.save(refugio=user.perfil_refugio)
    
    def perform_update(self, serializer):
        user = self.request.user
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden editar eventos.")
        if serializer.instance.refugio != user.perfil_refugio:
            raise PermissionDenied("No puedes editar eventos de otro refugio.")
        serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden eliminar eventos.")
        if instance.refugio != user.perfil_refugio:
            raise PermissionDenied("No puedes eliminar eventos de otro refugio.")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        
        evento = self.get_object()
        user = request.user
        
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden cancelar eventos.")
        if evento.refugio != user.perfil_refugio:
            raise PermissionDenied("No puedes cancelar eventos de otro refugio.")
        
        evento.estado = 'CANCELADO'
        evento.save()
        
        return Response({
            'mensaje': 'Evento cancelado correctamente',
            'evento': EventoVoluntariadoSerializer(evento, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        
        evento = self.get_object()
        user = request.user
        
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden finalizar eventos.")
        if evento.refugio != user.perfil_refugio:
            raise PermissionDenied("No puedes finalizar eventos de otro refugio.")
        
        evento.estado = 'FINALIZADO'
        evento.save()
        
        return Response({
            'mensaje': 'Evento finalizado correctamente',
            'evento': EventoVoluntariadoSerializer(evento, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def inscribirse(self, request, pk=None):
        
        evento = self.get_object()
        user = request.user
        
        if hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Los refugios no pueden inscribirse a voluntariados.")
        
        if evento.estado != 'ACTIVO':
            raise ValidationError("Este evento no está activo.")
        
        if evento.esta_lleno:
            raise ValidationError("No hay cupos disponibles.")
        
        if evento.ya_paso:
            raise ValidationError("Este evento ya pasó.")
        
        inscripcion_existente = InscripcionVoluntariado.objects.filter(
            evento=evento, usuario=user
        ).first()
        
        if inscripcion_existente:
            if inscripcion_existente.estado == 'INSCRITO':
                raise ValidationError("Ya estás inscrito en este evento.")
            elif inscripcion_existente.estado == 'CANCELADO':
                inscripcion_existente.estado = 'INSCRITO'
                inscripcion_existente.comentario = request.data.get('comentario', '')
                inscripcion_existente.save()
                return Response({
                    'mensaje': 'Te has inscrito nuevamente al evento',
                    'inscripcion': InscripcionVoluntariadoSerializer(inscripcion_existente).data
                })
        
        inscripcion = InscripcionVoluntariado.objects.create(
            evento=evento,
            usuario=user,
            comentario=request.data.get('comentario', '')
        )
        
        return Response({
            'mensaje': 'Inscripción exitosa',
            'inscripcion': InscripcionVoluntariadoSerializer(inscripcion).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def cancelar_inscripcion(self, request, pk=None):
        
        evento = self.get_object()
        user = request.user
        
        inscripcion = InscripcionVoluntariado.objects.filter(
            evento=evento, usuario=user, estado='INSCRITO'
        ).first()
        
        if not inscripcion:
            raise ValidationError("No tienes una inscripción activa en este evento.")
        
        inscripcion.estado = 'CANCELADO'
        inscripcion.save()
        
        return Response({
            'mensaje': 'Inscripción cancelada correctamente'
        })
    
    @action(detail=True, methods=['get'])
    def inscritos(self, request, pk=None):
        
        evento = self.get_object()
        user = request.user
        
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden ver la lista de inscritos.")
        if evento.refugio != user.perfil_refugio:
            raise PermissionDenied("No puedes ver inscritos de eventos de otro refugio.")
        
        inscripciones = evento.inscripciones.filter(estado='INSCRITO')
        serializer = InscripcionVoluntariadoSerializer(inscripciones, many=True)
        
        return Response(serializer.data)


class InscripcionVoluntariadoViewSet(viewsets.ModelViewSet):
    
    serializer_class = InscripcionVoluntariadoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'perfil_refugio'):
            return InscripcionVoluntariado.objects.filter(
                evento__refugio=user.perfil_refugio
            )
        
        return InscripcionVoluntariado.objects.filter(usuario=user)
    
    @action(detail=True, methods=['post'])
    def marcar_asistencia(self, request, pk=None):
        
        inscripcion = self.get_object()
        user = request.user
        
        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo refugios pueden marcar asistencia.")
        if inscripcion.evento.refugio != user.perfil_refugio:
            raise PermissionDenied("No puedes marcar asistencia en eventos de otro refugio.")
        
        asistio = request.data.get('asistio', True)
        inscripcion.estado = 'ASISTIO' if asistio else 'NO_ASISTIO'
        inscripcion.notas_refugio = request.data.get('notas', inscripcion.notas_refugio)
        inscripcion.save()
        
        return Response({
            'mensaje': f"Asistencia marcada: {'Asistió' if asistio else 'No asistió'}",
            'inscripcion': InscripcionVoluntariadoSerializer(inscripcion).data
        })
    
    @action(detail=False, methods=['get'])
    def mis_voluntariados(self, request):
        
        user = request.user
        
        if hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Esta acción es solo para adoptantes.")
        
        inscripciones = InscripcionVoluntariado.objects.filter(
            usuario=user
        ).select_related('evento', 'evento__refugio')
        
        estado = request.query_params.get('estado')
        if estado:
            inscripciones = inscripciones.filter(estado=estado)

        serializer = InscripcionVoluntariadoSerializer(inscripciones, many=True)

        return Response(serializer.data)


# =============================================================================
# DOCUMENTOS
# =============================================================================

class DocumentoViewSet(viewsets.ModelViewSet):
    
    serializer_class = DocumentoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['categoria', 'estado', 'tipo_archivo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['fecha_creacion', 'fecha_modificacion', 'nombre', 'descargas']
    ordering = ['-fecha_modificacion']

    def get_queryset(self):
        
        user = self.request.user

        if hasattr(user, 'perfil_refugio'):
            return Documento.objects.filter(
                refugio=user.perfil_refugio
            ).select_related('creado_por', 'refugio')

        
        return Documento.objects.none()

    def get_serializer_context(self):
        
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        
        user = self.request.user

        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo los refugios pueden crear documentos.")

        
        archivo = self.request.FILES.get('archivo')
        if not archivo:
            raise ValidationError("Debe proporcionar un archivo.")


        max_size = 150 * 1024 * 1024
        if archivo.size > max_size:
            raise ValidationError(f"El archivo es demasiado grande. Máximo permitido: 150MB")

        
        tipo_archivo = serializer.validated_data.get('tipo_archivo')
        extensiones_permitidas = {
            'PDF': ['.pdf'],
            'DOCX': ['.docx', '.doc'],
            'XLSX': ['.xlsx', '.xls'],
            'TXT': ['.txt'],
        }

        extension = archivo.name.lower().split('.')[-1]
        if tipo_archivo in extensiones_permitidas:
            extensiones = extensiones_permitidas[tipo_archivo]
            if not any(archivo.name.lower().endswith(ext) for ext in extensiones):
                raise ValidationError(
                    f"El archivo debe ser de tipo {tipo_archivo}. Extensiones permitidas: {', '.join(extensiones)}"
                )

        serializer.save(
            creado_por=user,
            refugio=user.perfil_refugio,
            tamano=archivo.size
        )

    @action(detail=True, methods=['post'])
    def descargar(self, request, pk=None):
        
        documento = self.get_object()

        
        documento.incrementar_descargas()

        
        return Response({
            'url': request.build_absolute_uri(documento.archivo.url),
            'nombre': documento.nombre,
            'tamano': documento.tamano,
            'tipo_archivo': documento.tipo_archivo
        })

    @action(detail=True, methods=['post'])
    def incrementar_uso(self, request, pk=None):
        
        documento = self.get_object()
        documento.incrementar_usos()

        return Response({
            'success': True,
            'usos': documento.usos
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        
        user = request.user

        if not hasattr(user, 'perfil_refugio'):
            raise PermissionDenied("Solo los refugios pueden ver estadísticas.")

        documentos = Documento.objects.filter(refugio=user.perfil_refugio)

        
        por_categoria = {}
        for categoria, _ in Documento.CATEGORIA_CHOICES:
            por_categoria[categoria] = documentos.filter(categoria=categoria).count()

        
        por_estado = {}
        for estado, _ in Documento.ESTADO_CHOICES:
            por_estado[estado] = documentos.filter(estado=estado).count()

        
        total = documentos.count()
        total_descargas = documentos.aggregate(Sum('descargas'))['descargas__sum'] or 0

        return Response({
            'total': total,
            'total_descargas': total_descargas,
            'por_categoria': por_categoria,
            'por_estado': por_estado,
            'documento_mas_descargado': DocumentoSerializer(
                documentos.order_by('-descargas').first(),
                context={'request': request}
            ).data if documentos.exists() else None
        })


# =============================================================================
# NOTIFICACIONES
# =============================================================================

class NotificacionViewSet(viewsets.ModelViewSet):
    
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        return Notificacion.objects.filter(
            usuario=self.request.user
        ).order_by('-fecha_creacion')

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        
        Notificacion.objects.filter(
            usuario=request.user,
            leida=False
        ).update(leida=True)
        return Response({'success': True})

    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        
        count = Notificacion.objects.filter(
            usuario=request.user,
            leida=False
        ).count()
        return Response({'count': count})


# =============================================================================
# FAVORITOS
# =============================================================================

class MascotaFavoritaViewSet(viewsets.ModelViewSet):
    
    serializer_class = MascotaFavoritaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        return MascotaFavorita.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        
        mascota_id = request.data.get('mascota_id')

        if not mascota_id:
            return Response(
                {'error': 'Se requiere mascota_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            mascota = Mascota.objects.get(id=mascota_id)
        except Mascota.DoesNotExist:
            return Response(
                {'error': 'Mascota no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        favorito, created = MascotaFavorita.objects.get_or_create(
            usuario=request.user,
            mascota=mascota
        )

        if not created:
            favorito.delete()
            return Response({'favorito': False, 'message': 'Eliminado de favoritos'})

        return Response({
            'favorito': True,
            'message': 'Agregado a favoritos',
            'id': favorito.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def verificar(self, request):
        
        mascota_id = request.query_params.get('mascota_id')

        if not mascota_id:
            return Response({'favorito': False})

        es_favorito = MascotaFavorita.objects.filter(
            usuario=request.user,
            mascota_id=mascota_id
        ).exists()

        return Response({'favorito': es_favorito})


class TipFavoritoViewSet(viewsets.ModelViewSet):
    
    serializer_class = TipFavoritoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        return TipFavorito.objects.filter(
            usuario=self.request.user
        ).select_related('tip', 'tip__refugio').order_by('-fecha_agregado')

    def get_serializer_context(self):
        
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        
        tip_id = request.data.get('tip_id')

        if not tip_id:
            return Response(
                {'error': 'Se requiere tip_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tip = Tip.objects.get(id=tip_id)
        except Tip.DoesNotExist:
            return Response(
                {'error': 'Tip no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        favorito, created = TipFavorito.objects.get_or_create(
            usuario=request.user,
            tip=tip
        )

        if not created:
            favorito.delete()
            return Response({'favorito': False, 'message': 'Eliminado de favoritos'})

        return Response({
            'favorito': True,
            'message': 'Agregado a favoritos',
            'id': favorito.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def verificar(self, request):
        
        tip_id = request.query_params.get('tip_id')

        if not tip_id:
            return Response({'favorito': False})

        es_favorito = TipFavorito.objects.filter(
            usuario=request.user,
            tip_id=tip_id
        ).exists()

        return Response({'favorito': es_favorito})


# =============================================================================
# INVENTARIO VIEWSET
# =============================================================================

class ItemInventarioViewSet(viewsets.ModelViewSet):
    
    serializer_class = ItemInventarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['categoria']
    search_fields = ['nombre', 'proveedor', 'ubicacion']
    ordering_fields = ['nombre', 'cantidad', 'fecha_vencimiento', 'precio_unitario']
    ordering = ['-fecha_actualizacion']

    def get_queryset(self):
        
        user = self.request.user

        
        if hasattr(user, 'perfil_refugio'):
            queryset = ItemInventario.objects.filter(refugio=user.perfil_refugio)
        else:
            
            queryset = ItemInventario.objects.none()

        
        bajo_stock = self.request.query_params.get('bajo_stock', None)
        if bajo_stock is not None and bajo_stock.lower() == 'true':
            queryset = [item for item in queryset if item.bajo_stock]
            queryset = ItemInventario.objects.filter(
                id__in=[item.id for item in queryset]
            )

        
        proximo_vencer = self.request.query_params.get('proximo_vencer', None)
        if proximo_vencer is not None and proximo_vencer.lower() == 'true':
            from datetime import date, timedelta
            fecha_limite = date.today() + timedelta(days=30)
            queryset = queryset.filter(
                fecha_vencimiento__isnull=False,
                fecha_vencimiento__lte=fecha_limite,
                fecha_vencimiento__gte=date.today()
            )

        return queryset

    def perform_create(self, serializer):
        
        if hasattr(self.request.user, 'perfil_refugio'):
            serializer.save(refugio=self.request.user.perfil_refugio)
        else:
            raise ValidationError(
                "Solo los refugios pueden crear items de inventario"
            )

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        
        queryset = self.get_queryset()

        
        total_items = queryset.count()
        items_bajo_stock = sum(1 for item in queryset if item.bajo_stock)

        
        from datetime import date, timedelta
        fecha_limite = date.today() + timedelta(days=30)
        items_proximo_vencer = queryset.filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=date.today()
        ).count()

        
        valor_total = sum(item.valor_total for item in queryset)

        return Response({
            'total_items': total_items,
            'items_bajo_stock': items_bajo_stock,
            'items_proximo_vencer': items_proximo_vencer,
            'valor_total_inventario': float(valor_total),
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):

        from datetime import date
        queryset = self.get_queryset().filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lt=date.today()
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)