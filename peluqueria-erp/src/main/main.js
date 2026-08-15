const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { startServer, stopServer } = require('../backend/server');
const BackupService = require('../backend/services/BackupService');

let mainWindow = null;
const backupService = new BackupService();

async function initializeApp() {
  await startServer();
  createWindow();
  setupMenu();
  setupIpcHandlers();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', '..', 'resources', 'icons', 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function setupMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Crear Backup',
          click: async () => {
            try {
              const result = await backupService.createBackup();
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Backup creado',
                message: `Backup creado exitosamente: ${result.filename}`
              });
            } catch (error) {
              dialog.showErrorBox('Error', 'No se pudo crear el backup');
            }
          }
        },
        {
          label: 'Restaurar Backup',
          click: async () => {
            const backups = await backupService.listBackups();
            
            if (backups.length === 0) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Sin backups',
                message: 'No hay backups disponibles para restaurar'
              });
              return;
            }

            const choices = backups.map(b => `${b.filename} (${formatBytes(b.size)})`);
            
            dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['Cancelar', ...backups.map((_, i) => `Restaurar ${i + 1}`)],
              title: 'Restaurar Backup',
              message: 'Seleccione el backup a restaurar:\n\n' + choices.join('\n'),
              defaultId: 0,
              cancelId: 0
            }).then(async ({ response }) => {
              if (response > 0) {
                const selectedBackup = backups[response - 1];
                try {
                  await backupService.restoreBackup(selectedBackup.filename);
                  dialog.showMessageBox(mainWindow, {
                    type: 'success',
                    title: 'Backup restaurado',
                    message: 'El backup ha sido restaurado correctamente.\nReinicie la aplicación.'
                  });
                } catch (error) {
                  dialog.showErrorBox('Error', 'No se pudo restaurar el backup');
                }
              }
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Maximizar',
          accelerator: 'F11',
          click: () => {
            if (mainWindow.isMaximized()) {
              mainWindow.unmaximize();
            } else {
              mainWindow.maximize();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom Reset',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Peluquería ERP',
              message: 'Sistema de Gestión para Peluquería Femenina\nVersión 1.0.0\n\n© 2024 Todos los derechos reservados'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupIpcHandlers() {
  // Minimizar ventana
  ipcMain.on('app:minimize', () => {
    mainWindow.minimize();
  });

  // Maximizar ventana
  ipcMain.on('app:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  // Cerrar ventana
  ipcMain.on('app:close', () => {
    app.quit();
  });

  // Crear backup
  ipcMain.handle('create-backup', async () => {
    return await backupService.createBackup();
  });

  // Listar backups
  ipcMain.handle('list-backups', async () => {
    return await backupService.listBackups();
  });

  // Restaurar backup
  ipcMain.handle('restore-backup', async (event, filename) => {
    return await backupService.restoreBackup(filename);
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Eventos de la aplicación
app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  await stopServer();
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  dialog.showErrorBox('Error Crítico', 'Ha ocurrido un error inesperado. La aplicación se cerrará.');
  app.quit();
});

module.exports = { mainWindow };
