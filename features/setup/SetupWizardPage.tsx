"use client";
import React, { useState } from 'react';
import { useNavigate } from '@/lib/navigation';
import { useAppStore } from '../../store';
import { PaymentMode } from '../../types';
import { sounds } from '../../utils/audio';
import { TikkitLogo } from '@/components/TikkitLogo';
import {
  Building2,
  MapPin,
  FileText,
  ShieldCheck,
  CreditCard,
  ChefHat,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  QrCode,
  Banknote,
  Printer,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, setCurrentUser, users, businesses, updateBusiness } = useAppStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STEP 1: Brand & Business Details
  const [brandName, setBrandName] = useState(settings.storeName || 'Sign Laban');
  const [legalName, setLegalName] = useState('Sign Laban Foods India Pvt Ltd');
  const [tagline, setTagline] = useState(settings.brandTagline || "India's First Egyptian Dessert");
  const [category, setCategory] = useState('Dessert QSR');
  const [slug, setSlug] = useState('sign-laban-blr');

  // STEP 2: Outlet Location & Contact
  const [outletName, setOutletName] = useState('Sign Laban · Indiranagar Flagship');
  const [address, setAddress] = useState(settings.address || '12th Main Rd, HAL 2nd Stage, Indiranagar');
  const [city, setCity] = useState('Bengaluru');
  const [stateCode, setStateCode] = useState('29'); // Karnataka
  const [pincode, setPincode] = useState('560038');
  const [phone, setPhone] = useState(settings.phone || '+91 80 4958 2211');
  const [email, setEmail] = useState(settings.email || 'indiranagar@signlaban.in');

  // STEP 3: Indian GST Configuration
  const [isGstEnabled, setIsGstEnabled] = useState<boolean>(
    settings.isGstEnabled !== undefined ? settings.isGstEnabled : true
  );
  const [gstin, setGstin] = useState(settings.gstin || '29AABCS1429B1Z8');
  const [gstRate, setGstRate] = useState<number>(settings.gstRate || 5);
  const [isCompositionScheme, setIsCompositionScheme] = useState<boolean>(false);

  // STEP 4: FSSAI & Receipts
  const [fssai, setFssai] = useState(settings.fssai || '11223334000123');
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader || 'SIGN LABAN · Egyptian Desserts\nIndiranagar, Bengaluru');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || 'Thank you for dining with Sign Laban! Follow @signlaban');
  const [wifiPassword, setWifiPassword] = useState(settings.wifiPassword || 'SignLabanGuest2026');

  // STEP 5: Counter Operations & Billing Rules
  const [defaultPaymentMode, setDefaultPaymentMode] = useState<PaymentMode>(
    settings.defaultPaymentMode || 'upi'
  );
  const [cashTiming, setCashTiming] = useState<'before' | 'after'>(
    settings.cashTiming || 'before'
  );
  const [upiId, setUpiId] = useState(settings.upiId || 'signlaban@okhdfcbank');
  const [printerModel, setPrinterModel] = useState(settings.printerModel || 'EPSON TM-T88VII Thermal Printer');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(settings.autoPrintReceipt !== false);
  const [roundingStrategy, setRoundingStrategy] = useState<'round_half_up' | 'none'>('round_half_up');

  // STEP 6: Menu & Team Seeding
  const [seedDefaultMenu, setSeedDefaultMenu] = useState(true);
  const [cashierName, setCashierName] = useState(settings.activeCashierName || 'Priya Sharma');

  // Validation per step
  const validateCurrentStep = (): boolean => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!brandName.trim()) {
        setErrorMessage('Please enter a valid restaurant brand name.');
        return false;
      }
      if (!slug.trim()) {
        setErrorMessage('Please enter a URL slug.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!address.trim() || !city.trim() || !pincode.trim() || !phone.trim()) {
        setErrorMessage('Please provide complete outlet address, city, pincode and phone.');
        return false;
      }
      if (!/^\d{6}$/.test(pincode.trim())) {
        setErrorMessage('Pincode must be exactly 6 digits.');
        return false;
      }
    }

    if (currentStep === 3 && isGstEnabled) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin.trim().toUpperCase())) {
        setErrorMessage('Invalid GSTIN format. Must be 15 characters (e.g. 29AABCS1429B1Z8).');
        return false;
      }
      // Check state code matching
      if (gstin.substring(0, 2) !== stateCode) {
        setErrorMessage(`GSTIN state code prefix (${gstin.substring(0, 2)}) does not match selected state (${stateCode}).`);
        return false;
      }
    }

    if (currentStep === 4) {
      if (fssai && !/^\d{14}$/.test(fssai.trim())) {
        setErrorMessage('FSSAI license number must be exactly 14 digits.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    sounds.playClick();
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    sounds.playClick();
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteOnboarding = () => {
    if (!validateCurrentStep()) return;
    sounds.playSuccess();

    // Persist all configurations into store and active business
    updateSettings({
      storeName: brandName,
      brandTagline: tagline,
      address: `${address}, ${city}, KA ${pincode}`,
      phone,
      email,
      activeCashierName: cashierName,
      defaultPaymentMode,
      cashTiming,
      lastUsedPaymentMode: defaultPaymentMode,
      upiId,
      printerModel,
      autoPrintReceipt,
      receiptHeader,
      receiptFooter,
      wifiPassword,
      isGstEnabled,
      gstin: isGstEnabled ? gstin.toUpperCase() : '',
      fssai,
      gstRate: isGstEnabled ? gstRate : 0,
      isSetupCompleted: true,
    });

    if (businesses.length > 0) {
      updateBusiness(businesses[0].id, {
        name: outletName,
        brandName,
        tagline,
        address: `${address}, ${city}, KA ${pincode}`,
        phone,
        email,
        gstin: isGstEnabled ? gstin.toUpperCase() : '',
        fssai,
        status: 'active',
        features: {
          ...businesses[0].features,
          gstEnabled: isGstEnabled,
          gstRate: isGstEnabled ? gstRate : 0,
          cashTiming,
          autoPrintReceipt,
          receiptHeader,
          receiptFooter,
          wifiPassword,
        },
      });
    }

    // Set default cashier user
    const cashierUser = users.find((u) => u.name.toLowerCase().includes('priya')) || users[0];
    if (cashierUser) {
      setCurrentUser(cashierUser);
    }

    navigate('/pos');
  };

  const steps = [
    { number: 1, title: 'Brand', icon: Building2 },
    { number: 2, title: 'Outlet', icon: MapPin },
    { number: 3, title: 'GST & Tax', icon: FileText },
    { number: 4, title: 'FSSAI & Receipt', icon: ShieldCheck },
    { number: 5, title: 'Operations', icon: Sliders },
    { number: 6, title: 'Catalog & Team', icon: ChefHat },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-6 select-none font-sans">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-200/80 animate-scaleUp">
        {/* Wizard Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <TikkitLogo variant="header" size="sm" />
            <div className="border-l border-slate-200 pl-3">
              <span className="font-extrabold text-xs text-gray-900 tracking-tight uppercase block">
                Restaurant Onboarding Wizard
              </span>
              <p className="text-[11px] text-gray-400">Step {currentStep} of 6 · {steps[currentStep - 1].title}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <Sparkles size={12} className="text-blue-600" />
            Sign Laban QSR
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {steps.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;
            return (
              <div key={s.number} className="text-center">
                <div
                  className={`h-1.5 rounded-full transition-all mb-2 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-slate-900'
                      : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold block truncate ${
                    isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: BRAND DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">1. Brand & Corporate Entity</h3>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Restaurant Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Sign Laban"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Sign Laban Foods India Pvt Ltd"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Restaurant Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 bg-white text-slate-900"
                >
                  <option value="Dessert QSR">Dessert QSR</option>
                  <option value="Quick Service Restaurant">Quick Service Restaurant</option>
                  <option value="Bakery & Cafe">Bakery & Cafe</option>
                  <option value="Cloud Kitchen">Cloud Kitchen</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="India's First Egyptian Dessert"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* STEP 2: OUTLET LOCATION */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">2. Outlet Branch & Contact Details</h3>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Branch Name</label>
              <input
                type="text"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                placeholder="Sign Laban · Indiranagar Flagship"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="12th Main Rd, HAL 2nd Stage, Indiranagar"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">State Code</label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 bg-white text-slate-900"
                >
                  <option value="29">29 - Karnataka</option>
                  <option value="27">27 - Maharashtra</option>
                  <option value="07">07 - Delhi</option>
                  <option value="33">33 - Tamil Nadu</option>
                  <option value="36">36 - Telangana</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="560038"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Store Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 80 4958 2211"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Store Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="indiranagar@signlaban.in"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GST & COMPLIANCE */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">3. Indian Goods & Services Tax (GST)</h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Enable GST Billing</p>
                <p className="text-[11px] text-slate-500">Calculate CGST, SGST, IGST and generate Rule 46 invoices</p>
              </div>
              <input
                type="checkbox"
                checked={isGstEnabled}
                onChange={(e) => setIsGstEnabled(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded border-slate-300"
              />
            </div>

            {isGstEnabled && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    GSTIN (15 Characters)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AABCS1429B1Z8"
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-slate-800 text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Prefix 29 indicates Karnataka jurisdiction.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST Tax Rate</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 bg-white text-slate-900 font-semibold"
                    >
                      <option value={5}>5% GST (Standard Restaurant No-ITC)</option>
                      <option value={18}>18% GST (Hotel / Standard Commercial)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Scheme</label>
                    <div className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700">
                      Regular Restaurant (5% No ITC)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: FSSAI & RECEIPT BRANDING */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">4. Food Safety (FSSAI) & Thermal Receipt Branding</h3>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">FSSAI License # (14 Digits)</label>
              <input
                type="text"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                placeholder="11223334000123"
                maxLength={14}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receipt Header Text</label>
              <textarea
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Receipt Footer Message</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Guest Wi-Fi Password on Receipt</label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
              />
            </div>
          </div>
        )}

        {/* STEP 5: OPERATIONAL RULES & PAYMENTS */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">5. Counter Operations & Cash Flow Timing</h3>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Primary Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'upi', label: 'UPI QR', icon: QrCode },
                  { mode: 'cash', label: 'Cash', icon: Banknote },
                  { mode: 'card', label: 'Card / EDC', icon: CreditCard },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setDefaultPaymentMode(item.mode as PaymentMode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      defaultPaymentMode === item.mode
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={13} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Cash Collection Timing</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashTiming('before')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cashTiming === 'before'
                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Pay Before (QSR Fast Counter)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Payment collected upfront before food prep.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCashTiming('after')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cashTiming === 'after'
                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">Pay After (Dine-In)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Collect payment when table bill is requested.</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Thermal Printer</label>
                <input
                  type="text"
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Store UPI VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: CATALOG & TEAM */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">6. Menu Catalog & Front-Desk Staff Assignment</h3>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Preload Sign Laban Flagship Catalog</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  61 authentic Egyptian dessert items, modifiers, combos, and image assets will be provisioned.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Head Cashier</label>
              <select
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-slate-800 bg-white text-slate-900"
              >
                <option value="Priya Sharma">Priya Sharma (Head Cashier · Indiranagar)</option>
                <option value="Alex Rivera">Alex Rivera (Store Manager)</option>
                <option value="Vikram Sethi">Vikram Sethi (Franchise Owner)</option>
              </select>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Skip to POS
            </button>
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteOnboarding}
              className="py-3 px-6 rounded-2xl bg-[#556475] hover:bg-slate-700 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check size={15} />
              <span>Complete Onboarding & Launch Counter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
