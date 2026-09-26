import { Router, Response } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper to generate reference numbers
const generateDocReference = async (type: string): Promise<string> => {
  const prefixMap: Record<string, string> = {
    RECEIPT: 'REC',
    DELIVERY: 'DEL',
    INTERNAL: 'INT',
    ADJUSTMENT: 'ADJ',
  };
  const prefix = prefixMap[type] || 'DOC';
  const year = new Date().getFullYear();
  const count = await prisma.operationDocument.count({
    where: { type },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
};

// Helper to ensure standard virtual locations exist
export const ensureStandardLocations = async () => {
  let vendorLoc = await prisma.location.findFirst({ where: { type: 'VENDOR' } });
  if (!vendorLoc) {
    vendorLoc = await prisma.location.create({
      data: { name: 'Vendors / Suppliers', code: 'PARTNERS/VENDORS', type: 'VENDOR' },
    });
  }

  let customerLoc = await prisma.location.findFirst({ where: { type: 'CUSTOMER' } });
  if (!customerLoc) {
    customerLoc = await prisma.location.create({
      data: { name: 'Customers / Physical Clients', code: 'PARTNERS/CUSTOMERS', type: 'CUSTOMER' },
    });
  }

  let lossLoc = await prisma.location.findFirst({ where: { type: 'INVENTORY_LOSS' } });
  if (!lossLoc) {
    lossLoc = await prisma.location.create({
      data: { name: 'Inventory Scraps & Adjustments', code: 'VIRTUAL/LOSS', type: 'INVENTORY_LOSS' },
    });
  }

  return { vendorLoc, customerLoc, lossLoc };
};

// List all operations with dynamic filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, status, warehouseId, search } = req.query;

    const where: any = {};
    if (type && type !== 'ALL') {
      where.type = String(type);
    }
    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    if (warehouseId && warehouseId !== 'ALL') {
      where.OR = [
        { sourceLocation: { warehouseId: String(warehouseId) } },
        { destLocation: { warehouseId: String(warehouseId) } },
      ];
    }
    if (search) {
      const q = String(search).toLowerCase();
      where.AND = [
        {
          OR: [
            { reference: { contains: q } },
            { partnerName: { contains: q } },
            { notes: { contains: q } },
          ],
        },
      ];
    }

    const operations = await prisma.operationDocument.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        sourceLocation: {
          include: { warehouse: true },
        },
        destLocation: {
          include: { warehouse: true },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ operations });
  } catch (error: any) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Failed to fetch operations.' });
  }
});

// Get single operation details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const operation = await prisma.operationDocument.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        sourceLocation: {
          include: { warehouse: true },
        },
        destLocation: {
          include: { warehouse: true },
        },
        items: {
          include: {
            product: {
              include: {
                stockQuants: {
                  include: { location: true },
                },
              },
            },
          },
        },
        stockMoves: {
          include: {
            product: true,
            sourceLocation: true,
            destLocation: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!operation) {
      res.status(404).json({ error: 'Operation document not found.' });
      return;
    }

    res.json({ operation });
  } catch (error: any) {
    console.error('Error fetching operation details:', error);
    res.status(500).json({ error: 'Failed to fetch operation details.' });
  }
});

// Create new operation document
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      type, // RECEIPT, DELIVERY, INTERNAL, ADJUSTMENT
      partnerName,
      sourceLocationId,
      destLocationId,
      scheduledDate,
      notes,
      items, // array of { productId, requestedQty }
    } = req.body;

    if (!type || !['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT'].includes(type)) {
      res.status(400).json({ error: 'Valid operation type is required.' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one product item is required.' });
      return;
    }

    const { vendorLoc, customerLoc, lossLoc } = await ensureStandardLocations();

    let finalSourceLocId = sourceLocationId;
    let finalDestLocId = destLocationId;

    if (type === 'RECEIPT') {
      if (!finalSourceLocId) finalSourceLocId = vendorLoc.id;
      if (!finalDestLocId) {
        // default to first internal location
        const defaultLoc = await prisma.location.findFirst({ where: { type: 'INTERNAL' } });
        finalDestLocId = defaultLoc?.id;
      }
    } else if (type === 'DELIVERY') {
      if (!finalDestLocId) finalDestLocId = customerLoc.id;
      if (!finalSourceLocId) {
        const defaultLoc = await prisma.location.findFirst({ where: { type: 'INTERNAL' } });
        finalSourceLocId = defaultLoc?.id;
      }
    } else if (type === 'ADJUSTMENT') {
      if (!finalSourceLocId && !finalDestLocId) {
        const defaultLoc = await prisma.location.findFirst({ where: { type: 'INTERNAL' } });
        finalSourceLocId = defaultLoc?.id;
        finalDestLocId = lossLoc.id;
      }
    }

    if (!finalSourceLocId || !finalDestLocId) {
      res.status(400).json({ error: 'Source and destination locations must be defined.' });
      return;
    }

    const reference = await generateDocReference(type);

    const doc = await prisma.operationDocument.create({
      data: {
        reference,
        type,
        status: 'DRAFT',
        partnerName,
        sourceLocationId: finalSourceLocId,
        destLocationId: finalDestLocId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        notes,
        createdById: req.user!.id,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId,
            requestedQty: Number(it.requestedQty) || 1,
            pickedQty: 0,
            packedQty: 0,
            doneQty: 0,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        sourceLocation: true,
        destLocation: true,
      },
    });

    res.status(201).json({ operation: doc });
  } catch (error: any) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: error.message || 'Failed to create operation.' });
  }
});

// Update items/quantities in an operation
router.put('/:id/items', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { id, pickedQty, packedQty, doneQty }

    const doc = await prisma.operationDocument.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ error: 'Operation document not found.' });
      return;
    }

    if (doc.status === 'DONE' || doc.status === 'CANCELED') {
      res.status(400).json({ error: `Cannot modify document in ${doc.status} state.` });
      return;
    }

    for (const it of items) {
      await prisma.operationItem.update({
        where: { id: it.id },
        data: {
          pickedQty: it.pickedQty !== undefined ? Number(it.pickedQty) : undefined,
          packedQty: it.packedQty !== undefined ? Number(it.packedQty) : undefined,
          doneQty: it.doneQty !== undefined ? Number(it.doneQty) : undefined,
        },
      });
    }

    const updated = await prisma.operationDocument.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    res.json({ operation: updated });
  } catch (error: any) {
    console.error('Error updating items:', error);
    res.status(500).json({ error: 'Failed to update items.' });
  }
});

// Action transitions: 'pick', 'pack', 'validate', 'cancel'
router.post('/:id/action', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'pick', 'pack', 'validate', 'cancel'

    const doc = await prisma.operationDocument.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        sourceLocation: true,
        destLocation: true,
      },
    });

    if (!doc) {
      res.status(404).json({ error: 'Operation not found.' });
      return;
    }

    if (doc.status === 'DONE' || doc.status === 'CANCELED') {
      res.status(400).json({ error: `Operation is already ${doc.status}.` });
      return;
    }

    if (action === 'cancel') {
      const updated = await prisma.operationDocument.update({
        where: { id },
        data: { status: 'CANCELED' },
      });
      res.json({ message: 'Operation canceled.', operation: updated });
      return;
    }

    // Workflow: Pick stage (for Delivery orders)
    if (action === 'pick') {
      if (doc.type !== 'DELIVERY') {
        res.status(400).json({ error: 'Pick action is only valid for Delivery Orders.' });
        return;
      }

      // Check availability before picking
      for (const item of doc.items) {
        const quant = await prisma.stockQuant.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: doc.sourceLocationId!,
            },
          },
        });
        const currentQty = quant ? quant.quantity : 0;
        if (currentQty < item.requestedQty) {
          res.status(400).json({
            error: `Insufficient stock in ${doc.sourceLocation?.name} for "${item.product.name}". Required: ${item.requestedQty}, Available: ${currentQty}`,
          });
          return;
        }

        await prisma.operationItem.update({
          where: { id: item.id },
          data: { pickedQty: item.requestedQty },
        });
      }

      const updated = await prisma.operationDocument.update({
        where: { id },
        data: { status: 'WAITING' }, // Waiting for packaging
        include: { items: { include: { product: true } } },
      });

      res.json({ message: 'Items picked successfully. Ready for packing.', operation: updated });
      return;
    }

    // Workflow: Pack stage (for Delivery orders)
    if (action === 'pack') {
      if (doc.type !== 'DELIVERY') {
        res.status(400).json({ error: 'Pack action is only valid for Delivery Orders.' });
        return;
      }

      for (const item of doc.items) {
        const packAmount = item.pickedQty > 0 ? item.pickedQty : item.requestedQty;
        await prisma.operationItem.update({
          where: { id: item.id },
          data: { packedQty: packAmount },
        });
      }

      const updated = await prisma.operationDocument.update({
        where: { id },
        data: { status: 'READY' }, // Ready for validation / shipping
        include: { items: { include: { product: true } } },
      });

      res.json({ message: 'Items packed successfully. Ready for validation.', operation: updated });
      return;
    }

    // Workflow: Validate stage (executes double-entry stock moves)
    if (action === 'validate') {
      const { lossLoc } = await ensureStandardLocations();

      await prisma.$transaction(async (tx) => {
        for (const item of doc.items) {
          let transferQty = item.requestedQty;
          if (doc.type === 'DELIVERY' && item.packedQty > 0) {
            transferQty = item.packedQty;
          }

          // Case 1: RECEIPT (Vendor -> Destination Location)
          if (doc.type === 'RECEIPT') {
            // Increment stock in destination location
            await tx.stockQuant.upsert({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: doc.destLocationId!,
                },
              },
              update: { quantity: { increment: transferQty } },
              create: {
                productId: item.productId,
                locationId: doc.destLocationId!,
                quantity: transferQty,
              },
            });

            // Log double entry stock move
            await tx.stockMove.create({
              data: {
                documentId: doc.id,
                productId: item.productId,
                sourceLocationId: doc.sourceLocationId!,
                destLocationId: doc.destLocationId!,
                quantity: transferQty,
                userId: req.user?.id,
                notes: `Receipt validated from ${doc.partnerName || 'Supplier'}`,
              },
            });

            await tx.operationItem.update({
              where: { id: item.id },
              data: { doneQty: transferQty },
            });
          }

          // Case 2: DELIVERY (Source Location -> Customer)
          else if (doc.type === 'DELIVERY') {
            const quant = await tx.stockQuant.findUnique({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: doc.sourceLocationId!,
                },
              },
            });

            const available = quant ? quant.quantity : 0;
            if (available < transferQty) {
              throw new Error(
                `Cannot ship. Insufficient stock for ${item.product.name}. Available: ${available}, Required: ${transferQty}`
              );
            }

            // Decrement from source
            await tx.stockQuant.update({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: doc.sourceLocationId!,
                },
              },
              data: { quantity: { decrement: transferQty } },
            });

            // Log double entry move
            await tx.stockMove.create({
              data: {
                documentId: doc.id,
                productId: item.productId,
                sourceLocationId: doc.sourceLocationId!,
                destLocationId: doc.destLocationId!,
                quantity: transferQty,
                userId: req.user?.id,
                notes: `Delivery order fulfilled for ${doc.partnerName || 'Customer'}`,
              },
            });

            await tx.operationItem.update({
              where: { id: item.id },
              data: { doneQty: transferQty },
            });
          }

          // Case 3: INTERNAL TRANSFER (Source Internal -> Dest Internal)
          else if (doc.type === 'INTERNAL') {
            const quant = await tx.stockQuant.findUnique({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: doc.sourceLocationId!,
                },
              },
            });

            const available = quant ? quant.quantity : 0;
            if (available < transferQty) {
              throw new Error(
                `Insufficient stock in ${doc.sourceLocation?.name} for ${item.product.name}. Available: ${available}, Required: ${transferQty}`
              );
            }

            // Decrement source
            await tx.stockQuant.update({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: doc.sourceLocationId!,
                },
              },
              data: { quantity: { decrement: transferQty } },
            });

            // Increment destination
            await tx.stockQuant.upsert({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: doc.destLocationId!,
                },
              },
              update: { quantity: { increment: transferQty } },
              create: {
                productId: item.productId,
                locationId: doc.destLocationId!,
                quantity: transferQty,
              },
            });

            // Log ledger move
            await tx.stockMove.create({
              data: {
                documentId: doc.id,
                productId: item.productId,
                sourceLocationId: doc.sourceLocationId!,
                destLocationId: doc.destLocationId!,
                quantity: transferQty,
                userId: req.user?.id,
                notes: `Internal transfer from ${doc.sourceLocation?.name} to ${doc.destLocation?.name}`,
              },
            });

            await tx.operationItem.update({
              where: { id: item.id },
              data: { doneQty: transferQty },
            });
          }

          // Case 4: STOCK ADJUSTMENT
          else if (doc.type === 'ADJUSTMENT') {
            // transferQty represents the delta (can be positive or negative)
            // Or counted quantity passed directly
            const targetLocId = doc.sourceLocationId!;
            const quant = await tx.stockQuant.findUnique({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: targetLocId,
                },
              },
            });

            const recordedQty = quant ? quant.quantity : 0;
            const countedQty = item.requestedQty;
            const delta = countedQty - recordedQty;

            // Set new balance
            await tx.stockQuant.upsert({
              where: {
                productId_locationId: {
                  productId: item.productId,
                  locationId: targetLocId,
                },
              },
              update: { quantity: countedQty },
              create: {
                productId: item.productId,
                locationId: targetLocId,
                quantity: countedQty,
              },
            });

            // If delta > 0: stock gain (Inventory Loss -> Location)
            // If delta < 0: stock loss (Location -> Inventory Loss)
            const srcId = delta >= 0 ? lossLoc.id : targetLocId;
            const dstId = delta >= 0 ? targetLocId : lossLoc.id;

            await tx.stockMove.create({
              data: {
                documentId: doc.id,
                productId: item.productId,
                sourceLocationId: srcId,
                destLocationId: dstId,
                quantity: Math.abs(delta),
                userId: req.user?.id,
                notes: `Stock count adjustment: Counted ${countedQty}, Recorded ${recordedQty}, Diff ${delta > 0 ? '+' : ''}${delta}`,
              },
            });

            await tx.operationItem.update({
              where: { id: item.id },
              data: { doneQty: countedQty },
            });
          }
        }

        // Mark document as DONE
        await tx.operationDocument.update({
          where: { id: doc.id },
          data: {
            status: 'DONE',
            validatedAt: new Date(),
          },
        });
      });

      const updated = await prisma.operationDocument.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
          stockMoves: true,
        },
      });

      res.json({ message: 'Operation validated successfully. Stock ledger updated.', operation: updated });
      return;
    }

    res.status(400).json({ error: `Unknown action "${action}".` });
  } catch (error: any) {
    console.error('Error executing operation action:', error);
    res.status(400).json({ error: error.message || 'Operation action failed.' });
  }
});

export default router;
