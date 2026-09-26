import { Router, Response } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get Move History / Stock Ledger
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, locationId, search, startDate, endDate } = req.query;

    const where: any = {};
    if (productId && productId !== 'all') {
      where.productId = String(productId);
    }
    if (locationId && locationId !== 'all') {
      where.OR = [
        { sourceLocationId: String(locationId) },
        { destLocationId: String(locationId) },
      ];
    }
    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { product: { name: { contains: q } } },
        { product: { sku: { contains: q } } },
        { notes: { contains: q } },
        { document: { reference: { contains: q } } },
      ];
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(String(startDate));
      if (endDate) where.timestamp.lte = new Date(String(endDate));
    }

    const moves = await prisma.stockMove.findMany({
      where,
      include: {
        product: true,
        sourceLocation: {
          include: { warehouse: true },
        },
        destLocation: {
          include: { warehouse: true },
        },
        document: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    res.json({ moves });
  } catch (error: any) {
    console.error('Error fetching ledger moves:', error);
    res.status(500).json({ error: 'Failed to fetch stock moves.' });
  }
});

// Dashboard KPIs & Analytics
router.get('/dashboard-stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Total products in stock & stock status breakdown
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stockQuants: {
          include: { location: true },
        },
      },
    });

    let totalProductsCount = products.length;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockUnits = 0;

    const lowStockAlerts: any[] = [];

    products.forEach((p) => {
      const internalQuants = p.stockQuants.filter((q) => q.location.type === 'INTERNAL');
      const totalStock = internalQuants.reduce((sum, q) => sum + q.quantity, 0);
      totalStockUnits += totalStock;

      if (totalStock <= 0) {
        outOfStockCount++;
        lowStockAlerts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category.name,
          currentStock: totalStock,
          minStockThreshold: p.minStockThreshold,
          reorderQty: p.reorderQty,
          status: 'OUT_OF_STOCK',
        });
      } else if (totalStock <= p.minStockThreshold) {
        lowStockCount++;
        lowStockAlerts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category.name,
          currentStock: totalStock,
          minStockThreshold: p.minStockThreshold,
          reorderQty: p.reorderQty,
          status: 'LOW_STOCK',
        });
      } else {
        inStockCount++;
      }
    });

    // 2. Pending Receipts
    const pendingReceipts = await prisma.operationDocument.count({
      where: {
        type: 'RECEIPT',
        status: { in: ['DRAFT', 'WAITING', 'READY'] },
      },
    });

    // 3. Pending Deliveries
    const pendingDeliveries = await prisma.operationDocument.count({
      where: {
        type: 'DELIVERY',
        status: { in: ['DRAFT', 'WAITING', 'READY'] },
      },
    });

    // 4. Internal Transfers Scheduled
    const scheduledTransfers = await prisma.operationDocument.count({
      where: {
        type: 'INTERNAL',
        status: { in: ['DRAFT', 'WAITING', 'READY'] },
      },
    });

    // 5. Recent operations
    const recentOperations = await prisma.operationDocument.findMany({
      take: 6,
      include: {
        sourceLocation: true,
        destLocation: true,
        createdBy: { select: { name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 6. Recent ledger movements
    const recentMoves = await prisma.stockMove.findMany({
      take: 6,
      include: {
        product: true,
        sourceLocation: true,
        destLocation: true,
        user: { select: { name: true } },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      kpis: {
        totalProductsCount,
        totalStockUnits,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
      },
      lowStockAlerts,
      recentOperations,
      recentMoves,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

export default router;
