const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener KPIs del dashboard
router.get('/kpis', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Citas de hoy
    const appointmentsToday = await prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        status: {
          notIn: ['cancelled', 'no_show']
        }
      }
    });

    // Ingresos de hoy
    const revenueToday = await prisma.appointment.aggregate({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        status: 'completed'
      },
      _sum: {
        total: true
      }
    });

    // Clientes nuevos este mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newClientsThisMonth = await prisma.client.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Total clientes
    const totalClients = await prisma.client.count();

    // Productos con stock bajo
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lte: prisma.product.fields.minStock
        }
      }
    });

    // Ocupación del día (simplificado)
    const totalHours = 10; // Horas laborales
    const occupiedHours = await prisma.appointment.aggregate({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        status: {
          notIn: ['cancelled', 'no_show']
        }
      },
      _sum: {
        duration: true
      }
    });

    const occupancyRate = ((occupiedHours._sum.duration || 0) / 60 / totalHours) * 100;

    res.json({
      appointmentsToday,
      revenueToday: parseFloat(revenueToday._sum.total || 0),
      newClientsThisMonth,
      totalClients,
      lowStockProducts,
      occupancyRate: Math.min(occupancyRate, 100).toFixed(1)
    });
  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    res.status(500).json({ message: 'Error al obtener KPIs' });
  }
});

// Obtener datos para gráficos
router.get('/charts', async (req, res) => {
  try {
    const today = new Date();

    // Ventas últimos 7 días
    const last7Days = [];
    const salesData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      last7Days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));

      const revenue = await prisma.appointment.aggregate({
        where: {
          date: {
            gte: date,
            lt: nextDate
          },
          status: 'completed'
        },
        _sum: {
          total: true
        }
      });

      salesData.push(parseFloat(revenue._sum.total || 0));
    }

    // Distribución de citas por estado
    const statusCount = await prisma.appointment.groupBy({
      by: ['status'],
      _count: true,
      where: {
        date: {
          gte: today
        }
      }
    });

    const statusLabels = statusCount.map(s => s.status);
    const statusValues = statusCount.map(s => s._count);

    res.json({
      salesTrend: {
        labels: last7Days,
        data: salesData
      },
      appointmentsByStatus: {
        labels: statusLabels,
        data: statusValues
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos para gráficos:', error);
    res.status(500).json({ message: 'Error al obtener datos para gráficos' });
  }
});

// Próximas citas
router.get('/upcoming-appointments', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = await prisma.appointment.findMany({
      where: {
        date: {
          gte: today
        },
        status: {
          in: ['pending', 'confirmed']
        }
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: 10,
      include: {
        client: {
          select: { name: true, phone: true }
        },
        stylist: {
          select: { name: true }
        }
      }
    });

    res.json(upcoming);
  } catch (error) {
    console.error('Error obteniendo próximas citas:', error);
    res.status(500).json({ message: 'Error al obtener próximas citas' });
  }
});

module.exports = router;
