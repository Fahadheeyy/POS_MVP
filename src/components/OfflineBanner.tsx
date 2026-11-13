import React from 'react';
import { useAppStore } from '../store';
import { WifiOff, Printer, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { settings, toggleOfflineSimulated, togglePrinterSimulated } = useAppStore();

  const isOffline = settings.isSimulatedOffline;
  const isPrinterDown = settings.isSimulatedPrinterDown;

  if (!isOffline && !isPrinterDown) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between animate-fadeIn text-gray-800">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200/80 flex items-center justify-center text-gray-600 mt-0.5 shrink-0">
          {isOffline ? <WifiOff size={16} /> : <Printer size={16} />}
        </div>
        <div>
          <h4 className="font-bold text-sm text-gray-900 leading-tight">
            {isOffline && isPrinterDown
              ? 'Connection lost & printer disconnected · Orders stay on this display'
              : isOffline
              ? 'Connection lost · Orders stay on this display'
              : 'Printer disconnected · Receipts queued in memory'}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            {isOffline
              ? '2 ticket updates queued locally · New orders cannot arrive until you reconnect. Last synced just now. Do not resend orders.'
              : '1 thermal receipt waiting to print. Check paper roll or printer IP connection.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isOffline && (
          <button
            onClick={toggleOfflineSimulated}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-subtle flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} />
            Retry connection
          </button>
        )}
        {isPrinterDown && (
          <button
            onClick={togglePrinterSimulated}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-subtle flex items-center gap-1.5 transition-colors"
          >
            Reconnect printer
          </button>
        )}
      </div>
    </div>
  );
};

