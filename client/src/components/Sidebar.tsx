import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shuffle,
  SlidersHorizontal,
  History,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [productsOpen, setProductsOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 select-none z-20 flex-shrink-0">
        {/* App Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
              StockSense
              <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                IMS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Inventory Operations</p>
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {/* Dashboard */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-purple-400" />
            <span>Dashboard</span>
          </NavLink>

          {/* Operations Menu Section */}
          <div className="pt-2">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                Operations
              </span>
              {operationsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {operationsOpen && (
              <div className="mt-1 space-y-1 pl-3">
                <NavLink
                  to="/operations?type=RECEIPT"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('RECEIPT')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Receipts (Incoming)</span>
                </NavLink>

                <NavLink
                  to="/operations?type=DELIVERY"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('DELIVERY')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-400" />
                  <span>Delivery Orders (Outgoing)</span>
                </NavLink>

                <NavLink
                  to="/operations?type=INTERNAL"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('INTERNAL')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Internal Transfers</span>
                </NavLink>

                <NavLink
                  to="/operations?type=ADJUSTMENT"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('ADJUSTMENT')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                  <span>Inventory Adjustment</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Products Menu Section */}
          <div className="pt-2">
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                Products
              </span>
              {productsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {productsOpen && (
              <div className="mt-1 space-y-1 pl-3">
                <NavLink
                  to="/products?tab=catalog"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && (!window.location.search || window.location.search.includes('catalog'))
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <Package className="w-3.5 h-3.5 text-purple-400" />
                  <span>Products Catalog</span>
                </NavLink>

                <NavLink
                  to="/products?tab=stock-locations"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('stock-locations')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Stock per Location</span>
                </NavLink>

                <NavLink
                  to="/products?tab=categories"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('categories')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <Boxes className="w-3.5 h-3.5 text-amber-400" />
                  <span>Product Categories</span>
                </NavLink>

                <NavLink
                  to="/products?tab=reordering"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive && window.location.search.includes('reordering')
                        ? 'bg-purple-600/20 text-purple-300 font-semibold'
                        : 'hover:bg-slate-800/50 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reordering Rules</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Move History / Stock Ledger */}
          <div className="pt-2">
            <NavLink
              to="/ledger"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
                }`
              }
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>Move History</span>
            </NavLink>
          </div>

          {/* Settings -> Warehouse */}
          <div className="pt-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
                }`
              }
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Warehouse Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* Profile Menu (Left Sidebar Bottom) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">
                    {user?.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 text-xs">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <UserIcon className="w-3 h-3 text-purple-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-900/40 transition-colors"
              >
                <LogOut className="w-3 h-3 text-red-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile Modal */}
      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
    </>
  );
};

export default Sidebar;
