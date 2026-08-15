const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener reportes de ventas
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
        status: {
          in: ['completed', 'confirmed']
        }
      },
      include: {
        stylist: {
          select: { name: true }
        },
        client: {
          select: { name: true }
        }
      }
    });

    // Calcular totales
    const totalRevenue = appointments.reduce((sum, app) => sum + parseFloat(app.total || 0), 0);
    const totalAppointments = appointments.length;

    // Ventas por estilista
    const salesByStylist = {};
    appointments.forEach(app => {
      const stylistName = app.stylist.name;
      if (!salesByStylist[stylistName]) {
        salesByStylist[stylistName] = { count: 0, revenue: 0 };
      }
      salesByStylist[stylistName].count++;
      salesByStylist[stylistName].revenue += parseFloat(app.total || 0);
    });

    res.json({
      period: { start, end },
      totalRevenue,
      totalAppointments,
      salesByStylist,
      appointments
    });
  } catch (error) {
    console.error('Error obteniendo reporte de ventas:', error);
    res.status(500).json({ message: 'Error al obtener reporte de ventas' });
  }
});

// Reporte de rendimiento por estilista
router.get('/stylist-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const stylists = await prisma.stylist.findMany({
      where: { active: true },
      include: {
        appointments: {
          where: {
            date: {
              gte: start,
              lte: end
            },
            status: {
              in: ['completed', 'confirmed']
            }
          },
          select: {
            total: true,
            duration: true
          }
        }
      }
    });

    const performance = stylists.map(stylist => {
      const totalAppointments = stylist.appointments.length;
      const totalRevenue = stylist.appointments.reduce((sum, app) => sum + parseFloat(app.total || 0), 0);
      const totalHours = stylist.appointments.reduce((sum, app) => sum + (app.duration / 60), 0);
      const avgRating = stylist.rating;

      return {
        id: stylist.id,
        name: stylist.name,
        totalAppointments,
        totalRevenue,
        totalHours,
        avgRevenuePerHour: totalHours > 0 ? totalRevenue / totalHours : 0,
        avgRating,
        commission: parseFloat(stylist.commission)
      };
    });

    res.json(performance.sort((a, b) => b.totalRevenue - a.totalRevenue));
  } catch (error) {
    console.error('Error obteniendo rendimiento de estilistas:', error);
    res.status(500).json({ message: 'Error al obtener rendimiento de estilistas' });
  }
});

// Reporte de clientes frecuentes
router.get('/top-clients', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const clients = await prisma.client.findMany({
      orderBy: { totalSpent: 'desc' },
      take: parseInt(limit),
      include: {
        appointments: {
          where: {
            status: 'completed'
          },
          select: {
            id: true
          }
        }
      }
    });

    const topClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      totalSpent: parseFloat(client.totalSpent),
      loyaltyPoints: client.loyaltyPoints,
      loyaltyTier: client.loyaltyTier,
      visitCount: client.appointments.length
    }));

    res.json(topClients);
  } catch (error) {
    console.error('Error obteniendo clientes frecuentes:', error);
    res.status(500).json({ message: 'Error al obtener clientes frecuentes' });
  }
});

module.exports = router;
