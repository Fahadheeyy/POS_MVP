import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { BusinessTenant } from '../../types';
import { Header } from '../../components/Header';
import { formatINR } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Building2,
  Plus,
  Check,
  CheckCircle2,
  Sliders,
  Receipt,
  Palette,
  Download,
  Upload,
  Play,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Layers,
  Settings,
  DollarSign,
  Smartphone,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Volume2,
  Database,
  Search,
  Store,
  ChefHat,
  MonitorCheck,
  BarChart3,
  Wifi,
  Printer,
  ChevronRight,
  FileText,
  X,
  CreditCard,
  QrCode,
  Banknote
} from 'lucide-react';

export const AdminPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    businesses,
    activeBusinessId,
    settings,
    orders,
    tickets,
    products,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    switchActiveBusiness,
    seedSalesDemoData,
    updateSettings,
    toggleOfflineSimulated,
    togglePrinterSimulated,
    resetDemoData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'businesses' | 'features' | 'telemetry'>('businesses');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessTenant | null>(null);
  const [selectedBusinessForCustomization, setSelectedBusinessForCustomization] = useState<string>(activeBusinessId);
  const [notification, setNotification] = useState<string | null>(null);

  // New business form state
  const [formName, setFormName] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formCategory, setFormCategory] = useState('Egyptian Desserts');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('+91 98450 12345');
  const [formEmail, setFormEmail] = useState('contact@outlet.in');
  const [formGstin, setFormGstin] = useState('29AABCS1429B1Z2');
  const [formFssai, setFormFssai] = useState('11223344556677');
  const [formPlanTier, setFormPlanTier] = useState<'trial' | 'starter' | 'growth' | 'enterprise'>('growth');
  const [formThemeColor, setFormThemeColor] = useState('#556475');
  const [formKdsEnabled, setFormKdsEnabled] = useState(true);
  const [formGstEnabled, setFormGstEnabled] = useState(true);
  const [formGstRate, setFormGstRate] = useState(5);
  const [formAddOnsEnabled, setFormAddOnsEnabled] = useState(true);
  const [formAutoPrint, setFormAutoPrint] = useState(true);
  const [formCashTiming, setFormCashTiming] = useState<'before' | 'after'>('after');

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const activeTenant = businesses.find((b) => b.id === activeBusinessId) || businesses[0];
  const targetTenant = businesses.find((b) => b.id === selectedBusinessForCustomization) || activeTenant;

  // Filtered businesses
  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || b.planTier === filterTier;
    return matchesSearch && matchesTier;
  });

  // Calculate platform totals
  const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalOrders = orders.length;

  const handleOpenAddModal = () => {
    setFormName('Sign Laban Koramangala');
    setFormBrandName('Sign Laban');
    setFormSlug('sign-laban-koramangala');
    setFormTagline("India's First Egyptian Dessert");
    setFormCategory('Egyptian Desserts');
    setFormAddress('432 80 Feet Road, 4th Block Koramangala, Bengaluru 560034');
    setFormPhone('+91 98765 43210');
    setFormEmail('koramangala@signlaban.in');
    setFormGstin('29AABCS1429B1Z8');
    setFormFssai('11223344556699');
    setFormPlanTier('growth');
    setFormThemeColor('#556475');
    setFormKdsEnabled(true);
    setFormGstEnabled(true);
    setFormGstRate(5);
    setFormAddOnsEnabled(true);
    setFormAutoPrint(true);
    setFormCashTiming('after');
    setEditingBusiness(null);
    setShowAddModal(true);
  };

  const handleEditBusinessModal = (biz: BusinessTenant) => {
    setFormName(biz.name);
    setFormBrandName(biz.brandName);
    setFormSlug(biz.slug);
    setFormTagline(biz.tagline || '');
    setFormCategory(biz.category);
    setFormAddress(biz.address);
    setFormPhone(biz.phone);
    setFormEmail(biz.email);
    setFormGstin(biz.gstin);
    setFormFssai(biz.fssai);
    setFormPlanTier(biz.planTier);
    setFormThemeColor(biz.themeColor);
    setFormKdsEnabled(biz.features.kdsEnabled);
    setFormGstEnabled(biz.features.gstEnabled);
    setFormGstRate(biz.features.gstRate);
    setFormAddOnsEnabled(biz.features.addOnsEnabled);
    setFormAutoPrint(biz.features.autoPrintReceipt);
    setFormCashTiming(biz.features.cashTiming);
    setEditingBusiness(biz);
    setShowAddModal(true);
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBrandName.trim()) return;

    if (editingBusiness) {
      updateBusiness(editingBusiness.id, {
        name: formName,
        brandName: formBrandName,
        slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        tagline: formTagline,
        category: formCategory,
        address: formAddress,
        phone: formPhone,
        email: formEmail,
        gstin: formGstin,
        fssai: formFssai,
        planTier: formPlanTier,
        themeColor: formThemeColor,
        features: {
          ...editingBusiness.features,
          kdsEnabled: formKdsEnabled,
          gstEnabled: formGstEnabled,
          gstRate: formGstRate,
          addOnsEnabled: formAddOnsEnabled,
          autoPrintReceipt: formAutoPrint,
          cashTiming: formCashTiming,
        },
      });
      triggerToast(`Updated profile for ${formName}`);
    } else {
      addBusiness({
        name: formName,
        brandName: formBrandName,
        slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        tagline: formTagline,
        category: formCategory,
        address: formAddress,
        phone: formPhone,
        email: formEmail,
        gstin: formGstin,
        fssai: formFssai,
        currency: 'INR',
        currencySymbol: '₹',
        planTier: formPlanTier,
        status: 'active',
        renewalDate: '2027-11-12',
        themeColor: formThemeColor,
        features: {
          kdsEnabled: formKdsEnabled,
          gstEnabled: formGstEnabled,
          gstRate: formGstRate,
          addOnsEnabled: formAddOnsEnabled,
          autoPrintReceipt: formAutoPrint,
          cashTiming: formCashTiming,
          enabledPayments: {
            cash: true,
            upi: true,
            card: true,
          },
          loyaltyEnabled: true,
          tableManagement: true,
          receiptHeader: `*** ${formBrandName.toUpperCase()} ***`,
          receiptFooter: 'Thank you for dining with us!',
          wifiPassword: 'Welcome@123',
        },
      });
      triggerToast(`Successfully onboarded new outlet: ${formName}`);
    }

    setShowAddModal(false);
  };

  const handleFeatureToggle = (key: keyof BusinessTenant['features'], value: any) => {
    if (!targetTenant) return;
    const updatedFeatures = {
      ...targetTenant.features,
      [key]: value,
    };
    updateBusiness(targetTenant.id, { features: updatedFeatures });
    triggerToast(`Updated ${String(key)} for ${targetTenant.name}`);
  };

  const handlePaymentToggle = (method: 'cash' | 'upi' | 'card') => {
    if (!targetTenant) return;
    const currentPayments = targetTenant.features.enabledPayments || { cash: true, upi: true, card: true };
    const updatedPayments = {
      ...currentPayments,
      [method]: !currentPayments[method],
    };
    handleFeatureToggle('enabledPayments', updatedPayments);
  };

  const handleSeedDemoData = (bizId: string, name: string) => {
    seedSalesDemoData(bizId);
    sounds.playSuccess();
    triggerToast(`Seeded 30-day realistic sales demo transactions for ${name}!`);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(businesses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pos_bits_tenants_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Exported businesses config JSON');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      <Header title="Developer & Sales Admin" subtitle="Multi-Tenant Platform Control Center" />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Developer Sub-Header Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">
                  Developer & Sales Command Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Tenant: <strong className="text-white font-semibold">{activeTenant.name}</strong> ({activeTenant.planTier.toUpperCase()} Plan) · Brand: {activeTenant.brandName}
              </p>
            </div>
          </div>

          {/* Quick Jumpers to Front-facing Apps */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/pos')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Store size={14} className="text-blue-400" />
              <span>Launch POS</span>
            </button>
            <button
              onClick={() => navigate('/kds')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <ChefHat size={14} className="text-amber-400" />
              <span>Launch KDS</span>
            </button>
            <button
              onClick={() => navigate('/manager')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Sliders size={14} className="text-purple-400" />
              <span>Manager Console</span>
            </button>
            <button
              onClick={() => navigate('/owner')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <BarChart3 size={14} className="text-emerald-400" />
              <span>Owner Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto p-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('businesses')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'businesses'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 size={16} />
              <span>Client Businesses & Outlets ({businesses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'features'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders size={16} />
              <span>Feature Flags & White-Labeling</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MonitorCheck size={16} />
              <span>Diagnostics & Sales Demo Mock Engine</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500">
            <span>Platform GMV: <strong className="text-slate-900 font-bold">{formatINR(totalRevenue)}</strong></span>
            <span>·</span>
            <span>Total Orders: <strong className="text-slate-900 font-bold">{totalOrders}</strong></span>
          </div>
        </div>

        {/* TAB 1: CLIENT BUSINESSES & OUTLETS */}
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            {/* Sales Toolkit & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
                <div className="relative w-full">
                  <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search brand, outlet name, address, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-slate-800 text-slate-900"
                  />
                </div>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-800"
                >
                  <option value="all">All Tiers</option>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportJson}
                  className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Export businesses metadata as JSON"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus size={16} />
                  <span>Onboard New Business</span>
                </button>
              </div>
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredBusinesses.map((biz) => {
                const isActive = biz.id === activeBusinessId;
                return (
                  <div
                    key={biz.id}
                    className={`bg-white rounded-2xl border p-5 transition-all relative flex flex-col justify-between ${
                      isActive
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {/* Top Row: Brand Info & Status Badges */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs"
                            style={{ backgroundColor: biz.themeColor || '#556475' }}
                          >
                            {biz.brandName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{biz.name}</h3>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <Check size={10} /> Active Outlet
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {biz.category} · Slug: <code className="text-slate-600">{biz.slug}</code>
                            </p>
                          </div>
                        </div>

                        {/* Plan Badge */}
                        <div className="text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              biz.planTier === 'enterprise'
                                ? 'bg-purple-100 text-purple-800'
                                : biz.planTier === 'growth'
                                ? 'bg-blue-100 text-blue-800'
                                : biz.planTier === 'starter'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {biz.planTier}
                          </span>
                        </div>
                      </div>

                      {/* Outlet Address & Tax Metadata */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1 mb-4">
                        <p className="line-clamp-1">📍 <strong>Address:</strong> {biz.address}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>GSTIN: <code className="font-mono text-slate-700">{biz.gstin}</code></span>
                          <span>FSSAI: <code className="font-mono text-slate-700">{biz.fssai}</code></span>
                        </div>
                        {biz.tagline && (
                          <p className="text-[11px] text-slate-400 italic pt-0.5 border-t border-slate-200/60">
                            "{biz.tagline}"
                          </p>
                        )}
                      </div>

                      {/* Enabled Features Pill List */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-5 text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium border ${
                            biz.features.kdsEnabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                          }`}
                        >
                          KDS Screen
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium border ${
                            biz.features.gstEnabled
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          GST ({biz.features.gstRate}%)
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium border ${
                            biz.features.addOnsEnabled
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                          }`}
                        >
                          Add-ons Engine
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium border ${
                            biz.features.autoPrintReceipt
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          Auto-Print
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          Cash: {biz.features.cashTiming === 'before' ? 'Before Checkout' : 'After Checkout'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!isActive ? (
                          <button
                            onClick={() => {
                              switchActiveBusiness(biz.id);
                              sounds.playSuccess();
                              triggerToast(`Switched active terminal outlet to ${biz.name}`);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <CheckCircle2 size={13} />
                            <span>Switch to this Outlet</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                            <Check size={13} /> Active in System
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setSelectedBusinessForCustomization(biz.id);
                            setActiveTab('features');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Sliders size={12} />
                          <span>Customise</span>
                        </button>

                        <button
                          onClick={() => handleSeedDemoData(biz.id, biz.name)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Generate 30-day realistic sales demo orders for client presentation"
                        >
                          <Sparkles size={12} className="text-amber-600" />
                          <span>Seed Sales Demo</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditBusinessModal(biz)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-gray-100 transition-colors"
                          title="Edit details"
                        >
                          <Edit3 size={14} />
                        </button>
                        {businesses.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${biz.name}?`)) {
                                deleteBusiness(biz.id);
                                triggerToast(`Removed ${biz.name}`);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete business"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sales Pitch Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-300" />
                  <h3 className="font-black text-base">Sales Pitch & Demo Mode</h3>
                </div>
                <p className="text-xs text-blue-100 max-w-xl">
                  Pitching pos.bits to a prospective QSR franchise or multi-unit operator? 
                  Switch the active outlet above, or click <strong>Seed Sales Demo</strong> to generate authentic Indian QSR tickets, GST tax receipts, and 30-day owner revenue metrics in 1-click.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    handleSeedDemoData(activeBusinessId, activeTenant.name);
                    navigate('/owner/reports');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white text-blue-900 font-extrabold text-xs hover:bg-blue-50 shadow-md transition-all flex items-center gap-2"
                >
                  <BarChart3 size={15} />
                  <span>Seed & Open Analytics</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FEATURE FLAGS & WHITE-LABELING */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* Business Selector Pill */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customising Outlet:</span>
                <select
                  value={selectedBusinessForCustomization}
                  onChange={(e) => setSelectedBusinessForCustomization(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.brandName}) {b.id === activeBusinessId ? '★ Active' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBusinessForCustomization !== activeBusinessId && (
                <button
                  onClick={() => {
                    switchActiveBusiness(selectedBusinessForCustomization);
                    triggerToast(`Switched active outlet to ${targetTenant.name}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Make Active Terminal
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Feature Flags & Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Feature Toggles Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900">Developer Feature Flags</h3>
                    <p className="text-xs text-slate-500">Toggle operational modules for {targetTenant.name}</p>
                  </div>

                  <div className="divide-y divide-gray-100 space-y-4">
                    {/* 1. KDS Engine */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <ChefHat size={16} className="text-slate-700" />
                          <span className="text-xs font-bold text-slate-900">Kitchen Display System (KDS)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Route orders to Grill, Fry, Cold and Expo touch screens with bump timers.
                        </p>
                      </div>
                      <button
                        onClick={() => handleFeatureToggle('kdsEnabled', !targetTenant.features.kdsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          targetTenant.features.kdsEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            targetTenant.features.kdsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 2. GST Tax Engine */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt size={16} className="text-slate-700" />
                          <span className="text-xs font-bold text-slate-900">Indian GST Tax Engine</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Compute CGST + SGST split on receipts, reports, and tax audits.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {targetTenant.features.gstEnabled && (
                          <select
                            value={targetTenant.features.gstRate}
                            onChange={(e) => handleFeatureToggle('gstRate', Number(e.target.value))}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                          >
                            <option value={5}>5% (Composite QSR)</option>
                            <option value={12}>12% (Standard)</option>
                            <option value={18}>18% (AC / Lounge)</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleFeatureToggle('gstEnabled', !targetTenant.features.gstEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                            targetTenant.features.gstEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              targetTenant.features.gstEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* 3. Add-Ons & Modifiers Engine */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-slate-700" />
                          <span className="text-xs font-bold text-slate-900">Product Add-ons & Modifiers Engine</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Prompt cashier for extra toppings, syrups, and crust customisations on product tap.
                        </p>
                      </div>
                      <button
                        onClick={() => handleFeatureToggle('addOnsEnabled', !targetTenant.features.addOnsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          targetTenant.features.addOnsEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            targetTenant.features.addOnsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 4. Auto-Print Receipts */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Printer size={16} className="text-slate-700" />
                          <span className="text-xs font-bold text-slate-900">Auto-Print Thermal Receipt on Payment</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Automatically trigger printer receipt immediately on successful checkout.
                        </p>
                      </div>
                      <button
                        onClick={() => handleFeatureToggle('autoPrintReceipt', !targetTenant.features.autoPrintReceipt)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          targetTenant.features.autoPrintReceipt ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            targetTenant.features.autoPrintReceipt ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 5. Cash Timing Flow */}
                    <div className="flex items-center justify-between pt-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Banknote size={16} className="text-slate-700" />
                          <span className="text-xs font-bold text-slate-900">Cash Payment Drawer Timing</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Default payment tender selection and drawer trigger behavior.
                        </p>
                      </div>
                      <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          onClick={() => handleFeatureToggle('cashTiming', 'after')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            targetTenant.features.cashTiming === 'after'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          After Checkout
                        </button>
                        <button
                          onClick={() => handleFeatureToggle('cashTiming', 'before')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            targetTenant.features.cashTiming === 'before'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Before Checkout
                        </button>
                      </div>
                    </div>

                    {/* 6. Enabled Payment Methods */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-slate-700" />
                        <span className="text-xs font-bold text-slate-900">Accepted Payment Tenders</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => handlePaymentToggle('cash')}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                            targetTenant.features.enabledPayments?.cash
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                              : 'border-gray-200 text-gray-400 opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Banknote size={14} /> Cash
                          </span>
                          {targetTenant.features.enabledPayments?.cash && <Check size={14} className="text-emerald-600" />}
                        </button>

                        <button
                          onClick={() => handlePaymentToggle('upi')}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                            targetTenant.features.enabledPayments?.upi
                              ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                              : 'border-gray-200 text-gray-400 opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <QrCode size={14} /> UPI QR
                          </span>
                          {targetTenant.features.enabledPayments?.upi && <Check size={14} className="text-blue-600" />}
                        </button>

                        <button
                          onClick={() => handlePaymentToggle('card')}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                            targetTenant.features.enabledPayments?.card
                              ? 'border-purple-500 bg-purple-50/50 text-purple-900'
                              : 'border-gray-200 text-gray-400 opacity-60'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <CreditCard size={14} /> Card (POS)
                          </span>
                          {targetTenant.features.enabledPayments?.card && <Check size={14} className="text-purple-600" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* White-Labeling & Receipt Branding */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-900">White-Labeling & Receipt Branding</h3>
                    <p className="text-xs text-slate-500">Customize receipt headers, greetings, and store guest WiFi</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Header Greeting</label>
                      <input
                        type="text"
                        value={targetTenant.features.receiptHeader || ''}
                        onChange={(e) => handleFeatureToggle('receiptHeader', e.target.value)}
                        placeholder="*** SIGN LABAN ***"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Footer Message</label>
                      <input
                        type="text"
                        value={targetTenant.features.receiptFooter || ''}
                        onChange={(e) => handleFeatureToggle('receiptFooter', e.target.value)}
                        placeholder="Thank you for dining with us! Follow @signlaban"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Guest Wi-Fi Password</label>
                      <input
                        type="text"
                        value={targetTenant.features.wifiPassword || ''}
                        onChange={(e) => handleFeatureToggle('wifiPassword', e.target.value)}
                        placeholder="GuestWiFi@2026"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Brand Theme Accent</label>
                      <div className="flex items-center gap-2">
                        {['#556475', '#0f172a', '#2563eb', '#e11d48', '#d97706', '#059669', '#7c3aed'].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              updateBusiness(targetTenant.id, { themeColor: color });
                              triggerToast(`Updated brand theme color`);
                            }}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${
                              targetTenant.themeColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Live Thermal Receipt Preview */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm sticky top-20">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} className="text-slate-700" />
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Live Thermal Receipt Preview</h4>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                      Auto-updates
                    </span>
                  </div>

                  {/* Thermal Slip */}
                  <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 font-mono text-slate-800 text-[11px] shadow-inner space-y-2 select-text">
                    <div className="text-center space-y-0.5">
                      <p className="font-bold text-sm tracking-wide">{targetTenant.brandName.toUpperCase()}</p>
                      <p className="text-[10px] text-slate-500">{targetTenant.tagline || "India's First Egyptian Dessert"}</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1">{targetTenant.address}</p>
                      <p className="text-[9px] text-slate-500">GSTIN: {targetTenant.gstin}</p>
                      {targetTenant.features.receiptHeader && (
                        <p className="text-[10px] font-bold text-slate-700 pt-1">{targetTenant.features.receiptHeader}</p>
                      )}
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    <div className="flex justify-between text-[10px]">
                      <span>Order: #T-108</span>
                      <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Type: Dine-In · Table 04</span>
                      <span>Cashier: Alex R.</span>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    {/* Sample Items */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold">
                        <span>1x Qashtuta Nutella Pistachio</span>
                        <span>₹320.00</span>
                      </div>
                      {targetTenant.features.addOnsEnabled && (
                        <div className="text-[9px] text-slate-500 pl-3">
                          + Extra Crushed Pistachio (₹40.00)
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>2x Umm Ali Royal Claypot</span>
                        <span>₹440.00</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹800.00</span>
                      </div>
                      {targetTenant.features.gstEnabled ? (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>CGST ({targetTenant.features.gstRate / 2}%):</span>
                            <span>₹{((800 * targetTenant.features.gstRate) / 200).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>SGST ({targetTenant.features.gstRate / 2}%):</span>
                            <span>₹{((800 * targetTenant.features.gstRate) / 200).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                            <span>TOTAL:</span>
                            <span>₹{(800 + (800 * targetTenant.features.gstRate) / 100).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
                          <span>TOTAL:</span>
                          <span>₹800.00</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2" />

                    <div className="text-center text-[10px] space-y-1 text-slate-600">
                      {targetTenant.features.wifiPassword && (
                        <p className="text-[9px]">Guest Wi-Fi: <strong>{targetTenant.features.wifiPassword}</strong></p>
                      )}
                      <p className="text-[9px]">{targetTenant.features.receiptFooter || 'Thank you for your visit!'}</p>
                      <p className="text-[8px] text-slate-400">Powered by pos.bits QSR Core</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Auto-print status:</span>
                    <span
                      className={`font-bold ${
                        targetTenant.features.autoPrintReceipt ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {targetTenant.features.autoPrintReceipt ? 'Enabled' : 'Reprint Only'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTICS & TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tenant Units</span>
                  <Building2 size={16} className="text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{businesses.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Multi-tenant registered outlets</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Orders In Memory</span>
                  <Receipt size={16} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{orders.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Lifetime store transactions</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Active KDS Tickets</span>
                  <ChefHat size={16} className="text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{tickets.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Cooking / ready pipeline</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Products Catalog</span>
                  <Layers size={16} className="text-purple-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{products.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">SKUs with add-on mappings</p>
              </div>
            </div>

            {/* Diagnostic Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Hardware & Environment Simulators</h3>
                <p className="text-xs text-slate-500 mt-0.5">Test how the POS and KDS react to peripheral failures and network drops</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${settings.isSimulatedOffline ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      <Wifi size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Network Simulation</p>
                      <p className="text-[11px] text-slate-500">
                        {settings.isSimulatedOffline ? 'Simulating complete network loss (Offline mode)' : 'Connected online'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleOfflineSimulated}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      settings.isSimulatedOffline
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                    }`}
                  >
                    {settings.isSimulatedOffline ? 'Reconnect' : 'Drop Network'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${settings.isSimulatedPrinterDown ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      <Printer size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Thermal Printer Simulation</p>
                      <p className="text-[11px] text-slate-500">
                        {settings.isSimulatedPrinterDown ? 'Printer offline or paper jam' : 'Printer ready & listening'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={togglePrinterSimulated}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      settings.isSimulatedPrinterDown
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                    }`}
                  >
                    {settings.isSimulatedPrinterDown ? 'Restore Printer' : 'Jam / Unplug'}
                  </button>
                </div>
              </div>

              {/* Sound test bench */}
              <div className="pt-4 border-t border-gray-100">
                <p className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-2">
                  <Volume2 size={15} /> Audio Chime Diagnostics
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => sounds.playNewTicket()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700"
                  >
                    🔔 KDS Order Chime
                  </button>
                  <button
                    onClick={() => sounds.playSuccess()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700"
                  >
                    ✨ Payment Success
                  </button>
                  <button
                    onClick={() => sounds.playError()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700"
                  >
                    ⚠️ Error Alert
                  </button>
                  <button
                    onClick={() => sounds.playClick()}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700"
                  >
                    🖱️ Tap Feedback
                  </button>
                </div>
              </div>

              {/* Master Database Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-rose-700">Developer Factory Reset</p>
                  <p className="text-[11px] text-slate-400">Reset local store, clear transaction history, and restore initial mock state</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Reset demo state to factory seed data?')) {
                      resetDemoData();
                      triggerToast('Database reset to factory demo state');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                >
                  Factory Reset Demo Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboard / Edit Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingBusiness ? `Edit Outlet: ${editingBusiness.name}` : 'Onboard New Business / Outlet'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Outlet / Unit Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sign Laban Koramangala"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formBrandName}
                    onChange={(e) => setFormBrandName(e.target.value)}
                    placeholder="e.g. Sign Laban"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category / Concept</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Egyptian Desserts, Specialty Cafe"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="India's First Egyptian Dessert"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store Address</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. 432 80 Feet Road, 4th Block Koramangala, Bengaluru"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="29AABCS1429B1Z2"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">FSSAI License</label>
                  <input
                    type="text"
                    value={formFssai}
                    onChange={(e) => setFormFssai(e.target.value)}
                    placeholder="11223344556677"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plan Tier</label>
                  <select
                    value={formPlanTier}
                    onChange={(e) => setFormPlanTier(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="trial">Trial (14 Days)</option>
                    <option value="starter">Starter (1 Outlet)</option>
                    <option value="growth">Growth (Multi-Outlet Franchise)</option>
                    <option value="enterprise">Enterprise (Unlimited Outlets)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Theme Accent</label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#556475', '#0f172a', '#2563eb', '#e11d48', '#d97706', '#059669', '#7c3aed'].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setFormThemeColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          formThemeColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Default feature switches */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-slate-800 mb-2">Initial Feature Configuration</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formKdsEnabled}
                      onChange={(e) => setFormKdsEnabled(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>KDS Enabled</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formGstEnabled}
                      onChange={(e) => setFormGstEnabled(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>GST (5% QSR)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formAddOnsEnabled}
                      onChange={(e) => setFormAddOnsEnabled(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Add-ons Engine</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formAutoPrint}
                      onChange={(e) => setFormAutoPrint(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Auto-Print</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {editingBusiness ? 'Save Changes' : 'Onboard Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
