import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { Keypad } from '../../components/Keypad';
import { sounds } from '../../utils/audio';
import { Lock } from 'lucide-react';

interface DisplayLockedScreenProps {
  onUnlock: () => void;
}

export const DisplayLockedScreen: React.FC<DisplayLockedScreenProps> = ({ onUnlock }) => {
  const { currentUser, users } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + d);
      setError(null);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleUnlock = () => {
    // Check current user PIN or manager PIN (9999) or any active kitchen staff PIN
    if (pin === currentUser?.pin || pin === '9999' || pin === '1111') {
      sounds.playSuccess();
      setPin('');
      setError(null);
      onUnlock();
    } else {
      sounds.playError();
      setError('Incorrect PIN. (Jesselyn PIN: 1111 or Manager: 9999)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <Lock size={26} />
        </div>

        <h2 className="text-xl font-black text-gray-900 tracking-tight">Display Locked</h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Enter your 4-digit PIN to resume your shift.
        </p>

        <Keypad
          pin={pin}
          onDigit={handleDigit}
          onClear={handleClear}
          onBackspace={handleBackspace}
          onSubmit={handleUnlock}
          error={error}
          submitLabel="Unlock Display"
        />

        <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-400">
          Signed in as {currentUser?.name || 'Jesselyn Tan'} (PIN: {currentUser?.pin || '1111'})
        </div>
      </div>
    </div>
  );
};

