import React from 'react';
import { Plus, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  title: string;
  subtitle?: string;
  onNewOperation?: () => void;
  onNewProduct?: () => void;
}

const Header: React.FC<Props> = ({ title, subtitle, onNewOperation, onNewProduct }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onNewProduct && (
          <button
            onClick={onNewProduct}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>New Product</span>
          </button>
        )}

        {onNewOperation && (
          <button
            onClick={onNewOperation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-700 hover:bg-purple-800 text-white transition-all shadow-md shadow-purple-600/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New Operation</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {user?.role === 'INVENTORY_MANAGER' ? 'Manager' : 'Staff'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
