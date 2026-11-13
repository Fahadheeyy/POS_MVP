import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useAppStore } from '../../store';
import { formatINR } from '../../utils/formatters';
import { ReceiptModal, ReceiptSlip } from './ReceiptModal';
import { Check, Printer, Plus, X } from 'lucide-react';

interface OrderSuccessfulModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderSuccessfulModal: React.FC<OrderSuccessfulModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { settings } = useAppStore();
  const [showReceipt, setShowReceipt] = useState(false);
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);

  // Auto-print bill on checkout
  useEffect(() => {
    if (isOpen && order && !hasAutoPrinted && settings.autoPrintReceipt !== false) {
      setHasAutoPrinted(true);
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, order, hasAutoPrinted, settings.autoPrintReceipt]);

  // Reset auto-printed flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasAutoPrinted(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const handleReprint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-modal grid grid-cols-1 md:grid-cols-2 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        {/* Left Column: Order Details matching Order — successful.png */}
        <div className="p-8 border-r border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900 text-xl mb-6 text-center">Order Details</h3>

            <div className="space-y-2 pb-4 border-b border-gray-100 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Number</span>
                <span className="font-bold text-gray-900">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Table / Type</span>
                <span className="font-semibold text-gray-800">
                  {order.type === 'dine-in' ? `${order.tableNumber || 'Table'}` : 'Takeaway'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-semibold text-gray-800">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-bold uppercase tracking-wide text-gray-900">
                  {order.paymentMode}
                </span>
              </div>
            </div>

            {/* Items list */}
            <div className="py-3 border-b border-gray-100 space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-gray-800 font-medium">{it.product.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{it.quantity}x</span>
                    <span className="font-semibold text-gray-900">{formatINR(it.lineTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-4 border-t border-gray-100 text-xs space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatINR(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-secondaryGreen-700">
                <span>Discount ({order.discountPercent}%)</span>
                <span>-{formatINR(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 ? (
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Total sales tax (GST)</span>
                <span>{formatINR(order.tax)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-[11px] text-gray-400 italic">
                <span>Tax</span>
                <span>Non-GST (₹0.00)</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-extrabold text-gray-900">
              <span>Total</span>
              <span className="text-base">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Success Callout matching Order — successful.png */}
        <div className="p-8 bg-[#cad3de] flex flex-col items-center justify-center text-center">
          {/* Circular checkmark with subtle confetti aesthetic */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-[#556475] text-white flex items-center justify-center shadow-sm mx-auto">
              <Check size={40} strokeWidth={2.5} />
            </div>
            {/* Minimal confetti dots from design */}
            <div className="absolute -top-2 left-4 w-2 h-2 rounded-full bg-slate-400" />
            <div className="absolute top-10 -left-4 w-2.5 h-2.5 rounded-full bg-slate-300" />
            <div className="absolute top-2 -right-3 w-2 h-2 rounded-full bg-slate-400" />
            <div className="absolute -bottom-1 right-3 w-3 h-3 rounded-full bg-slate-300" />
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
            Order Successful!
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mb-3">
            Token {order.orderNumber} created · Order queued in kitchen
          </p>

          {/* Auto-print confirmation notice */}
          <div className="mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-300 text-[11px] font-semibold text-slate-800 shadow-xs">
            <Printer size={13} className="text-emerald-600 animate-pulse" />
            <span>Bill automatically sent to receipt printer</span>
          </div>

          <div className="w-full max-w-xs space-y-2.5">
            <button
              type="button"
              onClick={handleReprint}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 border border-slate-200 text-xs font-bold text-gray-900 shadow-sm flex items-center justify-center gap-2 transition-all hover:border-slate-300"
            >
              <Printer size={15} />
              <span>Reprint Bill</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-[#556475] hover:bg-slate-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={15} />
              Start New Order
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen Thermal Slip for Print Dialog Execution */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <ReceiptSlip order={order} settings={settings} />
      </div>

      <ReceiptModal
        order={order}
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
};

