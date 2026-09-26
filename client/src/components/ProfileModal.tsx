import React from 'react';
import { X, User as UserIcon, Mail, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
}

const ProfileModal: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white text-purple-800 flex items-center justify-center font-bold text-2xl shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-purple-100 border border-white/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user?.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium text-slate-800">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Access Level</p>
                <p className="text-sm font-medium text-slate-800">
                  {user?.role === 'INVENTORY_MANAGER'
                    ? 'Full Administrator (Manage stock, reordering, validation, warehouse configs)'
                    : 'Warehouse Operations (Picking, packing, shelving, transfers, stock counts)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Authentication Type</p>
                <p className="text-sm font-medium text-slate-800">JWT Token with OTP Password Reset Support</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
