import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { KdsTicket } from '../../types';
import { formatTime } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import { Search, ArrowLeft, RotateCcw, Printer, CheckCircle2 } from 'lucide-react';

interface BumpedTicketsViewProps {
  onBackToBoard: () => void;
  onPrintTicket: (ticket: KdsTicket) => void;
}

export const BumpedTicketsView: React.FC<BumpedTicketsViewProps> = ({
  onBackToBoard,
  onPrintTicket,
}) => {
  const { tickets, recallTicketById, recallLastBumpedTicket } = useAppStore();

  const bumpedTickets = tickets
    .filter((t) => t.status === 'bumped')
    .sort((a, b) => new Date(b.bumpedAt || 0).getTime() - new Date(a.bumpedAt || 0).getTime());

  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    bumpedTickets[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('All stations');

  const filtered = bumpedTickets.filter((t) => {
    const matchesSearch =
      t.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tableNumber && t.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStation =
      selectedStation === 'All stations' ||
      t.items.some((i) => i.station.toLowerCase() === selectedStation.toLowerCase());

    return matchesSearch && matchesStation;
  });

  const activeTicket = bumpedTickets.find((t) => t.id === selectedTicketId) || bumpedTickets[0];

  const handleRecall = (id: string) => {
    sounds.playBump();
    recallTicketById(id);
    // Switch to next remaining or close if none
    const remaining = bumpedTickets.filter((t) => t.id !== id);
    if (remaining.length > 0) {
      setSelectedTicketId(remaining[0].id);
    }
  };

  const handleRecallLast = () => {
    sounds.playBump();
    const recalled = recallLastBumpedTicket();
    if (recalled) {
      setSelectedTicketId('');
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col space-y-6 overflow-hidden select-none bg-surface-canvas">
      {/* Header matching Bumped ticket history.png */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bumped tickets</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review completed orders and return a ticket to the pass.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBoard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to board</span>
          </button>

          {bumpedTickets.length > 0 && (
            <button
              onClick={handleRecallLast}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-subtle transition-colors"
            >
              <RotateCcw size={14} />
              <span>Recall last bumped · {bumpedTickets[0]?.orderNumber}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket, table or customer"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-gray-400 shadow-subtle"
          />
        </div>

        {/* Station Filter */}
        <select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 shadow-subtle focus:outline-none"
        >
          <option value="All stations">All stations</option>
          <option value="Grill">Grill</option>
          <option value="Fry">Fry</option>
          <option value="Cold">Cold</option>
          <option value="Expo">Expo</option>
        </select>

        <span className="text-xs text-gray-500 font-medium">
          {filtered.length} completed tickets
        </span>
      </div>

      {/* Two Column Layout matching Bumped ticket history.png */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Side: Table of tickets */}
        <div className="flex-1 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-card flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Bumped at</th>
                  <th className="px-6 py-3">Prep time</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No bumped tickets found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, idx) => {
                    const isSelected = activeTicket?.id === t.id;
                    const portionCount = t.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-50 font-bold' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <td className="px-6 py-4 font-black text-sm text-gray-900">
                          {t.orderNumber}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">
                            {t.orderType === 'dine-in' ? `${t.tableNumber || 'Table'}` : 'Takeaway'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {t.customerName} · {portionCount} portions
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatTime(t.bumpedAt || t.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono">
                          08:12
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              idx === 0
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {idx === 0 ? 'Last bumped' : 'Completed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Active Bumped Ticket Detail Panel matching Bumped ticket history.png */}
        <div className="w-96 bg-white border border-gray-200 rounded-3xl p-6 shadow-card flex flex-col justify-between overflow-y-auto">
          {activeTicket ? (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {activeTicket.orderNumber}
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                  Bumped
                </span>
              </div>

              <div className="py-4 border-b border-gray-100 text-xs">
                <p className="font-bold text-gray-900 text-sm">
                  {activeTicket.orderType === 'dine-in'
                    ? `${activeTicket.tableNumber || 'Table'}`
                    : 'Takeaway'}
                </p>
                <p className="text-gray-500 mt-0.5">
                  {activeTicket.customerName}, {activeTicket.guestCount} guests
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Bumped at {formatTime(activeTicket.bumpedAt || activeTicket.createdAt)}
                </p>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-2.5 border-b border-gray-100 text-xs">
                {activeTicket.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <span className="font-bold text-gray-900 w-4">{item.quantity}</span>
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                ))}
              </div>

              {/* Informational Callout matching Bumped ticket history.png */}
              <div className="my-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                <p className="font-bold text-gray-900 mb-1">Return to Ready</p>
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Recalling keeps the original order and completed item status. It does not create a new order.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleRecall(activeTicket.id)}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 shadow-subtle flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Recall ticket {activeTicket.orderNumber}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintTicket(activeTicket)}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer size={14} />
                  <span>Reprint ticket</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-gray-400 text-xs">
              Select a bumped ticket to review or recall.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

