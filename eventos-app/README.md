# Eventos App - React Native + Expo

Una aplicación móvil completa para gestionar eventos, desarrollada con React Native y Expo.

## 🚀 Características

### Autenticación
- ✅ Registro de usuarios
- ✅ Inicio de sesión con JWT
- ✅ Gestión de tokens segura
- ✅ Cerrar sesión

### Gestión de Eventos
- ✅ Listado de eventos con paginación
- ✅ Búsqueda por nombre, fecha y tags
- ✅ Detalle completo de eventos
- ✅ Crear nuevos eventos
- ✅ Editar eventos propios
- ✅ Eliminar eventos propios
- ✅ Inscripción/desinscripción a eventos

### Gestión de Ubicaciones
- ✅ Crear nuevas ubicaciones de eventos
- ✅ Seleccionar ubicaciones existentes
- ✅ Gestión de provincias y localidades

### Funcionalidades Adicionales
- ✅ Interfaz moderna con Material Design
- ✅ Navegación intuitiva
- ✅ Validación de formularios
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Pull-to-refresh

## 📱 Pantallas

1. **LoginScreen** - Inicio de sesión
2. **RegisterScreen** - Registro de usuarios
3. **HomeScreen** - Listado principal de eventos
4. **EventDetailScreen** - Detalle completo del evento
5. **CreateEventScreen** - Crear nuevo evento
6. **MyEventsScreen** - Mis eventos creados
7. **ProfileScreen** - Perfil de usuario

## 🛠️ Tecnologías Utilizadas

- **React Native** - Framework principal
- **Expo** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación
- **React Native Paper** - Componentes Material Design
- **Axios** - Cliente HTTP
- **Expo Secure Store** - Almacenamiento seguro
- **date-fns** - Manipulación de fechas

## 📦 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Expo CLI
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS, solo macOS)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd eventos-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar el backend**
   - Asegúrate de que tu API backend esté corriendo en `http://localhost:3000`
   - Si tu API está en otra URL, define `API_BASE_URL` en el archivo `.env`

4. **Iniciar la aplicación**
   ```bash
   npm start
   # o
   yarn start
   ```

5. **Ejecutar en dispositivo/emulador**
   - Presiona `a` para Android
   - Presiona `i` para iOS
   - Escanea el código QR con la app Expo Go en tu dispositivo

## 🔧 Configuración

### Variables de Entorno
El proyecto incluye un archivo `.env` en la raíz del proyecto con la siguiente configuración por defecto:

```env
API_BASE_URL=http://localhost:3000/api
```

La aplicación usará automáticamente esta variable mediante `process.env`. Si necesitas apuntar a otra URL, edita este archivo.

### Configuración del Backend
Asegúrate de que tu API backend tenga los siguientes endpoints implementados:

#### Autenticación
- `POST /api/user/login`
- `POST /api/user/register`

#### Eventos
- `GET /api/event/`
- `GET /api/event/{id}`
- `POST /api/event/`
- `PUT /api/event/`
- `DELETE /api/event/{id}`
- `POST /api/event/{id}/enrollment/`
- `DELETE /api/event/{id}/enrollment/`

#### Ubicaciones
- `GET /api/event-location`
- `GET /api/event-location/{id}`
- `POST /api/event-location/`
- `PUT /api/event-location/`
- `DELETE /api/event-location/{id}`

#### Datos Maestros
- `GET /api/tags`
- `GET /api/provinces`
- `GET /api/locations`

## 📱 Uso de la Aplicación

### Registro e Inicio de Sesión
1. Abre la aplicación
2. Si no tienes cuenta, toca "Regístrate aquí"
3. Completa el formulario de registro
4. Inicia sesión con tus credenciales

### Explorar Eventos
1. En la pantalla principal verás todos los eventos disponibles
2. Usa la barra de búsqueda para filtrar por nombre
3. Toca en cualquier evento para ver su detalle completo

### Crear un Evento
1. Toca el botón "+" flotante o ve a "Crear Evento" desde el perfil
2. Completa todos los campos requeridos
3. Selecciona una ubicación existente o crea una nueva
4. Selecciona las etiquetas relevantes
5. Toca "Crear Evento"

### Gestionar Mis Eventos
1. Ve a "Mis Eventos" desde el perfil
2. Verás todos los eventos que has creado
3. Puedes editar o eliminar tus eventos
4. Los eventos pasados no se pueden editar

### Inscribirse a Eventos
1. Ve al detalle de un evento
2. Si las inscripciones están abiertas, toca "Inscribirse"
3. Para desinscribirse, toca "Desinscribirse"

## 🎨 Estructura del Proyecto

```
eventos-app/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── context/            # Contextos de React (AuthContext)
│   ├── screens/            # Pantallas de la aplicación
│   ├── services/           # Servicios de API
│   ├── types/              # Definiciones de TypeScript
│   ├── utils/              # Utilidades y helpers
│   └── hooks/              # Custom hooks
├── assets/                 # Imágenes y recursos
├── App.tsx                 # Componente principal
├── package.json            # Dependencias
└── README.md              # Este archivo
```

## 🔒 Seguridad

- Los tokens JWT se almacenan de forma segura usando Expo Secure Store
- Todas las peticiones autenticadas incluyen el token en el header
- Validación de formularios en el frontend
- Manejo seguro de errores

## 🐛 Solución de Problemas

### Error de Conexión
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Asegúrate de que no haya problemas de red
- Revisa la configuración de CORS en el backend

### Error de Autenticación
- Verifica que las credenciales sean correctas
- Asegúrate de que el endpoint de login esté funcionando
- Revisa que el token JWT sea válido

### Problemas de Compilación
- Limpia la caché: `expo start -c`
- Reinstala las dependencias: `npm install`
- Verifica la versión de Node.js

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
- Revisa la documentación del backend
- Verifica los logs de la consola
- Asegúrate de que todas las dependencias estén instaladas correctamente
