import React, { useState } from 'react';
import { Mail, Check, X } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface ShareEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
}

export const ShareEmailModal: React.FC<ShareEmailModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
}) => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    sounds.playSuccess();
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setEmail('');
      setError('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fadeIn p-4 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 shadow-modal relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
        >
          <X size={18} />
        </button>

        <h3 className="font-bold text-gray-900 text-lg text-center mb-1">Share to email</h3>
        <p className="text-xs text-gray-400 text-center mb-6">
          Add your email to send the receipt for {orderNumber}
        </p>

        {isSent ? (
          <div className="p-4 bg-secondaryGreen-50 border border-secondaryGreen-200 rounded-2xl text-center text-secondaryGreen-700 text-xs font-semibold flex items-center justify-center gap-2">
            <Check size={16} />
            Receipt sent successfully!
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="customer@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-gray-500"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-[11px] text-secondaryRed-600">{error}</p>}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

