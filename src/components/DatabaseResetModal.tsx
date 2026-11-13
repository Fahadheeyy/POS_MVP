import React, { useState } from 'react';
import { useAppStore } from '../store';
import { AlertTriangle, ShieldAlert, Lock, Trash2, X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { sounds } from '../utils/audio';

interface DatabaseResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseResetModal: React.FC<DatabaseResetModalProps> = ({ isOpen, onClose }) => {
  const { resetDemoData, users } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const REQUIRED_PHRASE = 'RESET DATABASE';
  const isPhraseValid = typedConfirmation.trim().toUpperCase() === REQUIRED_PHRASE;

  // Owner or Master PIN check
  const ownerUser = users.find((u) => u.role === 'owner');
  const validPins = [ownerUser?.pin || '8888', '9999'];

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhraseValid) return;
    setStep(2);
    setPinError('');
  };

  const handleConfirmReset = () => {
    if (!validPins.includes(enteredPin)) {
      setPinError('Incorrect Owner PIN. Please try again (Hint: 8888).');
      sounds.playError();
      return;
    }

    setIsResetting(true);
    sounds.playSuccess();

    setTimeout(() => {
      resetDemoData();
      setIsResetting(false);
      handleClose();
      // Optional browser alert to notify state is refreshed
      setTimeout(() => {
        alert('Database has been completely wiped and re-seeded to factory demo state.');
      }, 100);
    }, 600);
  };

  const handleClose = () => {
    setStep(1);
    setTypedConfirmation('');
    setEnteredPin('');
    setPinError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-secondaryRed-50 border-b border-secondaryRed-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondaryRed-600 text-white flex items-center justify-center shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-secondaryRed-950">
                Two-Step Database Reset
              </h2>
              <p className="text-xs text-secondaryRed-700 font-semibold">
                Step {step} of 2 Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleProceedToStep2} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Irreversible Action</p>
                  <p className="text-amber-800 leading-relaxed">
                    This will permanently delete all transaction history, kitchen tickets, revenue records, and custom products, resetting the system back to clean demo data.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Type <span className="text-secondaryRed-600 font-mono font-black">{REQUIRED_PHRASE}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  placeholder="RESET DATABASE"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-secondaryRed-500 focus:border-secondaryRed-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isPhraseValid}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isPhraseValid
                      ? 'bg-secondaryRed-600 hover:bg-secondaryRed-700 text-white shadow-subtle'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span>Proceed to PIN</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-secondaryRed-100 text-secondaryRed-700 mx-auto flex items-center justify-center mb-2">
                  <Lock size={24} />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">
                  Enter Owner Security PIN
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Authorized Owner or Master PIN required (Hint: 8888)
                </p>
              </div>

              {/* PIN display boxes */}
              <div className="flex justify-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center font-mono text-xl font-black ${
                      enteredPin.length > idx
                        ? 'border-secondaryRed-500 bg-secondaryRed-50 text-secondaryRed-700'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {enteredPin.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>

              {pinError && (
                <p className="text-center text-xs font-bold text-secondaryRed-600 animate-shake">
                  {pinError}
                </p>
              )}

              {/* Touch Numpad */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-[260px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => {
                      if (digit === 'C') {
                        setEnteredPin('');
                        setPinError('');
                      } else if (digit === '⌫') {
                        setEnteredPin((prev) => prev.slice(0, -1));
                        setPinError('');
                      } else if (enteredPin.length < 4) {
                        setEnteredPin((prev) => prev + digit);
                        setPinError('');
                      }
                    }}
                    className="h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 border border-gray-200 font-mono font-bold text-base text-gray-800 transition-all flex items-center justify-center"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={enteredPin.length < 4 || isResetting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    enteredPin.length === 4 && !isResetting
                      ? 'bg-secondaryRed-600 hover:bg-secondaryRed-700 text-white shadow-subtle'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={14} />
                  <span>{isResetting ? 'Wiping Database...' : 'Permanently Delete & Reset'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

