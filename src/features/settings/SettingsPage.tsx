import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Header } from '../../components/Header';
import { DatabaseResetModal } from '../../components/DatabaseResetModal';
import { formatINR } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Store,
  Receipt,
  Printer,
  Sliders,
  CreditCard,
  Hash,
  Shield,
  Database,
  ArrowLeft,
  Check,
  RefreshCw,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, resetDemoData } = useAppStore();

  const [formData, setFormData] = useState(settings);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'tax' | 'receipt' | 'printers' | 'kds' | 'payments' | 'numbering' | 'permissions' | 'data'
  >('profile');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportDatabase = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(localStorage.getItem('sign_laban_pos_v2') || '{}');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'sign_laban_database_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Store },
    { id: 'tax', label: 'Taxes (GST)', icon: Sliders },
    { id: 'receipt', label: 'Receipt Designer', icon: Receipt },
    { id: 'printers', label: 'Receipt Printer', icon: Printer },
    { id: 'kds', label: 'KDS Kitchen Settings', icon: Sliders },
    { id: 'payments', label: 'Payment Modes', icon: CreditCard },
    { id: 'numbering', label: 'Order Numbering', icon: Hash },
    { id: 'permissions', label: 'Roles & Permissions', icon: Shield },
    { id: 'data', label: 'Database & Reset', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col select-none">
      <Header title="Settings" subtitle="System & Outlet Configuration">
        <button
          onClick={() => navigate('/owner')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Dashboard</span>
        </button>
      </Header>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6">
        {/* Left Navigation Rail */}
        <div className="w-full md:w-64 bg-white border border-gray-200 rounded-3xl p-3 shadow-subtle h-fit space-y-1 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-left transition-all ${
                  isSelected
                    ? 'bg-gray-900 text-white shadow-subtle'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-3xl p-8 shadow-card flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Business Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-lg">Business Profile</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Store identification shown on customer receipts and bills.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Outlet / Brand Name</label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Brand Tagline</label>
                    <input
                      type="text"
                      value={formData.brandTagline}
                      onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">Registered Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">GSTIN (India)</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">FSSAI License #</label>
                    <input
                      type="text"
                      value={formData.fssai}
                      onChange={(e) => setFormData({ ...formData, fssai: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Taxes (GST) */}
            {activeTab === 'tax' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-lg">Goods & Services Tax (GST)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configures CGST and SGST calculation applied automatically on checkout.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-900">Enable GST on Orders</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        When enabled, applies CGST + SGST. When disabled, generates non-GST retail bills.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isGstEnabled !== false}
                      onChange={(e) => setFormData({ ...formData, isGstEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-gray-900 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">GST Rate (%)</label>
                    <div className="flex gap-3">
                      {[5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setFormData({ ...formData, gstRate: rate })}
                          className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                            formData.gstRate === rate
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {rate}% {rate === 5 ? '(Standard Restaurant)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                    <p className="font-bold text-gray-800">Current Tax Breakdown:</p>
                    <p className="text-gray-600">
                      • CGST (Central Tax): <strong>{formData.gstRate / 2}%</strong>
                    </p>
                    <p className="text-gray-600">
                      • SGST (State Tax): <strong>{formData.gstRate / 2}%</strong>
                    </p>
                    <p className="text-[11px] text-gray-400 pt-1">
                      Changing this rate updates future POS orders instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Receipt Designer with Live Receipt Preview */}
            {activeTab === 'receipt' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4 text-xs">
                  <div className="pb-3 border-b border-gray-100">
                    <h3 className="font-extrabold text-gray-900 text-lg">Receipt Designer</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Customise printable thermal slip.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Header Welcome Note</label>
                    <textarea
                      value={formData.receiptHeader}
                      onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Footer Greeting</label>
                    <textarea
                      value={formData.receiptFooter}
                      onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.showGstinOnReceipt}
                        onChange={(e) => setFormData({ ...formData, showGstinOnReceipt: e.target.checked })}
                        className="rounded border-gray-300 text-gray-900 focus:ring-0"
                      />
                      <span>Print GSTIN & FSSAI license on receipt</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.showWifiOnReceipt}
                        onChange={(e) => setFormData({ ...formData, showWifiOnReceipt: e.target.checked })}
                        className="rounded border-gray-300 text-gray-900 focus:ring-0"
                      />
                      <span>Print Guest WiFi credentials</span>
                    </label>
                  </div>

                  {formData.showWifiOnReceipt && (
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Guest WiFi Password</label>
                      <input
                        type="text"
                        value={formData.wifiPassword}
                        onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Live Receipt Preview matching Receipt — printed.png */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Live Receipt Preview
                  </span>
                  <div className="w-64 bg-white border border-gray-300 rounded-2xl p-4 shadow-card text-[11px] space-y-2 font-mono">
                    <div className="text-center pb-2 border-b">
                      <img src={formData.logoUrl || '/assets/logo.png'} alt={formData.storeName || 'Sign Laban'} className="h-6 w-auto mx-auto mb-1 object-contain" />
                      <p className="text-[9px] text-gray-500">{formData.address}</p>
                      {formData.showGstinOnReceipt && (
                        <p className="text-[9px] text-gray-500">GSTIN: {formData.gstin}</p>
                      )}
                      <p className="text-[10px] text-gray-600 mt-1">{formData.receiptHeader}</p>
                    </div>

                    <div className="space-y-1 py-1">
                      <div className="flex justify-between">
                        <span>1x Qashtuta Pistachio</span>
                        <span>₹320.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Umm Ali Lotus</span>
                        <span>₹270.00</span>
                      </div>
                    </div>

                    <div className="border-t pt-1 space-y-0.5 text-gray-600 text-[10px]">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹590.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST ({formData.gstRate}%):</span>
                        <span>₹29.50</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs text-gray-900 border-t pt-1">
                        <span>Total:</span>
                        <span>₹619.50</span>
                      </div>
                    </div>

                    {formData.showWifiOnReceipt && (
                      <div className="p-1 bg-gray-50 rounded text-center text-[9px] border">
                        WiFi: <strong>{formData.wifiPassword}</strong>
                      </div>
                    )}

                    <p className="text-center text-[9px] text-gray-400 pt-1">
                      {formData.receiptFooter}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Receipt Printer */}
            {activeTab === 'printers' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-lg">Receipt Printer Settings</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Zero hardware required except any standard thermal receipt printer.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{formData.printerModel}</p>
                      <p className="text-gray-400">Standard ESC/POS Thermal Receipt Printer</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => sounds.playSuccess()}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 font-semibold"
                    >
                      Test Feed
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 space-y-3">
                    <p className="font-bold text-gray-900">Simulate Network / Printer Disconnection</p>
                    <p className="text-gray-400 text-[11px]">
                      Toggle these to test POS offline order queuing and printer disconnect banners.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, isSimulatedOffline: !formData.isSimulatedOffline })
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          formData.isSimulatedOffline
                            ? 'bg-secondaryRed-50 border-secondaryRed-300 text-secondaryRed-700'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        {formData.isSimulatedOffline ? 'Simulating OFFLINE' : 'Network Online'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            isSimulatedPrinterDown: !formData.isSimulatedPrinterDown,
                          })
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          formData.isSimulatedPrinterDown
                            ? 'bg-secondaryRed-50 border-secondaryRed-300 text-secondaryRed-700'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        {formData.isSimulatedPrinterDown ? 'Simulating PRINTER DOWN' : 'Printer Ready'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Payments */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-lg">Payment Modes</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    UPI, Cash, and Card terminal settings.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Store UPI VPA / ID</label>
                    <input
                      type="text"
                      value={formData.upiVpaId}
                      onChange={(e) => setFormData({ ...formData, upiVpaId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Rendered on dynamic QR codes in POS checkout and customer receipts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Roles & Permissions */}
            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-lg">Roles & Permissions Matrix</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Access control enforced across all applications in this prototype.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-bold uppercase text-[10px] text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Permission</th>
                        <th className="px-4 py-3 text-center">Cashier</th>
                        <th className="px-4 py-3 text-center">Kitchen</th>
                        <th className="px-4 py-3 text-center">Manager</th>
                        <th className="px-4 py-3 text-center">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {[
                        { name: 'POS Order Taking & Payment', c: true, k: false, m: true, o: true },
                        { name: 'Cash Drawer Open / Close / Denominations', c: true, k: false, m: true, o: true },
                        { name: 'KDS Display & Ticket Bumping', c: false, k: true, m: true, o: true },
                        { name: 'Menu Item & Out-of-Stock Toggles', c: false, k: false, m: true, o: true },
                        { name: 'Staff PIN Resets & Approvals', c: false, k: false, m: true, o: true },
                        { name: 'Financial Analytics & GST Reports', c: false, k: false, m: false, o: true },
                        { name: 'Store Tax & System Settings', c: false, k: false, m: false, o: true },
                      ].map((perm) => (
                        <tr key={perm.name} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3 font-semibold text-gray-900">{perm.name}</td>
                          <td className="px-4 py-3 text-center">{perm.c ? '✅' : '—'}</td>
                          <td className="px-4 py-3 text-center">{perm.k ? '✅' : '—'}</td>
                          <td className="px-4 py-3 text-center">{perm.m ? '✅' : '—'}</td>
                          <td className="px-4 py-3 text-center">{perm.o ? '✅' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. Database & Reset */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-lg">Data Management</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Reset demo state or export database JSON.</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">Export State JSON</p>
                      <p className="text-gray-400 text-[11px]">Download full store database including 30-day orders.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportDatabase}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 shadow-subtle flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      Export JSON
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondaryRed-50 border border-secondaryRed-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-secondaryRed-900">Reset Demo Data</p>
                      <p className="text-secondaryRed-700 text-[11px]">
                        Re-seeds initial 30 days of orders, active tickets, and demo users.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="px-4 py-2 rounded-xl bg-secondaryRed-600 hover:bg-secondaryRed-700 text-white text-xs font-bold shadow-subtle flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} />
                      Reset Everything
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">All changes persist across browser tabs.</span>
              <div className="flex items-center gap-3">
                {savedSuccess && (
                  <span className="text-xs font-bold text-secondaryGreen-700 flex items-center gap-1">
                    <Check size={14} /> Settings Saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-subtle transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Two-step verification reset modal */}
      <DatabaseResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

