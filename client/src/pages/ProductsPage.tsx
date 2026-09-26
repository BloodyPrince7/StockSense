import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Boxes,
  Building2,
  SlidersHorizontal,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  Eye,
  MapPin,
  TrendingDown,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import Header from '../components/Header';
import NewProductModal from '../components/NewProductModal';
import { Product, Category, Location, Warehouse } from '../types';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'catalog';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isNewProdOpen, setIsNewProdOpen] = useState(false);

  // New Category Modal / State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catCreating, setCatCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, catRes, locRes, whRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
        api.get('/warehouses/locations/all'),
        api.get('/warehouses'),
      ]);

      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
      setLocations(locRes.data.locations || []);
      setWarehouses(whRes.data.warehouses || []);
    } catch (err) {
      console.error('Error loading products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setCatCreating(true);
    try {
      await api.post('/products/categories', {
        name: newCatName,
        description: newCatDesc,
      });
      setNewCatName('');
      setNewCatDesc('');
      fetchData();
    } catch (err) {
      console.error('Error creating category:', err);
    } finally {
      setCatCreating(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'LOW_STOCK' && p.isLowStock && !p.isOutOfStock) ||
      (statusFilter === 'OUT_OF_STOCK' && p.isOutOfStock) ||
      (statusFilter === 'IN_STOCK' && !p.isLowStock && !p.isOutOfStock);

    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <Header
        title="Product Master & Stock Allocation"
        subtitle="Manage product catalog, location-level balances, categories & reordering rules"
        onNewProduct={() => setIsNewProdOpen(true)}
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => handleTabChange('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'catalog'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('stock-locations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'stock-locations'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Stock per Location</span>
          </button>

          <button
            onClick={() => handleTabChange('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'categories'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('reordering')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'reordering'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Reordering Rules</span>
          </button>
        </div>

        {/* TAB 1: Products Catalog */}
        {currentTab === 'catalog' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by SKU or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                >
                  <option value="ALL">All Stock Statuses</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                <button
                  onClick={() => setIsNewProdOpen(true)}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Cost Price</th>
                    <th className="py-3 px-3 text-right">Min Threshold</th>
                    <th className="py-3 px-3 text-right">Total Available</th>
                    <th className="py-3 px-4">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No products match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {p.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {p.category?.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          ${p.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-500">
                          {p.minStockThreshold} {p.uom}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-sm text-slate-900">
                          {p.totalStock ?? 0} <span className="text-xs font-normal text-slate-500">{p.uom}</span>
                        </td>
                        <td className="py-3 px-4">
                          {p.isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Out of Stock
                            </span>
                          ) : p.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <TrendingDown className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Stock Availability per Location */}
        {currentTab === 'stock-locations' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations
                .filter((l) => l.type === 'INTERNAL')
                .map((loc) => (
                  <div
                    key={loc.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span>{loc.name}</span>
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{loc.code}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {loc.warehouse?.name || 'Warehouse'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Current Items in Stock
                      </p>
                      {(!loc.stockQuants || loc.stockQuants.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-2">No items currently stored in this location.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 text-xs">
                          {loc.stockQuants.map((q) => (
                            <div key={q.id} className="py-2 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-slate-800">{q.product?.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{q.product?.sku}</p>
                              </div>
                              <span className="font-bold font-mono text-purple-700 text-sm">
                                {q.quantity} {q.product?.uom}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: Categories */}
        {currentTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Category Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Add New Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrical Components"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Short description of items in this category"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={catCreating}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  {catCreating ? 'Saving...' : 'Save Category'}
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                        {c._count?.products ?? 0} items
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-500 mt-2">{c.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Reordering Rules */}
        {currentTab === 'reordering' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Automated Inventory Reordering Rules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rules specify when stock dips below safe thresholds to trigger replenishment receipts.
              </p>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3 text-right">Min Trigger Threshold</th>
                  <th className="py-3 px-3 text-right">Target Reorder Qty</th>
                  <th className="py-3 px-3 text-right">Current Available Stock</th>
                  <th className="py-3 px-4">Replenishment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const needsReorder = (p.totalStock ?? 0) <= p.minStockThreshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.sku}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {p.minStockThreshold} {p.uom}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-purple-700 font-mono">
                        +{p.reorderQty} {p.uom}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {p.totalStock ?? 0} {p.uom}
                      </td>
                      <td className="py-3 px-4">
                        {needsReorder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Triggered: Order +{p.reorderQty} {p.uom}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Stock Level Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isNewProdOpen && (
        <NewProductModal
          onClose={() => setIsNewProdOpen(false)}
          onSuccess={fetchData}
          categories={categories}
          locations={locations}
        />
      )}
    </div>
  );
};

export default ProductsPage;
