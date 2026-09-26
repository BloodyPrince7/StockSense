import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  Eye,
  TrendingDown,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
  Plus,
  ArrowRight,
  Layers,
  MapPin,
  Building2,
  Package,
} from 'lucide-react';
import api from '../services/api';
import DynamicFilterBar from '../components/DynamicFilterBar';
import NewOperationModal from '../components/NewOperationModal';
import NewProductModal from '../components/NewProductModal';
import OperationDetailModal from '../components/OperationDetailModal';
import {
  DashboardKPIs,
  OperationDocument,
  Warehouse,
  Category,
  Location,
  Product,
  LowStockAlert,
  StockMove,
} from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalProductsCount: 0,
    totalStockUnits: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  });

  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [operations, setOperations] = useState<OperationDocument[]>([]);
  const [recentMoves, setRecentMoves] = useState<StockMove[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    warehouseId: 'ALL',
    categoryId: 'ALL',
    search: '',
  });

  // Modal states
  const [isNewOpOpen, setIsNewOpOpen] = useState(false);
  const [isNewProdOpen, setIsNewProdOpen] = useState(false);
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, opRes, whRes, catRes, locRes, prodRes] = await Promise.all([
        api.get('/ledger/dashboard-stats'),
        api.get('/operations', { params: filters }),
        api.get('/warehouses'),
        api.get('/products/categories'),
        api.get('/warehouses/locations/all'),
        api.get('/products'),
      ]);

      setKpis(kpiRes.data.kpis);
      setAlerts(kpiRes.data.lowStockAlerts || []);
      setRecentMoves(kpiRes.data.recentMoves || []);
      setOperations(opRes.data.operations || []);
      setWarehouses(whRes.data.warehouses || []);
      setCategories(catRes.data.categories || []);
      setLocations(locRes.data.locations || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'WAITING':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">Waiting (Picked)</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">Ready (Packed)</span>;
      case 'DONE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Done</span>;
      case 'CANCELED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">Canceled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DELIVERY':
        return <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />;
      case 'INTERNAL':
        return <Shuffle className="w-3.5 h-3.5 text-cyan-600" />;
      case 'ADJUSTMENT':
        return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Subheader / Action bar */}
      <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inventory Overview</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">Main Central Warehouse (WH-MAIN)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewProdOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => setIsNewOpOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New Operation</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Architecture Flow: Odoo-Style Operation Kanban Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operations Overview (Click to open list view)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Receipts (Incoming) */}
            <div
              onClick={() => navigate('/operations?type=RECEIPT')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <ArrowDownToLine className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">
                      Receipts
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800">
                    Incoming
                  </span>
                </div>

                <div className="py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {kpis.pendingReceipts}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 uppercase">
                      To Process
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Shipments awaiting vendor receipt & shelving
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-emerald-700 font-medium">
                <span>View Receipts List</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Delivery Orders (Outgoing) */}
            <div
              onClick={() => navigate('/operations?type=DELIVERY')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <ArrowUpFromLine className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 group-hover:text-amber-700 transition-colors">
                      Delivery Orders
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100/70 text-amber-800">
                    Outgoing
                  </span>
                </div>

                <div className="py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {kpis.pendingDeliveries}
                    </span>
                    <span className="text-xs font-semibold text-amber-700 uppercase">
                      To Deliver
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Customer orders awaiting picking & dispatch
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-amber-700 font-medium">
                <span>View Delivery List</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Internal Transfers */}
            <div
              onClick={() => navigate('/operations?type=INTERNAL')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-cyan-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 group-hover:text-cyan-700 transition-colors">
                      Internal Transfers
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-cyan-100/70 text-cyan-800">
                    Internal
                  </span>
                </div>

                <div className="py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {kpis.scheduledTransfers}
                    </span>
                    <span className="text-xs font-semibold text-cyan-700 uppercase">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Inter-rack & inter-warehouse relocations
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-cyan-700 font-medium">
                <span>View Transfers List</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Inventory Adjustments */}
            <div
              onClick={() => navigate('/operations?type=ADJUSTMENT')}
              className="bg-white rounded-2xl border border-slate-200 hover:border-rose-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 group-hover:text-rose-700 transition-colors">
                      Adjustments
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-100/70 text-rose-800">
                    Reconciliation
                  </span>
                </div>

                <div className="py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {operations.filter((o) => o.type === 'ADJUSTMENT').length}
                    </span>
                    <span className="text-xs font-semibold text-rose-700 uppercase">
                      Audits
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Physical count vs recorded stock reconciliations
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-rose-700 font-medium">
                <span>View Adjustments</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Drawer */}
        {alerts.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white mt-0.5 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Low Stock Attention Required ({alerts.length} item{alerts.length > 1 ? 's' : ''})
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  The following items have fallen below their minimum reorder thresholds:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {alerts.map((al) => (
                    <span
                      key={al.id}
                      className="px-2.5 py-1 rounded-lg bg-white/90 border border-amber-300 text-xs font-semibold text-amber-900 shadow-2xs flex items-center gap-1.5"
                    >
                      <span className="font-mono text-[10px] text-amber-700">{al.sku}</span>
                      <span>{al.name}</span>
                      <span className="text-red-700 font-bold">
                        ({al.currentStock} left / Min: {al.minStockThreshold})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsNewOpOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-end md:self-center"
            >
              Create Restock Receipt
            </button>
          </div>
        )}

        {/* Dynamic Multi-Criteria Filters Bar */}
        <DynamicFilterBar
          filters={filters}
          onChange={setFilters}
          warehouses={warehouses}
          categories={categories}
        />

        {/* Main Operations List & Recent Move History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations List Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Operations ({operations.length})
                </h2>
              </div>
              <button
                onClick={() => setIsNewOpOpen(true)}
                className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                <span>+ Create Operation</span>
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Partner / Location</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No operations match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    operations.map((op) => (
                      <tr
                        key={op.id}
                        onClick={() => setSelectedOpId(op.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {op.reference}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            {getTypeIcon(op.type)}
                            <span>{op.type}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 truncate max-w-[180px]">
                          {op.partnerName ? (
                            <span className="font-medium text-slate-800">{op.partnerName}</span>
                          ) : (
                            <span>{op.sourceLocation?.name} → {op.destLocation?.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {op.items.length} item{op.items.length > 1 ? 's' : ''}
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(op.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOpId(op.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Move History / Stock Ledger Ticker */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Move History Ticker</span>
              </h3>
              <a
                href="/ledger"
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-800 flex items-center"
              >
                View All <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
              {recentMoves.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent stock movements.</p>
              ) : (
                recentMoves.map((m) => (
                  <div key={m.id} className="pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{m.product?.name}</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +{m.quantity} {m.product?.uom}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {m.sourceLocation?.name} → {m.destLocation?.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>By {m.user?.name || 'System'}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {isNewOpOpen && (
        <NewOperationModal
          onClose={() => setIsNewOpOpen(false)}
          onSuccess={fetchDashboardData}
          products={products}
          locations={locations}
        />
      )}

      {isNewProdOpen && (
        <NewProductModal
          onClose={() => setIsNewProdOpen(false)}
          onSuccess={fetchDashboardData}
          categories={categories}
          locations={locations}
        />
      )}

      {selectedOpId && (
        <OperationDetailModal
          operationId={selectedOpId}
          onClose={() => setSelectedOpId(null)}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default DashboardPage;
