import { Router, Response } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all categories
router.get('/categories', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Create category
router.post('/categories', authenticate, requireRole(['INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), description },
    });

    res.status(201).json({ category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message || 'Failed to create category.' });
  }
});

// Get all products with aggregate stock and alerts
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId, search, status } = req.query;

    const where: any = {};
    if (categoryId && categoryId !== 'all') {
      where.categoryId = String(categoryId);
    }
    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stockQuants: {
          include: {
            location: {
              include: { warehouse: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute total available stock and stock status for each product
    const formatted = products.map((p) => {
      // Sum quantity only from internal locations
      const internalQuants = p.stockQuants.filter((q) => q.location.type === 'INTERNAL');
      const totalStock = internalQuants.reduce((sum, q) => sum + q.quantity, 0);

      let stockStatus = 'IN_STOCK';
      if (totalStock <= 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (totalStock <= p.minStockThreshold) {
        stockStatus = 'LOW_STOCK';
      }

      return {
        ...p,
        totalStock,
        stockStatus,
        isLowStock: totalStock <= p.minStockThreshold,
        isOutOfStock: totalStock <= 0,
      };
    });

    // Filter by stock status if requested
    let result = formatted;
    if (status === 'LOW_STOCK') {
      result = formatted.filter((p) => p.isLowStock);
    } else if (status === 'OUT_OF_STOCK') {
      result = formatted.filter((p) => p.isOutOfStock);
    }

    res.json({ products: result });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Create product (with optional initial stock)
router.post('/', authenticate, requireRole(['INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      sku,
      categoryId,
      uom,
      costPrice,
      minStockThreshold,
      reorderQty,
      initialStock,
      initialLocationId,
    } = req.body;

    if (!name || !sku || !categoryId) {
      res.status(400).json({ error: 'Name, SKU, and Category are required.' });
      return;
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });

    if (existingSku) {
      res.status(400).json({ error: `Product with SKU "${sku}" already exists.` });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku.toUpperCase().trim(),
        categoryId,
        uom: uom || 'Units',
        costPrice: Number(costPrice) || 0,
        minStockThreshold: Number(minStockThreshold) || 10,
        reorderQty: Number(reorderQty) || 50,
      },
      include: { category: true },
    });

    // Handle initial stock if provided
    const qty = Number(initialStock) || 0;
    if (qty > 0) {
      // Find location or use default
      let targetLocationId = initialLocationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.location.findFirst({
          where: { type: 'INTERNAL' },
        });
        targetLocationId = defaultLoc?.id;
      }

      if (targetLocationId) {
        // Find or create vendor/inventory adjustment source location
        let vendorLoc = await prisma.location.findFirst({
          where: { type: 'VENDOR' },
        });
        if (!vendorLoc) {
          vendorLoc = await prisma.location.create({
            data: { name: 'Initial Inventory Source', code: 'VEND/INIT', type: 'VENDOR' },
          });
        }

        // Create StockQuant
        await prisma.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: product.id,
              locationId: targetLocationId,
            },
          },
          update: { quantity: { increment: qty } },
          create: {
            productId: product.id,
            locationId: targetLocationId,
            quantity: qty,
          },
        });

        // Log double-entry StockMove
        await prisma.stockMove.create({
          data: {
            productId: product.id,
            sourceLocationId: vendorLoc.id,
            destLocationId: targetLocationId,
            quantity: qty,
            userId: req.user?.id,
            notes: 'Initial stock on product creation',
          },
        });
      }
    }

    res.status(201).json({ product });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Failed to create product.' });
  }
});

// Update product
router.put('/:id', authenticate, requireRole(['INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, sku, categoryId, uom, costPrice, minStockThreshold, reorderQty } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku: sku ? sku.toUpperCase().trim() : undefined,
        categoryId,
        uom,
        costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
        minStockThreshold: minStockThreshold !== undefined ? Number(minStockThreshold) : undefined,
        reorderQty: reorderQty !== undefined ? Number(reorderQty) : undefined,
      },
      include: { category: true },
    });

    res.json({ product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Get stock availability per location for a specific product
router.get('/:id/stock-locations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const quants = await prisma.stockQuant.findMany({
      where: {
        productId: id,
        location: { type: 'INTERNAL' },
      },
      include: {
        location: {
          include: { warehouse: true },
        },
      },
      orderBy: { location: { name: 'asc' } },
    });

    res.json({ stockLocations: quants });
  } catch (error: any) {
    console.error('Error fetching product stock locations:', error);
    res.status(500).json({ error: 'Failed to fetch stock locations.' });
  }
});

export default router;
