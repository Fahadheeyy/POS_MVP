import React, { useState } from 'react';
import { Order } from '../../types';
import { useAppStore } from '../../store';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';
import { Printer, Check, X } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptSlip: React.FC<{ order: Order; settings: any }> = ({ order, settings }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-b-2xl w-full p-6 pt-8 shadow-modal text-gray-900 font-sans relative printable-receipt">
      {/* Header */}
      <div className="text-center pb-3 border-b border-gray-100">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <img
            src={settings.logoUrl || '/assets/sign-laban-logo.png'}
            alt={settings.storeName || 'Sign Laban'}
            className="h-9 w-auto mx-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-900">
          {settings.storeName || 'Sign Laban'}
        </p>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#556475]">
          {settings.brandTagline || "India's First Egyptian Dessert"}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">{settings.address}</p>
        {settings.isGstEnabled !== false && settings.showGstinOnReceipt && settings.gstin && (
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            GSTIN: {settings.gstin} {settings.fssai ? `· FSSAI: ${settings.fssai}` : ''}
          </p>
        )}
        {settings.isGstEnabled === false && settings.fssai && (
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            FSSAI: {settings.fssai}
          </p>
        )}
        <div className="mt-2 py-1 px-3 rounded-lg bg-slate-100 border border-slate-200 inline-block">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            {settings.isGstEnabled !== false ? 'TAX INVOICE' : 'TOKEN RECEIPT'}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="py-2.5 border-b border-gray-100 text-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Order Token</span>
          <span className="font-black text-sm text-blue-700 font-mono">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Service Mode</span>
          <span className="font-semibold text-gray-800">Express Counter Pickup</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date & Time</span>
          <span className="text-gray-700 font-mono text-[11px]">
            {formatDate(order.createdAt)} {formatTime(order.createdAt)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Counter Staff</span>
          <span className="text-gray-700">{order.cashierName}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="py-3 border-b border-gray-100 space-y-2 max-h-48 overflow-y-auto pr-1">
        {order.items.map((it, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex justify-between items-start font-medium">
              <span className="text-gray-900 flex-1 pr-2">{it.product.name}</span>
              <span className="text-gray-500 px-2">{it.quantity}x</span>
              <span className="font-semibold text-gray-900 text-right">
                {formatINR(it.lineTotal)}
              </span>
            </div>
            {it.selectedAddOns.length > 0 && (
              <div className="text-[10px] text-gray-400 pl-2">
                {it.selectedAddOns.map((a) => `+ ${a.item.name}`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tax Breakdown & Totals */}
      <div className="py-2.5 text-xs space-y-1 text-gray-600 border-b border-gray-200">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{formatINR(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-secondaryGreen-700">
            <span>Discount ({order.discountPercent || 0}%)</span>
            <span>-{formatINR(order.discount)}</span>
          </div>
        )}
        {order.tax > 0 ? (
          <>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>CGST</span>
              <span>{formatINR(order.cgst)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>SGST</span>
              <span>{formatINR(order.sgst)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-[11px] text-gray-400 italic">
            <span>Tax</span>
            <span>Non-GST Bill (₹0.00)</span>
          </div>
        )}
      </div>

      {/* Total & Payment Method */}
      <div className="pt-3 pb-2 flex items-center justify-between">
        <span className="font-bold text-sm text-gray-900">Total</span>
        <span className="font-black text-lg text-gray-900">{formatINR(order.total)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
        <span className="font-medium">Payment Method</span>
        <span className="font-bold uppercase tracking-wider text-gray-800">
          {order.paymentMode}
        </span>
      </div>

      {order.paymentMode === 'cash' && order.cashTendered && (
        <div className="text-[11px] text-gray-500 flex justify-between pt-1">
          <span>Tendered / Change</span>
          <span>
            {formatINR(order.cashTendered)} / {formatINR(order.cashChange || 0)}
          </span>
        </div>
      )}

      {settings.showWifiOnReceipt && settings.wifiPassword && (
        <div className="mt-3 p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-center text-[10px] text-gray-600">
          Guest WiFi: <span className="font-bold font-mono">{settings.wifiPassword}</span>
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 text-center text-[9px] text-gray-500 space-y-0.5">
        <div>{settings.receiptFooter || 'Thank you for visiting Sign Laban!'}</div>
        <div className="font-semibold text-slate-400 uppercase tracking-wider">
          Powered by pos.bits · High-Speed QSR Systems
        </div>
      </div>

      {/* Serrated Bottom Perforation matching Receipt — printed.png */}
      <div className="absolute -bottom-2.5 left-0 right-0 flex justify-between px-2 overflow-hidden pointer-events-none">
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-300 -mb-1" />
        ))}
      </div>
    </div>
  );
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const { settings } = useAppStore();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="relative max-w-sm w-full flex flex-col items-center">
        {/* Physical Thermal Printer Feeder Slot matching Receipt — printed.png */}
        <div className="w-72 h-8 rounded-full bg-slate-400 border border-slate-500 shadow-card flex items-center justify-center z-10 -mb-4">
          <div className="w-56 h-2 rounded-full bg-slate-600/80 shadow-inner" />
        </div>

        {/* The White Thermal Slip Sheet */}
        <ReceiptSlip order={order} settings={settings} />

        {/* Action Buttons below receipt */}
        <div className="w-full flex items-center gap-2 mt-4 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="py-3 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 shadow-subtle flex items-center justify-center gap-1.5 transition-colors"
            title="Reprint Bill"
          >
            <Printer size={15} />
            <span>Reprint Bill</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#556475] hover:bg-slate-700 text-white text-xs font-black shadow-card flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Check size={16} />
            <span>Next Customer [Enter]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

