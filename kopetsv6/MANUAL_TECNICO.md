# Manual Técnico - Kokoropets

## Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [API Backend](#api-backend)
7. [Frontend](#frontend)
8. [Autenticación y Seguridad](#autenticación-y-seguridad)
9. [Configuración y Despliegue](#configuración-y-despliegue)
10. [Mantenimiento](#mantenimiento)

---

## Introducción

### Descripción del Sistema
Kokoropets es una plataforma web integral para la gestión de adopciones de mascotas que conecta fundaciones de protección animal con potenciales adoptantes. El sistema facilita todo el proceso de adopción, desde la publicación de mascotas disponibles hasta el seguimiento post-adopción.

### Objetivo
Proporcionar una solución completa y profesional para:
- Gestionar el catálogo de mascotas disponibles para adopción
- Facilitar la comunicación entre fundaciones y adoptantes
- Automatizar el proceso de solicitudes de adopción
- Realizar seguimiento del bienestar de las mascotas adoptadas
- Organizar campañas y eventos de las fundaciones

### Alcance
- **Usuarios**: Adoptantes, Fundaciones, Administradores
- **Funcionalidades principales**: Gestión de mascotas, solicitudes de adopción, seguimiento, campañas, inventario
- **Plataformas**: Web responsive

---

## Arquitectura del Sistema

### Arquitectura General
El sistema sigue una arquitectura cliente-servidor con separación clara entre frontend y backend:

```
┌─────────────────┐
│   React App     │ (Frontend - Puerto 5173)
│   (Vite + TS)   │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Django REST    │ (Backend - Puerto 8000)
│   Framework     │
└────────┬────────┘
         │
┌────────▼────────┐
│     MySQL       │ (Base de Datos)
│   Database      │
└─────────────────┘
```

### Componentes Principales

#### Frontend (Cliente)
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Gestión de Estado**: React Hooks (useState, useEffect, useContext)
- **Routing**: React Router v6
- **HTTP Client**: Axios + Fetch API

#### Backend (Servidor)
- **Framework**: Django 5.1.4
- **API**: Django REST Framework 3.15.2
- **Autenticación**: JWT (Simple JWT)
- **Base de Datos**: MySQL
- **ORM**: Django ORM
- **CORS**: django-cors-headers

---

## Tecnologías Utilizadas

### Backend
```
Python 3.13
Django 5.1.4
djangorestframework 3.15.2
djangorestframework-simplejwt 5.4.0
django-cors-headers 4.6.0
PyMySQL 1.1.1
Pillow 11.0.0 (procesamiento de imágenes)
```

### Frontend
```
React 18.3.1
TypeScript 5.6.2
Vite 6.0.1
Axios 1.7.9
React Router DOM 7.1.1
Tailwind CSS 3.4.17
shadcn/ui components
Motion (framer-motion) 11.15.0
Lucide React (iconos)
Recharts 2.15.0 (gráficos)
Sonner (notificaciones)
```

### Herramientas de Desarrollo
- **Control de Versiones**: Git
- **Editor**: VS Code (recomendado)
- **Testing**: Jest (configurado pero no implementado completamente)

---

## Estructura del Proyecto

### Estructura del Backend

```
backend/
├── config/                 # Configuración del proyecto Django
│   ├── settings.py        # Configuración principal
│   ├── urls.py            # URLs raíz
│   ├── wsgi.py            # WSGI para despliegue
│   └── asgi.py            # ASGI para despliegue
│
├── core/                  # Aplicación principal
│   ├── models.py          # Modelos de la base de datos
│   ├── serializers.py     # Serializadores DRF
│   ├── views.py           # Vistas/Endpoints de la API
│   ├── urls.py            # URLs de la aplicación
│   ├── permissions.py     # Permisos personalizados
│   ├── signals.py         # Señales de Django
│   ├── admin.py           # Configuración del admin
│   ├── apps.py            # Configuración de la app
│   └── migrations/        # Migraciones de base de datos
│
├── media/                 # Archivos subidos (imágenes)
│   ├── mascotas/
│   ├── refugios/
│   ├── documentos/
│   ├── tips/
│   └── campanas/
│
└── manage.py              # CLI de Django
```

### Estructura del Frontend

```
kopetsv6/
├── src/
│   ├── components/             # Componentes React
│   │   ├── ui/                # Componentes UI base (shadcn)
│   │   ├── usuario/           # Componentes para adoptantes
│   │   │   ├── AdopcionesUsuario.tsx
│   │   │   ├── CampanasUsuario.tsx
│   │   │   ├── PerfilUsuario.tsx
│   │   │   └── SolicitudesUsuario.tsx
│   │   ├── Mascotas.tsx       # Gestión de mascotas (fundación)
│   │   ├── Solicitudes.tsx    # Gestión de solicitudes (fundación)
│   │   ├── Seguimiento.tsx    # Seguimiento post-adopción
│   │   ├── Campanas.tsx       # Gestión de campañas
│   │   ├── Inventario.tsx     # Gestión de inventario
│   │   ├── Documentos.tsx     # Gestión de documentos
│   │   ├── Dashboard.tsx      # Panel principal
│   │   ├── DashboardLayout.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   │
│   ├── services/              # Servicios y lógica de negocio
│   │   ├── api.ts            # Cliente API y endpoints
│   │   └── tokenService.ts   # Gestión de tokens JWT
│   │
│   ├── lib/                   # Utilidades
│   │   └── utils.ts
│   │
│   ├── App.tsx               # Componente raíz
│   ├── main.tsx              # Punto de entrada
│   ├── index.css             # Estilos globales
│   └── vite-env.d.ts         # Tipos TypeScript
│
├── public/                    # Archivos estáticos
├── index.html                # HTML base
├── package.json              # Dependencias npm
├── tsconfig.json             # Configuración TypeScript
├── vite.config.ts            # Configuración Vite
└── tailwind.config.js        # Configuración Tailwind
```

---



### Modelos Principales

#### 1. **CustomUser** (Usuario del Sistema)
```python
- id: AutoField
- email: EmailField (único, usado para login)
- password: CharField (hasheado)
- first_name: CharField
- last_name: CharField
- foto_perfil: ImageField (opcional)
- tipo_usuario: CharField (choices: ADOPTANTE, REFUGIO, ADMINISTRADOR)
- fecha_registro: DateTimeField (auto)
- is_active: BooleanField
- is_staff: BooleanField
```

**Relaciones:**
- 1:1 con Refugio (si tipo_usuario='REFUGIO')
- 1:1 con PerfilAdoptante (si tipo_usuario='ADOPTANTE')
- 1:N con TwoFactorCode (códigos 2FA)

#### 2. **Refugio** (Fundación)
```python
- id: AutoField
- usuario: OneToOneField(CustomUser)
- nombre: CharField
- descripcion: TextField
- logo: ImageField
- portada: ImageField
- ciudad: CharField
- region: CharField
- direccion: CharField
- telefono: CharField
- email_contacto: EmailField
- whatsapp: CharField
- sitio_web: URLField
```

**Relaciones:**
- 1:N con Mascota
- 1:N con Campana
- 1:N con EventoVoluntariado
- 1:N con ItemInventario
- 1:N con Documento

#### 3. **Mascota**
```python
- id: AutoField
- refugio: ForeignKey(Refugio)
- nombre: CharField
- tipo_animal: ForeignKey(TipoAnimal)
- raza: ForeignKey(Raza, null=True)
- edad: CharField (choices: CACHORRO, JOVEN, ADULTO, SENIOR)
- sexo: CharField (choices: MACHO, HEMBRA)
- esterilizado: BooleanField
- desparasitado: BooleanField
- microchip: BooleanField
- descripcion: TextField
- necesidades_especiales: TextField
- estado: CharField (choices: DISPONIBLE, RESERVADO, ADOPTADO, BORRADOR)
- tamano: CharField (choices: PEQUENO, MEDIANO, GRANDE, GIGANTE)
- color: CharField
- nivel_energia: CharField (choices: BAJA, MEDIA, ALTA)
- nivel_cuidado: CharField (choices: BAJO, MEDIO, ALTO)
- apto_ninos: BooleanField
- apto_apartamento: BooleanField
- sociable_perros: BooleanField
- sociable_gatos: BooleanField
- foto_principal: ImageField
- foto_2: ImageField
- foto_3: ImageField
- fecha_ingreso: DateField
```

**Relaciones:**
- N:1 con Refugio
- N:1 con TipoAnimal
- N:1 con Raza (opcional)
- 1:N con VacunaMascota
- 1:N con SolicitudAdopcion
- 1:1 con Adopcion
- 1:N con VisitaSeguimiento
- 1:N con MascotaFavorita

#### 4. **SolicitudAdopcion**
```python
- id: AutoField
- mascota: ForeignKey(Mascota)
- adoptante: ForeignKey(CustomUser)
- mensaje: TextField
- estado: CharField (choices: PENDIENTE, APROBADA, RECHAZADA, COMPLETADA)
- fecha_solicitud: DateTimeField (auto)
- fecha_respuesta: DateTimeField (null=True)
- respuesta_refugio: TextField
```

#### 5. **Adopcion**
```python
- id: AutoField
- mascota: OneToOneField(Mascota)
- adoptante: ForeignKey(CustomUser)
- refugio: ForeignKey(Refugio)
- fecha_adopcion: DateField
- seguimiento_activo: BooleanField
- strikes: IntegerField
- max_strikes: IntegerField
- puede_agregar_strike: BooleanField
- puede_quitar_strike: BooleanField
- puede_finalizar: BooleanField
```

**Relaciones:**
- 1:1 con Mascota
- N:1 con Usuario (adoptante)
- N:1 con Refugio
- 1:N con VisitaSeguimiento

#### 6. **VisitaSeguimiento**
```python
- id: AutoField
- adopcion: ForeignKey(Adopcion)
- fecha_visita: DateField
- observaciones: TextField
- estado_mascota: CharField (choices: EXCELENTE, BUENO, REGULAR, MALO)
- peso_actual: DecimalField
- fotos: ImageField (múltiples)
- recomendaciones: TextField
- es_strike: BooleanField
```

#### 7. **Campana**
```python
- id: AutoField
- refugio: ForeignKey(Refugio)
- titulo: CharField
- descripcion: TextField
- imagen: ImageField
- fecha_inicio: DateField
- fecha_fin: DateField
- tipo: CharField (choices: DONACION, VOLUNTARIADO, EVENTO, EDUCACION)
- objetivo_donacion: DecimalField
- donacion_actual: DecimalField
- activa: BooleanField
```

#### 8. **ItemInventario**
```python
- id: AutoField
- refugio: ForeignKey(Refugio)
- nombre: CharField
- categoria: CharField (choices: ALIMENTO, MEDICINA, ACCESORIOS, LIMPIEZA, OTROS)
- cantidad_actual: IntegerField
- unidad_medida: CharField (choices: UNIDADES, KG, LITROS, CAJAS)
- stock_minimo: IntegerField
- ultima_actualizacion: DateTimeField
- notas: TextField
```

### Índices de Base de Datos

```sql
-- Índices de rendimiento
CREATE INDEX idx_mascota_estado ON core_mascota(estado);
CREATE INDEX idx_mascota_refugio ON core_mascota(refugio_id);
CREATE INDEX idx_adopcion_estado ON core_adopcion(seguimiento_activo);
CREATE INDEX idx_solicitud_estado ON core_solicitudadopcion(estado);
```

---

## API Backend

### Configuración Base

**URL Base**: `http://localhost:8000/api/`

**Formato de Respuesta**: JSON

**Autenticación**: JWT Bearer Token

### Headers Comunes
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Endpoints Principales

#### 1. Autenticación

##### POST `/api/auth/registro/`
Registra un nuevo usuario (adoptante o fundación).

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "password2": "contraseña123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "tipo_usuario": "ADOPTANTE"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Código de verificación enviado",
  "user_id": 1,
  "requiere_verificacion": false
}
```

##### POST `/api/auth/login/`
Inicia sesión con email y contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Código enviado a tu email",
  "user_id": 1,
  "tipo_usuario": "ADOPTANTE"
}
```

##### POST `/api/auth/verificar-codigo/`
Verifica el código 2FA y obtiene tokens.

**Request:**
```json
{
  "user_id": 1,
  "codigo": "123456"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "tipo_usuario": "ADOPTANTE",
    "foto_perfil": null
  }
}
```

##### POST `/api/auth/refresh/`
Renueva el access token usando el refresh token.

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 2. Mascotas

##### GET `/api/mascotas/`
Lista las mascotas de la fundación autenticada.

**Requiere**: Autenticación (tipo_usuario='REFUGIO')

**Response (200 OK):**
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "nombre": "Max",
      "tipo_animal": 1,
      "tipo_animal_nombre": "Perro",
      "raza": 5,
      "raza_nombre": "Labrador",
      "edad": "JOVEN",
      "sexo": "MACHO",
      "esterilizado": true,
      "desparasitado": true,
      "microchip": false,
      "descripcion": "Perro muy amigable y juguetón",
      "estado": "DISPONIBLE",
      "tamano": "GRANDE",
      "color": "Dorado",
      "nivel_energia": "ALTA",
      "foto_principal": "/media/mascotas/max.jpg",
      "vacunas_aplicadas": [
        {
          "id": 1,
          "tipo_vacuna": 1,
          "tipo_vacuna_nombre": "Rabia",
          "fecha_aplicacion": "2025-01-15"
        }
      ],
      "refugio_nombre": "Fundación Patitas Felices"
    }
  ]
}
```

##### POST `/api/mascotas/`
Crea una nueva mascota.

**Requiere**: Autenticación (tipo_usuario='REFUGIO')

**Request (multipart/form-data):**
```json
{
  "nombre": "Luna",
  "tipo_animal": 2,
  "raza": 8,
  "edad": "CACHORRO",
  "sexo": "HEMBRA",
  "esterilizado": false,
  "desparasitado": true,
  "microchip": false,
  "descripcion": "Gatita muy tierna",
  "estado": "DISPONIBLE",
  "tamano": "PEQUENO",
  "color": "Blanco",
  "nivel_energia": "MEDIA",
  "foto_principal": <File>
}
```

##### PUT/PATCH `/api/mascotas/{id}/`
Actualiza una mascota existente.

##### DELETE `/api/mascotas/{id}/`
Elimina una mascota.

##### POST `/api/mascotas/{id}/publicar/`
Cambia el estado de una mascota de BORRADOR a DISPONIBLE.

#### 3. Mascotas Públicas

##### GET `/api/mascotas-publicas/`
Lista todas las mascotas disponibles (sin autenticación).

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "nombre": "Max",
    "tipo_animal_nombre": "Perro",
    "raza_nombre": "Labrador",
    "edad": "JOVEN",
    "sexo": "MACHO",
    "descripcion": "Perro muy amigable",
    "foto_principal": "/media/mascotas/max.jpg",
    "refugio_nombre": "Fundación Patitas Felices",
    "refugio_ciudad": "Santiago",
    "refugio_region": "Metropolitana",
    "whatsapp": "+56912345678",
    "vacunas_aplicadas": [...]
  }
]
```

#### 4. Solicitudes de Adopción

##### GET `/api/solicitudes-adopcion/`
Lista las solicitudes según el tipo de usuario.
- Fundación: Ve solicitudes de sus mascotas
- Adoptante: Ve sus propias solicitudes

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "mascota": {
        "id": 1,
        "nombre": "Max",
        "foto_principal": "/media/mascotas/max.jpg"
      },
      "adoptante_nombre": "Juan Pérez",
      "adoptante_email": "juan@ejemplo.com",
      "mensaje": "Me encantaría adoptar a Max",
      "estado": "PENDIENTE",
      "fecha_solicitud": "2025-11-20T10:30:00Z"
    }
  ]
}
```

##### POST `/api/solicitudes-adopcion/`
Crea una nueva solicitud de adopción.

**Request:**
```json
{
  "mascota": 1,
  "mensaje": "Me encantaría adoptar a Max. Tengo experiencia con perros grandes."
}
```

##### POST `/api/solicitudes-adopcion/{id}/aprobar/`
Aprueba una solicitud de adopción (solo fundación).

**Request:**
```json
{
  "respuesta": "¡Excelente! Agenda una visita."
}
```

##### POST `/api/solicitudes-adopcion/{id}/rechazar/`
Rechaza una solicitud de adopción (solo fundación).

**Request:**
```json
{
  "respuesta": "Lamentablemente no cumples los requisitos."
}
```

##### POST `/api/solicitudes-adopcion/{id}/completar/`
Completa una adopción (solo fundación).

**Request:**
```json
{
  "fecha_adopcion": "2025-11-25"
}
```

**Response (201 Created):**
```json
{
  "adopcion_id": 1,
  "message": "Adopción registrada exitosamente"
}
```

#### 5. Adopciones y Seguimiento

##### GET `/api/adopciones/`
Lista las adopciones según el tipo de usuario.

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "mascota_nombre": "Max",
      "mascota_foto": "/media/mascotas/max.jpg",
      "adoptante_nombre": "Juan Pérez",
      "fecha_adopcion": "2025-11-20",
      "seguimiento_activo": true,
      "strikes": 0,
      "max_strikes": 3,
      "puede_agregar_strike": true,
      "puede_quitar_strike": false,
      "puede_finalizar": true,
      "visitas": [
        {
          "id": 1,
          "fecha_visita": "2025-11-25",
          "estado_mascota": "EXCELENTE",
          "observaciones": "La mascota está muy bien adaptada"
        }
      ]
    }
  ]
}
```

##### POST `/api/adopciones/{id}/agregar-strike/`
Agrega un strike a una adopción (solo fundación).

**Request:**
```json
{
  "observaciones": "No se encontró la mascota en el domicilio"
}
```

##### POST `/api/adopciones/{id}/quitar-strike/`
Quita un strike de una adopción (solo fundación).

##### POST `/api/adopciones/{id}/finalizar/`
Finaliza el seguimiento de una adopción (solo fundación).

#### 6. Visitas de Seguimiento

##### POST `/api/visitas-seguimiento/`
Crea una nueva visita de seguimiento (solo fundación).

**Request (multipart/form-data):**
```json
{
  "adopcion": 1,
  "fecha_visita": "2025-11-25",
  "observaciones": "La mascota está muy bien",
  "estado_mascota": "EXCELENTE",
  "peso_actual": "25.5",
  "foto_1": <File>,
  "foto_2": <File>
}
```

#### 7. Campañas

##### GET `/api/campanas/`
Lista las campañas de la fundación autenticada.

##### POST `/api/campanas/`
Crea una nueva campaña.

##### PUT/PATCH `/api/campanas/{id}/`
Actualiza una campaña.

##### DELETE `/api/campanas/{id}/`
Elimina una campaña.

#### 8. Inventario

##### GET `/api/inventario/`
Lista los items del inventario de la fundación.

##### POST `/api/inventario/`
Crea un nuevo item de inventario.

##### PUT/PATCH `/api/inventario/{id}/`
Actualiza un item de inventario.

##### DELETE `/api/inventario/{id}/`
Elimina un item de inventario.

### Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Operación exitosa sin contenido de respuesta
- **400 Bad Request**: Datos inválidos en la solicitud
- **401 Unauthorized**: No autenticado o token inválido
- **403 Forbidden**: No tiene permisos para esta acción
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Frontend

### Arquitectura de Componentes

#### Sistema de Rutas

```tsx
// App.tsx
<Routes>
  {/* Rutas públicas */}
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/verificar-2fa" element={<LoginDobleFactor />} />

  {/* Rutas protegidas - Fundación */}
  <Route path="/fundacion/*" element={<ProtectedRoute tipoUsuario="REFUGIO">
    <DashboardLayout>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="mascotas" element={<Mascotas />} />
      <Route path="solicitudes" element={<Solicitudes />} />
      <Route path="seguimiento" element={<Seguimiento />} />
      <Route path="campanas" element={<Campanas />} />
      <Route path="inventario" element={<Inventario />} />
      <Route path="documentos" element={<Documentos />} />
      <Route path="perfil" element={<PerfilRefugio />} />
    </DashboardLayout>
  </ProtectedRoute>} />

  {/* Rutas protegidas - Adoptante */}
  <Route path="/usuario/*" element={<ProtectedRoute tipoUsuario="ADOPTANTE">
    <DashboardLayoutUsuario>
      <Route path="adopciones" element={<AdopcionesUsuario />} />
      <Route path="solicitudes" element={<SolicitudesUsuario />} />
      <Route path="campanas" element={<CampanasUsuario />} />
      <Route path="perfil" element={<PerfilUsuario />} />
    </DashboardLayoutUsuario>
  </ProtectedRoute>} />
</Routes>
```

### Gestión de Estado

#### AuthContext (Autenticación)
```tsx
interface AuthContextType {
  user: User | null;
  login: (access: string, refresh: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
```

#### TokenService (Multi-sesión)
```tsx
// Permite múltiples sesiones activas por tipo de usuario
setSession(access: string, refresh: string, user: User): void
getSession(tipoUsuario: string): Session | null
clearSession(tipoUsuario: string): void
```

### Servicios API (Frontend)

```typescript
// src/services/api.ts

// Cliente Axios configurado
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Servicios exportados
export const authService = {
  login: (data) => { ... },
  registro: (data) => { ... },
  verificarCodigo: (data) => { ... },
};

export const mascotaService = {
  listar: () => { ... },
  crear: (data) => { ... },
  actualizar: (id, data) => { ... },
  eliminar: (id) => { ... },
  publicar: (id) => { ... },
};

export const solicitudAdopcionService = {
  listar: () => { ... },
  crear: (data) => { ... },
  aprobar: (id, data) => { ... },
  rechazar: (id, data) => { ... },
  completar: (id, data) => { ... },
};
```

### Componentes UI Reutilizables

El proyecto utiliza **shadcn/ui**, una colección de componentes construidos con Radix UI y Tailwind CSS:

```tsx
// Componentes disponibles
- Button
- Card
- Dialog
- Input
- Select
- Textarea
- Badge
- Tabs
- Accordion
- Checkbox
- Switch
- ScrollArea
- Separator
- Avatar
- Progress
```

## Autenticación y Seguridad

### Flujo de Autenticación

```
1. Usuario ingresa email y contraseña
   ↓
2. Backend valida credenciales
   ↓
3. Backend genera código 2FA de 6 dígitos
   ↓
4. Backend envía código por email (Gmail SMTP)
   ↓
5. Usuario ingresa código en frontend
   ↓
6. Backend valida código (válido por 10 minutos)
   ↓
7. Backend genera tokens JWT (access + refresh)
   ↓
8. Frontend almacena tokens en localStorage
   ↓
9. Frontend incluye access token en cada request
```

### JWT (JSON Web Tokens)

#### Configuración
```python

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

#### Estructura del Token
```json
{
  "token_type": "access",
  "exp": 1732116000,
  "iat": 1732112400,
  "jti": "abc123",
  "user_id": 1,
  "tipo_usuario": "ADOPTANTE"
}
```

### Autenticación 2FA

#### Modelo TwoFactorCode
```python
class TwoFactorCode(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    code_hash = models.CharField(max_length=256)
    salt = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @staticmethod
    def generar_codigo(user):
        
        codigo = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        
        salt = secrets.token_hex(32)
        codigo_hash = hashlib.sha256((codigo + salt).encode()).hexdigest()

        
        send_mail(...)

        return codigo
```

### Permisos Personalizados

```python
# permissions.py

class IsRefugio(BasePermission):
    """Solo permite acceso a usuarios tipo REFUGIO"""
    def has_permission(self, request, view):
        return request.user.tipo_usuario == 'REFUGIO'

class IsAdoptante(BasePermission):
    """Solo permite acceso a usuarios tipo ADOPTANTE"""
    def has_permission(self, request, view):
        return request.user.tipo_usuario == 'ADOPTANTE'

class IsOwnerOrRefugio(BasePermission):
    """Permite acceso al dueño del objeto o a refugios"""
    def has_object_permission(self, request, view, obj):
        if request.user.tipo_usuario == 'REFUGIO':
            return obj.refugio.usuario == request.user
        return obj.adoptante == request.user
```

### CORS (Cross-Origin Resource Sharing)

```python

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  
    'http://127.0.0.1:5173',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'x-csrftoken',
]
```

### Seguridad de Contraseñas

- Hasheado con **PBKDF2** (configuración por defecto de Django)
- Mínimo 8 caracteres
- Validaciones de complejidad

---

## Configuración y Despliegue

### Requisitos del Sistema

#### Servidor
- **Sistema Operativo**: Ubuntu 20.04+ / Windows 10+ / macOS 10.15+
- **RAM**: 2GB mínimo (4GB recomendado)
- **Espacio en Disco**: 10GB mínimo
- **Procesador**: Dual-core 2GHz+

#### Software
- **Python**: 3.13+
- **Node.js**: 18+
- **MySQL**: 8.0+
- **Git**: 2.30+


#### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE kopets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kopets_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON kopets.* TO 'kopets_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Configurar variables de entorno
# Crear archivo .env
DATABASE_NAME=kopets
DATABASE_USER=kopets_user
DATABASE_PASSWORD=password
DATABASE_HOST=localhost
DATABASE_PORT=3306
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

#### 3. Configurar Frontend

```bash
cd kopetsv6

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

#### Backend (.env)
```env
# Base de datos
DATABASE_NAME=kopets
DATABASE_USER=kopets_user
DATABASE_PASSWORD=password_seguro
DATABASE_HOST=localhost
DATABASE_PORT=3306

# Django
SECRET_KEY=django-insecure-clave-super-secreta-cambiar-en-produccion
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,tu-dominio.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=soporte@tudominio.com
EMAIL_HOST_PASSWORD=tu-app-password
DEFAULT_FROM_EMAIL=Kokoropets <soporte@tudominio.com>

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://tu-dominio.com
```




## Mantenimiento

### Tareas Periódicas

#### Limpieza de Códigos 2FA Expirados
```python
# management/commands/limpiar_codigos_2fa.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import TwoFactorCode

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        expired = TwoFactorCode.objects.filter(expires_at__lt=timezone.now())
        count = expired.count()
        expired.delete()
        self.stdout.write(f'Eliminados {count} códigos expirados')
```

Ejecutar:
```bash
python manage.py limpiar_codigos_2fa
```

#### Backup de Base de Datos
```bash
# Backup
mysqldump -u kopets_user -p kopets > backup_$(date +%Y%m%d).sql

# Restaurar
mysql -u kopets_user -p kopets < backup_20251120.sql
```

#### Backup de Archivos Media
```bash
tar -czf media_backup_$(date +%Y%m%d).tar.gz backend/media/
```

### Monitoreo

#### Logs de Django
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/kopets/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

#### Métricas Importantes
- Tasa de adopciones completadas
- Tiempo promedio de respuesta a solicitudes
- Mascotas publicadas vs adoptadas
- Strikes promedio en seguimientos
- Uso de almacenamiento en media/




## Contacto y Soporte

Para soporte técnico o consultas sobre la implementación:

- **Email**: soporte@kokoropets.com
- **Documentación**: Este manual técnico

---

**Versión del Documento**: 1.0
**Fecha**: Noviembre 2025
**Autor**: Equipo de Desarrollo Kokoropets
