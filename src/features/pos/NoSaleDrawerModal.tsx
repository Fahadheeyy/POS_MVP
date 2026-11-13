import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { Unlock, X, ShieldAlert, Check } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface NoSaleDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REASONS = [
  'Providing change for customer note (₹500 / ₹200)',
  'Mid-shift cash drawer audit / reconciliation',
  'Cash float verification check',
  'Depositing customer tip / jar adjustment',
  'Hardware diagnostic test print',
];

export const NoSaleDrawerModal: React.FC<NoSaleDrawerModalProps> = ({ isOpen, onClose }) => {
  const { triggerNoSaleDrawerOpen } = useAppStore();
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleOpenDrawer = () => {
    sounds.playBump();
    const finalReason = customReason || selectedReason;
    triggerNoSaleDrawerOpen(finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-modal max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Unlock size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Open Drawer (No-Sale)</h3>
              <p className="text-xs text-gray-500">Security audit reason required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>
              This event will be logged in the Owner Security Audit Trail with your staff timestamp.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">Select Purpose</label>
            {REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedReason === r && !customReason
                    ? 'border-gray-900 bg-gray-50 font-bold text-gray-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="drawer_reason"
                  checked={selectedReason === r && !customReason}
                  onChange={() => {
                    setSelectedReason(r);
                    setCustomReason('');
                  }}
                  className="w-3.5 h-3.5 text-gray-900 focus:ring-0"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Or Other Reason
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specify manual reason..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleOpenDrawer}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-subtle transition-colors flex items-center gap-1.5"
          >
            <Unlock size={14} />
            <span>Kick Drawer & Log Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

