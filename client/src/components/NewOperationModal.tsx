import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, Shuffle, SlidersHorizontal, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Product, Location, OperationType } from '../types';

interface Props {
  initialType?: OperationType;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  locations: Location[];
}

const NewOperationModal: React.FC<Props> = ({
  initialType = 'RECEIPT',
  onClose,
  onSuccess,
  products,
  locations,
}) => {
  const [type, setType] = useState<OperationType>(initialType);
  const [partnerName, setPartnerName] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; requestedQty: number }[]>([
    { productId: products[0]?.id || '', requestedQty: 10 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto configure default locations based on type
  React.useEffect(() => {
    const internalLocs = locations.filter((l) => l.type === 'INTERNAL');
    const vendorLoc = locations.find((l) => l.type === 'VENDOR');
    const customerLoc = locations.find((l) => l.type === 'CUSTOMER');
    const lossLoc = locations.find((l) => l.type === 'INVENTORY_LOSS');

    if (type === 'RECEIPT') {
      setSourceLocationId(vendorLoc?.id || '');
      setDestLocationId(internalLocs[0]?.id || '');
    } else if (type === 'DELIVERY') {
      setSourceLocationId(internalLocs[0]?.id || '');
      setDestLocationId(customerLoc?.id || '');
    } else if (type === 'INTERNAL') {
      setSourceLocationId(internalLocs[0]?.id || '');
      setDestLocationId(internalLocs[1]?.id || internalLocs[0]?.id || '');
    } else if (type === 'ADJUSTMENT') {
      setSourceLocationId(internalLocs[0]?.id || '');
      setDestLocationId(lossLoc?.id || '');
    }
  }, [type, locations]);

  const addItemRow = () => {
    setItems([...items, { productId: products[0]?.id || '', requestedQty: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: 'productId' | 'requestedQty', val: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: val };
    setItems(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.some((it) => !it.productId || it.requestedQty <= 0)) {
      setError('Please specify a valid product and quantity for each item line.');
      return;
    }

    if (type === 'INTERNAL' && sourceLocationId === destLocationId) {
      setError('Source location and destination location must be different for internal transfers.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/operations', {
        type,
        partnerName: partnerName || (type === 'RECEIPT' ? 'General Supplier' : type === 'DELIVERY' ? 'Standard Customer' : undefined),
        sourceLocationId,
        destLocationId,
        notes,
        items,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create operation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold">Create New Operation</h2>
            <p className="text-xs text-slate-400">Initialize a stock receipt, delivery order, internal move, or adjustment</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Operation Type Selector Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Operation Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('RECEIPT')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  type === 'RECEIPT'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                <span>Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setType('DELIVERY')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  type === 'DELIVERY'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <ArrowUpFromLine className="w-4 h-4 text-amber-600" />
                <span>Delivery Order</span>
              </button>

              <button
                type="button"
                onClick={() => setType('INTERNAL')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  type === 'INTERNAL'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Shuffle className="w-4 h-4 text-cyan-600" />
                <span>Internal Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                  type === 'ADJUSTMENT'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-semibold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-rose-600" />
                <span>Adjustment</span>
              </button>
            </div>
          </div>

          {/* Partner / Client */}
          {(type === 'RECEIPT' || type === 'DELIVERY') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                {type === 'RECEIPT' ? 'Vendor / Supplier Name' : 'Customer / Recipient'}
              </label>
              <input
                type="text"
                placeholder={type === 'RECEIPT' ? 'e.g. National Steel Corp' : 'e.g. Apex Construction'}
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>
          )}

          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Source Location</label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code}) [{loc.type}]
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Destination Location</label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code}) [{loc.type}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Operation Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {items.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} ({p.uom})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28 flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.requestedQty}
                      onChange={(e) => updateItem(idx, 'requestedQty', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notes & Reference (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Sales order dispatch, vendor shipment reference, or damaged goods note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>

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
              {loading ? 'Creating...' : 'Create Operation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOperationModal;
