const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const AppointmentService = require('../services/AppointmentService');

const prisma = new PrismaClient();

// Obtener citas con filtros
router.get('/', async (req, res) => {
  try {
    const { date, stylistId, status, clientId } = req.query;

    const where = {};

    if (date) {
      where.date = new Date(date);
    }

    if (stylistId) {
      where.stylistId = stylistId;
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        client: {
          select: { name: true, phone: true, email: true }
        },
        stylist: {
          select: { name: true, specialities: true }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
});

// Obtener cita por ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        stylist: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({ message: 'Error al obtener cita' });
  }
});

// Crear cita
router.post('/', async (req, res) => {
  try {
    const { clientId, stylistId, date, time, duration, services, total } = req.body;

    if (!clientId || !stylistId || !date || !time || !duration) {
      return res.status(400).json({ message: 'Datos requeridos incompletos' });
    }

    // Verificar disponibilidad
    const available = await AppointmentService.checkAvailability(
      stylistId,
      date,
      time,
      duration
    );

    if (!available) {
      return res.status(400).json({ 
        message: 'El estilista no está disponible en este horario' 
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        stylistId,
        date: new Date(date),
        time,
        duration,
        services: services || [],
        total: total || 0,
        status: 'pending'
      },
      include: {
        client: true,
        stylist: true
      }
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({ message: 'Error al crear cita' });
  }
});

// Actualizar cita
router.put('/:id', async (req, res) => {
  try {
    const { clientId, stylistId, date, time, duration, services, total } = req.body;

    // Verificar disponibilidad si cambia el horario
    if (stylistId && date && time && duration) {
      const available = await AppointmentService.checkAvailability(
        stylistId,
        date,
        time,
        duration
      );

      if (!available) {
        return res.status(400).json({ 
          message: 'El estilista no está disponible en este horario' 
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        clientId,
        stylistId,
        date: date ? new Date(date) : undefined,
        time,
        duration,
        services,
        total
      },
      include: {
        client: true,
        stylist: true
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({ message: 'Error al actualizar cita' });
  }
});

// Cambiar estado de cita
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: true,
        stylist: true
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

// Eliminar cita
router.delete('/:id', async (req, res) => {
  try {
    await prisma.appointment.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando cita:', error);
    res.status(500).json({ message: 'Error al eliminar cita' });
  }
});

module.exports = router;
