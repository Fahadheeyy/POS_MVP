import React from 'react';
import { useAppStore } from '../../store';
import { Printer, X, FileText } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface EstimateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EstimateReceiptModal: React.FC<EstimateReceiptModalProps> = ({ isOpen, onClose }) => {
  const {
    cartItems,
    orderType,
    tableNumber,
    customerName,
    guestCount,
    cartDiscountPercent,
    settings,
  } = useAppStore();

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = Math.round((subtotal * cartDiscountPercent) / 100);
  const taxableAmount = Math.max(0, subtotal - discount);
  const gstRate = settings.gstRate || 5;
  const cgst = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
  const sgst = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
  const tax = Number((cgst + sgst).toFixed(2));
  const total = Number((taxableAmount + tax).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="relative max-w-sm w-full flex flex-col items-center">
        {/* Physical Thermal Printer Feeder Slot */}
        <div className="w-72 h-8 rounded-full bg-slate-400 border border-slate-500 shadow-card flex items-center justify-center z-10 -mb-4">
          <div className="w-56 h-2 rounded-full bg-slate-600/80 shadow-inner" />
        </div>

        {/* The White Thermal Slip Sheet */}
        <div className="bg-white border border-gray-200 rounded-b-2xl w-full p-6 pt-8 shadow-modal text-gray-900 font-sans relative printable-receipt">
          {/* Header */}
          <div className="text-center pb-3 border-b border-gray-100">
            <img
              src={settings.logoUrl || '/assets/logo.png'}
              alt={settings.storeName || 'Sign Laban'}
              className="h-7 w-auto mx-auto mb-1.5 object-contain"
            />
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">{settings.brandTagline || "India's First Egyptian Dessert"}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{settings.address}</p>
            <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold tracking-wider uppercase">
              Pre-Bill Estimate
            </div>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-gray-100 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-bold text-gray-900">
                Express Counter Pickup
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Token</span>
              <span className="font-bold text-blue-700 font-mono">
                {settings.orderPrefix || 'Token #'}{settings.nextOrderSequence || 106}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-700">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-gray-100 space-y-2 max-h-48 overflow-y-auto pr-1">
            {cartItems.map((it, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-start font-medium">
                  <span className="text-gray-900 flex-1 pr-2">{it.product.name}</span>
                  <span className="text-gray-500 px-2">{it.quantity}x</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatINR(it.lineTotal)}
                  </span>
                </div>
                {it.specialInstructions && (
                  <div className="text-[10px] text-amber-700 pl-2">
                    Note: {it.specialInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="py-2.5 text-xs space-y-1 text-gray-600 border-b border-gray-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-secondaryGreen-700">
                <span>Discount ({cartDiscountPercent}%)</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Estimated GST ({gstRate}%)</span>
              <span>{formatINR(tax)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-3 pb-2 flex items-center justify-between">
            <span className="font-bold text-sm text-gray-900">Total Payable</span>
            <span className="font-black text-xl text-gray-900">{formatINR(total)}</span>
          </div>

          <div className="text-center pt-3 text-[10px] text-gray-400 italic">
            * This is an estimate slip, not a GST tax invoice *
          </div>

          {/* Serrated Tear Edge Bottom */}
          <div className="absolute -bottom-2.5 left-0 right-0 flex justify-between overflow-hidden px-1">
            {Array.from({ length: 22 }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 bg-surface-canvas rounded-full -mb-1.5" />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-6 w-full">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-2xl shadow-card transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={14} />
            <span>Print Estimate</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-2xl shadow-subtle transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

