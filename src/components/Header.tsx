import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { Role } from '../types';
import { DatabaseResetModal } from './DatabaseResetModal';
import { Wifi, WifiOff, Printer, ShieldAlert, ShieldCheck, LogOut, ChevronDown, Volume2, VolumeX, Maximize, RefreshCw, LayoutDashboard, AlertTriangle, Sliders } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    currentRole,
    settings,
    logout,
    setCurrentRole,
    kdsSoundEnabled,
    toggleKdsSound,
    toggleOfflineSimulated,
    togglePrinterSimulated,
    resetDemoData,
    kitchenAlert,
    setKitchenAlert,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    setShowRoleMenu(false);
    if (role === 'cashier') navigate('/pos');
    else if (role === 'kitchen') navigate('/kds');
    else if (role === 'manager') navigate('/manager');
    else if (role === 'owner') navigate('/owner');
    else if (role === 'admin') navigate('/admin');
  };

  const isOffline = settings.isSimulatedOffline;
  const isPrinterDown = settings.isSimulatedPrinterDown;
  const isKdsRoute = location.pathname.startsWith('/kds');

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Module Info */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img src="/assets/pos-bits-logo.png" alt="pos.bits" className="h-6 w-auto object-contain" />
          <div className="border-l border-gray-200 pl-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 tracking-tight text-xs uppercase leading-none block">
                {title && title !== 'Sign Laban'
                  ? title
                  : isKdsRoute
                  ? 'Kitchen Display (KDS)'
                  : currentRole === 'cashier'
                  ? 'POS Express Counter'
                  : currentRole === 'manager'
                  ? 'Manager Operations'
                  : 'Owner Dashboard'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-800 uppercase tracking-wider border border-slate-200/80">
                {settings.storeName || 'Sign Laban'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                · Indiranagar
              </span>
            </div>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 leading-none">{subtitle}</p>}
          </div>
        </div>

        {/* Dynamic Center Controls / Sub-navigation */}
        {children && <div className="ml-4 pl-4 border-l border-gray-100">{children}</div>}

        {/* Real-time Kitchen Rush Delay Alert broadcast */}
        {kitchenAlert && kitchenAlert.active && (
          <div className="ml-3 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 animate-pulse shadow-subtle">
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
            <span>{kitchenAlert.station} Delay: +{kitchenAlert.delayMinutes}m ({kitchenAlert.message})</span>
            <button
              onClick={() => setKitchenAlert(null)}
              title="Dismiss alert"
              className="text-amber-500 hover:text-amber-800 ml-1 text-xs font-bold leading-none"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Status, Simulation Controls, Time, Staff Profile */}
      <div className="flex items-center gap-5">
        {/* Connection & Printer Status Dot (Clickable simulator) */}
        <div className="relative">
          <button
            onClick={() => setShowStatusModal(!showStatusModal)}
            title="Click to toggle simulated Offline or Printer status"
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOffline || isPrinterDown ? 'bg-secondaryRed-500 animate-pulse' : 'bg-secondaryGreen-500'
              }`}
            />
            <span>
              {isOffline
                ? 'Offline'
                : isPrinterDown
                ? 'Printer offline'
                : 'Online · Printer ready'}
            </span>
          </button>

          {/* Quick Hardware Simulator Popover */}
          {showStatusModal && (
            <div className="absolute top-9 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-modal p-3 z-50 text-xs">
              <p className="font-semibold text-gray-900 mb-2">Printer & System Status</p>
              <div className="space-y-2">
                <button
                  onClick={toggleOfflineSimulated}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left font-medium transition-colors ${
                    isOffline ? 'bg-secondaryRed-50 border-secondaryRed-200 text-secondaryRed-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
                    Network Connection
                  </span>
                  <span className="font-semibold">{isOffline ? 'Offline' : 'Online'}</span>
                </button>
                <button
                  onClick={togglePrinterSimulated}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left font-medium transition-colors ${
                    isPrinterDown ? 'bg-secondaryRed-50 border-secondaryRed-200 text-secondaryRed-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Printer size={14} />
                    Receipt Printer
                  </span>
                  <span className="font-semibold">{isPrinterDown ? 'Disconnected' : 'Ready'}</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Toggling these will test system resilience and offline order queuing.
              </p>
            </div>
          )}
        </div>

        {/* KDS specific action buttons if on KDS */}
        {isKdsRoute && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleKdsSound}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                kdsSoundEnabled
                  ? 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  : 'border-secondaryRed-200 text-secondaryRed-600 bg-secondaryRed-50'
              }`}
            >
              {kdsSoundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              {kdsSoundEnabled ? 'Sound on' : 'Sound off'}
            </button>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors"
            >
              <Maximize size={13} />
              Full screen
            </button>
          </div>
        )}

        {/* Global Clock */}
        <div className="text-right border-l border-gray-100 pl-4">
          <div className="font-bold text-gray-900 text-base tracking-tight leading-none">
            {currentTime || '06:10 AM'}
          </div>
          <div className="text-[11px] text-gray-400 font-medium leading-none mt-0.5">
            {currentDate || 'Wednesday, Nov 10'}
          </div>
        </div>

        {/* Role & Staff Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 bg-white transition-all shadow-subtle"
          >
            <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-[10px] font-bold flex items-center justify-center">
              {currentUser?.avatarInitials || 'PR'}
            </div>
            <div className="text-left text-xs">
              <span className="font-semibold text-gray-800 block leading-tight">
                {currentUser?.name || 'Staff User'}
              </span>
              <span className="text-[10px] text-gray-400 capitalize block leading-none">
                {currentRole}
              </span>
            </div>
            <ChevronDown size={12} className="text-gray-400 ml-0.5" />
          </button>

          {/* Quick Switch Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 top-10 w-64 bg-white border border-gray-200 rounded-2xl shadow-modal p-2 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900">{currentUser?.name}</p>
                <p className="text-[11px] text-gray-500">{currentUser?.title} · Role: {currentRole}</p>
              </div>

              <div className="py-1">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Switch App / Role
                </p>
                <button
                  onClick={() => handleRoleChange('cashier')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    currentRole === 'cashier' ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>1. POS Cashier</span>
                  <span className="text-[10px] text-gray-400">PIN 1234</span>
                </button>
                <button
                  onClick={() => handleRoleChange('kitchen')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    currentRole === 'kitchen' ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>2. Kitchen Display (KDS)</span>
                  <span className="text-[10px] text-gray-400">PIN 1111</span>
                </button>
                <button
                  onClick={() => handleRoleChange('manager')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    currentRole === 'manager' ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>3. Manager Console</span>
                  <span className="text-[10px] text-gray-400">PIN 9999</span>
                </button>
                <button
                  onClick={() => handleRoleChange('owner')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    currentRole === 'owner' ? 'bg-primary-50 text-primary-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>4. Owner Dashboard & Reports</span>
                  <span className="text-[10px] text-gray-400">PIN 8888</span>
                </button>
                <button
                  onClick={() => handleRoleChange('admin')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    currentRole === 'admin' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-blue-600" />
                    <span>5. Developer & Sales Admin</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold">PIN 0000</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1 mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    navigate('/setup');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <Sliders size={12} className="text-slate-600" />
                  <span>Counter Setup Wizard</span>
                </button>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    navigate('/ui-kit');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  <LayoutDashboard size={12} />
                  <span>Interactive UI Kit Showcase</span>
                </button>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    setShowResetModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw size={12} />
                  <span>Reset Demo Data</span>
                </button>
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-secondaryRed-600 hover:bg-secondaryRed-50 font-medium"
                >
                  <LogOut size={12} />
                  <span>Sign out / Lock screen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-step verification database reset modal */}
      <DatabaseResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </header>
  );
};

