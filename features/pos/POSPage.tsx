"use client";
import { pendingCheckoutKey, readPendingCheckout, type CheckoutRequest } from '@/services/orderService';
import { collections } from '@/lib/tax/collections';
import { businessDate } from '@/utils/businessDate';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "@/lib/navigation";
import { useAppStore } from '../../store';
import { Product, PaymentMode } from '../../types';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { ProductCustomizationModal } from './ProductCustomizationModal';
import { calculateCheckoutTotals } from '@/lib/tax/checkoutTotals';
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
    currentUser,
    connectedOutlet,
    businesses,
    activeBusinessId,
    orderType,
    tableNumber,
    setOrderType,
    setTableNumber,
  } = useAppStore();

  const [panel, setPanel] = useState<'menu' | 'order'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Modals matching user's design flows
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState<boolean>(false);
  const [showRevenueModal, setShowRevenueModal] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (orderType !== 'takeaway') {
      setOrderType('takeaway');
    }
    if (tableNumber) {
      setTableNumber('');
    }
  }, [orderType, tableNumber, setOrderType, setTableNumber]);

  const [preferredPayment, setSelectedPaymentMode] = useState<PaymentMode>(
    settings.lastUsedPaymentMode || settings.defaultPaymentMode || 'cash'
  );
  const allowedPayments = (['cash', 'upi', 'card'] as const).filter((mode) => !settings.enabledPayments || settings.enabledPayments[mode] === true);
  const selectedPaymentMode = allowedPayments.includes(preferredPayment)
    ? preferredPayment : allowedPayments[0];
  const [cashTendered, setCashTendered] = useState<number>(0);

  const pendingKey = connectedOutlet && pendingCheckoutKey(connectedOutlet.outletId, connectedOutlet.id);
  const [pending, setPending] = useState<CheckoutRequest | null>(null);
  const [pendingError, setPendingError] = useState('');
  useEffect(() => {
    const sync = () => {
      try {
        setPending(pendingKey ? readPendingCheckout(localStorage, pendingKey) : null);
        setPendingError('');
      } catch (error) {
        setPending(null);
        setPendingError(error instanceof Error ? error.message : 'Browser storage could not be read.');
      }
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [pendingKey, checkingOut]);

  const clearUnreadableCheckout = () => {
    if (!pendingKey) return;
    try {
      localStorage.removeItem(pendingKey);
      setPendingError('');
    } catch {
      setPendingError('Browser storage could not be cleared. Review Today’s Orders and check browser storage access.');
    }
  };

  // Today's orders & revenue calculation
  const todayStr = businessDate();
  const daily = collections(orders, todayStr, todayStr);
  const todayOrderCount = daily.count;
  const todayRevenue = daily.net;

  // Helper to determine if a category is "all items"
  const isAllCategory = (catId: string) => catId === 'all' || catId === 'cat_all';

  // Dedicated Add-on standalone items
  const addOnProducts: Product[] = addOnGroups.flatMap((g) =>
    g.items.map((it) => ({
      id: `addon_${it.id}`,
      name: it.name,
      categoryId: 'addons',
      price: it.price,
      image: it.image || '/assets/coffee/cappuccino.webp',
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
  const {
    grossSubtotal: subtotal, discountTotal: discount, taxTotal: tax, grandTotal: total,
  } = calculateCheckoutTotals(cartItems, cartDiscountPercent, settings,
    settings.stateCode ?? connectedOutlet?.stateCode ?? businesses.find((business) => business.id === activeBusinessId)?.stateCode);
  const isGstEnabled = settings.isGstEnabled !== false;
  const gstRate = isGstEnabled ? (settings.gstRate ?? 5) : 0;

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

  const handleConfirmPayment = async (mode: PaymentMode, tenderAmt?: number, resume = false) => {
    if (checkingOut) return;
    setCheckoutError('');
    setCheckingOut(true);
    try {
      await checkout(mode, tenderAmt, undefined, resume);
      setSelectedPaymentMode(mode);
      setShowOrderSuccessModal(true);
      setCashTendered(0);
      setPanel('menu');
      sounds.playSuccess();
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
      sounds.playError();
    } finally {
      setCheckingOut(false);
    }
  };

  const handleDirectCheckout = () => {
    if (cartItems.length === 0 || checkingOut || pending || pendingError || !selectedPaymentMode) return;
    setCheckoutError('');
    void handleConfirmPayment(selectedPaymentMode, selectedPaymentMode === 'cash' ? cashTendered : undefined);
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
        if (showOrderSuccessModal) setShowOrderSuccessModal(false);
        else if (customizingProduct) setCustomizingProduct(null);
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLElement && e.target.closest('button, a, select'))) {
        if (!pending && !showRevenueModal && !showOrderSuccessModal && !customizingProduct && cartItems.length > 0) {
          e.preventDefault();
          handleDirectCheckout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, showOrderSuccessModal, customizingProduct, checkingOut, selectedPaymentMode, cashTendered, orderType, tableNumber, pending, pendingError, showRevenueModal]);

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
    <div className="tikkit-pos h-screen max-h-screen bg-brand-oat flex flex-col select-none overflow-hidden font-sans">
      {/* Top Header matching design system: Clean, calm, uncluttered */}
      <Header title="POS Express Counter" subtitle={`Counter 01 · ${currentUser?.name || settings.activeCashierName || 'Counter staff'}`}>
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

      {/* Main Split Layout: Cool Slate Canvas (Left) + Pure White Order Cart (Right) */}
      {pending && !checkingOut && <section className="screen-state" role="alert">
        <h2>Finish previous checkout</h2>
        <p>{pending.paymentMode.toUpperCase()} · {formatINR(pending.expectedTotal)}. Resume to retrieve the receipt or finish saving this sale.</p>
        <button className="state-action" onClick={() => void handleConfirmPayment(pending.paymentMode, pending.cashTendered, true)}>Resume checkout</button>
        {checkoutError && <p>{checkoutError}</p>}
      </section>}
      {pendingError && <section className="screen-state" role="alert">
        <p>{pendingError}</p>
        <button type="button" className="state-action" onClick={clearUnreadableCheckout}>Clear unreadable checkout</button>
      </section>}
      <nav className="counter-panels" aria-label="Counter view">
        <button aria-pressed={panel === 'menu'} onClick={() => setPanel('menu')}>Menu</button>
        <button aria-pressed={panel === 'order'} onClick={() => setPanel('order')}>Order ({totalCartQuantity}) · {formatINR(total)}</button>
      </nav>
      <div inert={checkingOut || !!pending} data-panel={panel} className="tikkit-pos-layout flex-1 flex overflow-hidden min-h-0 lg:px-7 lg:pb-6 lg:pt-5 gap-5">
        {/* Left Side: Product Catalog Canvas */}
        <div className="flex-1 min-w-0 px-4 lg:px-0 overflow-y-auto space-y-5 h-full tikkit-pos-catalog">
          <h1 className="sr-only">Counter menu</h1>
          {/* 1. Search Bar matching "Menu — populated order.png" */}
          <div className="flex items-center gap-3">
            <div className="counter-search px-4 py-3 flex items-center justify-between flex-1">
              <div className="flex items-center gap-3 flex-1">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search menu" placeholder="Search menu…"
                  className="w-full bg-transparent text-xs font-medium text-gray-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="px-2 text-sm font-bold">Clear</button>}
            </div>

            {/* Filter Pill Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="w-10 h-10 rounded-full bg-brand-orange hover:bg-slate-700 text-white flex items-center justify-center shadow-sm transition-colors shrink-0"
              title="Reset Filters"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* 3. Category Row matching "Menu — populated order.png" */}
          <div className="counter-categories" aria-label="Menu categories">
            <button type="button" aria-pressed={isAllCategory(selectedCategory)} onClick={() => setSelectedCategory('all')}>All items</button>
            {categories
              .filter((cat) => {
                if (isAllCategory(cat.id) || cat.slug === 'all') return false;
                return products.some((p) => p.categoryId === cat.id);
              })
              .map((cat) => {
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    aria-pressed={isSelected}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}

            {addOnProducts.length > 0 && (
              <button type="button" aria-pressed={selectedCategory === 'addons'} onClick={() => setSelectedCategory('addons')}>Add-ons</button>
            )}
          </div>

          {/* 4. Product Grid Section */}
          <div className="space-y-3">
            {/* Category Header: Category Name on left, count on right */}
            <div className="flex items-center justify-between text-slate-800 px-1">
              <h3 className="tikkit-heading text-lg">{currentCategoryTitle}</h3>
              <span className="text-xs font-semibold text-slate-500">
                {filteredProducts.length}
              </span>
            </div>

            {!filteredProducts.length && <div className="screen-state" role="status">
              <h3>{baseList.length ? 'No matching items' : 'Menu is empty'}</h3>
              {baseList.length ? <button className="state-action" onClick={() => {setSearchQuery(''); setSelectedCategory('all');}}>Show all items</button>
                : <p>Add a menu item from menu management to start selling.</p>}
            </div>}
            <div className="counter-grid grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button type="button"
                  key={product.id}
                  disabled={!product.isAvailable || checkingOut || !!pending || !!pendingError}
                  onClick={() => handleProductCardClick(product)}
                  className={`tikkit-dish rounded-xl text-left transition-transform cursor-pointer flex flex-col justify-between select-none ${
                    !product.isAvailable ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Image container with rounded corners and soft neutral background */}
                  <div className={`w-full aspect-[4/3] overflow-hidden relative flex items-center justify-center ${product.image.startsWith('/assets/coffee/') ? 'bg-white' : 'bg-slate-100'}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full transition-transform duration-300 hover:scale-105 ${product.image.startsWith('/assets/coffee/') ? 'object-contain' : 'object-cover'}`}
                      onError={(e) => {
                        e.currentTarget.src = '/assets/coffee/cappuccino.webp';
                      }}
                    />

                    {!product.isAvailable && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Product Title and Price (Centered, matching design) */}
                  <div className="w-full px-3.5 py-3.5">
                    <h4 className="font-bold text-sm text-gray-900 leading-snug">
                      {product.name}
                    </h4>
                    <p className="font-mono text-sm font-bold mt-2">
                      {formatINR(product.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Order Cart matching "Menu — populated order.png" / "Menu — empty order.png" */}
        <div className="tikkit-pos-cart w-[340px] xl:w-[390px] flex flex-col h-full select-none shrink-0">
          {/* Cart Header */}
          <div className="px-6 py-4 border-b-2 border-dashed border-brand-rule flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <h3 className="tikkit-heading text-2xl">Order</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                Takeaway
              </span>
            </div>
            <span className="font-semibold text-lg text-slate-700">
              {totalCartQuantity}
            </span>
          </div>

          {/* Cart Content: Empty State or Populated Lines */}
          {cartItems.length === 0 ? (
            /* Empty State matching "Menu — empty order.png" */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-full bg-brand-orange text-white flex items-center justify-center mb-3 shadow-sm">
                <ShoppingBag size={22} />
              </div>
              <p className="text-sm font-medium text-slate-500">Tap a menu item to start this order.</p>
            </div>
          ) : (
            /* Populated State matching "Menu — populated order.png" */
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

                      {/* Selected Toppings/Sauces from design */}
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
                      className="w-14 h-14 rounded-xl bg-slate-100 object-cover shrink-0 ml-3"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/coffee/cappuccino.webp';
                      }}
                    />
                  </div>

                  {/* Circular Stepper Buttons matching design: circular minus, qty, circular plus */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      disabled={checkingOut || !!pending || !!pendingError}
                      onClick={() => updateCartItemQty(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-full bg-brand-orange hover:bg-slate-700 text-white flex items-center justify-center text-xs transition-colors"
                      title="Decrease"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-bold text-gray-900 min-w-4 text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= 1000 || checkingOut || !!pending || !!pendingError}
                      onClick={() => updateCartItemQty(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-full bg-brand-orange hover:bg-slate-700 text-white flex items-center justify-center text-xs transition-colors"
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
                  {selectedPaymentMode === 'upi' ? 'UPI / QR' : selectedPaymentMode || 'No payment method enabled'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  disabled={!allowedPayments.includes('upi') || checkingOut || !!pending}
                  aria-pressed={selectedPaymentMode === 'upi'}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPaymentMode('upi');
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                    selectedPaymentMode === 'upi'
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <QrCode size={13} />
                  <span>UPI</span>
                </button>
                <button
                  type="button"
                  disabled={!allowedPayments.includes('cash') || checkingOut || !!pending}
                  aria-pressed={selectedPaymentMode === 'cash'}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPaymentMode('cash');
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                    selectedPaymentMode === 'cash'
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Banknote size={13} />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  disabled={!allowedPayments.includes('card') || checkingOut || !!pending}
                  aria-pressed={selectedPaymentMode === 'card'}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedPaymentMode('card');
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                    selectedPaymentMode === 'card'
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <CreditCard size={13} />
                  <span>Card</span>
                </button>
              </div>

              {selectedPaymentMode === 'cash' && cartItems.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-semibold">Tender Notes:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        aria-label="Cash tendered"
                        min="0" step="0.01"
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(Number(e.target.value))}
                        placeholder={total.toFixed(2)}
                        className="w-20 px-2 py-0.5 rounded border border-slate-200 text-xs font-mono font-bold text-slate-900 text-right bg-white focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[total, 500, 1000, 2000]
                      .filter((v, idx, arr) => v >= total && arr.indexOf(v) === idx)
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
                              ? 'bg-brand-orange text-white border-[#FF4F1A]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {amt === total ? 'Exact' : `₹${amt}`}
                        </button>
                      ))}
                  </div>
                  {cashTendered >= total && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-700 font-medium">
                      <span>Change Return:</span>
                      <span className="font-extrabold font-mono text-emerald-700">
                        {formatINR(cashTendered - total)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {checkoutError && <p role="alert" className="text-xs text-red-700">{checkoutError}</p>}

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={cartItems.length === 0 || checkingOut || !!pending || !!pendingError || !selectedPaymentMode}
              onClick={handleDirectCheckout}
              className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                cartItems.length > 0
                  ? 'bg-brand-orange hover:bg-slate-700 text-white shadow-md cursor-pointer active:scale-98 tracking-wide'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {cartItems.length > 0 ? (
                <>
                  <span>{checkingOut ? 'Saving order…' : (selectedPaymentMode ? 'Checkout (' + selectedPaymentMode.toUpperCase() + ')' : 'No payment method enabled')}</span>
                  <span>·</span>
                  <span className="font-mono">{formatINR(total)}</span>
                </>
              ) : (
                'Checkout'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Customization Modal matching "Menu — Beast Style details.png" */}
      {customizingProduct && <ProductCustomizationModal
        key={customizingProduct.id}
        product={customizingProduct}
        isOpen
        onClose={() => setCustomizingProduct(null)}
      />}

      {/* Payments Method Modal matching "Payment — methods.png" */}


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
