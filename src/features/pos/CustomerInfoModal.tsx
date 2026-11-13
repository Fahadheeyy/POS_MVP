import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { X, Users, UtensilsCrossed } from 'lucide-react';

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({ isOpen, onClose }) => {
  const { tableNumber, customerName, guestCount, orderType, setCustomerInfo, setOrderType } = useAppStore();

  const [table, setTable] = useState(tableNumber || 'T-16');
  const [name, setName] = useState(customerName || 'Jesselyn');
  const [guests, setGuests] = useState(guestCount || 2);
  const [type, setType] = useState(orderType || 'dine-in');

  if (!isOpen) return null;

  const guestOptions = [1, 2, 3, 4, 6, 8];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerInfo(name, guests, table);
    setOrderType(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 shadow-modal relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        <h3 className="font-bold text-gray-900 text-lg mb-4">Table & Order Info</h3>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Dine-in vs Takeaway segmented */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setType('dine-in')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                type === 'dine-in' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Dine In
            </button>
            <button
              type="button"
              onClick={() => setType('takeaway')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                type === 'takeaway' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Takeaway
            </button>
          </div>

          {type === 'dine-in' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Table Number</label>
              <input
                type="text"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="e.g. T-16"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jesselyn"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Total Guests</label>
            <div className="grid grid-cols-6 gap-1.5">
              {guestOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGuests(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    guests === num
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-subtle mt-4 transition-colors"
          >
            Update Order Details
          </button>
        </form>
      </div>
    </div>
  );
};

