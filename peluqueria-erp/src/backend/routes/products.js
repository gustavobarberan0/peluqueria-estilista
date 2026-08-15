const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(products);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// Obtener productos con stock bajo
router.get('/low-stock', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock
        }
      },
      orderBy: { stock: 'asc' }
    });

    res.json(products);
  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    res.status(500).json({ message: 'Error al obtener productos con stock bajo' });
  }
});

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

// Crear producto
router.post('/', async (req, res) => {
  try {
    const { name, sku, stock, minStock, costPrice, sellPrice } = req.body;

    if (!name || !sku || !costPrice || !sellPrice) {
      return res.status(400).json({ message: 'Datos requeridos incompletos' });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'Ya existe un producto con este SKU' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        stock: stock || 0,
        minStock: minStock || 5,
        costPrice,
        sellPrice
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

// Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { name, sku, stock, minStock, costPrice, sellPrice } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        sku,
        stock,
        minStock,
        costPrice,
        sellPrice
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

// Ajustar stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { adjustment, reason } = req.body;

    if (!adjustment) {
      return res.status(400).json({ message: 'Ajuste requerido' });
    }

    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const newStock = product.stock + parseInt(adjustment);

    if (newStock < 0) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock: newStock }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error ajustando stock:', error);
    res.status(500).json({ message: 'Error al ajustar stock' });
  }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

module.exports = router;
