import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Header from '../components/Header';
import { Warehouse, Location } from '../types';

const SettingsPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // New Warehouse Form
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whLoading, setWhLoading] = useState(false);
  const [whError, setWhError] = useState('');
  const [whSuccess, setWhSuccess] = useState('');

  // New Location Form
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locWhId, setLocWhId] = useState('');
  const [locType, setLocType] = useState('INTERNAL');
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [locSuccess, setLocSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [whRes, locRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/warehouses/locations/all'),
      ]);

      const whs = whRes.data.warehouses || [];
      setWarehouses(whs);
      if (whs.length > 0 && !locWhId) {
        setLocWhId(whs[0].id);
      }
      setLocations(locRes.data.locations || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhLoading(true);
    setWhError('');
    setWhSuccess('');

    try {
      await api.post('/warehouses', {
        name: whName,
        code: whCode,
        address: whAddress,
      });

      setWhSuccess(`Warehouse "${whName}" created successfully with default stock location.`);
      setWhName('');
      setWhCode('');
      setWhAddress('');
      fetchData();
    } catch (err: any) {
      setWhError(err.response?.data?.error || 'Failed to create warehouse.');
    } finally {
      setWhLoading(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocLoading(true);
    setLocError('');
    setLocSuccess('');

    try {
      await api.post('/warehouses/locations', {
        name: locName,
        code: locCode,
        type: locType,
        warehouseId: locWhId || undefined,
      });

      setLocSuccess(`Location "${locName}" created successfully.`);
      setLocName('');
      setLocCode('');
      fetchData();
    } catch (err: any) {
      setLocError(err.response?.data?.error || 'Failed to create location.');
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      <Header
        title="Warehouse & Location Settings"
        subtitle="Configure physical warehouses, distribution hubs, storage racks, and zones"
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Warehouse Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Add New Warehouse</h3>
                <p className="text-xs text-slate-400">Creates an independent inventory facility with default stock</p>
              </div>
            </div>

            {whError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{whError}</span>
              </div>
            )}

            {whSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{whSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Warehouse Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Eastern Regional Hub"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Short Code (Unique) *</label>
                <input
                  type="text"
                  placeholder="e.g. WH-EAST"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 88, Port Industrial Zone"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={whLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                {whLoading ? 'Creating...' : 'Register Warehouse'}
              </button>
            </form>
          </div>

          {/* Add Rack / Internal Location Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Add Storage Location / Rack</h3>
                <p className="text-xs text-slate-400">Register specific racks, zones, or staging locations</p>
              </div>
            </div>

            {locError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{locError}</span>
              </div>
            )}

            {locSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{locSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Location Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rack C (Heavy Parts)"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Location Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. WH-MAIN/RACK-C"
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Warehouse</label>
                  <select
                    value={locWhId}
                    onChange={(e) => setLocWhId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Location Type</label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  <option value="INTERNAL">Internal Storage (Racks, Stock, Production)</option>
                  <option value="VENDOR">Vendor / Supplier Location</option>
                  <option value="CUSTOMER">Customer / Dispatch Location</option>
                  <option value="INVENTORY_LOSS">Inventory Loss / Scrap Location</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={locLoading}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                {locLoading ? 'Saving...' : 'Add Storage Location'}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Warehouses & Locations Tree */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Current Warehouse Topology</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-sm text-slate-900">{wh.name}</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                    {wh.code}
                  </span>
                </div>
                {wh.address && <p className="text-xs text-slate-500">{wh.address}</p>}

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Internal Racks & Locations ({wh.locations?.length ?? 0})
                  </p>
                  <div className="space-y-1.5">
                    {wh.locations?.map((l) => (
                      <div
                        key={l.id}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-700">{l.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">{l.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
