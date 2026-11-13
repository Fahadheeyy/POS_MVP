import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { KdsTicket, Station } from '../../types';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { ExpandedTicketDrawer } from './ExpandedTicketDrawer';
import { TicketActionsMenu } from './TicketActionsMenu';
import { BumpedTicketsView } from './BumpedTicketsView';
import { DisplaySettingsModal } from './DisplaySettingsModal';
import { DisplayLockedScreen } from './DisplayLockedScreen';
import { Item86Modal } from './Item86Modal';
import { RecipeSpecModal } from './RecipeSpecModal';
import { formatElapsedMinutes, formatDate, formatTime } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Settings,
  RotateCcw,
  MoreHorizontal,
  Flame,
  Check,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Clock,
  Printer,
  History,
  Sparkles,
  Ban,
  ChefHat,
  AlertTriangle,
} from 'lucide-react';

export const KDSPage: React.FC = () => {
  const {
    tickets,
    products,
    activeKdsStation,
    setActiveKdsStation,
    advanceTicketStatus,
    setTicketStatus,
    toggleTicketItemReady,
    recallLastBumpedTicket,
    kdsSoundEnabled,
    isKdsLocked,
    setIsKdsLocked,
    settings,
    kitchenAlert,
    setKitchenAlert,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<'board' | 'bumped_history'>('board');
  const [selectedTicket, setSelectedTicket] = useState<KdsTicket | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<KdsTicket | null>(null);
  const [actionsTicket, setActionsTicket] = useState<KdsTicket | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [show86Modal, setShow86Modal] = useState<boolean>(false);
  const [selectedRecipeDish, setSelectedRecipeDish] = useState<string | null>(null);
  const [printingKotTicket, setPrintingKotTicket] = useState<KdsTicket | null>(null);

  // Touch-first Drag & Drop states
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<'new' | 'cooking' | 'ready' | null>(null);

  const outOfStockCount = products.filter((p) => !p.isAvailable).length;

  // Active unbumped tickets across kitchen
  const newTickets = tickets.filter((t) => t.status === 'new');
  const cookingTickets = tickets.filter((t) => t.status === 'cooking');
  const readyTickets = tickets.filter((t) => t.status === 'ready');
  const activeTickets = [...newTickets, ...cookingTickets, ...readyTickets];

  // Set default selected ticket for keyboard navigation
  useEffect(() => {
    if (!selectedTicket && activeTickets.length > 0) {
      setSelectedTicket(activeTickets[0]);
    }
  }, [activeTickets, selectedTicket]);

  // Keyboard navigation: Arrows, Space (advance), R (recall)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input is focused or locked
      if (isKdsLocked || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = activeTickets.findIndex((t) => t.id === selectedTicket?.id);
        const nextIndex = (currentIndex + 1) % activeTickets.length;
        if (activeTickets[nextIndex]) {
          setSelectedTicket(activeTickets[nextIndex]);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = activeTickets.findIndex((t) => t.id === selectedTicket?.id);
        const prevIndex = (currentIndex - 1 + activeTickets.length) % activeTickets.length;
        if (activeTickets[prevIndex]) {
          setSelectedTicket(activeTickets[prevIndex]);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (selectedTicket) {
          sounds.playBump();
          advanceTicketStatus(selectedTicket.id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        sounds.playBump();
        recallLastBumpedTicket();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket, activeTickets, advanceTicketStatus, recallLastBumpedTicket, isKdsLocked]);

  const handleAdvance = (ticketId: string) => {
    sounds.playBump();
    advanceTicketStatus(ticketId);
  };

  const handlePrintKOT = (ticket: KdsTicket) => {
    setPrintingKotTicket(ticket);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const stations: Station[] = ['All stations', 'Grill', 'Fry', 'Cold', 'Expo'];

  // Calculate live operational metrics for footer
  const totalOpenTickets = activeTickets.length;
  const oldestTicket = activeTickets.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];

  return (
    <div className="h-screen max-h-screen bg-surface-canvas flex flex-col justify-between select-none overflow-hidden">
      {/* Top Header: Clean, distraction-free */}
      <Header title="Kitchen Display" subtitle={`${activeTickets.length} active orders in kitchen`}>
        <div className="flex items-center gap-2">
          {/* Recall Last Bumped */}
          <button
            onClick={() => {
              sounds.playBump();
              recallLastBumpedTicket();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-gray-700 hover:bg-gray-50 shadow-xs active:scale-95 transition-all"
            title="Recall last bumped ticket back to board"
          >
            <RotateCcw size={13} />
            <span>Recall Last</span>
          </button>

          {/* Bumped Ticket History Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'board' ? 'bumped_history' : 'board')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              viewMode === 'bumped_history'
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white border-slate-200 text-gray-700 hover:bg-gray-50 shadow-xs'
            }`}
          >
            <History size={13} />
            <span>{viewMode === 'bumped_history' ? 'Back to Board' : 'Bumped History'}</span>
          </button>
        </div>
      </Header>

      <OfflineBanner />

      {/* Main View Area */}
      {viewMode === 'bumped_history' ? (
        <BumpedTicketsView
          onBackToBoard={() => setViewMode('board')}
          onPrintTicket={handlePrintKOT}
        />
      ) : (
        <div className="flex-1 p-4 md:p-6 flex gap-4 md:gap-6 overflow-x-auto touch-pan-x h-full">
          {/* Column 1: Incoming Orders */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverLane('new');
            }}
            onDragLeave={() => {
              if (dragOverLane === 'new') setDragOverLane(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
              if (ticketId) {
                setTicketStatus(ticketId, 'new');
                sounds.playBump();
              }
              setDragOverLane(null);
              setDraggedTicketId(null);
            }}
            className={`flex-1 min-w-[320px] max-w-md bg-white/95 backdrop-blur-sm border rounded-3xl p-4 flex flex-col transition-all duration-200 ${
              dragOverLane === 'new'
                ? 'border-amber-400 bg-amber-50/50 ring-4 ring-amber-200/60 scale-[1.01]'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                  1. Incoming Orders
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                {newTickets.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {newTickets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                  <Sparkles size={28} className="text-amber-400/80 mb-2" />
                  <p className="font-bold text-sm text-gray-700">All caught up</p>
                  <p className="text-xs text-gray-400 mt-0.5">New incoming orders will appear here</p>
                </div>
              ) : (
                newTickets.map((ticket) => {
                  const elapsedSec = Math.floor(
                    (Date.now() - new Date(ticket.createdAt).getTime()) / 1000
                  );
                  const targetSec = ticket.targetMinutes * 60;
                  const isOverdue = elapsedSec > targetSec;
                  const isRush = ticket.isRush;

                  return (
                    <div
                      key={ticket.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', ticket.id);
                        setDraggedTicketId(ticket.id);
                      }}
                      onDragEnd={() => setDraggedTicketId(null)}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`group relative rounded-2xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none border ${
                        isRush
                          ? 'bg-[#FFF9F5] border-red-300 ring-2 ring-red-100 shadow-md'
                          : isOverdue
                          ? 'bg-[#FFF8F5] border-rose-300 shadow-sm'
                          : 'bg-[#FFFDF5] border-amber-200/80 hover:border-amber-300 shadow-sm hover:shadow-md'
                      } ${draggedTicketId === ticket.id ? 'opacity-40 scale-95' : ''}`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-amber-200/50">
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-amber-400/70 group-hover:text-amber-600 transition-colors" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-gray-900 tracking-tight">
                                #{ticket.orderNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                                {ticket.orderType}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">
                              {ticket.tableNumber ? `Table ${ticket.tableNumber}` : ticket.customerName || 'Takeaway'}
                            </p>
                          </div>
                        </div>

                        {/* Elapsed Timer Pill */}
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            isOverdue
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <Clock size={12} />
                          <span>{formatElapsedMinutes(ticket.createdAt)}</span>
                        </div>
                      </div>

                      {/* Touch Checklist for Items */}
                      <div className="space-y-1.5 my-3">
                        {ticket.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playSuccess();
                              toggleTicketItemReady(ticket.id, item.id);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 min-h-[44px] ${
                              item.isReady
                                ? 'bg-amber-100/50 border-amber-200 text-gray-400 line-through'
                                : 'bg-white/90 border-amber-200/70 text-gray-900 hover:bg-white shadow-xs'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                item.isReady
                                  ? 'bg-secondaryGreen-600 border-secondaryGreen-600 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {item.isReady && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="text-amber-800">{item.quantity}x</span>
                                <span className={item.isReady ? 'line-through text-gray-400' : 'text-gray-900'}>
                                  {item.name}
                                </span>
                              </div>
                              {item.modifiers.length > 0 && (
                                <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                                  +{item.modifiers.join(', ')}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Touch Action Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketStatus(ticket.id, 'cooking');
                            sounds.playBump();
                          }}
                          className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm shadow-subtle flex items-center justify-center gap-2 transition-transform"
                        >
                          <span>Start Prep</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: In Preparation */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverLane('cooking');
            }}
            onDragLeave={() => {
              if (dragOverLane === 'cooking') setDragOverLane(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
              if (ticketId) {
                setTicketStatus(ticketId, 'cooking');
                sounds.playBump();
              }
              setDragOverLane(null);
              setDraggedTicketId(null);
            }}
            className={`flex-1 min-w-[320px] max-w-md bg-white/95 backdrop-blur-sm border rounded-3xl p-4 flex flex-col transition-all duration-200 ${
              dragOverLane === 'cooking'
                ? 'border-sky-400 bg-sky-50/50 ring-4 ring-sky-200/60 scale-[1.01]'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                  2. In Preparation
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 text-xs font-black">
                {cookingTickets.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {cookingTickets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                  <Flame size={28} className="text-sky-400/80 mb-2" />
                  <p className="font-bold text-sm text-gray-700">Station idle</p>
                  <p className="text-xs text-gray-400 mt-0.5">Drag orders here to start preparing</p>
                </div>
              ) : (
                cookingTickets.map((ticket) => {
                  const elapsedSec = Math.floor(
                    (Date.now() - new Date(ticket.createdAt).getTime()) / 1000
                  );
                  const targetSec = ticket.targetMinutes * 60;
                  const isOverdue = elapsedSec > targetSec;
                  const isRush = ticket.isRush;

                  return (
                    <div
                      key={ticket.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', ticket.id);
                        setDraggedTicketId(ticket.id);
                      }}
                      onDragEnd={() => setDraggedTicketId(null)}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`group relative rounded-2xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none border ${
                        isRush
                          ? 'bg-[#F5FAFF] border-red-300 ring-2 ring-red-100 shadow-md'
                          : isOverdue
                          ? 'bg-[#FFF8F5] border-rose-300 shadow-sm'
                          : 'bg-[#F8FAFC] border-sky-200/80 hover:border-sky-300 shadow-sm hover:shadow-md'
                      } ${draggedTicketId === ticket.id ? 'opacity-40 scale-95' : ''}`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-sky-200/50">
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-sky-400/70 group-hover:text-sky-600 transition-colors" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-gray-900 tracking-tight">
                                #{ticket.orderNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-900">
                                {ticket.orderType}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">
                              {ticket.tableNumber ? `Table ${ticket.tableNumber}` : ticket.customerName || 'Takeaway'}
                            </p>
                          </div>
                        </div>

                        {/* Elapsed Timer Pill */}
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            isOverdue
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-sky-100 text-sky-900'
                          }`}
                        >
                          <Clock size={12} />
                          <span>{formatElapsedMinutes(ticket.createdAt)}</span>
                        </div>
                      </div>

                      {/* Touch Checklist for Items */}
                      <div className="space-y-1.5 my-3">
                        {ticket.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playSuccess();
                              toggleTicketItemReady(ticket.id, item.id);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 min-h-[44px] ${
                              item.isReady
                                ? 'bg-sky-100/50 border-sky-200 text-gray-400 line-through'
                                : 'bg-white/90 border-sky-200/70 text-gray-900 hover:bg-white shadow-xs'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                item.isReady
                                  ? 'bg-secondaryGreen-600 border-secondaryGreen-600 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {item.isReady && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="text-sky-800">{item.quantity}x</span>
                                <span className={item.isReady ? 'line-through text-gray-400' : 'text-gray-900'}>
                                  {item.name}
                                </span>
                              </div>
                              {item.modifiers.length > 0 && (
                                <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                                  +{item.modifiers.join(', ')}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketStatus(ticket.id, 'new');
                          }}
                          className="h-12 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-subtle flex items-center justify-center gap-1 active:scale-95 transition-all"
                          title="Move back to incoming"
                        >
                          <ArrowLeft size={14} />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketStatus(ticket.id, 'ready');
                            sounds.playBump();
                          }}
                          className="flex-1 h-12 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold text-sm shadow-subtle flex items-center justify-center gap-2 transition-transform"
                        >
                          <span>Mark Ready</span>
                          <Check size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Ready for Pickup */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverLane('ready');
            }}
            onDragLeave={() => {
              if (dragOverLane === 'ready') setDragOverLane(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
              if (ticketId) {
                setTicketStatus(ticketId, 'ready');
                sounds.playBump();
              }
              setDragOverLane(null);
              setDraggedTicketId(null);
            }}
            className={`flex-1 min-w-[320px] max-w-md bg-white/95 backdrop-blur-sm border rounded-3xl p-4 flex flex-col transition-all duration-200 ${
              dragOverLane === 'ready'
                ? 'border-emerald-400 bg-emerald-50/50 ring-4 ring-emerald-200/60 scale-[1.01]'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                  3. Ready for Pickup
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                {readyTickets.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {readyTickets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                  <Check size={28} className="text-emerald-400/80 mb-2" />
                  <p className="font-bold text-sm text-gray-700">Counter clear</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ready dishes show here for customer pickup</p>
                </div>
              ) : (
                readyTickets.map((ticket) => {
                  const isRush = ticket.isRush;

                  return (
                    <div
                      key={ticket.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', ticket.id);
                        setDraggedTicketId(ticket.id);
                      }}
                      onDragEnd={() => setDraggedTicketId(null)}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`group relative rounded-2xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none border ${
                        isRush
                          ? 'bg-[#F6FEF9] border-red-300 ring-2 ring-red-100 shadow-md'
                          : 'bg-[#F6FEF9] border-emerald-200/80 hover:border-emerald-300 shadow-sm hover:shadow-md'
                      } ${draggedTicketId === ticket.id ? 'opacity-40 scale-95' : ''}`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-emerald-200/50">
                        <div className="flex items-center gap-2">
                          <GripVertical size={16} className="text-emerald-400/70 group-hover:text-emerald-600 transition-colors" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-gray-900 tracking-tight">
                                #{ticket.orderNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900">
                                {ticket.orderType}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">
                              {ticket.tableNumber ? `Table ${ticket.tableNumber}` : ticket.customerName || 'Takeaway'}
                            </p>
                          </div>
                        </div>

                        {/* Elapsed Timer Pill */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-900">
                          <Clock size={12} />
                          <span>{formatElapsedMinutes(ticket.createdAt)}</span>
                        </div>
                      </div>

                      {/* Items Checklist for Ready Lane */}
                      <div className="space-y-1.5 my-3">
                        {ticket.items.map((item) => (
                          <div
                            key={item.id}
                            className="w-full text-left p-2.5 rounded-xl border border-emerald-100 bg-white/90 text-gray-700 flex items-start gap-2.5 min-h-[44px]"
                          >
                            <div className="mt-0.5 w-5 h-5 rounded-md bg-secondaryGreen-600 text-white flex items-center justify-center flex-shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                                <span className="text-emerald-800">{item.quantity}x</span>
                                <span>{item.name}</span>
                              </div>
                              {item.modifiers.length > 0 && (
                                <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                                  +{item.modifiers.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketStatus(ticket.id, 'cooking');
                          }}
                          className="h-12 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-subtle flex items-center justify-center gap-1 active:scale-95 transition-all"
                          title="Move back to prep"
                        >
                          <ArrowLeft size={14} />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvance(ticket.id);
                          }}
                          className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-subtle flex items-center justify-center gap-2 transition-transform"
                        >
                          <span>Bump Order</span>
                          <Check size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Expanded Ticket */}
      <ExpandedTicketDrawer
        ticket={expandedTicket}
        isOpen={!!expandedTicket}
        onClose={() => setExpandedTicket(null)}
        onAdvance={handleAdvance}
        onPrint={() => expandedTicket && handlePrintKOT(expandedTicket)}
        onOpenActions={(t) => setActionsTicket(t)}
      />

      {/* Ticket Actions Popover */}
      <TicketActionsMenu
        ticket={actionsTicket}
        isOpen={!!actionsTicket}
        onClose={() => setActionsTicket(null)}
        onViewDetails={(t) => setExpandedTicket(t)}
        onPrintKOT={handlePrintKOT}
      />

      {/* Display Settings Modal */}
      <DisplaySettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onLockNow={() => setIsKdsLocked(true)}
      />

      {/* Kitchen 86 / Line Out-of-Stock Modal */}
      <Item86Modal
        isOpen={show86Modal}
        onClose={() => setShow86Modal(false)}
      />

      {/* Chef Recipe Spec & Line Assembly Modal */}
      <RecipeSpecModal
        productId={selectedRecipeDish}
        isOpen={!!selectedRecipeDish}
        onClose={() => setSelectedRecipeDish(null)}
      />

      {/* Display Locked Screen */}
      {isKdsLocked && <DisplayLockedScreen onUnlock={() => setIsKdsLocked(false)} />}

      {/* Hidden Thermal KOT Print Sheet */}
      {printingKotTicket && (
        <div className="hidden printable-receipt">
          <div className="text-center font-mono pb-2 border-b">
            <h1 className="text-sm font-extrabold tracking-wider">SIGN LABAN</h1>
            <h2 className="text-base font-bold">KITCHEN ORDER TICKET (KOT)</h2>
            <p className="text-xs">Express Counter Service</p>
            <p className="text-xs">Ticket: {printingKotTicket.orderNumber}</p>
            <p className="text-xs">
              {printingKotTicket.customerName} · {formatTime(printingKotTicket.createdAt)}
            </p>
          </div>
          <div className="py-2 font-mono text-sm space-y-1">
            {printingKotTicket.items.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{it.quantity}x {it.name}</span>
                <span className="text-xs">[{it.station}]</span>
              </div>
            ))}
          </div>
          {printingKotTicket.allergyNote && (
            <div className="py-1 font-mono text-xs font-bold border-t border-b">
              NOTE: {printingKotTicket.allergyNote}
            </div>
          )}
          <div className="pt-2 text-center font-mono text-[10px] text-gray-500 border-t">
            pos.bits High-Speed Kitchen Routing
          </div>
        </div>
      )}
    </div>
  );
};

