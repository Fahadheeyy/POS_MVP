import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Header } from '../../components/Header';
import { formatINR, formatTime, formatDate } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Coins,
  ArrowLeft,
  PlusCircle,
  MinusCircle,
  Printer,
  CheckCircle2,
  AlertCircle,
  Lock,
  Calendar,
} from 'lucide-react';

export const ShiftPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentShift,
    addCashMovement,
    updateShiftDenominations,
    closeShift,
    openNewShift,
    settings,
  } = useAppStore();

  const [denominations, setDenominations] = useState<{ [k: number]: number }>({
    2000: currentShift.denominationCounts[2000] || 0,
    500: currentShift.denominationCounts[500] || 8,
    200: currentShift.denominationCounts[200] || 5,
    100: currentShift.denominationCounts[100] || 10,
    50: currentShift.denominationCounts[50] || 10,
    20: currentShift.denominationCounts[20] || 15,
    10: currentShift.denominationCounts[10] || 20,
    1: currentShift.denominationCounts[1] || 50,
  });

  // Cash movement form state
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [newOpeningCash, setNewOpeningCash] = useState('5000');

  const denomKeys = [2000, 500, 200, 100, 50, 20, 10, 1];

  const handleDenomChange = (denom: number, countStr: string) => {
    const count = parseInt(countStr) || 0;
    const updated = { ...denominations, [denom]: Math.max(0, count) };
    setDenominations(updated);
    updateShiftDenominations(updated);
  };

  const countedTotal = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * count,
    0
  );

  const cashInTotal = currentShift.movements
    .filter((m) => m.type === 'in')
    .reduce((sum, m) => sum + m.amount, 0);

  const cashOutTotal = currentShift.movements
    .filter((m) => m.type === 'out')
    .reduce((sum, m) => sum + m.amount, 0);

  const expectedCash =
    currentShift.openingCash + currentShift.cashSales + cashInTotal - cashOutTotal;
  const variance = countedTotal - expectedCash;

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmount);
    if (!amt || !movementReason) return;
    sounds.playSuccess();
    addCashMovement(movementType, amt, movementReason);
    setMovementAmount('');
    setMovementReason('');
    setShowMovementModal(false);
  };

  const handleConfirmCloseShift = () => {
    sounds.playSuccess();
    closeShift(countedTotal);
    setShowCloseShiftModal(false);
  };

  const handleConfirmOpenShift = () => {
    sounds.playSuccess();
    openNewShift(parseFloat(newOpeningCash) || 5000);
    setShowOpenShiftModal(false);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col select-none">
      <Header
        title="Shift & Today's Orders"
        subtitle={`Cashier: ${currentShift.cashierName} · Shift #${currentShift.shiftNumber}`}
      >
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => navigate('/pos')}
            className="text-slate-500 hover:text-gray-900 transition-colors"
          >
            POS
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="text-slate-500 hover:text-gray-900 transition-colors"
          >
            Today's Orders
          </button>
          <button
            onClick={() => navigate('/shift')}
            className="text-gray-900 border-b-2 border-gray-900 pb-0.5"
          >
            Shift & Cash
          </button>
        </div>
      </Header>

      <div className="flex-1 p-6 space-y-6 max-w-6xl w-full mx-auto">
        {/* Top Summary Header Banner */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Coins size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Active Shift #{currentShift.shiftNumber}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentShift.status === 'open'
                      ? 'bg-secondaryGreen-50 text-secondaryGreen-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {currentShift.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Started at {formatTime(currentShift.startTime)} on {formatDate(currentShift.startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMovementModal(true)}
              disabled={currentShift.status === 'closed'}
              className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <PlusCircle size={14} />
              <span>Cash In / Out</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} />
              <span>Print Shift Report</span>
            </button>

            {currentShift.status === 'open' ? (
              <button
                onClick={() => setShowCloseShiftModal(true)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-subtle flex items-center gap-1.5 transition-colors"
              >
                <Lock size={14} />
                <span>End Shift & Balance</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="px-4 py-2 rounded-xl bg-secondaryGreen-600 hover:bg-secondaryGreen-700 text-white text-xs font-bold shadow-subtle flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 size={14} />
                <span>Open Next Shift</span>
              </button>
            )}
          </div>
        </div>

        {/* Shift Totals Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Total Orders</span>
            <span className="text-2xl font-black text-gray-900">{currentShift.totalOrders}</span>
            <span className="text-[10px] text-gray-400 block mt-1">Processed today</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Cash Sales</span>
            <span className="text-xl font-bold text-gray-900">{formatINR(currentShift.cashSales)}</span>
            <span className="text-[10px] text-gray-400 block mt-1">In drawer cash</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">UPI Sales</span>
            <span className="text-xl font-bold text-gray-900">{formatINR(currentShift.upiSales)}</span>
            <span className="text-[10px] text-secondaryGreen-600 font-semibold block mt-1">
              Direct to bank
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Card Sales</span>
            <span className="text-xl font-bold text-gray-900">{formatINR(currentShift.cardSales)}</span>
            <span className="text-[10px] text-gray-400 block mt-1">EDC settlements</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Gross Sales</span>
            <span className="text-xl font-black text-gray-900">{formatINR(currentShift.grossSales)}</span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Discounts: -{formatINR(currentShift.totalDiscount)}
            </span>
          </div>
        </div>

        {/* 2-Column Section: Cash Denomination Counting & Drawer Reconciliation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Denomination Counter */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Cash Count by Denomination</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Count notes and coins physically inside drawer
                </p>
              </div>
              <span className="font-bold text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                Counted: {formatINR(countedTotal)}
              </span>
            </div>

            <div className="space-y-2 mt-4">
              {denomKeys.map((denom) => {
                const count = denominations[denom] || 0;
                const sub = denom * count;
                return (
                  <div
                    key={denom}
                    className="flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-xs"
                  >
                    <div className="w-24 font-bold text-gray-800">
                      {denom === 1 ? 'Coins / 1s' : `₹${denom} Notes`}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">x</span>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => handleDenomChange(denom, e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center font-bold text-xs bg-white focus:outline-none focus:border-gray-600"
                        disabled={currentShift.status === 'closed'}
                      />
                    </div>
                    <span className="w-24 text-right font-extrabold text-gray-900">
                      {formatINR(sub)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Drawer Reconciliation & Variance */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-card">
              <h3 className="font-bold text-gray-900 text-base mb-4">Drawer Balancing & Variance</h3>

              <div className="space-y-2.5 text-xs text-gray-600 pb-4 border-b border-gray-100">
                <div className="flex justify-between">
                  <span>Opening Cash (Float)</span>
                  <span className="font-bold text-gray-900">{formatINR(currentShift.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Total Cash Sales Today</span>
                  <span className="font-bold text-gray-900">{formatINR(currentShift.cashSales)}</span>
                </div>
                <div className="flex justify-between text-secondaryGreen-700">
                  <span>+ Cash In (Pay-ins / Replenishments)</span>
                  <span className="font-bold">+{formatINR(cashInTotal)}</span>
                </div>
                <div className="flex justify-between text-secondaryRed-700">
                  <span>- Cash Out (Petty Cash / Purchases)</span>
                  <span className="font-bold">-{formatINR(cashOutTotal)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-bold text-gray-800">
                  <span>Expected Cash in Drawer</span>
                  <span>{formatINR(expectedCash)}</span>
                </div>
              </div>

              {/* Variance Comparison Box */}
              <div
                className={`p-4 rounded-2xl border my-4 ${
                  Math.abs(variance) < 1
                    ? 'bg-secondaryGreen-50 border-secondaryGreen-200 text-secondaryGreen-800'
                    : variance > 0
                    ? 'bg-accent-50 border-accent-200 text-accent-800'
                    : 'bg-secondaryRed-50 border-secondaryRed-200 text-secondaryRed-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold">Counted Cash:</span>
                  <span className="font-black text-sm">{formatINR(countedTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-current/20">
                  <span className="font-bold">
                    {Math.abs(variance) < 1
                      ? 'Balanced (No variance)'
                      : variance > 0
                      ? 'Cash Surplus (+)'
                      : 'Cash Shortage (-)'}
                  </span>
                  <span className="text-base font-black">
                    {variance > 0 ? `+${formatINR(variance)}` : formatINR(variance)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                Any discrepancy between expected cash and physically counted notes is audited and recorded in shift history.
              </p>
            </div>

            {/* Cash Movements Record */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-card">
              <h4 className="font-bold text-gray-900 text-sm mb-3">Today's Drawer Movements</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
                {currentShift.movements.length === 0 ? (
                  <p className="text-gray-400 text-xs">No drawer movements recorded in this shift.</p>
                ) : (
                  currentShift.movements.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <span
                          className={`font-bold mr-1.5 ${
                            m.type === 'in' ? 'text-secondaryGreen-600' : 'text-secondaryRed-600'
                          }`}
                        >
                          {m.type === 'in' ? 'CASH IN' : 'CASH OUT'}
                        </span>
                        <span className="text-gray-700">{m.reason}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 block">{formatINR(m.amount)}</span>
                        <span className="text-[10px] text-gray-400">{formatTime(m.timestamp)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 select-none">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 shadow-modal">
            <h3 className="font-bold text-gray-900 text-base mb-4">Record Cash In / Out</h3>
            <form onSubmit={handleAddMovement} className="space-y-3 text-xs">
              <div className="flex rounded-xl bg-gray-100 p-1 font-semibold">
                <button
                  type="button"
                  onClick={() => setMovementType('in')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    movementType === 'in' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'
                  }`}
                >
                  Cash In (Pay In)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('out')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    movementType === 'out' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'
                  }`}
                >
                  Cash Out (Pay Out)
                </button>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-500 text-sm font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="e.g. Purchased ice or change replenishment"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Confirmation Modal */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 select-none">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 shadow-modal text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-3">
              <Lock size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Confirm Close Shift</h3>
            <p className="text-xs text-gray-500 mb-4">
              Closing Shift #{currentShift.shiftNumber}. Once closed, cash drawer balances will be locked.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 text-left mb-4">
              <div className="flex justify-between">
                <span>Counted Cash:</span>
                <span className="font-bold">{formatINR(countedTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Cash:</span>
                <span className="font-bold">{formatINR(expectedCash)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1">
                <span>Variance:</span>
                <span className="font-bold">{formatINR(variance)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold"
              >
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open New Shift Modal */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 select-none">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-sm p-6 shadow-modal">
            <h3 className="font-bold text-gray-900 text-base mb-2">Open Next Shift</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter the initial float cash drawer amount for the incoming cashier.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Opening Float (₹)
              </label>
              <input
                type="number"
                value={newOpeningCash}
                onChange={(e) => setNewOpeningCash(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOpenShift}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold"
              >
                Open Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Shift End Report */}
      <div className="hidden printable-report">
        <div className="text-center pb-4 border-b">
          <h1 className="text-2xl font-bold">{settings.storeName}</h1>
          <p className="text-sm">END OF SHIFT RECONCILIATION REPORT</p>
          <p className="text-xs">
            Shift #{currentShift.shiftNumber} · Cashier: {currentShift.cashierName} · {formatDate(currentShift.startTime)}
          </p>
        </div>
        <div className="py-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Opening Cash:</span>
            <span>{formatINR(currentShift.openingCash)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Sales:</span>
            <span>{formatINR(currentShift.cashSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>Card Sales:</span>
            <span>{formatINR(currentShift.cardSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>UPI Sales:</span>
            <span>{formatINR(currentShift.upiSales)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Gross Sales:</span>
            <span>{formatINR(currentShift.grossSales)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Counted Cash:</span>
            <span>{formatINR(countedTotal)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Cash Variance:</span>
            <span>{formatINR(variance)}</span>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
          Generated automatically by pos.bits Counter System for Sign Laban
        </div>
      </div>
    </div>
  );
};

