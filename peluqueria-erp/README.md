# Peluquería ERP - Sistema de Gestión para Peluquería Femenina

Sistema de escritorio para gestión de peluquería femenina usando Electron, SQLite y Node.js embebido, sin necesidad de Internet ni instalaciones adicionales.

## 🚀 Características Principales

- **Dashboard** con KPIs en tiempo real
- **Gestión de Citas** con calendario interactivo
- **Clientes** con sistema de fidelidad
- **Estilistas** con seguimiento de rendimiento
- **Inventario** con alertas de stock bajo
- **Reportes** exportables a PDF/Excel
- **Backups** automáticos y manuales
- **Acceso en Red Local** desde cualquier dispositivo
- **SQLite** - Base de datos en un solo archivo, sin instalaciones

## 📋 Requisitos Previos

### Para Desarrollo
- Node.js 18+
- npm o yarn

### Para Producción
- Solo se requiere el instalador generado (.exe)
- **NO requiere PostgreSQL ni otras dependencias externas**

## 🛠️ Instalación para Desarrollo

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd peluqueria-erp
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar base de datos SQLite
```bash
npm run db:seed
```

Este comando crea automáticamente:
- Archivo `data/peluqueria.db` con la base de datos
- Tablas necesarias
- Datos de prueba iniciales

### 4. Ejecutar en modo desarrollo
```bash
npm run dev
```

## 📦 Generar Instaladores

### Windows (Recomendado)
```bash
npm run dist:win
```
Genera: `dist/PeluqueriaERP Setup 1.0.0.exe`

### macOS
```bash
npm run dist:mac
```

### Linux
```bash
npm run dist:linux
```

## 🗄️ Base de Datos SQLite

### Ventajas
- **Un solo archivo**: `data/peluqueria.db`
- **Sin instalación**: No requiere servidor de base de datos
- **Portable**: Fácil de copiar y respaldar
- **Rápido**: Optimizado para aplicaciones de escritorio
- **Auto-contenido**: Todo incluido en el instalador .exe

### Estructura de Tablas
- **Client**: Clientes con sistema de puntos
- **Appointment**: Citas programadas
- **Stylist**: Estilistas con especialidades
- **Product**: Productos de inventario
- **User**: Usuarios del sistema
- **CashRegister**: Caja diario
- **Backup**: Historial de backups

### Ubicación del Archivo
- **Desarrollo**: `data/peluqueria.db` en el directorio del proyecto
- **Producción**: `%APPDATA%/peluqueria-erp/data/peluqueria.db` (Windows)

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `PUT /api/appointments/:id` - Actualizar cita
- `PATCH /api/appointments/:id/status` - Cambiar estado
- `DELETE /api/appointments/:id` - Eliminar cita

### Estilistas
- `GET /api/stylists` - Listar estilistas
- `POST /api/stylists` - Crear estilista
- `PUT /api/stylists/:id` - Actualizar estilista

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/low-stock` - Productos con stock bajo
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `PATCH /api/products/:id/stock` - Ajustar stock

### Dashboard
- `GET /api/dashboard/kpis` - Obtener KPIs
- `GET /api/dashboard/charts` - Datos para gráficos
- `GET /api/dashboard/upcoming-appointments` - Próximas citas

### Reportes
- `GET /api/reports/sales` - Reporte de ventas
- `GET /api/reports/stylist-performance` - Rendimiento por estilista
- `GET /api/reports/top-clients` - Mejores clientes

## 🔐 Credenciales por Defecto

Después de ejecutar el seed:
- **Usuario**: admin
- **Contraseña**: admin123

## 📁 Estructura del Proyecto

```
peluqueria-erp/
├── src/
│   ├── main/              # Proceso principal de Electron
│   │   ├── main.js
│   │   ├── preload.js
│   │   └── ipcHandlers.js
│   └── backend/           # Backend Express
│       ├── server.js
│       ├── routes/        # Endpoints API
│       ├── controllers/   # Lógica de negocio
│       └── services/      # Servicios
├── frontend/              # Interfaz de usuario
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── app.js
│       ├── router.js
│       ├── services/
│       └── modules/
├── data/                  # Base de datos SQLite
│   └── peluqueria.db
├── backups/               # Backups automáticos y manuales
├── scripts/               # Scripts de inicialización
│   └── init-db.js
├── package.json
├── electron-builder.yml
└── README.md
```

## 🔧 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar aplicación en producción |
| `npm run dev` | Iniciar en modo desarrollo |
| `npm run dist:win` | Generar instalador Windows (.exe) |
| `npm run dist:mac` | Generar instalador macOS (.dmg) |
| `npm run dist:linux` | Generar instalador Linux (.AppImage) |
| `npm run db:seed` | Crear base de datos SQLite con datos de prueba |
| `npm run backup` | Crear backup manual de la base de datos |

## 🌐 Acceso en Red Local

El servidor se ejecuta en `0.0.0.0:3000`, permitiendo acceso desde otros dispositivos en la misma red:

```
http://<IP-del-servidor>:3000
```

Desde otros dispositivos en la red local, puedes acceder a la interfaz web sin instalar nada.

## 💾 Backups

### Crear Backup Manual
1. Menú → Archivo → Crear Backup
2. O usar IPC: `window.electron.ipcRenderer.invoke('create-backup')`
3. El backup se guarda en `backups/peluqueria-YYYY-MM-DD-HH-mm.db`

### Restaurar Backup
1. Menú → Archivo → Restaurar Backup
2. Seleccionar backup de la lista
3. Confirmar restauración

### Backup Automático
- Se crea automáticamente al cerrar la aplicación
- Ubicación: `backups/auto/`

## 🎨 Personalización

Los colores y estilos pueden modificarse en `frontend/css/main.css`:

```css
:root {
  --primary-color: #9b59b6;
  --secondary-color: #3498db;
  /* ... más variables */
}
```

## ⚡ Instalación Rápida en Windows

1. **Descargar el instalador**: `PeluqueriaERP Setup 1.0.0.exe`
2. **Ejecutar instalador**: Doble clic en el .exe
3. **Seguir asistente**: Elegir ubicación de instalación
4. **Ejecutar aplicación**: Icono en escritorio o menú inicio
5. **Iniciar sesión**: admin / admin123

¡Listo! No requiere PostgreSQL ni configuraciones adicionales.

## 🔒 Seguridad

- Autenticación JWT para usuarios
- Roles: admin, manager, stylist, cashier
- Validación de datos en backend
- Contraseñas encriptadas con bcrypt
- Context isolation en Electron

## 📝 Licencia

MIT License

## 👥 Soporte

Para reportar problemas o solicitar características, abra un issue en el repositorio.

---

**Versión**: 1.0.0  
**Base de Datos**: SQLite (archivo único)  
**Última actualización**: 2024
