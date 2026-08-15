const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener todos los clientes con paginación y búsqueda
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const clients = await prisma.client.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        appointments: {
          select: {
            id: true,
            date: true,
            time: true,
            status: true
          },
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    const total = await prisma.client.count({ where });

    res.json({
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

// Obtener cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          include: {
            stylist: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
});

// Crear cliente
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, loyaltyPoints, loyaltyTier } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Nombre y teléfono requeridos' });
    }

    const existingClient = await prisma.client.findUnique({
      where: { phone }
    });

    if (existingClient) {
      return res.status(400).json({ message: 'Ya existe un cliente con este teléfono' });
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email: email || null,
        loyaltyPoints: loyaltyPoints || 0,
        loyaltyTier: loyaltyTier || 'bronce',
        totalSpent: 0
      }
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

// Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, loyaltyPoints, loyaltyTier, totalSpent } = req.body;

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
        email,
        loyaltyPoints,
        loyaltyTier,
        totalSpent
      }
    });

    res.json(client);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
});

module.exports = router;
