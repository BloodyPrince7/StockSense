import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  Filter,
  Calendar,
  User as UserIcon,
  ArrowRight,
  MapPin,
  Package,
} from 'lucide-react';
import api from '../services/api';
import Header from '../components/Header';
import { StockMove, Product, Location } from '../types';

const MoveHistoryPage: React.FC = () => {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const fetchMoves = async () => {
    try {
      const [moveRes, prodRes, locRes] = await Promise.all([
        api.get('/ledger', {
          params: {
            search: search || undefined,
            productId: selectedProduct !== 'all' ? selectedProduct : undefined,
            locationId: selectedLocation !== 'all' ? selectedLocation : undefined,
          },
        }),
        api.get('/products'),
        api.get('/warehouses/locations/all'),
      ]);

      setMoves(moveRes.data.moves || []);
      setProducts(prodRes.data.products || []);
      setLocations(locRes.data.locations || []);
    } catch (err) {
      console.error('Error fetching stock moves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoves();
  }, [search, selectedProduct, selectedLocation]);

  // Export Stock Ledger to CSV
  const handleExportCsv = () => {
    if (moves.length === 0) return;

    const headers = [
      'Timestamp',
      'Document Reference',
      'Product SKU',
      'Product Name',
      'From Location',
      'To Location',
      'Quantity',
      'UoM',
      'Done By',
      'Notes',
    ];

    const rows = moves.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.document?.reference || 'N/A',
      `"${m.product?.sku}"`,
      `"${m.product?.name}"`,
      `"${m.sourceLocation?.name} (${m.sourceLocation?.code})"`,
      `"${m.destLocation?.name} (${m.destLocation?.code})"`,
      m.quantity,
      m.product?.uom,
      `"${m.user?.name || 'System'}"`,
      `"${m.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `StockSense_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <Header
        title="Move History / Stock Ledger"
        subtitle="Immutable double-entry audit trail of all physical inventory movements & adjustments"
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filter Bar & Export */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search moves by SKU, product name, or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCsv}
              disabled={moves.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Source Location</th>
                <th className="py-3 px-3">Destination Location</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3">Done By</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No ledger move history recorded.
                  </td>
                </tr>
              ) : (
                moves.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {new Date(m.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                      {m.document?.reference || 'Direct Move'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{m.product?.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{m.product?.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-medium text-slate-700">{m.sourceLocation?.name}</span>
                      <p className="text-[10px] font-mono text-slate-400">{m.sourceLocation?.code}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-medium text-slate-700">{m.destLocation?.name}</span>
                      <p className="text-[10px] font-mono text-slate-400">{m.destLocation?.code}</p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-slate-900 whitespace-nowrap">
                      +{m.quantity} <span className="text-xs font-normal text-slate-500">{m.product?.uom}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {m.user?.name || 'System'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">
                      {m.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default MoveHistoryPage;
