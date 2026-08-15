const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    }
  });
  console.log('✅ Usuario admin creado (password: admin123)');

  // Crear estilistas
  const stylists = [
    {
      name: 'María García',
      specialities: ['Corte', 'Color', 'Mechas'],
      commission: 35,
      rating: 4.8
    },
    {
      name: 'Laura Rodríguez',
      specialities: ['Peinado', 'Maquillaje', 'Tratamientos'],
      commission: 30,
      rating: 4.9
    },
    {
      name: 'Carmen López',
      specialities: ['Uñas', 'Manicure', 'Pedicure'],
      commission: 25,
      rating: 4.7
    },
    {
      name: 'Ana Martínez',
      specialities: ['Corte', 'Alisado', 'Ondas'],
      commission: 32,
      rating: 4.6
    }
  ];

  for (const stylistData of stylists) {
    await prisma.stylist.upsert({
      where: { name: stylistData.name },
      update: {},
      create: stylistData
    });
  }
  console.log(`✅ ${stylists.length} estilistas creados`);

  // Crear productos
  const products = [
    { name: 'Shampoo Hidratante 500ml', sku: 'SH-001', stock: 20, minStock: 5, costPrice: 8.50, sellPrice: 15.99 },
    { name: 'Acondicionador Reparador 500ml', sku: 'AC-001', stock: 18, minStock: 5, costPrice: 9.00, sellPrice: 17.99 },
    { name: 'Mascarilla Intensiva 250ml', sku: 'MA-001', stock: 12, minStock: 5, costPrice: 12.00, sellPrice: 24.99 },
    { name: 'Serum Capilar 100ml', sku: 'SE-001', stock: 8, minStock: 5, costPrice: 15.00, sellPrice: 29.99 },
    { name: 'Laca Fijación Fuerte 400ml', sku: 'LA-001', stock: 15, minStock: 5, costPrice: 6.50, sellPrice: 12.99 },
    { name: 'Aceite de Argán 50ml', sku: 'AR-001', stock: 10, minStock: 5, costPrice: 18.00, sellPrice: 35.99 },
    { name: 'Tinte Rubio 8.0', sku: 'TI-008', stock: 6, minStock: 5, costPrice: 5.50, sellPrice: 11.99 },
    { name: 'Tinte Castaño 5.0', sku: 'TI-005', stock: 8, minStock: 5, costPrice: 5.50, sellPrice: 11.99 },
    { name: 'Decolorante Polvo 500g', sku: 'DE-001', stock: 4, minStock: 5, costPrice: 22.00, sellPrice: 42.99 },
    { name: 'Guantes Desechables (caja)', sku: 'GU-001', stock: 25, minStock: 10, costPrice: 3.00, sellPrice: 7.99 }
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData
    });
  }
  console.log(`✅ ${products.length} productos creados`);

  // Crear clientes de ejemplo
  const clients = [
    { name: 'Isabel Fernández', phone: '612345678', email: 'isabel@email.com', loyaltyPoints: 150, loyaltyTier: 'plata', totalSpent: 250.00 },
    { name: 'Rocío Jiménez', phone: '623456789', email: 'rocio@email.com', loyaltyPoints: 80, loyaltyTier: 'bronce', totalSpent: 120.00 },
    { name: 'Pilar Sánchez', phone: '634567890', email: 'pilar@email.com', loyaltyPoints: 320, loyaltyTier: 'oro', totalSpent: 580.00 },
    { name: 'Teresa Ruiz', phone: '645678901', email: 'teresa@email.com', loyaltyPoints: 45, loyaltyTier: 'bronce', totalSpent: 75.00 },
    { name: 'Lucía Moreno', phone: '656789012', email: 'lucia@email.com', loyaltyPoints: 200, loyaltyTier: 'plata', totalSpent: 340.00 }
  ];

  for (const clientData of clients) {
    await prisma.client.upsert({
      where: { phone: clientData.phone },
      update: {},
      create: clientData
    });
  }
  console.log(`✅ ${clients.length} clientes creados`);

  // Crear citas de ejemplo
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = [
    {
      clientId: (await prisma.client.findFirst({ where: { phone: '612345678' } })).id,
      stylistId: (await prisma.stylist.findFirst({ where: { name: 'María García' } })).id,
      date: today,
      time: '10:00',
      duration: 60,
      status: 'completed',
      services: [{ name: 'Corte y Peinado', price: 35.00 }],
      total: 35.00
    },
    {
      clientId: (await prisma.client.findFirst({ where: { phone: '623456789' } })).id,
      stylistId: (await prisma.stylist.findFirst({ where: { name: 'Laura Rodríguez' } })).id,
      date: today,
      time: '12:00',
      duration: 90,
      status: 'pending',
      services: [{ name: 'Color Completo', price: 65.00 }],
      total: 65.00
    },
    {
      clientId: (await prisma.client.findFirst({ where: { phone: '634567890' } })).id,
      stylistId: (await prisma.stylist.findFirst({ where: { name: 'Carmen López' } })).id,
      date: tomorrow,
      time: '16:00',
      duration: 45,
      status: 'pending',
      services: [{ name: 'Manicure Completa', price: 25.00 }],
      total: 25.00
    }
  ];

  for (const appointmentData of appointments) {
    await prisma.appointment.create({
      data: appointmentData
    });
  }
  console.log(`✅ ${appointments.length} citas creadas`);

  console.log('🎉 Seed completado exitosamente!');
}

seed()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
