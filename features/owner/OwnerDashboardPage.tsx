"use client";
import { collections } from '@/lib/tax/collections';
import { businessDate, businessDateDaysAgo } from '@/utils/businessDate';
import React, { useState } from 'react';
import { useNavigate } from "@/lib/navigation";
import { useAppStore } from '../../store';
import { Header } from '../../components/Header';
import { formatINR } from '../../utils/formatters';
import {
  FileSpreadsheet,
  ChevronRight,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, settings } = useAppStore();

  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days'>('today');

  // Filter orders by date range
  const now = new Date();
  const todayStr = businessDate(now);
  const daysBack = dateRange === 'yesterday' ? 1 : dateRange === '7days' ? 6 : dateRange === '30days' ? 29 : 0;
  const from = businessDateDaysAgo(daysBack, now);
  const through = dateRange === 'yesterday' ? from : todayStr;
  const ledger = collections(orders, from, through);
  const filteredOrders = orders.filter(order => {
    const day = businessDate(order.createdAt);
    return day >= from && day <= through && (order.paymentStatus === 'refunded' || (order.paymentStatus === 'paid' && order.status !== 'cancelled'));
  });
  const totalSales = ledger.net;
  const totalOrdersCount = ledger.count;
  const aov = ledger.count ? ledger.sales / ledger.count : 0;
  const {upi: upiSales, card: cardSales, cash: cashSales} = ledger;

  const upiPct = totalSales > 0 ? Math.round((upiSales / totalSales) * 100) : 0;
  const cardPct = totalSales > 0 ? Math.round((cardSales / totalSales) * 100) : 0;
  const cashPct = totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 0;

  // Hourly curve data
  const hourFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: true });
  const hourlyMap: Record<string, number> = {};
  for (let hour = 0; hour < 24; hour++) {
    hourlyMap[(hour % 12 || 12) + (hour < 12 ? ' AM' : ' PM')] = 0;
  }
  filteredOrders.forEach(order => {
    hourlyMap[hourFormatter.format(new Date(order.createdAt))] += order.total;
  });

  const hourlyChartData = Object.entries(hourlyMap).map(([hour, sales]) => ({
    hour,
    sales: Math.round(sales),
  }));

  // Top Items
  const itemMap: { [name: string]: { count: number; revenue: number } } = Object.create(null);
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!itemMap[item.product.name]) {
        itemMap[item.product.name] = { count: 0, revenue: 0 };
      }
      itemMap[item.product.name].count += item.quantity;
      itemMap[item.product.name].revenue += item.lineTotal;
    });
  });

  const topItems = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-brand-oat flex flex-col select-none font-sans">
      <Header title="Owner Dashboard" subtitle="Sales, Mix & Performance">
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => navigate('/owner')}
            className="text-gray-900 border-b-2 border-gray-900 pb-0.5"
          >
            Overview
          </button>
          <button
            onClick={() => navigate('/owner/reports')}
            className="text-slate-500 hover:text-gray-900 transition-colors"
          >
            Reports
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="text-slate-500 hover:text-gray-900 transition-colors"
          >
            Settings
          </button>
        </div>
      </Header>

      <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-5">
        {!ledger.count && !ledger.refunds && <p className="screen-state" role="status">No sales or refunds in this period.</p>}
        {/* Date Filter & Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="tikkit-heading text-3xl">Business Overview</h2>
            <p suppressHydrationWarning className="text-xs text-slate-500 mt-0.5">
              Net collections and tender mix for {settings.storeName || 'Daybreak Coffee'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white/70 backdrop-blur-xs rounded-full p-0.5 text-xs font-semibold border border-slate-200">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDateRange(d.id as any)}
                  className={`px-3.5 py-1.5 rounded-full transition-all ${
                    dateRange === d.id
                      ? 'bg-brand-orange text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-gray-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/owner/reports')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-colors"
            >
              <FileSpreadsheet size={13} className="text-slate-500" />
              <span>Full Reports</span>
            </button>
          </div>
        </div>

        {/* 4 Core KPIs: Clean, quiet, minimal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="tikkit-card p-5">
            <span className="tikkit-label text-[11px] text-brand-muted block mb-2">Net collections</span>
            <div className="flex items-baseline gap-2">
              <span className="tikkit-heading text-2xl text-brand-ink">
                {formatINR(totalSales)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">After refunds</span>
          </div>

          <div className="tikkit-card p-5">
            <span className="tikkit-label text-[11px] text-brand-muted block mb-2">Total Orders</span>
            <div className="flex items-baseline gap-2">
              <span className="tikkit-heading text-2xl text-brand-ink">
                {totalOrdersCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Paid orders recorded</span>
          </div>

          <div className="tikkit-card p-5">
            <span className="tikkit-label text-[11px] text-brand-muted block mb-2">Avg Order Value</span>
            <span className="tikkit-heading text-2xl text-brand-ink">
              {formatINR(aov)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Per customer ticket</span>
          </div>

          <div className="tikkit-card p-5">
            <span className="tikkit-label text-[11px] text-brand-muted block mb-2">Payment Mix</span>
            <div className="flex items-center gap-3 mt-1.5">
              <div>
                <span className="text-xs font-black text-gray-900 block font-mono">{upiPct}%</span>
                <span className="text-[10px] text-slate-400">UPI</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-xs font-black text-gray-900 block font-mono">{cashPct}%</span>
                <span className="text-[10px] text-slate-400">Cash</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-xs font-black text-gray-900 block font-mono">{cardPct}%</span>
                <span className="text-[10px] text-slate-400">Card</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Core Visualizations: Hourly Curve + Top 5 Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Hourly Curve (2 Cols) */}
          <div className="lg:col-span-2 tikkit-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Hourly Sales Curve</h3>
                <p className="text-xs text-slate-400 mt-0.5">Turnover distribution through the day (₹)</p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                Peak: 7 PM - 10 PM
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="minimalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4F1A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF4F1A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#776B60" fontSize={10} tickLine={false} />
                  <YAxis stroke="#776B60" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Sales']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #D9CFC0',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#FF4F1A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#minimalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Items (1 Col) */}
          <div className="tikkit-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm">Top 5 Items</h3>
                <span className="text-[11px] text-slate-400 font-medium">By revenue</span>
              </div>

              <div className="space-y-3">
                {topItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 text-slate-400 font-bold font-mono text-[11px]">
                        {idx + 1}.
                      </span>
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.count} sold</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-gray-900 font-mono">
                      {formatINR(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/owner/reports')}
              className="mt-4 w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Full Item-wise Breakdown</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Quiet System & Hardware Footer Notice */}
        <div className="p-3.5 rounded-xl bg-white/60 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
            <span className="text-[11px]">
              Hardware: <strong>Thermal Receipt Printer Only</strong> (Online & Ready) · Zero external peripheral devices required.
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            GSTIN: {settings.gstin || '29AABCS1429B1Z8'}
          </span>
        </div>
      </div>
    </div>
  );
};
