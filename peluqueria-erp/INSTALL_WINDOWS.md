# Instalación en Windows - Sistema ERP Peluquería

## Requisitos Previos
- Windows 10/11 (64-bit)
- 4GB RAM mínimo
- 2GB espacio libre en disco

## Pasos de Instalación

### 1. Descargar e Instalar PostgreSQL
```
Descargar: https://www.postgresql.org/download/windows/
Versión recomendada: PostgreSQL 15.x
Durante la instalación:
- Puerto: 5432
- Contraseña de superusuario: recordar para configuración
```

### 2. Clonar/Descargar el Proyecto
```bash
git clone https://github.com/gustavobarberan0/peluqueria-erp.git
cd peluqueria-erp
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Configurar Base de Datos
```bash
# Crear usuario y base de datos manualmente o ejecutar:
node scripts/db-setup.js

# O manualmente en psql:
createdb -U postgres peluqueria_db
```

### 5. Ejecutar Migraciones
```bash
npx prisma migrate deploy
```

### 6. Cargar Datos de Prueba
```bash
npm run db:seed
```

### 7. Ejecutar Aplicación
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 8. Generar Instalador .exe
```bash
npm run dist:win
```

El instalador se generará en `dist/PeluqueriaERP Setup 1.0.0.exe`

## Credenciales por Defecto
- Usuario: admin
- Contraseña: admin123

## Acceso en Red Local
Una vez iniciado, el servidor estará disponible en:
- Local: http://localhost:3000
- Red LAN: http://[TU_IP]:3000

Para encontrar tu IP:
```bash
ipconfig
```

## Solución de Problemas

### Error: Puerto 3000 en uso
```bash
# Cambiar puerto en src/backend/server.js
const PORT = process.env.PORT || 3001;
```

### Error: Conexión a PostgreSQL
Verificar que el servicio esté corriendo:
```bash
# Services.msc -> PostgreSQL
```

### Error: Prisma no encuentra la BD
Actualizar DATABASE_URL en .env:
```
DATABASE_URL="postgresql://peluqueria_user:password@localhost:5432/peluqueria_db"
```
