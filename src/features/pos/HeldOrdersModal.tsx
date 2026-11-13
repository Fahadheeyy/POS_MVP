import React from 'react';
import { useAppStore } from '../../store';
import { Clock, Play, Trash2, X, AlertCircle } from 'lucide-react';
import { formatINR, formatTime } from '../../utils/formatters';

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({ isOpen, onClose }) => {
  const { heldOrders, recallHeldOrder, deleteHeldOrder } = useAppStore();

  if (!isOpen) return null;

  const handleRecall = (id: string) => {
    recallHeldOrder(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-modal max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Parked / Held Orders</h3>
              <p className="text-xs text-gray-500">Temporarily suspended orders during queue rush</p>
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
        <div className="p-5 overflow-y-auto space-y-3 flex-1 min-h-[200px]">
          {heldOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-300">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-700">No Orders On Hold</p>
              <p className="text-xs text-gray-400">
                Tap "Hold Order" in the cart to park a customer's cart while they search for wallet or decide.
              </p>
            </div>
          ) : (
            heldOrders.map((held) => {
              const totalItems = held.cartItems.reduce((sum, item) => sum + item.quantity, 0);
              const estTotal = held.cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
              const elapsedMins = Math.max(
                1,
                Math.floor((Date.now() - new Date(held.heldAt).getTime()) / 60000)
              );

              return (
                <div
                  key={held.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 shadow-subtle transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">
                          {held.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Held {elapsedMins}m ago
                        </span>
                        <span className="text-xs font-semibold text-gray-500">
                          · {held.orderType === 'dine-in' ? held.tableNumber : 'Takeaway'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 mt-1">
                        Guest: {held.customerName} ({held.guestCount} {held.guestCount === 1 ? 'guest' : 'guests'})
                      </p>
                      {held.note && (
                        <p className="text-xs text-amber-800 bg-amber-50/70 px-2 py-0.5 rounded mt-1 inline-block border border-amber-100">
                          {held.note}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-sm text-gray-900 block">
                        {formatINR(estTotal)}
                      </span>
                      <span className="text-[11px] text-gray-400">{totalItems} items</span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-600 space-y-1">
                    {held.cartItems.map((ci, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>
                          {ci.quantity}x {ci.product.name}
                        </span>
                        <span className="font-semibold text-gray-800">{formatINR(ci.lineTotal)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => deleteHeldOrder(held.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-secondaryRed-600 hover:bg-secondaryRed-50 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Discard</span>
                    </button>

                    <button
                      onClick={() => handleRecall(held.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-subtle transition-colors flex items-center gap-1.5"
                    >
                      <Play size={13} />
                      <span>Recall to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

