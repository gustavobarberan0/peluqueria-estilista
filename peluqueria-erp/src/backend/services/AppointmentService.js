class AppointmentService {
  static async checkAvailability(stylistId, date, time, duration) {
    const { prisma } = require('../server');
    
    const appointments = await prisma.appointment.findMany({
      where: { 
        stylistId, 
        date: new Date(date),
        status: { notIn: ['cancelled', 'no_show'] }
      }
    });
    
    const start = this.timeToMinutes(time);
    const end = start + duration;
    
    for (const app of appointments) {
      const appStart = this.timeToMinutes(app.time);
      const appEnd = appStart + app.duration;
      
      // Verificar solapamiento con margen de 15 minutos
      if (start < appEnd + 15 && end > appStart - 15) {
        return false;
      }
    }
    
    return true;
  }

  static async assignStylist(date, time, duration, serviceIds) {
    const { prisma } = require('../server');
    
    const stylists = await prisma.stylist.findMany({
      where: { active: true },
      include: { appointments: true }
    });
    
    // Scoring: especialidad + carga + rating
    const scored = stylists.map(s => ({
      ...s,
      score: this.calculateScore(s, serviceIds, date)
    }));
    
    const sorted = scored.sort((a, b) => b.score - a.score);
    
    for (const stylist of sorted) {
      if (await this.checkAvailability(stylist.id, date, time, duration)) {
        return stylist;
      }
    }
    
    return null;
  }

  static calculateScore(stylist, serviceIds, date) {
    let score = stylist.rating || 0;
    
    // Bonus por especialidades
    if (serviceIds && serviceIds.length > 0) {
      // Aquí se podría verificar si las especialidades coinciden
      score += 2;
    }
    
    // Penalización por carga de trabajo hoy
    const todayApps = stylist.appointments.filter(app => {
      const appDate = new Date(app.date);
      return appDate.toDateString() === new Date(date).toDateString();
    });
    
    score -= todayApps.length * 0.5;
    
    return score;
  }

  static timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  static minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

module.exports = AppointmentService;
