import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  PackageCheck,
  Truck,
  Ban,
  ArrowRight,
  Printer,
  Clock,
  User as UserIcon,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import { OperationDocument } from '../types';

interface Props {
  operationId: string;
  onClose: () => void;
  onRefresh: () => void;
}

const OperationDetailModal: React.FC<Props> = ({ operationId, onClose, onRefresh }) => {
  const [doc, setDoc] = useState<OperationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDoc = async () => {
    try {
      const res = await api.get(`/operations/${operationId}`);
      setDoc(res.data.operation);
    } catch (err: any) {
      setError('Failed to load operation details.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDoc();
  }, [operationId]);

  const handleAction = async (action: 'pick' | 'pack' | 'validate' | 'cancel') => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/operations/${operationId}/action`, { action });
      setSuccessMsg(res.data.message || 'Operation updated successfully.');
      fetchDoc();
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-700">Loading operation details...</span>
        </div>
      </div>
    );
  }

  if (!doc) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'WAITING': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'READY': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DONE': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CANCELED': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col print:max-h-full print:shadow-none print:border-none">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 print:bg-purple-900">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold tracking-tight text-purple-300 print:text-white">
              {doc.reference}
            </span>
            <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${getStatusColor(doc.status)}`}>
              {doc.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header Bar (matches Architecture Wireframe: Validate, Print, Cancel) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {doc.status !== 'DONE' && doc.status !== 'CANCELED' && (
              <>
                {/* Delivery multi-step pick & pack */}
                {doc.type === 'DELIVERY' && doc.status === 'DRAFT' && (
                  <button
                    onClick={() => handleAction('pick')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Step 1: Pick Items</span>
                  </button>
                )}

                {doc.type === 'DELIVERY' && doc.status === 'WAITING' && (
                  <button
                    onClick={() => handleAction('pack')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Step 2: Pack Items</span>
                  </button>
                )}

                {/* Validation actions */}
                {(doc.type !== 'DELIVERY' || doc.status === 'READY') && (
                  <button
                    onClick={() => handleAction('validate')}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {doc.type === 'DELIVERY'
                        ? 'Validate & Ship'
                        : doc.type === 'RECEIPT'
                        ? 'Validate'
                        : doc.type === 'INTERNAL'
                        ? 'Validate Transfer'
                        : 'Validate Adjustment'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Slip</span>
            </button>
          </div>

          {/* Workflow Status Steps Indicator (Draft -> Ready -> Done) */}
          <div className="flex items-center text-xs font-medium text-slate-500 gap-1.5">
            <span className={doc.status === 'DRAFT' ? 'text-purple-700 font-bold' : ''}>Draft</span>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            {doc.type === 'DELIVERY' && (
              <>
                <span className={doc.status === 'WAITING' ? 'text-amber-700 font-bold' : ''}>Picked</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
                <span className={doc.status === 'READY' ? 'text-blue-700 font-bold' : ''}>Packed</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
              </>
            )}
            {doc.type !== 'DELIVERY' && (
              <>
                <span className={doc.status === 'READY' ? 'text-blue-700 font-bold' : ''}>Ready</span>
                <ArrowRight className="w-3 h-3 text-slate-300" />
              </>
            )}
            <span className={doc.status === 'DONE' ? 'text-emerald-700 font-bold' : ''}>Done</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium print:hidden">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium print:hidden">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Key Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Operation Type</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{doc.type}</p>
              {doc.partnerName && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{doc.partnerName}</p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{doc.type === 'RECEIPT' ? 'Receive From' : 'Source Location'}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{doc.sourceLocation?.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">{doc.sourceLocation?.code}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{doc.type === 'DELIVERY' ? 'Delivery Address' : 'Destination Location'}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{doc.destLocation?.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">{doc.destLocation?.code}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Scheduled / Validated</span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {new Date(doc.scheduledDate).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-slate-500">
                By {doc.createdBy?.name}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Line Items</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Requested</th>
                    <th className="py-2.5 px-3 text-right">Picked</th>
                    <th className="py-2.5 px-3 text-right">Packed</th>
                    <th className="py-2.5 px-3 text-right">Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {doc.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.product?.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {item.product?.sku}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                        {item.requestedQty} {item.product?.uom}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700">
                        {item.pickedQty}
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700">
                        {item.packedQty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {item.doneQty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linked Move History / Ledger Audit Trail */}
          {doc.stockMoves && doc.stockMoves.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Generated Stock Ledger Movements
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50">
                {doc.stockMoves.map((m) => (
                  <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{m.product?.name}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {m.sourceLocation?.name} → {m.destLocation?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700 font-mono">
                        +{m.quantity} {m.product?.uom}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doc.notes && (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
              <span className="font-bold">Notes: </span>
              {doc.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationDetailModal;
