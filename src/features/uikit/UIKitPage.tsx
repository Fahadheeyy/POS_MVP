import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Keypad } from '../../components/Keypad';
import { formatINR } from '../../utils/formatters';
import {
  ArrowLeft,
  Flame,
  Check,
  Printer,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Bell,
  Eye,
  Sliders,
  Download,
} from 'lucide-react';

export const UIKitPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col select-none">
      <Header title="Design System & UI Kit" subtitle="Tokens, Components & Visual Guidelines">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-subtle transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to POS</span>
        </button>
      </Header>

      <div className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-10">
        <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">QSR Design System</h1>
            <p className="text-xs text-gray-500 mt-1">
              Extracted from single source of truth PNGs. Pure Inter typography, cool slate neutrals, restrained coral accent.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs shadow-subtle hover:bg-gray-800 transition-colors"
          >
            <Download size={14} />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* 1. ATOMS: COLOR PALETTES (image 3022) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Color Palette Tokens (image 3022)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Slate Neutrals */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle space-y-2">
              <span className="font-bold text-gray-900 block">Gray Neutrals</span>
              <div className="space-y-1">
                {[
                  { name: 'gray-50', hex: '#f0f0f2', bg: 'bg-[#f0f0f2]', dark: false },
                  { name: 'gray-100', hex: '#d0d2d8', bg: 'bg-[#d0d2d8]', dark: false },
                  { name: 'gray-300', hex: '#989daa', bg: 'bg-[#989daa]', dark: false },
                  { name: 'gray-500', hex: '#666d80', bg: 'bg-[#666d80]', dark: true },
                  { name: 'gray-800', hex: '#383c46', bg: 'bg-[#383c46]', dark: true },
                  { name: 'gray-900', hex: '#2b2e36', bg: 'bg-[#2b2e36]', dark: true },
                ].map((c) => (
                  <div key={c.name} className={`${c.bg} ${c.dark ? 'text-white' : 'text-gray-900'} p-2 rounded-lg flex justify-between font-mono text-[11px]`}>
                    <span>{c.name}</span>
                    <span>{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Coral / Red */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle space-y-2">
              <span className="font-bold text-gray-900 block">Primary Accent</span>
              <div className="space-y-1">
                {[
                  { name: 'primary-50', hex: '#ffedee', bg: 'bg-[#ffedee]', dark: false },
                  { name: 'primary-200', hex: '#ffaaaf', bg: 'bg-[#ffaaaf]', dark: false },
                  { name: 'primary-500', hex: '#ff4750', bg: 'bg-[#ff4750]', dark: true },
                  { name: 'primary-600', hex: '#e84149', bg: 'bg-[#e84149]', dark: true },
                  { name: 'primary-800', hex: '#8c272c', bg: 'bg-[#8c272c]', dark: true },
                ].map((c) => (
                  <div key={c.name} className={`${c.bg} ${c.dark ? 'text-white' : 'text-gray-900'} p-2 rounded-lg flex justify-between font-mono text-[11px]`}>
                    <span>{c.name}</span>
                    <span>{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Yellow */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle space-y-2">
              <span className="font-bold text-gray-900 block">Accent Yellow</span>
              <div className="space-y-1">
                {[
                  { name: 'yellow-50', hex: '#fff9e6', bg: 'bg-[#fff9e6]', dark: false },
                  { name: 'yellow-200', hex: '#ffe38a', bg: 'bg-[#ffe38a]', dark: false },
                  { name: 'yellow-500', hex: '#ffc201', bg: 'bg-[#ffc201]', dark: true },
                  { name: 'yellow-700', hex: '#b58a01', bg: 'bg-[#b58a01]', dark: true },
                ].map((c) => (
                  <div key={c.name} className={`${c.bg} ${c.dark ? 'text-white' : 'text-gray-900'} p-2 rounded-lg flex justify-between font-mono text-[11px]`}>
                    <span>{c.name}</span>
                    <span>{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Green */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-subtle space-y-2">
              <span className="font-bold text-gray-900 block">Secondary Green</span>
              <div className="space-y-1">
                {[
                  { name: 'green-50', hex: '#ecf9f7', bg: 'bg-[#ecf9f7]', dark: false },
                  { name: 'green-200', hex: '#a7e4d8', bg: 'bg-[#a7e4d8]', dark: false },
                  { name: 'green-500', hex: '#40c4aa', bg: 'bg-[#40c4aa]', dark: true },
                  { name: 'green-700', hex: '#2d8b79', bg: 'bg-[#2d8b79]', dark: true },
                ].map((c) => (
                  <div key={c.name} className={`${c.bg} ${c.dark ? 'text-white' : 'text-gray-900'} p-2 rounded-lg flex justify-between font-mono text-[11px]`}>
                    <span>{c.name}</span>
                    <span>{c.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. ATOMS: TYPOGRAPHY (image 3021) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Typography Scale (image 3021)</h2>
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-subtle space-y-4">
            <div className="border-b pb-3">
              <span className="text-[10px] uppercase font-bold text-gray-400">H1 · 32px</span>
              <h1 className="text-3xl font-extrabold text-gray-900">Welcome to the kitchen</h1>
            </div>
            <div className="border-b pb-3">
              <span className="text-[10px] uppercase font-bold text-gray-400">H2 · 24px</span>
              <h2 className="text-2xl font-bold text-gray-900">Order Details & Payments</h2>
            </div>
            <div className="border-b pb-3">
              <span className="text-[10px] uppercase font-bold text-gray-400">H3 · 18px</span>
              <h3 className="text-lg font-bold text-gray-900">Qashtuta Pistachio (₹299.00)</h3>
            </div>
            <div className="border-b pb-3">
              <span className="text-[10px] uppercase font-bold text-gray-400">Body · 14px</span>
              <p className="text-sm text-gray-600">
                Tres leches cake soaked in rich milk, fresh whipped qashta cream, crushed pistachio & Belgian drizzle.
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Tiny · 11px</span>
              <p className="text-[11px] text-gray-400">
                GSTIN: 29AABCU9603R1ZM · Store Shift 01 · All systems operational
              </p>
            </div>
          </div>
        </section>

        {/* 3. MOLECULES: BUTTONS, CHIPS & STATUS (image 3025, 3026) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">3. Buttons, Badges & Chips</h2>
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-subtle space-y-6">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block mb-3">Status Badges (image 3026)</span>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  Reserved
                </span>
                <span className="px-3 py-1 rounded-full bg-secondaryRed-50 border border-secondaryRed-200 text-secondaryRed-700 text-xs font-bold flex items-center gap-1">
                  <Flame size={12} /> 08:50 Late
                </span>
                <span className="px-3 py-1 rounded-full bg-accent-50 border border-accent-200 text-accent-700 text-xs font-bold flex items-center gap-1">
                  <Bell size={12} /> Ready
                </span>
                <span className="px-3 py-1 rounded-full bg-secondaryGreen-50 border border-secondaryGreen-200 text-secondaryGreen-700 text-xs font-bold flex items-center gap-1">
                  <Check size={12} /> Done
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block mb-3">Button Variants (image 3025)</span>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs shadow-subtle">
                  Primary Dark
                </button>
                <button className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold text-xs shadow-subtle">
                  Primary Action Coral
                </button>
                <button className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs shadow-subtle">
                  Secondary White
                </button>
                <button className="px-4 py-2 rounded-xl bg-secondaryRed-50 text-secondaryRed-700 border border-secondaryRed-200 font-bold text-xs">
                  Danger / Void
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ORGANISMS: KEYPAD & INPUTS (Staff PIN login.png & image 3027) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">4. Keypad & Input Form Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-subtle flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 uppercase block mb-4">4-Digit PIN Keypad</span>
              <Keypad
                pin="12"
                onDigit={() => {}}
                onClear={() => {}}
                onBackspace={() => {}}
                onSubmit={() => {}}
                submitLabel="Authorize"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-subtle space-y-4">
              <span className="text-xs font-bold text-gray-500 uppercase block">Form Inputs (image 3027)</span>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Text Field</label>
                <input
                  type="text"
                  defaultValue="aziemela@gmail.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Error State Field</label>
                <input
                  type="text"
                  defaultValue="invalid-email-address"
                  className="w-full px-4 py-2.5 rounded-2xl border border-secondaryRed-300 bg-secondaryRed-50/50 text-xs text-secondaryRed-800"
                />
                <span className="text-[11px] text-secondaryRed-600 mt-1 block">Please enter a valid email</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

