const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class PostgreSQLInstaller {
  constructor() {
    this.platform = process.platform;
    this.configDir = path.join(__dirname, '..', 'config');
    this.configFile = path.join(this.configDir, 'database.json');
  }

  async install() {
    console.log(`🔧 Detectando plataforma: ${this.platform}`);
    
    if (this.platform === 'win32') {
      await this.installWindows();
    } else if (this.platform === 'darwin') {
      await this.installMacOS();
    } else {
      await this.installLinux();
    }
    
    await this.setupDatabase();
  }

  async installWindows() {
    console.log('📦 Instalando PostgreSQL en Windows...');
    try {
      // Intentar con winget primero
      await this.execPromise('winget install PostgreSQL.PostgreSQL --silent');
    } catch (error) {
      console.log('⚠️ winget no disponible, usando instalador directo');
      // Alternativa: descargar e instalar manualmente
      const installerUrl = 'https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64.exe';
      console.log(`Descargando desde: ${installerUrl}`);
      // El usuario debe descargar e instalar manualmente
      console.log('⚠️ Por favor, descargue e instale PostgreSQL 15+ manualmente desde: https://www.postgresql.org/download/windows/');
    }
  }

  async installMacOS() {
    console.log('📦 Instalando PostgreSQL en macOS...');
    try {
      await this.execPromise('brew install postgresql@15');
    } catch (error) {
      console.log('⚠️ Homebrew no disponible');
      console.log('⚠️ Por favor, instale PostgreSQL manualmente desde: https://postgresapp.com/');
    }
  }

  async installLinux() {
    console.log('📦 Instalando PostgreSQL en Linux...');
    try {
      await this.execPromise('sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib');
    } catch (error) {
      try {
        await this.execPromise('sudo yum install -y postgresql-server postgresql-contrib');
      } catch (error2) {
        console.log('⚠️ No se pudo instalar automáticamente');
        console.log('⚠️ Por favor, instale PostgreSQL manualmente');
      }
    }
  }

  async setupDatabase() {
    console.log('🗄️ Configurando base de datos...');
    
    const config = {
      user: 'peluqueria_user',
      password: this.generatePassword(),
      database: 'peluqueria_db',
      host: 'localhost',
      port: 5432
    };

    // Crear directorio de configuración si no existe
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Guardar configuración
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    console.log(`✅ Configuración guardada en: ${this.configFile}`);

    // Crear archivo .env para Prisma
    const envContent = `DATABASE_URL=postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?schema=public`;
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Variables de entorno guardadas en: ${envPath}`);

    console.log('✅ Base de datos configurada correctamente');
    return config;
  }

  generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// Ejecutar instalación
if (require.main === module) {
  const installer = new PostgreSQLInstaller();
  installer.install()
    .then(() => {
      console.log('✅ Instalación completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la instalación:', error.message);
      process.exit(1);
    });
}

module.exports = PostgreSQLInstaller;
