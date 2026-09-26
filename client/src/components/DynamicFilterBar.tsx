import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Warehouse, Category } from '../types';

interface FilterState {
  type: string;
  status: string;
  warehouseId: string;
  categoryId: string;
  search: string;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  warehouses: Warehouse[];
  categories: Category[];
  showTypeFilter?: boolean;
  showCategoryFilter?: boolean;
  showWarehouseFilter?: boolean;
  showStatusFilter?: boolean;
  placeholder?: string;
}

const DynamicFilterBar: React.FC<Props> = ({
  filters,
  onChange,
  warehouses,
  categories,
  showTypeFilter = true,
  showCategoryFilter = true,
  showWarehouseFilter = true,
  showStatusFilter = true,
  placeholder = 'Search by SKU, reference, or description...',
}) => {
  const handleUpdate = (field: keyof FilterState, value: string) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const handleReset = () => {
    onChange({
      type: 'ALL',
      status: 'ALL',
      warehouseId: 'ALL',
      categoryId: 'ALL',
      search: '',
    });
  };

  const isFiltered =
    filters.type !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.warehouseId !== 'ALL' ||
    filters.categoryId !== 'ALL' ||
    filters.search !== '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={placeholder}
            value={filters.search}
            onChange={(e) => handleUpdate('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Document Type Filter */}
          {showTypeFilter && (
            <select
              value={filters.type}
              onChange={(e) => handleUpdate('type', e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="ALL">All Document Types</option>
              <option value="RECEIPT">Receipts (Incoming)</option>
              <option value="DELIVERY">Delivery Orders (Outgoing)</option>
              <option value="INTERNAL">Internal Transfers</option>
              <option value="ADJUSTMENT">Stock Adjustments</option>
            </select>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <select
              value={filters.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting (Picked)</option>
              <option value="READY">Ready (Packed)</option>
              <option value="DONE">Done (Validated)</option>
              <option value="CANCELED">Canceled</option>
            </select>
          )}

          {/* Warehouse Filter */}
          {showWarehouseFilter && (
            <select
              value={filters.warehouseId}
              onChange={(e) => handleUpdate('warehouseId', e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          )}

          {/* Category Filter */}
          {showCategoryFilter && (
            <select
              value={filters.categoryId}
              onChange={(e) => handleUpdate('categoryId', e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              onClick={handleReset}
              title="Reset all filters"
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicFilterBar;
