export type Role = 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  createdAt: string;
  locations?: Location[];
}

export interface Location {
  id: string;
  warehouseId?: string;
  warehouse?: Warehouse;
  name: string;
  code: string;
  type: 'INTERNAL' | 'VENDOR' | 'CUSTOMER' | 'INVENTORY_LOSS';
  createdAt: string;
  stockQuants?: StockQuant[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    products: number;
  };
}

export interface StockQuant {
  id: string;
  productId: string;
  product?: Product;
  locationId: string;
  location: Location;
  quantity: number;
  reservedQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category: Category;
  uom: string;
  costPrice: number;
  minStockThreshold: number;
  reorderQty: number;
  totalStock?: number;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  stockQuants?: StockQuant[];
  createdAt: string;
  updatedAt: string;
}

export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';
export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface OperationItem {
  id: string;
  documentId: string;
  productId: string;
  product: Product;
  requestedQty: number;
  pickedQty: number;
  packedQty: number;
  doneQty: number;
}

export interface OperationDocument {
  id: string;
  reference: string;
  type: OperationType;
  status: OperationStatus;
  partnerName?: string;
  sourceLocationId?: string;
  sourceLocation?: Location;
  destLocationId?: string;
  destLocation?: Location;
  scheduledDate: string;
  validatedAt?: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OperationItem[];
  stockMoves?: StockMove[];
}

export interface StockMove {
  id: string;
  documentId?: string;
  document?: OperationDocument;
  productId: string;
  product: Product;
  sourceLocationId: string;
  sourceLocation: Location;
  destLocationId: string;
  destLocation: Location;
  quantity: number;
  timestamp: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface DashboardKPIs {
  totalProductsCount: number;
  totalStockUnits: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

export interface LowStockAlert {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStockThreshold: number;
  reorderQty: number;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
}
