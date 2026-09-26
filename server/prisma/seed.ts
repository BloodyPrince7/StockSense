import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense comprehensive database seeding...');

  // Clean existing data
  await prisma.stockMove.deleteMany();
  await prisma.operationItem.deleteMany();
  await prisma.operationDocument.deleteMany();
  await prisma.stockQuant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  const manager = await prisma.user.create({
    data: {
      name: 'Apoorva Sharma',
      email: 'manager@stocksense.com',
      passwordHash,
      role: 'INVENTORY_MANAGER',
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Shiv Vashisth',
      email: 'staff@stocksense.com',
      passwordHash: staffPasswordHash,
      role: 'WAREHOUSE_STAFF',
    },
  });

  console.log('✅ Created users: manager@stocksense.com and staff@stocksense.com');

  // 2. Create Warehouses
  const whMain = await prisma.warehouse.create({
    data: {
      name: 'Main Central Warehouse',
      code: 'WH-MAIN',
      address: 'Plot 42, North Logistics Corridor',
    },
  });

  const whHub = await prisma.warehouse.create({
    data: {
      name: 'Secondary Distribution Hub',
      code: 'WH-HUB',
      address: 'Sector 9, Cargo Terminal South',
    },
  });

  console.log('✅ Created warehouses: WH-MAIN and WH-HUB');

  // 3. Create Locations
  const vendorLoc = await prisma.location.create({
    data: { name: 'Vendors / Suppliers', code: 'PARTNERS/VENDORS', type: 'VENDOR' },
  });

  const customerLoc = await prisma.location.create({
    data: { name: 'Customers / Shipments', code: 'PARTNERS/CUSTOMERS', type: 'CUSTOMER' },
  });

  const lossLoc = await prisma.location.create({
    data: { name: 'Inventory Scraps & Adjustments', code: 'VIRTUAL/LOSS', type: 'INVENTORY_LOSS' },
  });

  const mainStore = await prisma.location.create({
    data: {
      warehouseId: whMain.id,
      name: 'Main Store',
      code: 'WH-MAIN/STOCK',
      type: 'INTERNAL',
    },
  });

  const prodRack = await prisma.location.create({
    data: {
      warehouseId: whMain.id,
      name: 'Production Rack',
      code: 'WH-MAIN/PROD-RACK',
      type: 'INTERNAL',
    },
  });

  const rackA = await prisma.location.create({
    data: {
      warehouseId: whMain.id,
      name: 'Rack A',
      code: 'WH-MAIN/RACK-A',
      type: 'INTERNAL',
    },
  });

  const rackB = await prisma.location.create({
    data: {
      warehouseId: whMain.id,
      name: 'Rack B',
      code: 'WH-MAIN/RACK-B',
      type: 'INTERNAL',
    },
  });

  const hubStore = await prisma.location.create({
    data: {
      warehouseId: whHub.id,
      name: 'Warehouse 2 Store',
      code: 'WH-HUB/STOCK',
      type: 'INTERNAL',
    },
  });

  console.log('✅ Created internal and virtual locations');

  // 4. Create Categories
  const catRaw = await prisma.category.create({
    data: { name: 'Raw Materials', description: 'Metals, sheets, structural components' },
  });

  const catFurn = await prisma.category.create({
    data: { name: 'Furniture', description: 'Commercial office furniture & seating' },
  });

  const catHardware = await prisma.category.create({
    data: { name: 'Hardware & Fasteners', description: 'Bolts, screws, brackets and fittings' },
  });

  // 5. Create Products
  const steelProduct = await prisma.product.create({
    data: {
      name: 'Steel Rods (High Tensile)',
      sku: 'STL-ROD-100',
      categoryId: catRaw.id,
      uom: 'kg',
      costPrice: 4.5,
      minStockThreshold: 25.0,
      reorderQty: 100.0,
    },
  });

  const chairProduct = await prisma.product.create({
    data: {
      name: 'Ergonomic Office Chair',
      sku: 'CHR-ERG-20',
      categoryId: catFurn.id,
      uom: 'Units',
      costPrice: 85.0,
      minStockThreshold: 10.0,
      reorderQty: 40.0,
    },
  });

  const screwsProduct = await prisma.product.create({
    data: {
      name: 'Industrial Screws M6',
      sku: 'SCR-M6-500',
      categoryId: catHardware.id,
      uom: 'Boxes',
      costPrice: 12.0,
      minStockThreshold: 30.0,
      reorderQty: 150.0,
    },
  });

  const deskProduct = await prisma.product.create({
    data: {
      name: 'Executive Workstation Desk',
      sku: 'DSK-EX-10',
      categoryId: catFurn.id,
      uom: 'Units',
      costPrice: 190.0,
      minStockThreshold: 8.0,
      reorderQty: 20.0,
    },
  });

  // Initial stock for chairs & screws & desks
  await prisma.stockQuant.create({
    data: { productId: chairProduct.id, locationId: mainStore.id, quantity: 45.0 },
  });
  await prisma.stockQuant.create({
    data: { productId: screwsProduct.id, locationId: rackA.id, quantity: 120.0 },
  });
  // Low stock item: Desk with 2 units only (Threshold: 8)
  await prisma.stockQuant.create({
    data: { productId: deskProduct.id, locationId: mainStore.id, quantity: 2.0 },
  });

  // Initial ledger entries
  await prisma.stockMove.create({
    data: {
      productId: chairProduct.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: mainStore.id,
      quantity: 45.0,
      userId: manager.id,
      notes: 'Initial inventory count for Chairs',
    },
  });
  await prisma.stockMove.create({
    data: {
      productId: screwsProduct.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: rackA.id,
      quantity: 120.0,
      userId: manager.id,
      notes: 'Initial inventory count for Screws in Rack A',
    },
  });
  await prisma.stockMove.create({
    data: {
      productId: deskProduct.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: mainStore.id,
      quantity: 2.0,
      userId: manager.id,
      notes: 'Initial inventory count for Desks (Low Stock alert)',
    },
  });

  console.log('✅ Created products and initial stock quants');

  // 6. Execute Flow from Problem Statement:
  // Step 1: Receive Goods from Vendor: Receive 100 kg Steel -> Stock: +100 in Main Store
  const receipt1 = await prisma.operationDocument.create({
    data: {
      reference: 'REC-2026-0001',
      type: 'RECEIPT',
      status: 'DONE',
      partnerName: 'National Steel Corp',
      sourceLocationId: vendorLoc.id,
      destLocationId: mainStore.id,
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      validatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdById: manager.id,
      notes: 'PO-8821 Vendor shipment of high-tensile steel rods',
      items: {
        create: [
          {
            productId: steelProduct.id,
            requestedQty: 100.0,
            pickedQty: 0,
            packedQty: 0,
            doneQty: 100.0,
          },
        ],
      },
    },
  });

  // Step 1 Ledger move
  await prisma.stockMove.create({
    data: {
      documentId: receipt1.id,
      productId: steelProduct.id,
      sourceLocationId: vendorLoc.id,
      destLocationId: mainStore.id,
      quantity: 100.0,
      userId: staff.id,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Receipt validated: +100 kg Steel Rods from National Steel Corp',
    },
  });

  // Step 2: Internal Transfer: Main Store -> Production Rack (Move 40 kg)
  // Stock unchanged in total, but new location updated
  const transfer1 = await prisma.operationDocument.create({
    data: {
      reference: 'INT-2026-0001',
      type: 'INTERNAL',
      status: 'DONE',
      partnerName: 'Internal Production Requisition',
      sourceLocationId: mainStore.id,
      destLocationId: prodRack.id,
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      validatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdById: staff.id,
      notes: 'Stock staging for frame assembly line',
      items: {
        create: [
          {
            productId: steelProduct.id,
            requestedQty: 40.0,
            pickedQty: 40.0,
            packedQty: 40.0,
            doneQty: 40.0,
          },
        ],
      },
    },
  });

  // Step 2 Ledger move
  await prisma.stockMove.create({
    data: {
      documentId: transfer1.id,
      productId: steelProduct.id,
      sourceLocationId: mainStore.id,
      destLocationId: prodRack.id,
      quantity: 40.0,
      userId: staff.id,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: 'Internal transfer: 40 kg Steel moved to Production Rack',
    },
  });

  // Step 3: Deliver finished goods: Deliver 20 steel -> Stock: -20
  const delivery1 = await prisma.operationDocument.create({
    data: {
      reference: 'DEL-2026-0001',
      type: 'DELIVERY',
      status: 'DONE',
      partnerName: 'Apex Infrastructure Ltd',
      sourceLocationId: prodRack.id,
      destLocationId: customerLoc.id,
      scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      validatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdById: manager.id,
      notes: 'Sales Order SO-1049 dispatch',
      items: {
        create: [
          {
            productId: steelProduct.id,
            requestedQty: 20.0,
            pickedQty: 20.0,
            packedQty: 20.0,
            doneQty: 20.0,
          },
        ],
      },
    },
  });

  // Step 3 Ledger move
  await prisma.stockMove.create({
    data: {
      documentId: delivery1.id,
      productId: steelProduct.id,
      sourceLocationId: prodRack.id,
      destLocationId: customerLoc.id,
      quantity: 20.0,
      userId: staff.id,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: 'Delivery fulfilled: 20 kg Steel dispatched to Apex Infrastructure Ltd',
    },
  });

  // Step 4: Adjust damaged items: 3 kg steel damaged -> Stock: -3. Everything logged in Stock Ledger.
  const adj1 = await prisma.operationDocument.create({
    data: {
      reference: 'ADJ-2026-0001',
      type: 'ADJUSTMENT',
      status: 'DONE',
      partnerName: 'Physical Audit Team',
      sourceLocationId: prodRack.id,
      destLocationId: lossLoc.id,
      scheduledDate: new Date(),
      validatedAt: new Date(),
      createdById: staff.id,
      notes: 'Damaged during cutting operation (3 kg scrapped)',
      items: {
        create: [
          {
            productId: steelProduct.id,
            requestedQty: 17.0, // Counted 17 kg remaining in Prod Rack (was 40 - 20 = 20)
            pickedQty: 0,
            packedQty: 0,
            doneQty: 17.0,
          },
        ],
      },
    },
  });

  // Step 4 Ledger move
  await prisma.stockMove.create({
    data: {
      documentId: adj1.id,
      productId: steelProduct.id,
      sourceLocationId: prodRack.id,
      destLocationId: lossLoc.id,
      quantity: 3.0,
      userId: staff.id,
      timestamp: new Date(),
      notes: 'Stock count adjustment: Counted 17 kg, Recorded 20 kg, Diff -3 kg (Damaged items)',
    },
  });

  // Final StockQuants for Steel:
  // Main Store: 100 - 40 = 60 kg
  // Prod Rack: 40 - 20 - 3 = 17 kg
  await prisma.stockQuant.create({
    data: { productId: steelProduct.id, locationId: mainStore.id, quantity: 60.0 },
  });
  await prisma.stockQuant.create({
    data: { productId: steelProduct.id, locationId: prodRack.id, quantity: 17.0 },
  });

  // 7. Add Pending Operations for Live Dashboard KPIs
  // Pending Receipt: Screws from Fastener Tech
  await prisma.operationDocument.create({
    data: {
      reference: 'REC-2026-0002',
      type: 'RECEIPT',
      status: 'READY',
      partnerName: 'Fasteners Global Supply',
      sourceLocationId: vendorLoc.id,
      destLocationId: rackA.id,
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdById: manager.id,
      notes: 'Scheduled container arrival: Screws replenishment',
      items: {
        create: [
          {
            productId: screwsProduct.id,
            requestedQty: 80.0,
            pickedQty: 0,
            packedQty: 0,
            doneQty: 0,
          },
        ],
      },
    },
  });

  // Pending Delivery: 10 Chairs to Metro Corp (Status: WAITING - picked, awaiting pack)
  await prisma.operationDocument.create({
    data: {
      reference: 'DEL-2026-0002',
      type: 'DELIVERY',
      status: 'WAITING',
      partnerName: 'Metro Corporate Offices',
      sourceLocationId: mainStore.id,
      destLocationId: customerLoc.id,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdById: staff.id,
      notes: 'Delivery order: 10 Chairs (items picked by warehouse staff)',
      items: {
        create: [
          {
            productId: chairProduct.id,
            requestedQty: 10.0,
            pickedQty: 10.0,
            packedQty: 0,
            doneQty: 0,
          },
        ],
      },
    },
  });

  // Pending Internal Transfer: Scheduled transfer Rack A -> Rack B
  await prisma.operationDocument.create({
    data: {
      reference: 'INT-2026-0002',
      type: 'INTERNAL',
      status: 'DRAFT',
      partnerName: 'Rack Optimization Task',
      sourceLocationId: rackA.id,
      destLocationId: rackB.id,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: staff.id,
      notes: 'Moving 20 boxes of screws to balance Rack B load',
      items: {
        create: [
          {
            productId: screwsProduct.id,
            requestedQty: 20.0,
            pickedQty: 0,
            packedQty: 0,
            doneQty: 0,
          },
        ],
      },
    },
  });

  console.log('✅ Created pending operations for live Dashboard KPIs');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
