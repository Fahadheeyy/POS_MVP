import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onContinue,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    sounds.playSuccess();
    const timer = setTimeout(() => {
      onContinue();
    }, 1200);
    return () => clearTimeout(timer);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-8 shadow-modal text-center animate-scaleUp">
        {/* Checkmark circle from Payment — success.png */}
        <div className="w-20 h-20 rounded-full bg-slate-600 text-white flex items-center justify-center mx-auto mb-4 shadow-subtle">
          <Check size={40} strokeWidth={3} />
        </div>

        <h3 className="font-bold text-gray-900 text-xl tracking-tight mb-1">
          Payment Success
        </h3>
        <p className="text-xs text-gray-500">
          Your payment is success!
        </p>
      </div>
    </div>
  );
};

