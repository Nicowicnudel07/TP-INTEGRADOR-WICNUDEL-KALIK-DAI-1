# API de Eventos

API REST para gestión de eventos con autenticación JWT, desarrollada con Node.js, Express y PostgreSQL.

## Características

- ✅ Autenticación JWT
- ✅ CRUD completo de eventos
- ✅ Gestión de ubicaciones de eventos
- ✅ Inscripciones a eventos
- ✅ Búsqueda y filtrado de eventos
- ✅ Paginación
- ✅ Validaciones de negocio

## Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd api-eventos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/eventos_db
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui
PORT=3000
```

4. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb eventos_db

# Ejecutar script de creación de tablas
psql -d eventos_db -f database.sql
```

5. **Ejecutar la aplicación**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Endpoints

### Autenticación
- `POST /api/user/register` - Registro de usuario
- `POST /api/user/login` - Login de usuario

### Eventos
- `GET /api/event/` - Listar eventos (con filtros y paginación)
- `GET /api/event/:id` - Detalle de evento
- `POST /api/event/` - Crear evento (requiere autenticación)
- `PUT /api/event/` - Actualizar evento (requiere autenticación)
- `DELETE /api/event/:id` - Eliminar evento (requiere autenticación)
- `POST /api/event/:id/enrollment` - Inscribirse a evento (requiere autenticación)
- `DELETE /api/event/:id/enrollment` - Desinscribirse de evento (requiere autenticación)
- `GET /api/event/:id/participants` - Listar participantes de evento

### Ubicaciones de Eventos
- `GET /api/event-location/` - Listar ubicaciones del usuario (requiere autenticación)
- `GET /api/event-location/:id` - Detalle de ubicación (requiere autenticación)
- `POST /api/event-location/` - Crear ubicación (requiere autenticación)
- `PUT /api/event-location/:id` - Actualizar ubicación (requiere autenticación)
- `DELETE /api/event-location/:id` - Eliminar ubicación (requiere autenticación)

## Filtros de Búsqueda

Los eventos pueden filtrarse usando parámetros de query:

- `?name=texto` - Buscar por nombre
- `?startdate=YYYY-MM-DD` - Filtrar por fecha
- `?tag=texto` - Filtrar por tag
- `?page=1&limit=10` - Paginación

Ejemplos:
```
GET /api/event/?name=taylor&startdate=2025-03-03&tag=Rock
GET /api/event/?startdate=2025-08-21
```

## Autenticación

Para endpoints que requieren autenticación, incluir el token JWT en el header:
```
Authorization: Bearer <token>
```

## Estructura de Respuestas

### Listado de Eventos
```json
{
  "collection": [
    {
      "id": 2,
      "name": "Taylor Swift",
      "description": "Un alto show",
      "event_location": { ... },
      "start_date": "2024-03-21T03:00:00.000Z",
      "duration_in_minutes": 210,
      "price": "15500",
      "enabled_for_enrollment": true,
      "max_assistance": 120000,
      "creator_user": { ... },
      "tags": [ ... ]
    }
  ]
}
```

### Login Exitoso
```json
{
  "success": true,
  "message": "",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **pg** - Cliente PostgreSQL
- **dotenv** - Variables de entorno

## Validaciones Implementadas

- ✅ Validación de email con regex
- ✅ Validación de longitud mínima de campos
- ✅ Validación de capacidad máxima de eventos
- ✅ Validación de fechas de eventos
- ✅ Validación de permisos de usuario
- ✅ Validación de inscripciones duplicadas 