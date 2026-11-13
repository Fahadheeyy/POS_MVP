import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { Award, Search, Check, Sparkles, X, Phone, UserCheck } from 'lucide-react';
import { CustomerLoyalty } from '../../types';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({ isOpen, onClose }) => {
  const { loyaltyCustomers, applyLoyaltyCustomer } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<CustomerLoyalty | null>(null);
  const [redeemDiscount, setRedeemDiscount] = useState(false);

  if (!isOpen) return null;

  const filtered = loyaltyCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleApply = (cust: CustomerLoyalty) => {
    applyLoyaltyCustomer(cust, redeemDiscount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-modal max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold">
              <Award size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Customer CRM & Loyalty</h3>
              <p className="text-xs text-gray-500">Lookup VIP rewards & frequent guest history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone number (e.g. 98765) or customer name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[220px]">
          {filtered.map((cust) => {
            const isSelected = selectedCust?.id === cust.id;
            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCust(cust)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-gray-900 bg-gray-50/80 shadow-subtle'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">{cust.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cust.tier === 'VIP'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : cust.tier === 'Gold'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {cust.tier} Member
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-gray-400" />
                      <span>+91 {cust.phone}</span>
                      <span className="text-gray-300">·</span>
                      <span>{cust.visitsCount} visits</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-secondaryGreen-700 flex items-center justify-end gap-1">
                      <Sparkles size={13} />
                      {cust.points} pts
                    </span>
                    <span className="text-[10px] text-gray-400">₹{(cust.points / 2).toFixed(0)} value</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span>
                    Favorite: <strong className="text-gray-700">{cust.favoriteItem}</strong>
                  </span>
                  <span>{cust.lastVisit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loyalty Redemption Bar */}
        {selectedCust && (
          <div className="p-4 border-t border-gray-100 bg-amber-50/60">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={redeemDiscount}
                onChange={(e) => setRedeemDiscount(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-0"
              />
              <span className="text-xs font-bold text-gray-800">
                Redeem 10% Loyalty Privilege Discount on this bill ({selectedCust.points} pts balance)
              </span>
            </label>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <button
            disabled={!selectedCust}
            onClick={() => selectedCust && handleApply(selectedCust)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-subtle transition-all flex items-center gap-1.5 ${
              selectedCust
                ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <UserCheck size={14} />
            <span>Apply Customer to Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};

