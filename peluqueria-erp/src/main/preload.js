const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      const validChannels = ['app:minimize', 'app:maximize', 'app:close'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    invoke: async (channel, data) => {
      const validChannels = ['create-backup', 'list-backups', 'restore-backup'];
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, data);
      }
      throw new Error(`Canal IPC no válido: ${channel}`);
    }
  },
  system: {
    getVersion: () => '1.0.0',
    getPlatform: () => process.platform
  },
  network: {
    getLocalIP: () => {
      const os = require('os');
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            return net.address;
          }
        }
      }
      return 'localhost';
    }
  }
});
