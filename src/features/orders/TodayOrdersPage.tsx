import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Order, OrderStatus } from '../../types';
import { Header } from '../../components/Header';
import { ReceiptModal } from '../payment/ReceiptModal';
import { ManagerPinModal } from '../../components/ManagerPinModal';
import { formatINR, formatTime } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Search,
  ArrowLeft,
  Printer,
  Ban,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  X,
  CreditCard,
  QrCode,
  Banknote,
} from 'lucide-react';

export const TodayOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, refundOrder } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [orderToRefund, setOrderToRefund] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // Filter today's orders
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));

  const filteredOrders = todayOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tableNumber && order.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPayment =
      paymentFilter === 'all' || order.paymentMode.toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleStartRefund = (order: Order) => {
    setOrderToRefund(order);
    setRefundReason('Customer requested refund / service issue');
  };

  const handleAuthorizedRefund = () => {
    if (orderToRefund) {
      sounds.playSuccess();
      refundOrder(orderToRefund.id, refundReason);
      if (selectedOrder?.id === orderToRefund.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'cancelled',
          paymentStatus: 'refunded',
          cancelReason: refundReason,
        });
      }
      setOrderToRefund(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col select-none">
      <Header title="Today's Orders" subtitle={`${todayOrders.length} orders recorded today`}>
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => navigate('/pos')}
            className="text-slate-500 hover:text-gray-900 transition-colors"
          >
            POS Counter
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="text-gray-900 border-b-2 border-gray-900 pb-0.5"
          >
            Today's Orders ({todayOrders.length})
          </button>
        </div>
      </Header>

      <div className="flex-1 p-6 flex flex-col space-y-4 max-w-7xl w-full mx-auto">
        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token number (e.g. #104) or customer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-gray-400 shadow-subtle"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Chips */}
            <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-xs font-semibold">
              {['all', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-white text-gray-900 shadow-subtle font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Payment Mode Selector */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 shadow-subtle focus:outline-none"
            >
              <option value="all">All Payment Modes</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Quiet Table matching Design Rules */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-card flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Type & Table</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items Summary</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      No orders match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                    const itemNames = order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3.5 font-bold text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 font-mono">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-gray-800">
                            {order.type === 'dine-in' ? `${order.tableNumber || 'Table'}` : 'Takeaway'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-700">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-3.5 max-w-xs truncate text-gray-500">
                          <span className="font-semibold text-gray-700 mr-1.5">{itemCount} items:</span>
                          {itemNames}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1.5 uppercase font-bold text-[11px] text-gray-700">
                            {order.paymentMode === 'upi' ? (
                              <QrCode size={13} className="text-secondaryGreen-600" />
                            ) : order.paymentMode === 'card' ? (
                              <CreditCard size={13} className="text-blue-500" />
                            ) : (
                              <Banknote size={13} className="text-amber-600" />
                            )}
                            {order.paymentMode}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              order.status === 'completed'
                                ? 'bg-secondaryGreen-50 text-secondaryGreen-700'
                                : order.status === 'ready'
                                ? 'bg-accent-50 text-accent-700'
                                : order.status === 'preparing'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-secondaryRed-50 text-secondaryRed-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                          {formatINR(order.total)}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReceiptOrder(order);
                              }}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                              title="Reprint Bill"
                            >
                              <Printer size={13} />
                            </button>
                            <ChevronRight size={14} className="text-gray-400" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Panel for Selected Order */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/30 backdrop-blur-xs flex justify-end select-none animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-200 animate-slideLeft p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatTime(selectedOrder.createdAt)} · Cashier: {selectedOrder.cashierName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Order Meta */}
              <div className="py-3 border-b border-gray-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span>Type / Table</span>
                  <span className="font-semibold text-gray-900">
                    {selectedOrder.type === 'dine-in' ? `${selectedOrder.tableNumber || 'Table'}` : 'Takeaway'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Name</span>
                  <span className="font-semibold text-gray-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Mode</span>
                  <span className="font-bold text-gray-900 uppercase">{selectedOrder.paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-bold capitalize text-gray-900">{selectedOrder.status}</span>
                </div>
                {selectedOrder.cancelReason && (
                  <div className="p-2 bg-secondaryRed-50 text-secondaryRed-700 rounded-lg text-[11px] mt-2">
                    Cancel Reason: {selectedOrder.cancelReason}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Items Ordered
                </h4>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">
                        {it.quantity}x {it.product.name}
                      </p>
                      {it.selectedAddOns.length > 0 && (
                        <p className="text-[11px] text-gray-400">
                          {it.selectedAddOns.map((a) => a.item.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-extrabold text-gray-900">
                      {formatINR(it.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 border-t border-gray-100 text-xs space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-secondaryGreen-700">
                    <span>Discount</span>
                    <span>-{formatINR(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.tax > 0 ? (
                  <>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>CGST (2.5%)</span>
                      <span>{formatINR(selectedOrder.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>SGST (2.5%)</span>
                      <span>{formatINR(selectedOrder.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[11px] text-gray-400 italic">
                    <span>Tax</span>
                    <span>Non-GST (₹0.00)</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-black text-gray-900">
                  <span>Total</span>
                  <span>{formatINR(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => setReceiptOrder(selectedOrder)}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 shadow-subtle flex items-center justify-center gap-2 transition-colors"
              >
                <Printer size={15} />
                <span>Reprint Bill</span>
              </button>

              {selectedOrder.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => handleStartRefund(selectedOrder)}
                  className="w-full py-3 px-4 rounded-xl bg-secondaryRed-50 hover:bg-secondaryRed-100 text-secondaryRed-700 border border-secondaryRed-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Ban size={15} />
                  <span>Refund / Cancel Order (Manager PIN Required)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        order={receiptOrder}
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      {/* Manager PIN Modal for Refunds */}
      <ManagerPinModal
        isOpen={!!orderToRefund}
        onClose={() => setOrderToRefund(null)}
        onSuccess={handleAuthorizedRefund}
        actionTitle="Authorize Refund"
        actionDescription={`Manager approval needed to refund ${orderToRefund?.orderNumber} (${orderToRefund ? formatINR(orderToRefund.total) : ''})`}
      />
    </div>
  );
};

