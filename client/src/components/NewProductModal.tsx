import React, { useState } from 'react';
import { X, Package, Tag, Layers, Scale, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Category, Location } from '../types';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  locations: Location[];
}

const NewProductModal: React.FC<Props> = ({ onClose, onSuccess, categories, locations }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [uom, setUom] = useState('Units');
  const [costPrice, setCostPrice] = useState('0.00');
  const [minStockThreshold, setMinStockThreshold] = useState('10');
  const [reorderQty, setReorderQty] = useState('50');
  const [initialStock, setInitialStock] = useState('0');
  const [initialLocationId, setInitialLocationId] = useState(locations[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !categoryId) {
      setError('Product Name, SKU / Code, and Category are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/products', {
        name,
        sku,
        categoryId,
        uom,
        costPrice: parseFloat(costPrice) || 0,
        minStockThreshold: parseFloat(minStockThreshold) || 10,
        reorderQty: parseFloat(reorderQty) || 50,
        initialStock: parseFloat(initialStock) || 0,
        initialLocationId: parseFloat(initialStock) > 0 ? initialLocationId : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-300 border border-purple-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Create New Product</h2>
              <p className="text-xs text-slate-400">Add an inventory item with reordering rules and stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. Steel Rods (High Tensile)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            {/* SKU / Code */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">SKU / Code *</label>
              <input
                type="text"
                placeholder="e.g. STL-ROD-100"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 uppercase"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit of Measure (UoM) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Unit of Measure (UoM)</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                <option value="Units">Units</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="Boxes">Boxes</option>
                <option value="Meters">Meters</option>
                <option value="Liters">Liters</option>
              </select>
            </div>

            {/* Min Stock Alert Threshold */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Min Stock Alert Threshold</label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            {/* Reorder Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Suggested Reorder Qty</label>
              <input
                type="number"
                step="any"
                min="0"
                value={reorderQty}
                onChange={(e) => setReorderQty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            {/* Cost Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            {/* Initial Stock (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Initial Stock (Optional)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          </div>

          {parseFloat(initialStock) > 0 && (
            <div className="space-y-1 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <label className="text-xs font-semibold text-purple-900">Initial Stock Location</label>
              <select
                value={initialLocationId}
                onChange={(e) => setInitialLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs md:text-sm text-slate-800"
              >
                {locations
                  .filter((l) => l.type === 'INTERNAL')
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProductModal;
