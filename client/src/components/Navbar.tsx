import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  Shuffle,
  Package,
  History,
  Settings,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Building2,
  MapPin,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';

interface Props {
  onNewOperation?: () => void;
  onNewProduct?: () => void;
}

const Navbar: React.FC<Props> = ({ onNewOperation, onNewProduct }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [opsDropdown, setOpsDropdown] = useState(false);
  const [prodDropdown, setProdDropdown] = useState(false);
  const [settingsDropdown, setSettingsDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown')) {
        setOpsDropdown(false);
        setProdDropdown(false);
        setSettingsDropdown(false);
        setProfileDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-14 bg-slate-900 border-b border-slate-800 text-slate-200 px-4 md:px-6 flex items-center justify-between z-30 select-none flex-shrink-0">
        {/* Brand & Left Navigation Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40 group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                StockSense
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  IMS
                </span>
              </span>
            </div>
          </NavLink>

          {/* Menus matching Architecture Flow */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {/* 1. Dashboard */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
              <span>Dashboard</span>
            </NavLink>

            {/* 2. Operations Dropdown */}
            <div className="relative nav-dropdown">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpsDropdown(!opsDropdown);
                  setProdDropdown(false);
                  setSettingsDropdown(false);
                  setProfileDropdown(false);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  window.location.pathname.startsWith('/operations') || opsDropdown
                    ? 'bg-slate-800 text-purple-300'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Operations</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {opsDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs font-medium animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Stock Operations
                  </div>
                  <NavLink
                    to="/operations?type=RECEIPT"
                    onClick={() => setOpsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Receipts (Incoming)</span>
                  </NavLink>
                  <NavLink
                    to="/operations?type=DELIVERY"
                    onClick={() => setOpsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-400" />
                    <span>Delivery Orders (Outgoing)</span>
                  </NavLink>
                  <NavLink
                    to="/operations?type=INTERNAL"
                    onClick={() => setOpsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Internal Transfers</span>
                  </NavLink>
                  <NavLink
                    to="/operations?type=ADJUSTMENT"
                    onClick={() => setOpsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                    <span>Inventory Adjustment</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* 3. Products Dropdown */}
            <div className="relative nav-dropdown">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProdDropdown(!prodDropdown);
                  setOpsDropdown(false);
                  setSettingsDropdown(false);
                  setProfileDropdown(false);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  window.location.pathname.startsWith('/products') || prodDropdown
                    ? 'bg-slate-800 text-purple-300'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-purple-400" />
                <span>Products</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {prodDropdown && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs font-medium animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Catalog & Rules
                  </div>
                  <NavLink
                    to="/products?tab=catalog"
                    onClick={() => setProdDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-purple-400" />
                    <span>Products</span>
                  </NavLink>
                  <NavLink
                    to="/products?tab=stock-locations"
                    onClick={() => setProdDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Stock Availability</span>
                  </NavLink>
                  <NavLink
                    to="/products?tab=categories"
                    onClick={() => setProdDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Boxes className="w-3.5 h-3.5 text-amber-400" />
                    <span>Product Categories</span>
                  </NavLink>
                  <NavLink
                    to="/products?tab=reordering"
                    onClick={() => setProdDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reordering Rules</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* 4. Move History */}
            <NavLink
              to="/ledger"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Move History</span>
            </NavLink>

            {/* 5. Settings Dropdown */}
            <div className="relative nav-dropdown">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsDropdown(!settingsDropdown);
                  setOpsDropdown(false);
                  setProdDropdown(false);
                  setProfileDropdown(false);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  window.location.pathname.startsWith('/settings') || settingsDropdown
                    ? 'bg-slate-800 text-purple-300'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {settingsDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs font-medium animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Infrastructure
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setSettingsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Warehouse</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setSettingsDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>Location</span>
                  </NavLink>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: Quick Action Buttons & Profile */}
        <div className="flex items-center gap-3">
          {onNewProduct && (
            <button
              onClick={onNewProduct}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Product</span>
            </button>
          )}

          {onNewOperation && (
            <button
              onClick={onNewOperation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>New Operation</span>
            </button>
          )}

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* Profile User Dropdown */}
          <div className="relative nav-dropdown">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileDropdown(!profileDropdown);
                setOpsDropdown(false);
                setProdDropdown(false);
                setSettingsDropdown(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block text-xs font-medium text-slate-200">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs font-medium animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    {user?.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdown(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                >
                  <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </>
  );
};

export default Navbar;
