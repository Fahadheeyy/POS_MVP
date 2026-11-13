import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Keypad } from './Keypad';
import { sounds } from '../utils/audio';
import { ShieldCheck, X } from 'lucide-react';

interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle: string;
  actionDescription: string;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle,
  actionDescription,
}) => {
  const { users } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
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

  const handleVerify = () => {
    // Check if entered PIN belongs to a Manager or Owner
    const manager = users.find(
      (u) => (u.role === 'manager' || u.role === 'owner') && u.pin === pin && u.active
    );

    if (manager) {
      sounds.playSuccess();
      setPin('');
      setError(null);
      onSuccess();
      onClose();
    } else {
      sounds.playError();
      setError('Incorrect Manager PIN. Demo PIN is 9999');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-modal relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-2 border border-primary-100">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{actionTitle}</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">{actionDescription}</p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600">
            Manager PIN: <span className="font-bold text-gray-900">9999</span> (Alex Rivera)
          </div>
        </div>

        <Keypad
          pin={pin}
          onDigit={handleDigit}
          onClear={handleClear}
          onBackspace={handleBackspace}
          onSubmit={handleVerify}
          error={error}
          submitLabel="Authorize Action"
        />
      </div>
    </div>
  );
};

