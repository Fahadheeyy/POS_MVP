import React from 'react';
import { useAppStore } from '../../store';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';
import {
  TrendingUp,
  X,
  Printer,
  QrCode,
  Banknote,
  CreditCard,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CashierRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashierRevenueModal: React.FC<CashierRevenueModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { orders, settings, currentUser } = useAppStore();

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(
    (o) => o.createdAt.startsWith(todayStr) && o.status !== 'cancelled'
  );

  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCount = todayOrders.length;
  const aov = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

  const upiOrders = todayOrders.filter((o) => o.paymentMode === 'upi');
  const upiTotal = upiOrders.reduce((sum, o) => sum + o.total, 0);

  const cashOrders = todayOrders.filter((o) => o.paymentMode === 'cash');
  const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);

  const cardOrders = todayOrders.filter((o) => o.paymentMode === 'card');
  const cardTotal = cardOrders.reduce((sum, o) => sum + o.total, 0);

  const totalTax = todayOrders.reduce((sum, o) => sum + o.tax, 0);

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none font-sans">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 shadow-modal relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Close (Esc)"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#556475] text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 text-lg">Today's Revenue</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                Live Sales
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Counter 01 · {currentUser?.name || settings.activeCashierName || 'Priya Sharma'} · {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Big Gross Revenue Card */}
        <div className="bg-gradient-to-br from-[#bac7d5] to-[#cbd7e3] p-5 rounded-2xl border border-slate-300/60 shadow-sm mb-5 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
            Total Revenue Collected Today
          </span>
          <div className="text-4xl font-black text-gray-900 tracking-tight mb-2">
            {formatINR(totalRevenue)}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1">
              <ShoppingBag size={14} className="text-slate-600" />
              {totalCount} Orders Completed
            </span>
            <span>·</span>
            <span>Avg Order: {formatINR(aov)}</span>
          </div>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="space-y-2.5 mb-6">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block px-1">
            Collections by Tender
          </span>

          {/* UPI */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <QrCode size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">UPI / QR Payment</p>
                <p className="text-[11px] text-gray-500">{upiOrders.length} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-gray-900">{formatINR(upiTotal)}</p>
              <p className="text-[11px] text-gray-400">
                {totalRevenue > 0 ? Math.round((upiTotal / totalRevenue) * 100) : 0}% share
              </p>
            </div>
          </div>

          {/* Cash */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Banknote size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Cash in Drawer</p>
                <p className="text-[11px] text-gray-500">{cashOrders.length} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-gray-900">{formatINR(cashTotal)}</p>
              <p className="text-[11px] text-gray-400">
                {totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 0}% share
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Card Terminal</p>
                <p className="text-[11px] text-gray-500">{cardOrders.length} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-gray-900">{formatINR(cardTotal)}</p>
              <p className="text-[11px] text-gray-400">
                {totalRevenue > 0 ? Math.round((cardTotal / totalRevenue) * 100) : 0}% share
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrintSummary}
            className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 shadow-subtle flex items-center justify-center gap-2 transition-colors"
          >
            <Printer size={15} />
            <span>Print Daily Summary</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#556475] hover:bg-slate-700 text-white text-xs font-bold shadow-card transition-all active:scale-95"
          >
            Done
          </button>
        </div>

        {/* Hidden Printable Daily Summary Slip for Thermal Printer */}
        <div className="hidden printable-receipt">
          <div className="text-center pb-2 border-b">
            <h1 className="text-sm font-extrabold">{settings.storeName || 'Sign Laban'}</h1>
            <p className="text-xs">DAILY CASHIER REVENUE SUMMARY</p>
            <p className="text-[10px] text-gray-500">
              {formatDate(new Date().toISOString())} · {formatTime(new Date().toISOString())}
            </p>
            <p className="text-[10px]">
              Cashier: {currentUser?.name || settings.activeCashierName || 'Priya Sharma'}
            </p>
          </div>
          <div className="py-2 text-xs space-y-1">
            <div className="flex justify-between font-bold">
              <span>Gross Revenue:</span>
              <span>{formatINR(totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Orders:</span>
              <span>{totalCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Order Value:</span>
              <span>{formatINR(aov)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span>UPI:</span>
              <span>{formatINR(upiTotal)} ({upiOrders.length})</span>
            </div>
            <div className="flex justify-between">
              <span>Cash:</span>
              <span>{formatINR(cashTotal)} ({cashOrders.length})</span>
            </div>
            <div className="flex justify-between">
              <span>Card:</span>
              <span>{formatINR(cardTotal)} ({cardOrders.length})</span>
            </div>
            {settings.isGstEnabled !== false && (
              <div className="flex justify-between border-t pt-1">
                <span>GST Tax Collected:</span>
                <span>{formatINR(totalTax)}</span>
              </div>
            )}
          </div>
          <div className="pt-2 text-center text-[9px] text-gray-500 border-t">
            pos.bits High-Speed Counter Operations
          </div>
        </div>
      </div>
    </div>
  );
};

