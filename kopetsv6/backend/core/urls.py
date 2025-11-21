from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet,
    RefugioViewSet, RefugioPublicoViewSet,
    MascotaViewSet, MascotaPublicaViewSet,
    TipoAnimalViewSet, RazaViewSet, TipoVacunaViewSet, VacunaMascotaViewSet,
    CampanaViewSet,
    TipViewSet,
    SolicitudAdopcionViewSet, PerfilAdoptanteViewSet,  EventoVoluntariadoViewSet, InscripcionVoluntariadoViewSet,
    ResenaRefugioViewSet, AdopcionViewSet, VisitaSeguimientoViewSet, FotoVisitaViewSet,
    DocumentoViewSet, NotificacionViewSet, MascotaFavoritaViewSet, TipFavoritoViewSet, ItemInventarioViewSet
)

router = DefaultRouter()


router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'refugios', RefugioViewSet, basename='refugio')
router.register(r'refugios-publicos', RefugioPublicoViewSet, basename='refugio-publico')
router.register(r'mascotas', MascotaViewSet, basename='mascota')
router.register(r'mascotas-publicas', MascotaPublicaViewSet, basename='mascota-publica')
router.register(r'tipos-animales', TipoAnimalViewSet, basename='tipo-animal')
router.register(r'razas', RazaViewSet, basename='raza')
router.register(r'tipos-vacunas', TipoVacunaViewSet, basename='tipo-vacuna')
router.register(r'vacunas-mascotas', VacunaMascotaViewSet, basename='vacuna-mascota')
router.register(r'solicitudes-adopcion', SolicitudAdopcionViewSet, basename='solicitud-adopcion')
router.register(r'perfiles-adoptantes', PerfilAdoptanteViewSet, basename='perfil-adoptante')
router.register(r'campanas', CampanaViewSet, basename='campana')
router.register(r'tips', TipViewSet, basename='tip')
router.register(r'resenas-refugios', ResenaRefugioViewSet, basename='resena-refugio')
router.register(r'adopciones', AdopcionViewSet, basename='adopcion')
router.register(r'visitas-seguimiento', VisitaSeguimientoViewSet, basename='visita-seguimiento')
router.register(r'fotos-visitas', FotoVisitaViewSet, basename='foto-visita')
router.register(r'eventos-voluntariado', EventoVoluntariadoViewSet, basename='evento-voluntariado')
router.register(r'inscripciones-voluntariado', InscripcionVoluntariadoViewSet, basename='inscripcion-voluntariado')
router.register(r'documentos', DocumentoViewSet, basename='documento')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'mascotas-favoritas', MascotaFavoritaViewSet, basename='mascota-favorita')
router.register(r'tips-favoritos', TipFavoritoViewSet, basename='tip-favorito')
router.register(r'inventario', ItemInventarioViewSet, basename='inventario')

urlpatterns = [
    path('', include(router.urls)),
]