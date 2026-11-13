import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { PaymentMode } from '../../types';
import { formatINR } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import { Banknote, QrCode, CreditCard, X, Check, ArrowRight } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: PaymentMode, cashTendered?: number) => void;
  totalAmount: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
}) => {
  const { settings } = useAppStore();
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('upi');
  const [cashTendered, setCashTendered] = useState<string>(Math.ceil(totalAmount).toString());

  if (!isOpen) return null;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, tenderedNum - totalAmount);

  const quickCashOptions = [
    Math.ceil(totalAmount),
    500,
    1000,
    2000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= totalAmount);

  const handleConfirm = () => {
    sounds.playSuccess();
    onConfirm(selectedMode, selectedMode === 'cash' ? tenderedNum : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 shadow-modal relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <h3 className="font-bold text-gray-900 text-xl tracking-tight">Payments Method</h3>
          <p className="text-xs text-gray-400 mt-0.5">Select a payment method below</p>
          <div className="text-2xl font-black text-gray-900 mt-2">
            {formatINR(totalAmount)}
          </div>
        </div>

        {/* Payment Modes List matching Payment — methods.png */}
        <div className="space-y-2.5 mb-6">
          {/* UPI Option */}
          <div
            onClick={() => setSelectedMode('upi')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedMode === 'upi'
                ? 'border-gray-900 bg-gray-50/70 shadow-subtle'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedMode === 'upi' ? 'border-gray-900' : 'border-gray-300'
                }`}
              >
                {selectedMode === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
              </div>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <QrCode size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">UPI Dynamic QR / VPA</p>
                <p className="text-[11px] text-gray-400">GPay · PhonePe · Paytm · BHIM</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondaryGreen-50 text-secondaryGreen-700">
              Fastest
            </span>
          </div>

          {/* Cash Option */}
          <div
            onClick={() => setSelectedMode('cash')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedMode === 'cash'
                ? 'border-gray-900 bg-gray-50/70 shadow-subtle'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedMode === 'cash' ? 'border-gray-900' : 'border-gray-300'
                }`}
              >
                {selectedMode === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
              </div>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <Banknote size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Cash</p>
                <p className="text-[11px] text-gray-400">Cash payment & change calculator</p>
              </div>
            </div>
          </div>

          {/* Card Option */}
          <div
            onClick={() => setSelectedMode('card')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedMode === 'card'
                ? 'border-gray-900 bg-gray-50/70 shadow-subtle'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedMode === 'card' ? 'border-gray-900' : 'border-gray-300'
                }`}
              >
                {selectedMode === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
              </div>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">Credit / Debit Card</p>
                <p className="text-[11px] text-gray-400">Visa, Mastercard, RuPay, Amex</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Contextual Inputs */}
        {selectedMode === 'cash' && (
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Cash Tendered by Customer
            </label>
            <div className="relative mb-3">
              <span className="absolute left-3.5 top-2.5 font-bold text-gray-400">₹</span>
              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:border-gray-600 bg-white"
              />
            </div>

            {/* Quick Denominations */}
            <div className="flex items-center gap-1.5 mb-3">
              {quickCashOptions.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashTendered(amt.toString())}
                  className="px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
              <span className="text-gray-500 font-medium">Change to return:</span>
              <span className="text-sm font-extrabold text-secondaryGreen-700">
                {formatINR(changeToReturn)}
              </span>
            </div>
          </div>
        )}

        {selectedMode === 'upi' && (
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
            <div className="w-32 h-32 bg-white border border-gray-200 rounded-xl p-2 mx-auto mb-2 flex items-center justify-center shadow-subtle">
              <QrCode size={96} className="text-gray-800" />
            </div>
            <p className="text-xs font-bold text-gray-900">{settings.upiVpaId || 'signlaban@icici'}</p>
            <p className="text-[11px] text-gray-400">Scan customer QR or enter VPA on phone / UPI app</p>
          </div>
        )}

        {selectedMode === 'card' && (
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-600">
            <CreditCard size={28} className="mx-auto text-gray-700 mb-1.5" />
            <p className="font-semibold text-gray-900">Card Payment Confirmation</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Collect payment on card machine and tap Confirm</p>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-2xl bg-[#556475] hover:bg-slate-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>Confirm Payment</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

