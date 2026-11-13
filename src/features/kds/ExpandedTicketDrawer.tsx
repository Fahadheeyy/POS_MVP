import React from 'react';
import { KdsTicket } from '../../types';
import { formatElapsedMinutes } from '../../utils/formatters';
import { X, Printer, MoreHorizontal, ArrowRight } from 'lucide-react';

interface ExpandedTicketDrawerProps {
  ticket: KdsTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvance: (ticketId: string) => void;
  onPrint: () => void;
  onOpenActions: (ticket: KdsTicket) => void;
}

export const ExpandedTicketDrawer: React.FC<ExpandedTicketDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  onAdvance,
  onPrint,
  onOpenActions,
}) => {
  if (!isOpen || !ticket) return null;

  const totalPortions = ticket.items.reduce((sum, i) => sum + i.quantity, 0);

  // Group portions by station
  const stationPortions: { [st: string]: number } = {};
  ticket.items.forEach((item) => {
    stationPortions[item.station] = (stationPortions[item.station] || 0) + item.quantity;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/30 backdrop-blur-xs flex justify-end animate-fadeIn select-none">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-200 animate-slideLeft">
        {/* Header matching Expanded ticket 334.png */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Ticket {ticket.orderNumber}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-gray-900">
                {ticket.orderType === 'dine-in' ? `${ticket.tableNumber || 'Table'}` : 'Takeaway'} · {ticket.customerName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Channel: {ticket.channel} · Pickup in {ticket.targetMinutes} min
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-gray-900 font-mono">
                {formatElapsedMinutes(ticket.createdAt)}
              </span>
              <p className="text-[10px] text-gray-400">target {ticket.targetMinutes} min</p>
            </div>
          </div>

          {/* Badge Bar */}
          <div className="mt-4 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-800 capitalize">
              {ticket.status} · {ticket.status === 'new' ? 'Not started' : ticket.status === 'cooking' ? 'In progress' : 'Ready for pickup'}
            </span>
            <span className="text-gray-500 font-medium">
              {ticket.items.length} item lines · {totalPortions} portions
            </span>
          </div>
        </div>

        {/* Items List matching Expanded ticket 334.png */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-900 uppercase tracking-wide">
            <span>All items</span>
            <span onClick={onClose} className="text-primary-600 font-semibold cursor-pointer lowercase">
              collapse ticket
            </span>
          </div>

          <div className="space-y-3">
            {ticket.items.map((item) => (
              <div key={item.id} className="pb-3 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-3">
                  <span className="w-6 text-sm font-black text-gray-900">{item.quantity}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${item.isReady ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Station: <span className="font-semibold text-gray-600">{item.station}</span>
                    </p>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
                        {item.modifiers.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Allergy Note if present */}
          {ticket.allergyNote && (
            <div className="p-3.5 rounded-xl bg-secondaryRed-50 border border-secondaryRed-200 text-xs text-secondaryRed-800 font-semibold">
              ⚠️ {ticket.allergyNote}
            </div>
          )}

          {/* Station breakdown card matching Expanded ticket 334.png */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wide">
              Station Breakdown
            </h4>
            <div className="flex flex-wrap gap-3 text-xs text-gray-700">
              {Object.entries(stationPortions).map(([st, cnt]) => (
                <div key={st} className="flex items-center gap-1">
                  <span className="font-bold text-gray-900">{st}</span>
                  <span className="text-gray-400">· {cnt} portions</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 leading-snug pt-1">
              All stations must finish preparing their portions before this ticket is ready for Expo pass.
            </p>
          </div>
        </div>

        {/* Footer actions matching Expanded ticket 334.png */}
        <div className="p-6 border-t border-gray-100 bg-white flex items-center gap-2.5">
          <button
            onClick={() => {
              onAdvance(ticket.id);
              onClose();
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-subtle flex items-center justify-center gap-2 transition-colors"
          >
            <span>
              {ticket.status === 'new'
                ? 'Start cooking'
                : ticket.status === 'cooking'
                ? 'Mark ready'
                : 'Bump ticket'}
            </span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onPrint}
            className="py-3.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs shadow-subtle flex items-center gap-1.5 transition-colors"
          >
            <Printer size={15} />
            Print ticket
          </button>

          <button
            onClick={() => onOpenActions(ticket)}
            className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-subtle transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

