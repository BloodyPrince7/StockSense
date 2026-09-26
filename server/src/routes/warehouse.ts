import { Router, Response } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all warehouses with locations
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            stockQuants: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ warehouses });
  } catch (error: any) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses.' });
  }
});

// Create warehouse (Manager only)
router.post('/', authenticate, requireRole(['INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, address } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Warehouse name and unique code are required.' });
      return;
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        address,
      },
    });

    // Automatically create a default internal location for this warehouse
    await prisma.location.create({
      data: {
        warehouseId: warehouse.id,
        name: `${name} - Stock`,
        code: `${warehouse.code}/STOCK`,
        type: 'INTERNAL',
      },
    });

    res.status(201).json({ warehouse });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ error: error.message || 'Failed to create warehouse.' });
  }
});

// Get all locations
router.get('/locations/all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, warehouseId } = req.query;
    const where: any = {};
    if (type) where.type = String(type);
    if (warehouseId) where.warehouseId = String(warehouseId);

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: true,
        stockQuants: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    res.json({ locations });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations.' });
  }
});

// Create location
router.post('/locations', authenticate, requireRole(['INVENTORY_MANAGER']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, type, warehouseId } = req.body;
    if (!name || !code || !type) {
      res.status(400).json({ error: 'Location name, code, and type are required.' });
      return;
    }

    const location = await prisma.location.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        type,
        warehouseId: warehouseId || null,
      },
      include: {
        warehouse: true,
      },
    });

    res.status(201).json({ location });
  } catch (error: any) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message || 'Failed to create location.' });
  }
});

export default router;
