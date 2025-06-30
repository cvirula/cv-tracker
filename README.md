# Sistema de Seguimiento de Préstamos

Un sistema web completo para el seguimiento de clientes morosos en empresas de préstamos. Permite buscar clientes por DPI, gestionar información de deudas y administrar usuarios del sistema.

## Características

- 🔐 **Sistema de autenticación seguro** con JWT
- 👤 **Roles diferenciados**: Administrador y Usuario
- 🔍 **Búsqueda por DPI** de clientes morosos
- 💰 **Gestión de deudas** con información detallada
- 🏢 **Control de empresas** deudoras
- 📱 **Interfaz responsive** y moderna
- 🛡️ **Seguridad** con rate limiting y validaciones
- 💾 **Base de datos SQLite** fácil de configurar

## Requisitos

- Node.js (versión 14 o superior)
- npm o yarn

## Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   git clone <url-del-repositorio>
   cd cv-tracker
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor**
   ```bash
   npm start
   ```

4. **Acceder a la aplicación**
   - Abrir el navegador en: `http://localhost:3000`
   - Usuario administrador:
     - **Usuario**: `cristian`
     - **Contraseña**: `virula10`

## Uso

### Para Administradores

1. **Iniciar sesión** con las credenciales de administrador
2. **Crear usuarios** para el personal de la empresa
3. **Agregar clientes morosos** con su información:
   - DPI (Documento Personal de Identificación)
   - Nombre completo
   - Cantidad de deuda
   - Empresa a la que debe
4. **Gestionar clientes**: editar, eliminar o ver lista completa

### Para Usuarios

1. **Iniciar sesión** con las credenciales proporcionadas por el administrador
2. **Buscar clientes** ingresando el número de DPI
3. **Ver información** del cliente encontrado:
   - Nombre
   - Cantidad de deuda
   - Empresa deudora
   - Fechas de registro y actualización

## Estructura del Proyecto

```
cv-tracker/
├── server.js              # Servidor principal
├── package.json           # Dependencias y scripts
├── prestamos.db          # Base de datos SQLite (se crea automáticamente)
├── public/               # Archivos del frontend
│   ├── index.html        # Página principal
│   ├── styles.css        # Estilos CSS
│   └── script.js         # JavaScript del cliente
└── README.md             # Este archivo
```

## API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/usuarios` - Crear usuario (solo admin)

### Clientes
- `GET /api/clientes/:dpi` - Buscar cliente por DPI
- `GET /api/clientes` - Listar todos los clientes (solo admin)
- `POST /api/clientes` - Agregar cliente (solo admin)
- `PUT /api/clientes/:id` - Actualizar cliente (solo admin)
- `DELETE /api/clientes/:id` - Eliminar cliente (solo admin)

## Seguridad

- **JWT Tokens** para autenticación
- **Contraseñas encriptadas** con bcrypt
- **Rate limiting** para prevenir ataques
- **Validación de datos** en frontend y backend
- **CORS** configurado para seguridad

## Base de Datos

El sistema utiliza SQLite con las siguientes tablas:

### Tabla `usuarios`
- `id` - Identificador único
- `username` - Nombre de usuario
- `password` - Contraseña encriptada
- `es_admin` - Si es administrador
- `fecha_creacion` - Fecha de creación

### Tabla `clientes_morosos`
- `id` - Identificador único
- `dpi` - Número de DPI (único)
- `nombre` - Nombre del cliente
- `cantidad_deuda` - Monto de la deuda
- `empresa_deuda` - Empresa a la que debe
- `fecha_creacion` - Fecha de registro
- `fecha_actualizacion` - Última actualización

## Personalización

### Cambiar puerto del servidor
Editar la variable `PORT` en `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Cambiar clave secreta JWT
Establecer la variable de entorno `JWT_SECRET` o editar en `server.js`:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2024';
```

### Modificar estilos
Editar el archivo `public/styles.css` para personalizar la apariencia.

## Despliegue

### Opción 1: Servidor local
```bash
npm start
```

### Opción 2: Con nodemon (desarrollo)
```bash
npm run dev
```

### Opción 3: Servicios en la nube
El sistema es compatible con:
- Heroku
- Railway
- Render
- Vercel
- DigitalOcean

## Mantenimiento

### Respaldar base de datos
```bash
cp prestamos.db prestamos_backup.db
```

### Restaurar base de datos
```bash
cp prestamos_backup.db prestamos.db
```

### Ver logs del servidor
Los logs se muestran en la consola donde se ejecuta el servidor.

## Solución de Problemas

### Error: "Puerto ya en uso"
Cambiar el puerto en `server.js` o terminar el proceso que usa el puerto 3000.

### Error: "Módulo no encontrado"
Ejecutar `npm install` para instalar las dependencias.

### Error: "Base de datos no encontrada"
La base de datos se crea automáticamente al iniciar el servidor por primera vez.

### Error: "Token inválido"
Cerrar sesión y volver a iniciar sesión.

## Soporte

Para reportar problemas o solicitar nuevas características, contactar al administrador del sistema.

## Licencia

Este proyecto es para uso interno de la empresa de préstamos.

---

**Desarrollado para optimizar el seguimiento de clientes morosos y mejorar la gestión de préstamos.** 