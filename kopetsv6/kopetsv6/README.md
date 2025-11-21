# 🐾 KokoroPets

## 📋 Descripción

KokoroPets es una solución tecnológica diseñada para optimizar los procesos de adopción de mascotas, conectando refugios y fundaciones con potenciales adoptantes. La plataforma centraliza la gestión de adopciones, seguimiento post-adopción, coordinación de voluntariados y campañas de bienestar animal.

### Características principales

- **Gestión de usuarios**: Registro con roles diferenciados (Adoptante, Refugio/Fundación)
- **Autenticación segura**: JWT con 2FA mediante verificación hash
- **Gestión de mascotas**: CRUD completo con filtros avanzados por tamaño, color y rasgos conductuales
- **Solicitudes de adopción**: Flujo completo con creación automática de perfiles de adoptante
- **Seguimiento post-adopción**: Monitoreo de 30 días con visitas programadas, gestión de strikes y documentación fotográfica
- **Voluntariado**: Gestión de eventos y seguimiento de participación
- **Campañas**: Creación y difusión de eventos de adopción, vacunación y esterilización
- **Tips de cuidado**: Contenido educativo para adoptantes

---

## Arquitectura

El proyecto implementa una **arquitectura en N-capas** con separación clara de responsabilidades:

```
┌─────────────────────────────────────┐
│     Capa de Presentación            │
│     (React + TypeScript + Vite)     │
└─────────────────┬───────────────────┘
                  │ HTTPS/REST
┌─────────────────▼───────────────────┐
│     Capa de Aplicación              │
│     (Django REST Framework)         │
│     - ViewSets                      │
│     - Serializers                   │
│     - Permissions                   │
└─────────────────┬───────────────────┘
                  │ ORM
┌─────────────────▼───────────────────┐
│     Capa de Dominio                 │
│     (Models Django)                 │
│     - CustomUser                    │
│     - Refugio, Mascota              │
│     - Adopcion, Seguimiento         │
└─────────────────┬───────────────────┘
                  │ SQL
┌─────────────────▼───────────────────┐
│     Capa de Datos                   │
│     (MySQL)                         │
└─────────────────────────────────────┘
```

---

## Estructura del Proyecto

```
KOPETS/
├── backend/                    # API REST Django
│   ├── config/                 # Configuración del proyecto
│   │   ├── settings.py         # Configuración principal
│   │   ├── urls.py             # URLs raíz
│   │   └── wsgi.py             # Configuración WSGI
│   ├── core/                   # Aplicación principal
│   │   ├── migrations/         # Migraciones de base de datos
│   │   ├── models.py           # Modelos de datos
│   │   ├── serializers.py      # Serializadores DRF
│   │   ├── views.py            # ViewSets y vistas
│   │   ├── urls.py             # Rutas de la API
│   │   ├── permissions.py      # Permisos personalizados
│   │   ├── signals.py          # Señales Django
│   │   ├── admin.py            # Configuración admin
│   │   └── tests.py            # Pruebas unitarias
│   ├── media/                  # Archivos subidos
│   └── manage.py               # CLI Django
│
├── kopetsv6/                   # Frontend React
│   ├── src/                    # Código fuente
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Páginas/vistas
│   │   ├── services/           # Servicios API
│   │   ├── hooks/              # Custom hooks
│   │   ├── types/              # Definiciones TypeScript
│   │   └── utils/              # Utilidades
│   ├── public/                 # Archivos estáticos
│   ├── package.json            # Dependencias npm
│   ├── vite.config.ts          # Configuración Vite
│   └── tsconfig.json           # Configuración TypeScript
│
└── README.md                   # Este archivo
```

---

## 🛠️ Tecnologías

### Backend
- **Python 3.11+**
- **Django 5.x** - Framework web
- **Django REST Framework** - API REST
- **Simple JWT** - Autenticación JWT
- **MySQL 8.x** - Base de datos relacional
- **Pillow** - Procesamiento de imágenes

### Frontend
- **React 18.x** - Biblioteca UI
- **TypeScript 5.x** - Tipado estático
- **Vite** - Build tool
- **shadcn/ui** - Componentes UI
- **Sonner** - Notificaciones toast
- **Axios** - Cliente HTTP

---

## ⚙️ Instalación

### Prerrequisitos

- Python 3.11 o superior
- Node.js 18 o superior
- MySQL 8.x
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/kokoropets.git
cd kokoropets
```

### 2. Configurar el Backend

```bash
# Crear entorno virtual
cd backend
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor de desarrollo
python manage.py runserver
```

### 3. Configurar el Frontend

```bash
# En otra terminal
cd kopetsv6

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Acceder a la aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/

---

## Variables de Entorno

### Backend (.env)

```env
# Base de datos
DB_NAME=kokoropets_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=3306

# Django
SECRET_KEY=tu-secret-key-segura
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_SECRET_KEY=tu-jwt-secret
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Documentación de la API

### Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Registro de usuarios |
| POST | `/api/auth/login/` | Inicio de sesión |
| POST | `/api/auth/verify-2fa/` | Verificación 2FA |
| GET | `/api/refugios/` | Listar refugios |
| POST | `/api/refugios/` | Crear refugio |
| GET | `/api/mascotas/` | Listar mascotas |
| POST | `/api/mascotas/` | Crear mascota |
| GET | `/api/adopciones/` | Listar adopciones |
| POST | `/api/solicitudes/` | Crear solicitud de adopción |
| GET | `/api/seguimientos/` | Listar seguimientos |
| GET | `/api/campanas/` | Listar campañas |
| GET | `/api/tips/` | Listar tips de cuidado |

### Autenticación

La API utiliza JWT (JSON Web Tokens). Incluir el token en el header:

```
Authorization: Bearer <access_token>
```

---

## Pruebas

### Backend

```bash
cd backend
python manage.py test
```

### Frontend

```bash
cd kopetsv6
npm run test
```

---

## Modelo de Datos

### Entidades principales

- **CustomUser**: Usuario base con roles (ADOPTANTE, REFUGIO)
- **Refugio**: Fundaciones y refugios de animales
- **Mascota**: Animales disponibles para adopción
- **Adoptante**: Perfil extendido del adoptante
- **SolicitudAdopcion**: Solicitudes de adopción
- **Adopcion**: Adopciones confirmadas
- **Seguimiento**: Visitas post-adopción
- **Campana**: Eventos y campañas
- **Voluntario**: Participantes en eventos
- **Tip**: Consejos de cuidado animal

---

## Seguridad

- Autenticación JWT con tokens de acceso y refresco
- Verificación en dos pasos (2FA) con hash seguro
- Validación de fortaleza de contraseñas
- Transacciones atómicas en operaciones críticas
- Protección CSRF en formularios
- Sanitización de entradas
- Permisos basados en roles (RBAC)

---

## Equipo de Desarrollo

| Rol | Integrante |
|-----|------------|
| Gerente de Proyecto | Iván Saldívar Cortés |
| Analista de Requerimientos | Alexandra Torres Rojas |
| Arquitecto/Desarrollador | José Pérez Pérez |

---

## Licencia

Este proyecto fue desarrollado como Proyecto de Título para la carrera de Ingeniería en Informática en INACAP.

---
