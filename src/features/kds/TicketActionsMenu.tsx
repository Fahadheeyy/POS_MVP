import React, { useState } from 'react';
import { KdsTicket } from '../../types';
import { useAppStore } from '../../store';
import { ManagerPinModal } from '../../components/ManagerPinModal';
import { sounds } from '../../utils/audio';
import {
  FileText,
  Printer,
  Flame,
  Shuffle,
  FileEdit,
  PauseCircle,
  XCircle,
  X,
} from 'lucide-react';

interface TicketActionsMenuProps {
  ticket: KdsTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (ticket: KdsTicket) => void;
  onPrintKOT: (ticket: KdsTicket) => void;
}

export const TicketActionsMenu: React.FC<TicketActionsMenuProps> = ({
  ticket,
  isOpen,
  onClose,
  onViewDetails,
  onPrintKOT,
}) => {
  const { markTicketRush, cancelOrder, addTicketPrepNote } = useAppStore();
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const [prepNoteText, setPrepNoteText] = useState(ticket?.prepNote || '');

  if (!isOpen || !ticket) return null;

  const handleToggleRush = () => {
    sounds.playSuccess();
    markTicketRush(ticket.id, !ticket.isRush);
    onClose();
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    addTicketPrepNote(ticket.id, prepNoteText);
    setShowNotePrompt(false);
    onClose();
  };

  const handleAuthorizedCancel = () => {
    sounds.playSuccess();
    cancelOrder(ticket.orderId, 'Cancelled from KDS kitchen display by manager authorization');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-xs p-4 select-none animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-xs shadow-modal overflow-hidden">
        {/* Header matching Ticket actions open.png */}
        <div className="p-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm">
              Ticket {ticket.orderNumber}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {ticket.orderType === 'dine-in' ? `${ticket.tableNumber || 'Table'}` : 'Takeaway'} · {ticket.customerName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Options List matching Ticket actions open.png */}
        <div className="p-2 space-y-0.5 text-xs font-semibold text-gray-700">
          <button
            onClick={() => {
              onClose();
              onViewDetails(ticket);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
          >
            <FileText size={15} className="text-gray-400" />
            <span>View ticket details</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onPrintKOT(ticket);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
          >
            <Printer size={15} className="text-gray-400" />
            <span>Print ticket (KOT)</span>
          </button>

          <button
            onClick={handleToggleRush}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
              ticket.isRush ? 'bg-secondaryRed-50 text-secondaryRed-700 font-bold' : 'hover:bg-gray-50'
            }`}
          >
            <Flame size={15} className={ticket.isRush ? 'text-secondaryRed-600' : 'text-gray-400'} />
            <span>{ticket.isRush ? 'Remove rush priority' : 'Mark as rush'}</span>
          </button>

          <button
            onClick={() => setShowNotePrompt(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
          >
            <FileEdit size={15} className="text-gray-400" />
            <span>Add preparation note</span>
          </button>

          <button
            onClick={() => {
              sounds.playSuccess();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
          >
            <PauseCircle size={15} className="text-gray-400" />
            <span>Hold ticket</span>
          </button>

          <div className="pt-1 border-t border-gray-100">
            <button
              onClick={() => setShowManagerPinModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondaryRed-50 text-secondaryRed-600 text-left transition-colors"
            >
              <XCircle size={15} />
              <span>Cancel ticket...</span>
            </button>
            <p className="px-3 pb-1 text-[10px] text-gray-400 leading-tight">
              Cancellation requires manager confirmation.
            </p>
          </div>
        </div>

        {/* Note Prompt Modal */}
        {showNotePrompt && (
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <form onSubmit={handleSaveNote}>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Kitchen Prep Note
              </label>
              <input
                type="text"
                value={prepNoteText}
                onChange={(e) => setPrepNoteText(e.target.value)}
                placeholder="e.g. Extra crispy fries, separate dip bowl"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white mb-2 focus:outline-none focus:border-gray-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotePrompt(false)}
                  className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-gray-900 text-[11px] font-semibold text-white"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ManagerPinModal
        isOpen={showManagerPinModal}
        onClose={() => setShowManagerPinModal(false)}
        onSuccess={handleAuthorizedCancel}
        actionTitle="Authorize Ticket Cancellation"
        actionDescription={`Enter Manager PIN to void ticket ${ticket.orderNumber} from the kitchen.`}
      />
    </div>
  );
};

