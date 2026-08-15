const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rutas de API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/stylists', require('./routes/stylists'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

let server = null;

function startServer() {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`🌐 Acceso en red local: http://0.0.0.0:${PORT}`);
        resolve(server);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close(() => {
        prisma.$disconnect();
        console.log('✅ Servidor detenido');
        resolve();
      });
    } else {
      prisma.$disconnect();
      resolve();
    }
  });
}

module.exports = { app, startServer, stopServer, prisma };
