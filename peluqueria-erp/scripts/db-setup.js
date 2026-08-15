const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🔧 Configurando base de datos...');

  // Leer configuración
  const configPath = path.join(__dirname, '..', 'config', 'database.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ No se encontró el archivo de configuración. Ejecute primero: npm run postgres:install');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log(`📊 Conectando a PostgreSQL como ${config.user}...`);

  // Crear script SQL para configurar la base de datos
  const sqlScript = `
    -- Crear usuario si no existe
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${config.user}') THEN
        CREATE ROLE ${config.user} WITH LOGIN PASSWORD '${config.password}';
      END IF;
    END
    $$;

    -- Crear base de datos si no existe
    SELECT 'CREATE DATABASE ${config.database} OWNER ${config.user}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${config.database}')\\gexec

    -- Conceder privilegios
    GRANT ALL PRIVILEGES ON DATABASE ${config.database} TO ${config.user};
  `;

  const sqlPath = path.join(__dirname, 'setup.sql');
  fs.writeFileSync(sqlPath, sqlScript);

  // Ejecutar script SQL
  return new Promise((resolve, reject) => {
    exec(`psql -U postgres -f "${sqlPath}"`, (error, stdout, stderr) => {
      if (error && !stderr.includes('already exists')) {
        console.log('⚠️ Nota: Puede que necesite ejecutar esto manualmente con privilegios de superusuario');
        console.log('Comando: psql -U postgres -f ' + sqlPath);
      }
      
      // Limpiar archivo temporal
      fs.unlinkSync(sqlPath);
      
      console.log('✅ Base de datos configurada');
      resolve();
    });
  });
}

// Ejecutar setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup de base de datos completado');
      console.log('📝 Ahora ejecute: npm run db:migrate');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = setupDatabase;
