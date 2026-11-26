"use client";
import { monthlyTaxReport } from '@/lib/tax/monthlyReport';
import { businessDate, businessDateDaysAgo } from '@/utils/businessDate';
import React, { useState } from 'react';
import { useNavigate } from "@/lib/navigation";
import { useAppStore } from '../../store';
import { Header } from '../../components/Header';
import { formatINR, formatDate, formatTime } from '../../utils/formatters';
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  ChevronDown,
  BarChart2,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

type ReportType =
  | 'sales_summary'
  | 'item_sales'
  | 'category_sales'
  | 'payment_mode'
  | 'hourly'
  | 'staff_cashier'
  | 'discount_refund'
  | 'gst_tax'
  | 'kitchen_performance'
  | 'gstr1_ca_package';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, tickets, categories, settings } = useAppStore();

  const [activeReport, setActiveReport] = useState<ReportType>('sales_summary');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('30days');
  const [filingMonth, setFilingMonth] = useState(() => businessDate().slice(0, 7));
  const taxEntries = monthlyTaxReport(orders, filingMonth);

  const now = new Date();
  const through = businessDate(now);
  const from = businessDateDaysAgo(dateRange === '7days' ? 6 : dateRange === '30days' ? 29 : 0, now);
  const isSelectedDay = (timestamp: string) => {
    const day = businessDate(timestamp);
    return activeReport === 'gstr1_ca_package' ? day.startsWith(filingMonth + '-') : day >= from && day <= through;
  };
  const validOrders = orders.filter((order) =>
    isSelectedDay(order.createdAt) && (order.paymentStatus === 'refunded' || (order.paymentStatus === 'paid' && order.status !== 'cancelled')));
  const refundedOrders = orders.filter((order) =>
    order.paymentStatus === 'refunded' && order.refundedAt && isSelectedDay(order.refundedAt));

  // 1. Sales Summary Data
  const grossSales = validOrders.reduce((s, o) => s + o.total, 0);
  const totalSubtotal = validOrders.reduce((s, o) => s + o.subtotal, 0);
  const totalDiscount = validOrders.reduce((s, o) => s + o.discount, 0);
  const totalTax = validOrders.reduce((s, o) => s + o.tax, 0);
  const totalCgst = validOrders.reduce((s, o) => s + o.cgst, 0);
  const totalSgst = validOrders.reduce((s, o) => s + o.sgst, 0);
  const totalRefunds = refundedOrders.reduce((s, o) => s + o.total, 0);

  // 2. Item-wise Sales
  const itemMap: { [key: string]: { name: string; qty: number; sales: number; cat: string } } = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      const key = item.product.id + ':' + item.product.categoryId;
      if (!itemMap[key]) {
        const catObj = categories.find((c) => c.id === item.product.categoryId);
        itemMap[key] = { name: item.product.name, qty: 0, sales: 0, cat: catObj?.name || (item.product.id?.startsWith('addon_') ? 'Add-ons' : 'Uncategorized') };
      }
      itemMap[key].qty += item.quantity;
      itemMap[key].sales += item.lineTotal;
    });
  });
  const itemRows = Object.entries(itemMap).map(([key, value]) => ({ key, ...value }));

  // 3. Category-wise Sales
  const catMap: Record<string, { qty: number; sales: number }> = Object.create(null);
  itemRows.forEach((it) => {
    if (!catMap[it.cat]) catMap[it.cat] = { qty: 0, sales: 0 };
    catMap[it.cat].qty += it.qty;
    catMap[it.cat].sales += it.sales;
  });
  const categoryTotal = itemRows.reduce((sum, row) => sum + row.sales, 0);
  const catRows = Object.entries(catMap).map(([cat, val]) => ({
    cat,
    ...val,
    pct: categoryTotal > 0 ? Math.round((val.sales / categoryTotal) * 100) : 0,
  }));

  // 4. Payment Mode Data
  const payMap: { [mode: string]: { count: number; sales: number } } = {
    upi: { count: 0, sales: 0 },
    card: { count: 0, sales: 0 },
    cash: { count: 0, sales: 0 },
  };
  validOrders.forEach((o) => {
    if (payMap[o.paymentMode]) {
      payMap[o.paymentMode].count += 1;
      payMap[o.paymentMode].sales += o.total;
    }
  });
  for (const order of refundedOrders) payMap[order.paymentMode].sales -= order.total;
  const payRows = Object.entries(payMap).map(([mode, val]) => ({
    mode: mode.toUpperCase(),
    ...val,
    pct: grossSales > totalRefunds ? Math.round(val.sales / (grossSales-totalRefunds) * 100) : 0,
  }));

  // 5. Hourly Distribution
  const hourMap: Record<string,{orders:number; sales:number}> = {};
  for (let hour=0; hour<24; hour++) {
    hourMap[(hour % 12 || 12) + (hour < 12 ? ' AM' : ' PM')] = {orders:0,sales:0};
  }
  const clock = new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:true,timeZone:'Asia/Kolkata'});
  for (const order of validOrders) {
    const entry = hourMap[clock.format(new Date(order.createdAt))];
    entry.orders++;
    entry.sales += order.total;
  }
  const hourRows = Object.entries(hourMap).map(([hour, val]) => ({ hour, ...val }));

  // 6. Staff / Cashier Performance
  const staffMap: Record<string, { count: number; sales: number }> = Object.create(null);
  validOrders.forEach((o) => {
    const cName = o.cashierName || 'Unknown cashier';
    if (!staffMap[cName]) staffMap[cName] = { count: 0, sales: 0 };
    staffMap[cName].count += 1;
    staffMap[cName].sales += o.total;
  });
  const staffRows = Object.entries(staffMap).map(([name, val]) => ({ name, ...val }));

  const breakdowns = {
    hourly: {
      headings: ['Hour (IST)', 'Orders', 'Gross sales (INR)'],
      rows: hourRows.map(({ hour, orders, sales }) => [hour, String(orders), sales.toFixed(2)]),
    },
    staff_cashier: {
      headings: ['Cashier', 'Orders', 'Gross sales (INR)'],
      rows: staffRows.map(({ name, count, sales }) => [name, String(count), sales.toFixed(2)]),
    },
    discount_refund: {
      headings: ['Order', 'Date (IST)', 'Type', 'Amount (INR)'],
      rows: [
        ...validOrders.filter((order) => order.discount > 0).map((order) =>
          [order.orderNumber, businessDate(order.createdAt), 'Discount', order.discount.toFixed(2)]),
        ...refundedOrders.map((order) =>
          [order.orderNumber, businessDate(order.refundedAt!), 'Refund', order.total.toFixed(2)]),
      ],
    },
    kitchen_performance: {
      headings: ['Ticket', 'Date (IST)', 'Time to ready (min)', 'Target (min)', 'Result'],
      rows: tickets.filter((ticket) => ticket.readyAt && isSelectedDay(ticket.createdAt)).map((ticket) => {
        const minutes = (Date.parse(ticket.readyAt!) - Date.parse(ticket.createdAt)) / 60_000;
        return [ticket.orderNumber, businessDate(ticket.createdAt), minutes.toFixed(1), String(ticket.targetMinutes),
          minutes <= ticket.targetMinutes ? 'On time' : 'Late'];
      }),
    },
  };
  const breakdown = activeReport in breakdowns ? breakdowns[activeReport as keyof typeof breakdowns] : null;

  // Working CSV Export Function
  const exportCSV = () => {
    let rows: string[][] = [];
    let filename = `${activeReport}_${dateRange}.csv`;

    if (activeReport === 'sales_summary') {
      rows = [
        ['Metric', 'Value'],
        ['Gross Sales', grossSales.toFixed(2)],
        ['Total Orders', validOrders.length.toString()],
        ['Discounts Total', totalDiscount.toFixed(2)],
        ['CGST', totalCgst.toFixed(2)],
        ['SGST', totalSgst.toFixed(2)],
        ['Total Tax', totalTax.toFixed(2)],
        ['Refunds Total', totalRefunds.toFixed(2)],
        ['Net collections', (grossSales - totalRefunds).toFixed(2)],
      ];
    } else if (activeReport === 'item_sales') {
      rows = [
        ['Item Name', 'Category', 'Quantity Sold', 'Total Revenue (INR)'],
        ...itemRows.map((it) => [it.name, it.cat, it.qty.toString(), it.sales.toFixed(2)]),
      ];
    } else if (activeReport === 'category_sales') {
      rows = [
        ['Category', 'Quantity Sold', 'Revenue (INR)', 'Mix (%)'],
        ...catRows.map((c) => [c.cat, c.qty.toString(), c.sales.toFixed(2), `${c.pct}%`]),
      ];
    } else if (activeReport === 'payment_mode') {
      rows = [
        ['Payment Mode', 'Transactions', 'Total Collected (INR)', 'Share (%)'],
        ...payRows.map((p) => [p.mode, p.count.toString(), p.sales.toFixed(2), `${p.pct}%`]),
      ];
    } else if (activeReport === 'gst_tax') {
      rows = [
        ['Order #', 'Date', 'Taxable Subtotal', 'CGST', 'SGST', 'Total Tax'],
        ...validOrders.map((o) => [
          o.orderNumber,
          formatDate(o.createdAt),
          (o.subtotal - o.discount).toFixed(2),
          o.cgst.toFixed(2),
          o.sgst.toFixed(2),
          o.tax.toFixed(2),
        ]),
      ];
    } else if (activeReport === 'gstr1_ca_package') {
      filename = `GST-working-papers_${filingMonth}.csv`;
      rows = [
        ['GSTIN', 'Document type', 'Document number', 'Original invoice', 'Date (IST)', 'State code',
          'GST rate', 'Taxable value', 'CGST', 'SGST', 'Total'],
        ...taxEntries.map((entry) => [entry.gstin, entry.documentType, entry.documentNumber, entry.invoiceNumber,
          entry.date, entry.stateCode, String(entry.gstRate), entry.taxableValue.toFixed(2),
          entry.cgst.toFixed(2), entry.sgst.toFixed(2), entry.total.toFixed(2)]),
      ];
    } else if (breakdown) {
      rows = [breakdown.headings, ...breakdown.rows];
    } else {
      rows = [
        ['Order Number', 'Date', 'Type', 'Customer', 'Mode', 'Amount'],
        ...validOrders.map((o) => [
          o.orderNumber,
          formatDate(o.createdAt),
          o.type,
          o.customerName,
          o.paymentMode,
          o.total.toFixed(2),
        ]),
      ];
    }

    const csvCell = (value: string) => {
      const escaped = /^[=+@\t\r]|^-(?![0-9]+(?:[.][0-9]+)?$)/.test(value) ? `'${value}` : value;
      return `"${escaped.replace(/"/g, '""')}"`;
    };
    downloadFile(filename, '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  function downloadFile(name: string, contents: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const downloadGstr1Json = () => {
    downloadFile(`GST-working-papers_${filingMonth}.json`,
      JSON.stringify({ month: filingMonth, timeZone: 'Asia/Kolkata', documents: taxEntries }, null, 2),
      'application/json');
  };

  const reportNames: { id: ReportType; title: string }[] = [
    { id: 'sales_summary', title: '1. Sales Summary' },
    { id: 'item_sales', title: '2. Item-wise Sales' },
    { id: 'category_sales', title: '3. Category-wise Sales' },
    { id: 'payment_mode', title: '4. Payment-mode Report' },
    { id: 'hourly', title: '5. Hourly Sales Report' },
    { id: 'staff_cashier', title: '6. Staff/Cashier Report' },
    { id: 'discount_refund', title: '7. Discount & Refund Report' },
    { id: 'gst_tax', title: '8. GST (CGST/SGST) Report' },
    { id: 'kitchen_performance', title: '9. Kitchen Performance' },
    { id: 'gstr1_ca_package', title: '10. GST monthly working papers' },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col select-none printable-report">
      <div className="no-print">
      <Header title="Reports & Financials" subtitle="Audit, Tax & Operational Reports">
        <button
          onClick={() => navigate('/owner')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Dashboard</span>
        </button>
      </Header>
      </div>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="hidden print:block">
          <h1>{settings.storeName} · {reportNames.find((report) => report.id === activeReport)?.title}</h1>
          <p>{activeReport === 'gstr1_ca_package' ? filingMonth : from + ' to ' + through} (IST)</p>
        </div>
        {/* Top Control Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select
              value={activeReport}
              onChange={(e) => setActiveReport(e.target.value as ReportType)}
              className="px-4 py-2 rounded-2xl border border-gray-200 bg-white font-bold text-sm text-gray-900 shadow-subtle focus:outline-none"
            >
              {reportNames.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>

            {activeReport === 'gstr1_ca_package' ? (
              <label className="text-xs font-semibold">
                Filing month <input type="month" value={filingMonth} max={businessDate().slice(0, 7)}
                  onChange={(event) => { if (event.target.value) setFilingMonth(event.target.value); }}
                  className="rounded border border-gray-200 bg-white p-2" />
              </label>
            ) : (
            <div className="flex bg-gray-100 rounded-full p-0.5 text-xs font-semibold">
              <button
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-full ${dateRange === 'today' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'}`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 rounded-full ${dateRange === '7days' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-3 py-1 rounded-full ${dateRange === '30days' ? 'bg-white text-gray-900 shadow-subtle' : 'text-gray-500'}`}
              >
                Last 30 Days
              </button>
            </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeReport === 'gstr1_ca_package' && (
              <button
                onClick={downloadGstr1Json}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-subtle transition-colors"
              >
                <Download size={14} />
                <span>Download working papers JSON</span>
              </button>
            )}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-subtle transition-colors"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-subtle transition-colors"
            >
              <Printer size={14} />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {!validOrders.length && !refundedOrders.length && <p className="screen-state" role="status">No sales or refunds in this period.</p>}
        {/* Quiet Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="tikkit-card p-4">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Gross Revenue</span>
            <span className="tikkit-heading text-2xl">{formatINR(grossSales)}</span>
          </div>
          <div className="tikkit-card p-4">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Total Orders</span>
            <span className="tikkit-heading text-2xl">{validOrders.length}</span>
          </div>
          <div className="tikkit-card p-4">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">GST on sales</span>
            <span className="tikkit-heading text-2xl">{formatINR(totalTax)}</span>
          </div>
          <div className="tikkit-card p-4">
            <span className="text-[11px] font-semibold text-gray-400 block mb-1">Net collections</span>
            <span className="text-2xl font-black text-secondaryRed-600">
              {formatINR(grossSales - totalRefunds)}
            </span>
          </div>
        </div>

        {['sales_summary', 'hourly', 'category_sales', 'payment_mode'].includes(activeReport) && (
        <div className="no-print bg-white border border-gray-200 rounded-3xl p-6 shadow-card">
          <h3 className="font-bold text-gray-900 text-base mb-4">
            {reportNames.find((r) => r.id === activeReport)?.title} Trend
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeReport === 'category_sales' ? (
                <BarChart data={catRows}>
                  <XAxis dataKey="cat" stroke="#776B60" fontSize={11} tickLine={false} />
                  <YAxis stroke="#776B60" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                  <Bar dataKey="sales" fill="#FF4F1A" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : activeReport === 'payment_mode' ? (
                <BarChart data={payRows}>
                  <XAxis dataKey="mode" stroke="#776B60" fontSize={11} tickLine={false} />
                  <YAxis stroke="#776B60" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                  <Bar dataKey="sales" fill="#FFC72C" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={hourRows}>
                  <XAxis dataKey="hour" stroke="#776B60" fontSize={11} tickLine={false} />
                  <YAxis stroke="#776B60" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                  <Bar dataKey="sales" fill="#161412" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Quiet Table */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-x-auto shadow-card">
          {activeReport === 'item_sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Item Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Quantity Sold</th>
                  <th className="px-6 py-3.5 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {itemRows.map((it) => (
                  <tr key={it.key} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{it.name}</td>
                    <td className="px-6 py-3.5 text-gray-500">{it.cat}</td>
                    <td className="px-6 py-3.5 text-right">{it.qty}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                      {formatINR(it.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'category_sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Portions Sold</th>
                  <th className="px-6 py-3.5 text-right">Revenue</th>
                  <th className="px-6 py-3.5 text-right">Revenue Mix %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {catRows.map((c) => (
                  <tr key={c.cat} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{c.cat}</td>
                    <td className="px-6 py-3.5 text-right">{c.qty}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                      {formatINR(c.sales)}
                    </td>
                    <td className="px-6 py-3.5 text-right">{c.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'payment_mode' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Payment Mode</th>
                  <th className="px-6 py-3.5 text-right">Transactions</th>
                  <th className="px-6 py-3.5 text-right">Total Collected</th>
                  <th className="px-6 py-3.5 text-right">Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {payRows.map((p) => (
                  <tr key={p.mode} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{p.mode}</td>
                    <td className="px-6 py-3.5 text-right">{p.count}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                      {formatINR(p.sales)}
                    </td>
                    <td className="px-6 py-3.5 text-right">{p.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'gst_tax' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Taxable Subtotal</th>
                  <th className="px-6 py-3.5 text-right">CGST</th>
                  <th className="px-6 py-3.5 text-right">SGST</th>
                  <th className="px-6 py-3.5 text-right">Total GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {validOrders.slice(0, 30).map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{o.orderNumber}</td>
                    <td className="px-6 py-3.5 text-gray-500 font-mono">{formatDate(o.createdAt)}</td>
                    <td className="px-6 py-3.5 text-right">{formatINR(o.subtotal - o.discount)}</td>
                    <td className="px-6 py-3.5 text-right">{formatINR(o.cgst)}</td>
                    <td className="px-6 py-3.5 text-right">{formatINR(o.sgst)}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-secondaryGreen-700">
                      {formatINR(o.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {breakdown && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700">
                <tr>{breakdown.headings.map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdown.rows.map((row, index) => (
                  <tr key={index}>{row.map((value, column) => <td key={column} className="p-3">{value}</td>)}</tr>
                ))}
                {!breakdown.rows.length && <tr><td colSpan={breakdown.headings.length} className="p-3">No records for this period.</td></tr>}
              </tbody>
            </table>
          )}

          {activeReport === 'sales_summary' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {validOrders.slice(0, 20).map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/70">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{o.orderNumber}</td>
                    <td className="px-6 py-3.5 text-gray-500 font-mono">
                      {formatDate(o.createdAt)} {formatTime(o.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 capitalize">{o.type}</td>
                    <td className="px-6 py-3.5">{o.customerName}</td>
                    <td className="px-6 py-3.5 uppercase font-bold text-[11px]">
                      {o.paymentMode}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                      {formatINR(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'gstr1_ca_package' && (
            <div className="p-6 space-y-4">
              <h2 className="text-sm font-bold">Invoices and credit notes for {filingMonth}</h2>
              <p className="text-xs text-gray-600">Use these figures to prepare your filing with your accountant.</p>
              {taxEntries.length === 0 ? (
                <p className="text-sm text-gray-600">No GST invoices or credit notes were recorded this month.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50">
                      <tr>{['Document', 'Date', 'GSTIN', 'State', 'Rate', 'Taxable value', 'CGST', 'SGST', 'Total'].map((field) =>
                        <th key={field} scope="col" className="p-2">{field}</th>)}</tr>
                    </thead>
                    <tbody>
                      {taxEntries.map((entry) => (
                        <tr key={entry.documentNumber} className="border-t border-gray-100">
                          <td className="p-2">{entry.documentNumber}</td>
                          <td className="p-2">{entry.date}</td>
                          <td className="p-2">{entry.gstin}</td>
                          <td className="p-2">{entry.stateCode}</td>
                          <td className="p-2">{entry.gstRate}%</td>
                          <td className="p-2">{formatINR(entry.taxableValue)}</td>
                          <td className="p-2">{formatINR(entry.cgst)}</td>
                          <td className="p-2">{formatINR(entry.sgst)}</td>
                          <td className="p-2">{formatINR(entry.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

