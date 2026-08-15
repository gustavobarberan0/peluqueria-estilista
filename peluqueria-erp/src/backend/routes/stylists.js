const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener todos los estilistas
router.get('/', async (req, res) => {
  try {
    const stylists = await prisma.stylist.findMany({
      where: { active: true },
      orderBy: { rating: 'desc' },
      include: {
        appointments: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          select: {
            id: true,
            time: true,
            duration: true,
            status: true
          }
        }
      }
    });

    res.json(stylists);
  } catch (error) {
    console.error('Error obteniendo estilistas:', error);
    res.status(500).json({ message: 'Error al obtener estilistas' });
  }
});

// Obtener estilista por ID
router.get('/:id', async (req, res) => {
  try {
    const stylist = await prisma.stylist.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          include: {
            client: {
              select: { name: true, phone: true }
            }
          }
        }
      }
    });

    if (!stylist) {
      return res.status(404).json({ message: 'Estilista no encontrado' });
    }

    res.json(stylist);
  } catch (error) {
    console.error('Error obteniendo estilista:', error);
    res.status(500).json({ message: 'Error al obtener estilista' });
  }
});

// Crear estilista
router.post('/', async (req, res) => {
  try {
    const { name, specialities, commission, rating } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nombre requerido' });
    }

    const stylist = await prisma.stylist.create({
      data: {
        name,
        specialities: specialities || [],
        commission: commission || 30,
        rating: rating || 0,
        active: true
      }
    });

    res.status(201).json(stylist);
  } catch (error) {
    console.error('Error creando estilista:', error);
    res.status(500).json({ message: 'Error al crear estilista' });
  }
});

// Actualizar estilista
router.put('/:id', async (req, res) => {
  try {
    const { name, specialities, commission, rating, active } = req.body;

    const stylist = await prisma.stylist.update({
      where: { id: req.params.id },
      data: {
        name,
        specialities,
        commission,
        rating,
        active
      }
    });

    res.json(stylist);
  } catch (error) {
    console.error('Error actualizando estilista:', error);
    res.status(500).json({ message: 'Error al actualizar estilista' });
  }
});

// Eliminar estilista (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.stylist.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Estilista desactivado correctamente' });
  } catch (error) {
    console.error('Error eliminando estilista:', error);
    res.status(500).json({ message: 'Error al eliminar estilista' });
  }
});

module.exports = router;
