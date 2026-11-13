import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { sounds } from '../../utils/audio';
import { X, Check, Volume2, Printer, Lock, Monitor, Sliders } from 'lucide-react';

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockNow: () => void;
}

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  onLockNow,
}) => {
  const {
    activeKdsStation,
    setActiveKdsStation,
    settings,
    updateSettings,
    currentUser,
  } = useAppStore();

  const [station, setStation] = useState(activeKdsStation);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundAlertsEnabled);
  const [lateSoundEnabled, setLateSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [keepAwake, setKeepAwake] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [autoLock, setAutoLock] = useState(settings.autoLockMinutes || 5);
  const [requirePin, setRequirePin] = useState(settings.requireStaffPin);

  if (!isOpen) return null;

  const handleSave = () => {
    sounds.playSuccess();
    setActiveKdsStation(station);
    updateSettings({
      soundAlertsEnabled: soundEnabled,
      autoLockMinutes: autoLock,
      requireStaffPin: requirePin,
    });
    onClose();
  };

  const handleTestSound = () => {
    sounds.playNewTicket();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-4xl p-8 shadow-modal max-h-[90vh] overflow-y-auto">
        {/* Header matching Display settings.png */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Display settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Kitchen display 01 · Changes apply to this device only.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-subtle"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors shadow-subtle"
            >
              Save changes
            </button>
          </div>
        </div>

        {/* 2 Column Settings Grid matching Display settings.png */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* 1. Station Assignment */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Sliders size={16} className="text-gray-500" />
                <h4 className="font-bold text-sm text-gray-900">Station assignment</h4>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Choose which tickets and item lines this display shows.
              </p>

              <div className="grid grid-cols-5 gap-2">
                {['All stations', 'Grill', 'Fry', 'Cold', 'Expo'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStation(st as any)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                      station === st
                        ? 'bg-gray-900 text-white border-gray-900 shadow-subtle'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                Assigned to {station} · Active ticket filter
              </p>
            </div>

            {/* 2. Sound Alerts */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-gray-500" />
                <h4 className="font-bold text-sm text-gray-900">Sound alerts</h4>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">New order sound</p>
                    <p className="text-[11px] text-gray-400">Play a chime when a ticket arrives.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Late ticket alert</p>
                    <p className="text-[11px] text-gray-400">Repeat every 60 seconds after target time.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={lateSoundEnabled}
                    onChange={(e) => setLateSoundEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Volume · 70%</span>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Test sound
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Printer connection */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Printer size={16} className="text-gray-500" />
                <h4 className="font-bold text-sm text-gray-900">Printer connection</h4>
              </div>

              <div className="flex items-center justify-between pt-1 mb-4">
                <div>
                  <p className="font-bold text-xs text-gray-900">{settings.printerModel}</p>
                  <p className="text-[11px] text-gray-400">Kitchen printer · 192.168.1.42</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-secondaryGreen-700">
                  <span className="w-2 h-2 rounded-full bg-secondaryGreen-500" />
                  <span>Connected</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => sounds.playSuccess()}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Print test ticket
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Change printer
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* 4. Display Preferences */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={16} className="text-gray-500" />
                <h4 className="font-bold text-sm text-gray-900">Display preferences</h4>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Open in fullscreen</p>
                    <p className="text-[11px] text-gray-400">Use full screen when this display starts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={fullscreen}
                    onChange={(e) => setFullscreen(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Keep display awake</p>
                    <p className="text-[11px] text-gray-400">Prevent sleep while kitchen display is running.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={keepAwake}
                    onChange={(e) => setKeepAwake(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Show keyboard shortcuts</p>
                    <p className="text-[11px] text-gray-400">Display shortcut hints in the board footer.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showShortcuts}
                    onChange={(e) => setShowShortcuts(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 5. Lock & Security */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-gray-500" />
                <h4 className="font-bold text-sm text-gray-900">Lock & security</h4>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Require staff PIN</p>
                    <p className="text-[11px] text-gray-400">Use a 4-digit PIN to sign in and unlock.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requirePin}
                    onChange={(e) => setRequirePin(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-gray-900">Auto-lock after inactivity</p>
                    <p className="text-[11px] text-gray-400">Order sync continues while locked.</p>
                  </div>
                  <select
                    value={autoLock}
                    onChange={(e) => setAutoLock(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700"
                  >
                    <option value={2}>2 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLockNow();
                    }}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Lock display now
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Change my PIN
                  </button>
                </div>

                <p className="text-[11px] text-gray-400">
                  Signed in as {currentUser?.name} · {currentUser?.title}
                </p>
              </div>
            </div>

            {/* 6. System Info Card */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-500 space-y-1">
              <p className="font-bold text-gray-900">Kitchen display 01</p>
              <p>KDS · Version 2.4.1</p>
              <p>Last synced just now · All systems operational</p>
              <p className="text-[10px] text-gray-400 pt-1">
                PIN resets and staff access are managed by a store manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

