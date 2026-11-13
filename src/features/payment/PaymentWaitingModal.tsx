import React, { useEffect } from 'react';

interface PaymentWaitingModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentWaitingModal: React.FC<PaymentWaitingModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    // Auto-advance after 2 seconds to simulate fast payment confirmation
    const timer = setTimeout(() => {
      onSuccess();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-8 shadow-modal text-center">
        {/* 3 Animated Dots from Payment — waiting.png */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce" />
        </div>

        <h3 className="font-bold text-gray-900 text-xl tracking-tight mb-2">
          Waiting for payment
        </h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-8">
          Payment is in process, please wait several moments to print a receipt of payment.
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs shadow-subtle transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

