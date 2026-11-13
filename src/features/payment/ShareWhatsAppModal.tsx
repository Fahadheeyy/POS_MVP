import React, { useState } from 'react';
import { Order } from '../../types';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import { MessageSquare, Check, X, Copy, Phone, ArrowUpRight } from 'lucide-react';

interface ShareWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ShareWhatsAppModal: React.FC<ShareWhatsAppModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen || !order) return null;

  // Format WhatsApp message text
  const itemsText = order.items
    .map((it) => `• ${it.product.name} x${it.quantity} - ${formatINR(it.lineTotal)}`)
    .join('\n');

  const taxLine =
    order.tax > 0
      ? `*Tax (GST 5%):* ${formatINR(order.tax)}\n`
      : `*Tax:* Non-GST Bill\n`;

  const receiptMessage = `*SIGN LABAN · EGYPTIAN DESSERTS*
--------------------------------
*Order Token:* ${order.orderNumber}
*Date:* ${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}
*Mode:* Express Counter

*Items Ordered:*
${itemsText}

*Subtotal:* ${formatINR(order.subtotal)}
${order.discount > 0 ? `*Discount:* -${formatINR(order.discount)}\n` : ''}${taxLine}*Grand Total:* ${formatINR(order.total)}
*Payment Mode:* ${order.paymentMode.toUpperCase()}

Thank you for visiting Sign Laban!
India's First Egyptian Dessert · @signlaban
Shop 12, 100ft Road, Indiranagar, Bengaluru
--------------------------------
Powered by pos.bits High-Speed QSR Systems`;

  const cleanPhone = phoneNumber.replace(/\D/g, '');

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    setSent(true);

    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(receiptMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(receiptMessage)}`;

    window.open(url, '_blank');

    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptMessage).then(() => {
      sounds.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs animate-fadeIn p-4 select-none font-sans">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 shadow-modal relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Share Receipt to WhatsApp</h3>
            <p className="text-xs text-slate-400">
              Instant digital bill for {order.orderNumber}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Check size={24} />
            </div>
            <p className="font-bold text-sm text-gray-900">WhatsApp Opened!</p>
            <p className="text-xs text-slate-500">Digital receipt dispatched to customer</p>
          </div>
        ) : (
          <form onSubmit={handleSendWhatsApp} className="space-y-4">
            {/* Phone Input with +91 Prefix */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Mobile Number
              </label>
              <div className="flex rounded-xl border border-slate-200 focus-within:border-emerald-500 overflow-hidden bg-white shadow-xs">
                <span className="px-3.5 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold font-mono border-r border-slate-200 flex items-center gap-1">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="flex-1 px-3.5 py-2.5 text-xs font-mono font-medium text-gray-900 placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter 10-digit number or leave blank to open WhatsApp selector
              </p>
            </div>

            {/* Receipt Preview Box */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Receipt Message Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                {receiptMessage}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Send WhatsApp</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

