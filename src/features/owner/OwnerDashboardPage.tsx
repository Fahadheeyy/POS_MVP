import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { Header } from '../../components/Header';
import { formatINR } from '../../utils/formatters';
import {
  FileSpreadsheet,
  ArrowUpRight,
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
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const filteredOrders = orders.filter((order) => {
    const orderDate = order.createdAt.split('T')[0];
    if (dateRange === 'today') return orderDate === todayStr;
    if (dateRange === 'yesterday') return orderDate === yesterdayStr;
    if (dateRange === '7days') {
      const diffDays = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    if (dateRange === '30days') {
      const diffDays = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }
    return true;
  });

  // KPI Calculations
  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const totalOrdersCount = filteredOrders.filter((o) => o.status !== 'cancelled').length;
  const aov = totalOrdersCount > 0 ? Math.round(totalSales / totalOrdersCount) : 0;

  const upiSales = filteredOrders.filter((o) => o.paymentMode === 'upi' && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
  const cardSales = filteredOrders.filter((o) => o.paymentMode === 'card' && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
  const cashSales = filteredOrders.filter((o) => o.paymentMode === 'cash' && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);

  const upiPct = totalSales > 0 ? Math.round((upiSales / totalSales) * 100) : 0;
  const cardPct = totalSales > 0 ? Math.round((cardSales / totalSales) * 100) : 0;
  const cashPct = totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 0;

  // Hourly curve data
  const hourlyMap: { [hour: string]: number } = {
    '11 AM': 0, '12 PM': 0, '1 PM': 0, '2 PM': 0, '3 PM': 0, '4 PM': 0,
    '5 PM': 0, '6 PM': 0, '7 PM': 0, '8 PM': 0, '9 PM': 0, '10 PM': 0,
  };

  filteredOrders.forEach((o) => {
    if (o.status === 'cancelled') return;
    const hour = new Date(o.createdAt).getHours();
    let label = '12 PM';
    if (hour < 12) label = `${hour} AM`;
    else if (hour === 12) label = '12 PM';
    else label = `${hour - 12} PM`;

    if (hourlyMap[label] !== undefined) {
      hourlyMap[label] += o.total;
    }
  });

  const hourlyChartData = Object.entries(hourlyMap).map(([hour, sales]) => ({
    hour,
    sales: Math.round(sales),
  }));

  // Top Items
  const itemMap: { [name: string]: { count: number; revenue: number } } = {};
  filteredOrders.forEach((o) => {
    if (o.status === 'cancelled') return;
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
    <div className="min-h-screen bg-[#bac7d5] flex flex-col select-none font-sans">
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
        {/* Date Filter & Title Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Business Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live revenue and sales mix for {settings.storeName || 'Sign Laban'}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
                      ? 'bg-[#556475] text-white shadow-xs font-bold'
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Gross Sales</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 font-mono">
                {formatINR(totalSales)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight size={12} /> +12%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Net of discounts</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Orders</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 font-mono">
                {totalOrdersCount}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight size={12} /> +5
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Completed tokens</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Avg Order Value</span>
            <span className="text-2xl font-extrabold text-gray-900 font-mono">
              {formatINR(aov)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Per customer ticket</span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Payment Mix</span>
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
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
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
                      <stop offset="5%" stopColor="#556475" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#556475" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Sales']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#556475"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#minimalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Items (1 Col) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
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
