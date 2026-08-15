const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', '..', 'database', 'backup');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    // Leer configuración de la base de datos
    const configPath = path.join(__dirname, '..', '..', 'config', 'database.json');
    let config = { user: 'postgres', database: 'peluqueria_db' };
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    return new Promise((resolve, reject) => {
      // Ejecutar pg_dump
      const command = `pg_dump -U ${config.user} ${config.database} > "${filepath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error creando backup:', error);
          reject(new Error('No se pudo crear el backup'));
        } else {
          console.log(`✅ Backup creado: ${filename}`);
          resolve({
            filename,
            filepath,
            size: fs.statSync(filepath).size,
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  async listBackups() {
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return files;
  }

  async restoreBackup(filename) {
    const filepath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error('El archivo de backup no existe');
    }

    // Leer configuración de la base de datos
    const configPath = path.join(__dirname, '..', '..', 'config', 'database.json');
    let config = { user: 'postgres', database: 'peluqueria_db' };
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    return new Promise((resolve, reject) => {
      // Primero, terminar todas las conexiones existentes
      const terminateCommand = `psql -U ${config.user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${config.database}' AND pid <> pg_backend_pid()"`;
      
      exec(terminateCommand, (error) => {
        // Continuar incluso si hay error (puede que no haya conexiones)
        
        // Restaurar backup
        const restoreCommand = `psql -U ${config.user} ${config.database} < "${filepath}"`;
        
        exec(restoreCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('Error restaurando backup:', error);
            reject(new Error('No se pudo restaurar el backup'));
          } else {
            console.log(`✅ Backup restaurado: ${filename}`);
            resolve({ success: true, message: 'Backup restaurado correctamente' });
          }
        });
      });
    });
  }

  async deleteBackup(filename) {
    const filepath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error('El archivo de backup no existe');
    }

    fs.unlinkSync(filepath);
    return { success: true, message: 'Backup eliminado correctamente' };
  }

  // Limpieza automática de backups antiguos (más de 30 días)
  async cleanupOldBackups(days = 30) {
    const backups = await this.listBackups();
    const now = new Date();
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    for (const backup of backups) {
      const backupDate = new Date(backup.createdAt);
      if (backupDate < threshold) {
        await this.deleteBackup(backup.filename);
        console.log(`🗑️ Backup antiguo eliminado: ${backup.filename}`);
      }
    }
  }
}

module.exports = BackupService;
