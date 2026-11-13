import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { PaymentMode } from '../../types';
import { sounds } from '../../utils/audio';
import {
  Store,
  CreditCard,
  Printer,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Banknote,
  QrCode,
  Sparkles,
  Ban,
} from 'lucide-react';

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, setCurrentUser, users } = useAppStore();

  // Form State
  const [storeName, setStoreName] = useState(settings.storeName || 'Sign Laban');
  const [brandTagline, setBrandTagline] = useState(settings.brandTagline || "India's First Egyptian Dessert");
  const [address, setAddress] = useState(settings.address || 'Shop 12, 100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038');
  const [phone, setPhone] = useState(settings.phone || '+91 80 4958 2211');
  const [cashierName, setCashierName] = useState(settings.activeCashierName || 'Priya Sharma');

  // Key User Requirement: Default payment mode & Cash Timing (Before vs After)
  const [defaultPaymentMode, setDefaultPaymentMode] = useState<PaymentMode>(
    settings.defaultPaymentMode || 'upi'
  );
  const [cashTiming, setCashTiming] = useState<'before' | 'after'>(
    settings.cashTiming || 'before'
  );
  const [upiId, setUpiId] = useState(settings.upiId || 'signlaban@okhdfcbank');

  // Printer & Hardware (Receipt Printer Only)
  const [printerModel, setPrinterModel] = useState(settings.printerModel || 'EPSON TM-T88VII Thermal Printer');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(settings.autoPrintReceipt !== false);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || 'Thank you for visiting Sign Laban! Follow us @signlaban');

  // Taxes & Numbering & Compliance (GST Option)
  const [isGstEnabled, setIsGstEnabled] = useState<boolean>(
    settings.isGstEnabled !== undefined ? settings.isGstEnabled : true
  );
  const [gstin, setGstin] = useState(settings.gstin || '29AABCS1429B1Z8');
  const [fssai, setFssai] = useState(settings.fssai || '11223334000123');
  const [gstRate, setGstRate] = useState(settings.gstRate || 5);
  const [orderPrefix, setOrderPrefix] = useState(settings.orderPrefix || 'Token #');
  const [nextOrderSequence, setNextOrderSequence] = useState(settings.nextOrderSequence || 101);

  const handleSaveAndLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();

    updateSettings({
      storeName,
      brandTagline,
      address,
      phone,
      activeCashierName: cashierName,
      defaultPaymentMode,
      cashTiming,
      lastUsedPaymentMode: defaultPaymentMode,
      upiId,
      printerModel,
      autoPrintReceipt,
      receiptFooter,
      isGstEnabled,
      gstin: isGstEnabled ? gstin : '',
      fssai,
      gstRate: isGstEnabled ? gstRate : 0,
      orderPrefix,
      nextOrderSequence,
      isSetupCompleted: true,
    });

    // Ensure Priya Sharma (cashier) is set if default
    const foundUser = users.find((u) => u.name.toLowerCase() === cashierName.toLowerCase());
    if (foundUser) {
      setCurrentUser(foundUser);
    }

    navigate('/pos');
  };

  return (
    <div className="min-h-screen bg-[#bac7d5] flex items-center justify-center p-6 select-none font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-200/80 animate-scaleUp">
        {/* Header with Brand Logo */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <img src="/assets/pos-bits-logo.png" alt="pos.bits" className="h-8 w-auto object-contain" />
            <div className="border-l border-slate-200 pl-3">
              <span className="font-extrabold text-sm text-gray-900 tracking-tight uppercase block">
                Counter Setup Wizard
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure default payment flow, cash timing, printer & outlet
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            v1.0 Express
          </span>
        </div>

        <form onSubmit={handleSaveAndLaunch} className="space-y-6">
          {/* Section 1: Store & Operator Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Store size={15} className="text-[#556475]" />
              <span>1. Store & Counter Profile</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Brand / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Active Cashier
                </label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Outlet Location & City
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Sequence & Cash Timing (Key User Requirement) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <CreditCard size={15} className="text-[#556475]" />
                <span>2. Payment Flow & Cash Timing</span>
              </div>
              <span className="text-[10px] text-slate-400">Customizes order workflow</span>
            </div>

            {/* Default Payment Mode */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Default Tender Mode for Next Customer:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', desc: 'Fastest for Indian counters', icon: QrCode },
                  { id: 'cash', label: 'Cash', desc: 'Notes tender & change', icon: Banknote },
                  { id: 'card', label: 'Card', desc: 'Standalone EDC swipe', icon: CreditCard },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setDefaultPaymentMode(m.id as any)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      defaultPaymentMode === m.id
                        ? 'border-[#556475] bg-slate-50 shadow-xs ring-1 ring-[#556475]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <m.icon size={15} className={defaultPaymentMode === m.id ? 'text-[#556475]' : 'text-slate-400'} />
                      <span className="font-bold text-xs text-gray-900">{m.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{m.desc}</p>
                  </div>
                ))}
              </div>

              {/* UPI VPA Field */}
              <div className="mt-2.5">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Counter UPI Virtual Payment Address (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="signlaban@okhdfcbank"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Cash Timing Preference (Before vs After Checkout) */}
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                When do you want to default / calculate Cash tender?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setCashTiming('before')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    cashTiming === 'before'
                      ? 'border-[#556475] bg-slate-50 shadow-xs ring-1 ring-[#556475]/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900">Cash Before Checkout</span>
                    {cashTiming === 'before' && <CheckCircle2 size={14} className="text-[#556475]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Tender notes (₹500, ₹1000) and change calculation are selected directly under the cart before tapping Checkout.
                  </p>
                </div>

                <div
                  onClick={() => setCashTiming('after')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    cashTiming === 'after'
                      ? 'border-[#556475] bg-slate-50 shadow-xs ring-1 ring-[#556475]/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-gray-900">Cash After Checkout</span>
                    {cashTiming === 'after' && <CheckCircle2 size={14} className="text-[#556475]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Cart stays ultra-minimal with total only; tapping Checkout prompts for tender notes and change in payment dialog.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Hardware Statement & Printer Settings */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Printer size={15} className="text-[#556475]" />
                <span>3. Receipt Printer</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Receipt Printer Only
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Zero peripheral hardware needed:</strong> No card machine serial drivers, no cash drawer kick relays, and no scales required. Runs purely in your web browser with any standard thermal receipt printer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Printer Model
                </label>
                <input
                  type="text"
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white mt-4">
                <span className="text-xs font-semibold text-slate-700">Auto-Print Receipt</span>
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-[#556475] focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Taxes & Order Sequence */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Sliders size={15} className="text-[#556475]" />
              <span>4. Taxes & Token Numbering</span>
            </div>

            {/* GST Enable / Disable Choice */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Do you want to setup GST on orders?
              </label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div
                  onClick={() => setIsGstEnabled(true)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    isGstEnabled
                      ? 'border-[#556475] bg-slate-50 shadow-xs ring-1 ring-[#556475]/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <CheckCircle2 size={16} className={isGstEnabled ? 'text-[#556475]' : 'text-slate-300'} />
                  <div>
                    <span className="font-bold text-xs text-gray-900 block leading-tight">
                      Yes, Setup GST (Registered)
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Calculates CGST + SGST (5% composite / 18%) and prints GSTIN on receipt.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setIsGstEnabled(false)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    !isGstEnabled
                      ? 'border-[#556475] bg-slate-50 shadow-xs ring-1 ring-[#556475]/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Ban size={16} className={!isGstEnabled ? 'text-[#556475]' : 'text-slate-300'} />
                  <div>
                    <span className="font-bold text-xs text-gray-900 block leading-tight">
                      No GST (Non-GST / Exempt)
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      0% tax applied to dishes. Clean retail bill without tax breakdown.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {isGstEnabled && (
                <>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="29AABCS1429B1Z8"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      GST Rate
                    </label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400 bg-white"
                    >
                      <option value={5}>5% (Composite / Restaurant)</option>
                      <option value={18}>18% (Standard Rate)</option>
                    </select>
                  </div>
                </>
              )}

              <div className={isGstEnabled ? 'col-span-2' : 'col-span-2'}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  FSSAI License #
                </label>
                <input
                  type="text"
                  value={fssai}
                  onChange={(e) => setFssai(e.target.value)}
                  placeholder="11223334000123"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className={isGstEnabled ? 'col-span-2' : 'col-span-2'}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Starting Token #
                </label>
                <input
                  type="number"
                  value={nextOrderSequence}
                  onChange={(e) => setNextOrderSequence(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Skip to POS
            </button>

            <button
              type="submit"
              className="py-3.5 px-6 rounded-2xl bg-[#556475] hover:bg-slate-700 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Complete Setup & Launch Counter</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
