import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  SlidersHorizontal,
  Plus,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import Header from '../components/Header';
import NewOperationModal from '../components/NewOperationModal';
import OperationDetailModal from '../components/OperationDetailModal';
import { OperationDocument, OperationType, Product, Location, Warehouse } from '../types';

const OperationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentType = (searchParams.get('type') as OperationType) || 'RECEIPT';

  const [operations, setOperations] = useState<OperationDocument[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isNewOpOpen, setIsNewOpOpen] = useState(false);
  const [selectedOpId, setSelectedOpId] = useState<string | null>(null);

  const fetchOperations = async () => {
    try {
      const [opRes, prodRes, locRes, whRes] = await Promise.all([
        api.get('/operations', { params: { type: currentType } }),
        api.get('/products'),
        api.get('/warehouses/locations/all'),
        api.get('/warehouses'),
      ]);

      setOperations(opRes.data.operations || []);
      setProducts(prodRes.data.products || []);
      setLocations(locRes.data.locations || []);
      setWarehouses(whRes.data.warehouses || []);
    } catch (err) {
      console.error('Error fetching operations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [currentType]);

  const handleTypeChange = (type: OperationType) => {
    setSearchParams({ type });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'WAITING':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">Waiting (Picked)</span>;
      case 'READY':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">Ready (Packed)</span>;
      case 'DONE':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Done</span>;
      case 'CANCELED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">Canceled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const filteredOps = operations.filter((op) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      op.reference.toLowerCase().includes(q) ||
      (op.partnerName && op.partnerName.toLowerCase().includes(q)) ||
      (op.notes && op.notes.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <Header
        title="Stock Operations & Logistics"
        subtitle="Manage incoming receipts, outgoing delivery orders, internal transfers & stock adjustments"
        onNewOperation={() => setIsNewOpOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Operation Type Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleTypeChange('RECEIPT')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
              currentType === 'RECEIPT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Incoming</p>
              <p className="text-sm font-bold mt-0.5">Receipts</p>
            </div>
            <ArrowDownToLine className="w-5 h-5 opacity-90" />
          </button>

          <button
            onClick={() => handleTypeChange('DELIVERY')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
              currentType === 'DELIVERY'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Outgoing</p>
              <p className="text-sm font-bold mt-0.5">Delivery Orders</p>
            </div>
            <ArrowUpFromLine className="w-5 h-5 opacity-90" />
          </button>

          <button
            onClick={() => handleTypeChange('INTERNAL')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
              currentType === 'INTERNAL'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Inter-Rack</p>
              <p className="text-sm font-bold mt-0.5">Internal Transfers</p>
            </div>
            <Shuffle className="w-5 h-5 opacity-90" />
          </button>

          <button
            onClick={() => handleTypeChange('ADJUSTMENT')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
              currentType === 'ADJUSTMENT'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Reconciliation</p>
              <p className="text-sm font-bold mt-0.5">Adjustments</p>
            </div>
            <SlidersHorizontal className="w-5 h-5 opacity-90" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${currentType.toLowerCase()} by reference, partner or notes...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting (Picked)</option>
              <option value="READY">Ready (Packed)</option>
              <option value="DONE">Done (Validated)</option>
              <option value="CANCELED">Canceled</option>
            </select>

            <button
              onClick={() => setIsNewOpOpen(true)}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create {currentType}</span>
            </button>
          </div>
        </div>

        {/* Operations Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-3">Partner / Reason</th>
                <th className="py-3 px-3">From Location</th>
                <th className="py-3 px-3">To Location</th>
                <th className="py-3 px-3">Scheduled / Validated</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">View / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No {currentType.toLowerCase()} operations found.
                  </td>
                </tr>
              ) : (
                filteredOps.map((op) => (
                  <tr
                    key={op.id}
                    onClick={() => setSelectedOpId(op.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {op.reference}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {op.partnerName || op.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-medium text-slate-700">{op.sourceLocation?.name}</span>
                      <p className="text-[10px] font-mono text-slate-400">{op.sourceLocation?.code}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-medium text-slate-700">{op.destLocation?.name}</span>
                      <p className="text-[10px] font-mono text-slate-400">{op.destLocation?.code}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(op.scheduledDate).toLocaleDateString()}</span>
                      </div>
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
      </main>

      {/* Modals */}
      {isNewOpOpen && (
        <NewOperationModal
          initialType={currentType}
          onClose={() => setIsNewOpOpen(false)}
          onSuccess={fetchOperations}
          products={products}
          locations={locations}
        />
      )}

      {selectedOpId && (
        <OperationDetailModal
          operationId={selectedOpId}
          onClose={() => setSelectedOpId(null)}
          onRefresh={fetchOperations}
        />
      )}
    </div>
  );
};

export default OperationsPage;
