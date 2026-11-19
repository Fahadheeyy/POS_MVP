"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "@/lib/navigation";
import { useAppStore } from '../../store';
import { Product, PaymentMode } from '../../types';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { ProductCustomizationModal } from './ProductCustomizationModal';
import { PaymentModal } from '../payment/PaymentModal';
import { OrderSuccessfulModal } from '../payment/OrderSuccessfulModal';
import { CashierRevenueModal } from './CashierRevenueModal';
import { formatINR } from '../../utils/formatters';
import { sounds } from '../../utils/audio';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  SlidersHorizontal,
  QrCode,
  Banknote,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

// Palette inspired by Image 1: vibrant, saturated/pastel card color themes
interface CardTheme {
  bg: string;
  tagColor: string;
  pillBorder: string;
  titleColor: string;
  priceBg: string;
  priceText: string;
  defaultTag: string;
  defaultPrepTime: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    bg: 'bg-[#F2653E]', // Warm Coral / Tomato (Pasta card)
    tagColor: 'text-white/95',
    pillBorder: 'border-white/50 text-white',
    titleColor: 'text-white',
    priceBg: 'bg-black/25',
    priceText: 'text-white',
    defaultTag: 'La Totita',
    defaultPrepTime: '2 min',
  },
  {
    bg: 'bg-[#4E101E]', // Deep Berry / Burgundy (Burger card)
    tagColor: 'text-[#F5A9C8]',
    pillBorder: 'border-[#F5A9C8]/50 text-[#F5A9C8]',
    titleColor: 'text-[#E464A4]', // Vibrant hot pink title
    priceBg: 'bg-white/20',
    priceText: 'text-white',
    defaultTag: 'Linda',
    defaultPrepTime: '22 min',
  },
  {
    bg: 'bg-[#C7F064]', // Bright Lime / Chartreuse (Hot dog card)
    tagColor: 'text-[#1F4512]',
    pillBorder: 'border-[#1F4512]/40 text-[#1F4512]',
    titleColor: 'text-[#1F4512]', // Deep forest green title
    priceBg: 'bg-black/15',
    priceText: 'text-[#1F4512]',
    defaultTag: 'Blanca Nieves',
    defaultPrepTime: '30 min',
  },
  {
    bg: 'bg-[#F8CA4D]', // Sunny Golden Mustard (Cocktail card)
    tagColor: 'text-[#1C3B2B]',
    pillBorder: 'border-[#1C3B2B]/40 text-[#1C3B2B]',
    titleColor: 'text-[#1C3B2B]', // Dark bottle green title
    priceBg: 'bg-black/15',
    priceText: 'text-[#1C3B2B]',
    defaultTag: 'Alto',
    defaultPrepTime: '14 min',
  },
  {
    bg: 'bg-[#EBA2DF]', // Soft Lilac / Orchid Pink (Mucho card)
    tagColor: 'text-[#4F1339]',
    pillBorder: 'border-[#4F1339]/40 text-[#4F1339]',
    titleColor: 'text-[#4F1339]', // Dark plum title
    priceBg: 'bg-black/15',
    priceText: 'text-[#4F1339]',
    defaultTag: 'Mucho',
    defaultPrepTime: '16 min',
  },
  {
    bg: 'bg-[#3B6E6A]', // Ocean Deep Teal (Lunz card)
    tagColor: 'text-[#D2F3EE]',
    pillBorder: 'border-[#D2F3EE]/40 text-[#D2F3EE]',
    titleColor: 'text-white',
    priceBg: 'bg-black/25',
    priceText: 'text-white',
    defaultTag: 'Lunz',
    defaultPrepTime: '19 min',
  },
  {
    bg: 'bg-[#FF5520]', // Tikkit Electric Orange
    tagColor: 'text-amber-100',
    pillBorder: 'border-white/50 text-white',
    titleColor: 'text-white',
    priceBg: 'bg-black/25',
    priceText: 'text-white',
    defaultTag: 'tikkit Spot',
    defaultPrepTime: '5 min',
  },
  {
    bg: 'bg-[#4353E8]', // Royal Cobalt Blue
    tagColor: 'text-blue-100',
    pillBorder: 'border-white/50 text-white',
    titleColor: 'text-white',
    priceBg: 'bg-black/25',
    priceText: 'text-white',
    defaultTag: 'Express',
    defaultPrepTime: '4 min',
  },
];

export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    products,
    categories,
    addOnGroups,
    cartItems,
    cartDiscountPercent,
    settings,
    orders,
    addToCart,
    updateCartItemQty,
    checkout,
    lastCreatedOrder,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Modals matching user's design flows
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState<boolean>(false);
  const [showRevenueModal, setShowRevenueModal] = useState<boolean>(false);

  // Payment Mode selection under cart with persistence for next order
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>(
    settings.lastUsedPaymentMode || settings.defaultPaymentMode || 'upi'
  );
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Automatically keep in sync with last used mode
  useEffect(() => {
    if (settings.lastUsedPaymentMode) {
      setSelectedPaymentMode(settings.lastUsedPaymentMode);
    }
  }, [settings.lastUsedPaymentMode]);

  // Next Token sequence calculation
  const nextTokenNumber = `${settings.orderPrefix || 'Token #'}${settings.nextOrderSequence || 106}`;
  // Today's orders & revenue calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr) && o.status !== 'cancelled');
  const todayOrderCount = todayOrders.length;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  // Helper to determine if a category is "all items"
  const isAllCategory = (catId: string) => catId === 'all' || catId === 'cat_all';

  // Dedicated Add-on standalone items
  const addOnProducts: Product[] = addOnGroups.flatMap((g) =>
    g.items.map((it) => ({
      id: `addon_${it.id}`,
      name: it.name,
      categoryId: 'addons',
      price: it.price,
      image: it.image || '/assets/products/sign_laban/Pistachio.png',
      description: `Category: ${g.name}`,
      station: 'Cold' as const,
      isAvailable: it.isAvailable !== false,
      addOnGroupIds: [],
    }))
  );

  const isAddonsCategory = selectedCategory === 'addons';
  const baseList = isAddonsCategory ? addOnProducts : products;

  // Filter products by category and search
  const filteredProducts = baseList.filter((p) => {
    const matchesCategory =
      isAddonsCategory
        ? true
        : isAllCategory(selectedCategory) || p.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = Math.round((subtotal * cartDiscountPercent) / 100);
  const taxable = Math.max(0, subtotal - discount);
  const isGstEnabled = settings.isGstEnabled !== false;
  const gstRate = isGstEnabled ? (settings.gstRate ?? 5) : 0;
  const cgst = isGstEnabled ? Number(((taxable * (gstRate / 2)) / 100).toFixed(2)) : 0;
  const sgst = isGstEnabled ? Number(((taxable * (gstRate / 2)) / 100).toFixed(2)) : 0;
  const tax = Number((cgst + sgst).toFixed(2));
  const total = Number((taxable + tax).toFixed(2));

  const totalCartQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // 1-Tap on Product Card: Opens customization if options exist, otherwise adds directly
  const handleProductCardClick = (product: Product) => {
    if (!product.isAvailable) {
      sounds.playError();
      return;
    }

    if (product.addOnGroupIds && product.addOnGroupIds.length > 0) {
      setCustomizingProduct(product);
    } else {
      sounds.playClick();
      addToCart(product, 1, []);
    }
  };

  // Direct 1-Tap Checkout from under-cart selector
  const handleDirectCheckout = () => {
    if (cartItems.length === 0) return;

    if (selectedPaymentMode === 'cash' && settings.cashTiming === 'after') {
      // Cash timing 'after': open modal for tender entry
      setShowPaymentModal(true);
      return;
    }

    // Direct checkout for UPI, Card, or Cash (before)
    const effectiveCash =
      selectedPaymentMode === 'cash'
        ? cashTendered > 0
          ? cashTendered
          : Math.ceil(total)
        : undefined;

    sounds.playSuccess();
    checkout(selectedPaymentMode, effectiveCash);
    setShowOrderSuccessModal(true);
    setCashTendered(0);
  };

  // Payment Confirmation from PaymentModal
  const handleConfirmPayment = (mode: PaymentMode, tenderAmt?: number) => {
    setSelectedPaymentMode(mode);
    checkout(mode, tenderAmt);
    setShowPaymentModal(false);
    setShowOrderSuccessModal(true);
    setCashTendered(0);
  };

  // Keyboard Shortcuts for velocity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showPaymentModal) setShowPaymentModal(false);
        else if (showOrderSuccessModal) setShowOrderSuccessModal(false);
        else if (customizingProduct) setCustomizingProduct(null);
      } else if (e.key === 'Enter') {
        if (!showPaymentModal && !showOrderSuccessModal && cartItems.length > 0) {
          e.preventDefault();
          handleDirectCheckout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, showPaymentModal, showOrderSuccessModal, customizingProduct]);

  // Selected category title
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentCategoryTitle =
    selectedCategory === 'addons'
      ? 'Add-ons & Toppings'
      : isAllCategory(selectedCategory)
      ? 'All Items'
      : currentCategoryObj
      ? currentCategoryObj.name
      : 'All Items';

  return (
    <div className="h-screen max-h-screen bg-[#FAF7F2] flex flex-col select-none overflow-hidden font-sans">
      {/* Top Header matching design system: Clean, calm, uncluttered */}
      <Header title="POS Express Counter" subtitle={`Counter 01 · ${settings.activeCashierName || 'Priya Sharma'}`}>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => navigate('/pos')}
            className="text-gray-900 border-b-2 border-gray-900 pb-0.5"
          >
            POS Counter
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="text-slate-500 hover:text-gray-900 transition-colors"
          >
            Today's Orders ({todayOrderCount})
          </button>
          <button
            onClick={() => setShowRevenueModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-gray-800 hover:text-gray-950 border border-slate-200/80 shadow-xs font-bold text-xs transition-all hover:shadow-sm active:scale-95 cursor-pointer"
            title="View today's counter revenue and tender collections"
          >
            <TrendingUp size={13} className="text-emerald-600" />
            <span>Today's Sales: <span className="text-emerald-700 font-extrabold">{formatINR(todayRevenue)}</span></span>
          </button>
        </div>
      </Header>

      <OfflineBanner />

      {/* Main Split Layout: Warm Ivory Canvas (Left) + Pure White Order Cart (Right) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Side: Product Catalog Canvas adopting the "My Spots" vibrant style */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 h-full bg-[#FAF7F2]">
          {/* Top Title & Filter Bar matching Image 1 ("My Spots" + "Filter") */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight font-display">
                My Spots
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {currentCategoryTitle} · {filteredProducts.length} items ready to order
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-full border-2 border-gray-900 bg-white hover:bg-gray-50 text-gray-900 font-black text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset or Filter Categories"
            >
              <SlidersHorizontal size={13} />
              <span>Filter</span>
            </button>
          </div>

          {/* 1. Search Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200/80 rounded-full px-5 py-2.5 shadow-xs flex items-center justify-between flex-1 transition-all focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10">
              <div className="flex items-center gap-3 flex-1">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your dish, burgers, desserts..."
                  className="w-full bg-transparent text-xs font-medium text-gray-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1 rounded-full"
                >
                  Search
                </button>
              )}
            </div>
          </div>

          {/* 3. Category Row with Sleek Pill Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isCatAll = isAllCategory(cat.id) || cat.slug === 'all';
              const isSelected = isCatAll
                ? isAllCategory(selectedCategory)
                : selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCategory(isCatAll ? 'all' : cat.id);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111113] text-white shadow-sm'
                      : 'bg-white text-gray-700 hover:text-gray-950 border border-gray-200/80 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}

            {/* Dedicated Add-ons space on POS */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setSelectedCategory('addons');
              }}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'addons'
                  ? 'bg-[#111113] text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:text-gray-950 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              Add-ons & Toppings
            </button>
          </div>

          {/* 4. Product Grid Section with Vibrant Card Themes from Image 1 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 pb-16 md:pb-6">
              {filteredProducts.map((product, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                const cartQty = cartItems
                  .filter((item) => item.product.id === product.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                // Category tag name and prep time
                const categoryObj = categories.find((c) => c.id === product.categoryId);
                const tagLabel = categoryObj?.name.split(' ')[0] || theme.defaultTag;
                const prepTime =
                  product.station === 'Grill'
                    ? '12 min'
                    : product.station === 'Fry'
                    ? '8 min'
                    : theme.defaultPrepTime;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductCardClick(product)}
                    className={`${theme.bg} rounded-[28px] p-4 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative group border border-black/5 ${
                      !product.isAvailable ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Top Metadata Row: Tag on left + Prep time pill on right */}
                    <div className="flex items-center justify-between mb-3 px-0.5">
                      <span className={`text-xs font-black tracking-tight truncate max-w-[60%] ${theme.tagColor}`}>
                        {tagLabel}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${theme.pillBorder} backdrop-blur-xs shrink-0`}
                      >
                        {prepTime}
                      </span>
                    </div>

                    {/* Hero Food Photography Container */}
                    <div className="w-full aspect-square rounded-2xl bg-black/10 overflow-hidden mb-3.5 relative flex items-center justify-center shadow-inner">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/placeholder-dessert.svg';
                        }}
                      />

                      {/* In-cart count badge */}
                      {cartQty > 0 && (
                        <span className="absolute top-2 left-2 bg-[#111113] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC72C] animate-pulse" />
                          {cartQty} in order
                        </span>
                      )}

                      {!product.isAvailable && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                          Sold Out
                        </span>
                      )}
                    </div>

                    {/* Bottom Area: Big Chunky Title & Price Tag */}
                    <div className="pt-0.5">
                      <h4
                        className={`font-black text-lg md:text-xl tracking-tight leading-snug line-clamp-1 font-display ${theme.titleColor}`}
                      >
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between mt-2 pt-0.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-mono font-black ${theme.priceBg} ${theme.priceText}`}
                        >
                          {formatINR(product.price)}
                        </span>
                        <span className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors shadow-xs">
                          <Plus size={14} className="stroke-[3]" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating Action Pill on Mobile/Tablet matching Image 1 ("View More") */}
        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const cartElem = document.getElementById('pos-order-cart');
              cartElem?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111113] hover:bg-black text-white px-7 py-3 rounded-full font-black text-xs md:hidden shadow-2xl flex items-center gap-2.5 z-30 transition-transform active:scale-95 border border-white/20 cursor-pointer"
          >
            <span>View Order</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5520]" />
            <span className="text-[#FFC72C]">
              {totalCartQuantity} items · {formatINR(total)}
            </span>
          </button>
        )}

        {/* Right Side: Order Cart with Tikkit receipt styling */}
        <div id="pos-order-cart" className="w-[380px] xl:w-[410px] bg-white border-l border-gray-200/90 flex flex-col h-full select-none shrink-0 shadow-card">
          {/* Cart Header */}
          <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-gray-900 tracking-tight">Order</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#FFC72C] text-[#111113] border border-[#111113]/30">
                {nextTokenNumber}
              </span>
            </div>
            <span className="font-extrabold text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
              {totalCartQuantity} {totalCartQuantity === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Cart Content: Empty State or Populated Lines */}
          {cartItems.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-full bg-[#111113] text-[#FFC72C] flex items-center justify-center mb-3 shadow-sm border border-black/10">
                <ShoppingBag size={22} />
              </div>
              <p className="text-sm font-bold text-gray-900">Your order is empty</p>
              <p className="text-xs text-slate-400 mt-1">Tap any spot or dish on the left to add</p>
            </div>
          ) : (
            /* Populated State */
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-900 leading-snug">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {formatINR(item.unitPrice)}
                      </p>

                      {/* Selected Toppings/Sauces */}
                      {item.selectedAddOns.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Toppings: {item.selectedAddOns.map((a) => a.item.name).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Small square thumbnail on the right */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl bg-slate-100 object-cover shrink-0 ml-3 shadow-xs"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/placeholder-dessert.svg';
                      }}
                    />
                  </div>

                  {/* Circular Stepper Buttons matching design: circular minus, qty, circular plus */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => updateCartItemQty(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-full bg-[#111113] hover:bg-black text-white flex items-center justify-center text-xs transition-colors"
                      title="Decrease"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold text-gray-900 min-w-4 text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartItemQty(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-full bg-[#111113] hover:bg-black text-white flex items-center justify-center text-xs transition-colors"
                      title="Increase"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pinned Bottom Checkout Area: Completely Un-scrollable, Always Visible */}
          <div className="shrink-0 bg-white border-t border-slate-100 p-4 space-y-3 z-10 shadow-xs">
            {/* Order Summary Box matching "Menu — populated order.png" */}
            {cartItems.length > 0 && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-800">{formatINR(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>- {formatINR(discount)}</span>
                  </div>
                )}

                {isGstEnabled ? (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total sales tax (GST {gstRate}%)</span>
                    <span className="font-medium text-slate-800">{formatINR(tax)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tax</span>
                    <span className="italic">Non-GST (₹0.00)</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-extrabold text-base text-gray-900 font-mono">
                    {formatINR(total)}
                  </span>
                </div>
              </div>
            )}

            {/* Under-Cart Payment Mode Toggle with Last-Used Memory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Payment Mode</span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {selectedPaymentMode === 'upi' ? 'UPI / QR' : selectedPaymentMode} (auto-saved)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPaymentMode('upi');
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedPaymentMode === 'upi'
                      ? 'bg-[#111113] text-[#FFC72C] shadow-xs border border-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <QrCode size={13} />
                  <span>UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPaymentMode('cash');
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedPaymentMode === 'cash'
                      ? 'bg-[#111113] text-[#FFC72C] shadow-xs border border-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Banknote size={13} />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPaymentMode('card');
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedPaymentMode === 'card'
                      ? 'bg-[#111113] text-[#FFC72C] shadow-xs border border-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <CreditCard size={13} />
                  <span>Card</span>
                </button>
              </div>

              {/* If Cash and cashTiming === 'before', display inline quick tender chips & change calculator */}
              {selectedPaymentMode === 'cash' && settings.cashTiming === 'before' && cartItems.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-semibold">Tender Notes:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(Number(e.target.value))}
                        placeholder={String(Math.ceil(total))}
                        className="w-20 px-2 py-0.5 rounded border border-slate-200 text-xs font-mono font-bold text-slate-900 text-right bg-white focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[Math.ceil(total), 500, 1000, 2000]
                      .filter((v, idx, arr) => v >= Math.ceil(total) && arr.indexOf(v) === idx)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setCashTendered(amt);
                          }}
                          className={`flex-1 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                            cashTendered === amt
                              ? 'bg-[#556475] text-white border-[#556475]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {amt === Math.ceil(total) ? 'Exact' : `₹${amt}`}
                        </button>
                      ))}
                  </div>
                  {(cashTendered > 0 ? cashTendered : Math.ceil(total)) >= total && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-700 font-medium">
                      <span>Change Return:</span>
                      <span className="font-extrabold font-mono text-emerald-700">
                        {formatINR((cashTendered > 0 ? cashTendered : Math.ceil(total)) - total)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleDirectCheckout}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                cartItems.length > 0
                  ? 'bg-[#FF5520] hover:bg-[#e84915] text-white shadow-[0_4px_16px_rgba(255,85,32,0.35)] cursor-pointer active:scale-98 tracking-tight'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {cartItems.length > 0 ? (
                <>
                  <span>Checkout · {selectedPaymentMode.toUpperCase()}</span>
                  <span>·</span>
                  <span className="font-mono text-base font-black">{formatINR(total)}</span>
                </>
              ) : (
                'Add items to checkout'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Customization Modal matching "Menu — Beast Style details.png" */}
      <ProductCustomizationModal
        product={customizingProduct}
        isOpen={!!customizingProduct}
        onClose={() => setCustomizingProduct(null)}
      />

      {/* Payments Method Modal matching "Payment — methods.png" */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        totalAmount={total}
      />

      {/* Order Successful Callout matching "Order — successful.png" */}
      <OrderSuccessfulModal
        order={lastCreatedOrder}
        isOpen={showOrderSuccessModal}
        onClose={() => setShowOrderSuccessModal(false)}
      />

      {/* Cashier Today's Revenue Modal */}
      <CashierRevenueModal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
      />
    </div>
  );
};
