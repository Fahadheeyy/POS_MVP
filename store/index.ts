import { create } from 'zustand';
import {
  User,
  Role,
  Product,
  Category,
  AddOnGroup,
  AddOnItem,
  BusinessTenant,
  CartItem,
  Order,
  OrderType,
  PaymentMode,
  OrderStatus,
  KdsTicket,
  KdsTicketStatus,
  Shift,
  ApprovalRequest,
  SystemSettings,
  SelectedAddOn,
  HeldOrder,
  CustomerLoyalty,
  PettyCashExpense,
  WasteLogItem,
  StaffAttendance,
  KitchenAlert,
  AuditLogEvent,
} from '@/types';
import menuJson from '../public/assets/menu.json';
import { formatRule46InvoiceNumber, getIndianFinancialYear } from '@/lib/tax/gstEngine';
import { calculateCheckoutTotals } from '@/lib/tax/checkoutTotals';
import { businessDate } from '@/utils/businessDate';
import { orderService, pendingCheckoutKey, readPendingCheckout, RequestRejected } from '@/services/orderService';
import type { OutletAccess } from '@/lib/auth/operationalAccess';
import { authService } from '@/lib/auth/authService';
import {
  INITIAL_USERS,
  INITIAL_BUSINESSES,
  INITIAL_SETTINGS,
  generateHistoricalOrders,
  generateTodayOrders,
  INITIAL_HELD_ORDERS,
  INITIAL_LOYALTY_CUSTOMERS,
  INITIAL_PETTY_CASH,
  INITIAL_WASTE_LOG,
  INITIAL_ATTENDANCE,
  INITIAL_AUDIT_LOG,
} from '@/data/seedData';

const STORAGE_KEY = 'sign_laban_pos_v2';
const SYNC_CHANNEL_NAME = 'sign_laban_sync';

// Isomorphic safe storage helper for Next.js SSR / Prerender
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch {}
    return false;
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  },
};

interface StoreState {
  // Current session
  currentUser: User | null;
  currentRole: Role;
  connectedOutlet: OutletAccess | null;
  operationalError: string;
  
  // Data
  users: User[];
  settings: SystemSettings;
  businesses: BusinessTenant[];
  activeBusinessId: string;
  categories: Category[];
  products: Product[];
  addOnGroups: AddOnGroup[];
  orders: Order[];
  tickets: KdsTicket[];
  currentShift: Shift;
  shiftHistory: Shift[];
  approvals: ApprovalRequest[];

  // Specialized Role Data
  heldOrders: HeldOrder[];
  loyaltyCustomers: CustomerLoyalty[];
  pettyCashExpenses: PettyCashExpense[];
  wasteLog: WasteLogItem[];
  staffAttendance: StaffAttendance[];
  kitchenAlert: KitchenAlert | null;
  auditLog: AuditLogEvent[];
  
  // Cart
  cartItems: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  customerName: string;
  guestCount: number;
  cartDiscountPercent: number;
  lastCreatedOrder: Order | null;

  // System UI status
  activeKdsStation: 'All stations' | 'Grill' | 'Fry' | 'Cold' | 'Expo';
  kdsSoundEnabled: boolean;
  isKdsLocked: boolean;

  // Actions - Auth
  setCurrentUser: (user: User | null) => void;
  setCurrentRole: (role: Role) => void;
  loginWithPin: (pin: string, requestedRole?: Role) => { success: boolean; error?: string };
  loginWithPassword: (emailOrPhone: string, passwordOrPin: string) => { success: boolean; error?: string };
  logout: () => void;

  // Actions - Cart
  addToCart: (product: Product, quantity?: number, selectedAddOns?: SelectedAddOn[]) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  updateCartItemSpecialInstructions: (cartItemId: string, instructions: string) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (table: string) => void;
  setCustomerInfo: (name: string, guests: number, table?: string) => void;
  setCartDiscountPercent: (percent: number) => void;

  // Actions - Specialized Cashier
  holdCurrentOrder: (note?: string) => void;
  recallHeldOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;
  applyLoyaltyCustomer: (customer: CustomerLoyalty, redeemDiscount?: boolean) => void;
  triggerNoSaleDrawerOpen: (reason: string) => void;

  // Actions - Orders & Checkout
  checkout: (paymentMode: PaymentMode, cashTendered?: number, paymentReference?: string, resume?: boolean) => Order | Promise<Order>;
  cancelOrder: (orderId: string, reason: string) => void;
  refundOrder: (orderId: string, reason: string) => void;

  // Actions - KDS
  setActiveKdsStation: (station: 'All stations' | 'Grill' | 'Fry' | 'Cold' | 'Expo') => void;
  toggleKdsSound: () => void;
  setIsKdsLocked: (locked: boolean) => void;
  advanceTicketStatus: (ticketId: string) => void;
  setTicketStatus: (ticketId: string, status: KdsTicketStatus) => void;
  toggleTicketItemReady: (ticketId: string, itemId: string) => void;
  markTicketRush: (ticketId: string, isRush: boolean) => void;
  recallLastBumpedTicket: () => KdsTicket | null;
  recallTicketById: (ticketId: string) => void;
  addTicketPrepNote: (ticketId: string, note: string) => void;
  setKitchenAlert: (alert: KitchenAlert | null) => void;
  quickToggle86Item: (productId: string) => void;

  // Actions - Shifts
  addCashMovement: (type: 'in' | 'out', amount: number, reason: string) => void | Promise<boolean>;
  updateShiftDenominations: (counts: { [denom: number]: number }) => void;
  closeShift: (countedCash: number) => void | Promise<boolean>;
  openNewShift: (openingCash: number) => void | Promise<boolean>;

  // Actions - Management
  updateProduct: (id: string, updates: Partial<Product>) => boolean | Promise<boolean>;
  addProduct: (product: Omit<Product, 'id'>) => boolean | Promise<boolean>;
  updateAddOnGroups: (groups: AddOnGroup[]) => void;
  addAddOnGroup: (group: Omit<AddOnGroup, 'id'>) => void | Promise<boolean>;
  addAddOnItemToGroup: (groupId: string, item: Omit<AddOnItem, 'id'>) => void | Promise<boolean>;
  updateAddOnItem: (groupId: string, item: AddOnItem) => void;
  deleteAddOnItem: (groupId: string, itemId: string) => void;
  toggleAddOnItemStock: (groupId: string, itemId: string) => void;
  toggleProductAvailability: (id: string) => void;
  updatePromoBanner: (active: boolean, percent: number, text: string) => void;
  addStaff: (user: Omit<User, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<User>) => void;
  resetStaffPin: (id: string, newPin: string) => void;
  toggleStaffStatus: (id: string) => void;
  requestApproval: (req: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>) => void;
  resolveApproval: (id: string, status: 'approved' | 'rejected', reviewer: string, note?: string) => void;
  addPettyCashExpense: (expense: Omit<PettyCashExpense, 'id' | 'timestamp'>) => void;
  addWasteLogItem: (item: Omit<WasteLogItem, 'id' | 'timestamp'>) => void;
  updateStaffAttendanceStatus: (id: string, status: 'clocked-in' | 'on-break' | 'clocked-out') => void;

  // Actions - Common & Owner Audit
  logAuditEvent: (type: AuditLogEvent['type'], description: string, metadata?: Record<string, any>) => void;

  // Actions - Admin & Multi-Business Portal
  addBusiness: (business: Omit<BusinessTenant, 'id' | 'createdDate'>) => void;
  updateBusiness: (id: string, updates: Partial<BusinessTenant>) => void;
  deleteBusiness: (id: string) => void;
  switchActiveBusiness: (id: string) => void;
  launchAsOwner: (businessId: string) => { success: boolean; targetRoute: string };
  seedSalesDemoData: (businessId: string) => void;

  // Actions - Settings & System
  updateSettings: (partial: Partial<SystemSettings>) => void | Promise<boolean>;
  toggleOfflineSimulated: () => void;
  togglePrinterSimulated: () => void;
  resetDemoData: () => void;
}

// Initialize default seed data (deterministic for SSR and initial hydration)
function getDefaultInitialData() {
  const menuProducts: Product[] = menuJson.products as Product[];
  const categories: Category[] = menuJson.categories as Category[];
  const addOnGroups: AddOnGroup[] = menuJson.addOnGroups as AddOnGroup[];
  const historicalOrders = generateHistoricalOrders(menuProducts);
  const { orders: todayOrders, tickets, shift, approvals } = generateTodayOrders(menuProducts);

  return {
    users: INITIAL_USERS,
    settings: INITIAL_SETTINGS,
    businesses: INITIAL_BUSINESSES,
    activeBusinessId: INITIAL_BUSINESSES[0].id,
    categories,
    products: menuProducts,
    addOnGroups,
    orders: [...todayOrders, ...historicalOrders],
    tickets,
    currentShift: shift,
    shiftHistory: [],
    approvals,
    heldOrders: INITIAL_HELD_ORDERS,
    loyaltyCustomers: INITIAL_LOYALTY_CUSTOMERS,
    pettyCashExpenses: INITIAL_PETTY_CASH,
    wasteLog: INITIAL_WASTE_LOG,
    staffAttendance: INITIAL_ATTENDANCE,
    kitchenAlert: null,
    auditLog: INITIAL_AUDIT_LOG,
  };
}

// Broadcast channel for multi-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
}

function persistState(state: Partial<StoreState>) {
  if (useAppStore.getState().connectedOutlet) return;
  const currentSaved = safeStorage.getItem(STORAGE_KEY);
  let parsed: any = {};
  if (currentSaved) {
    try { parsed = JSON.parse(currentSaved); } catch (e) {}
  }
  
  const updated = {
    ...parsed,
    users: (state.users ?? parsed.users)?.map((user: User) => ({ ...user, pin: '' })),
    settings: state.settings ?? parsed.settings,
    businesses: (state.businesses ?? parsed.businesses)?.map((business: BusinessTenant) => ({ ...business, ownerPassword: undefined, ownerPin: undefined })),
    activeBusinessId: state.activeBusinessId ?? parsed.activeBusinessId,
    categories: state.categories ?? parsed.categories,
    products: state.products ?? parsed.products,
    addOnGroups: state.addOnGroups ?? parsed.addOnGroups,
    orders: state.orders ?? parsed.orders,
    tickets: state.tickets ?? parsed.tickets,
    currentShift: state.currentShift ?? parsed.currentShift,
    shiftHistory: state.shiftHistory ?? parsed.shiftHistory,
    approvals: state.approvals ?? parsed.approvals,
    heldOrders: state.heldOrders ?? parsed.heldOrders,
    loyaltyCustomers: state.loyaltyCustomers ?? parsed.loyaltyCustomers,
    pettyCashExpenses: state.pettyCashExpenses ?? parsed.pettyCashExpenses,
    wasteLog: state.wasteLog ?? parsed.wasteLog,
    staffAttendance: state.staffAttendance ?? parsed.staffAttendance,
    kitchenAlert: state.kitchenAlert ?? parsed.kitchenAlert,
    auditLog: state.auditLog ?? parsed.auditLog,
  };

  if (!safeStorage.setItem(STORAGE_KEY, JSON.stringify(updated))) return false;

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'SYNC_UPDATE' });
  }
  return true;
}

const initial = getDefaultInitialData();

type DemoOutletRecords = Pick<StoreState, 'orders' | 'tickets' | 'currentShift' | 'shiftHistory' | 'heldOrders' | 'settings'>;
const demoOutletRecords = new Map<string, DemoOutletRecords>();

// Register all business owners into authService dynamic directory
if (initial.businesses) {
  try {
    initial.businesses.forEach((biz: BusinessTenant) => {
      if (biz.ownerEmail) {
        authService.registerAccount({
          email: biz.ownerEmail,
          password: biz.ownerPassword || 'password123',
          role: 'owner',
          name: biz.ownerName || `${biz.brandName} Owner`,
          title: `${biz.brandName} Franchise Owner`,
          pin: biz.ownerPin || '8888',
          phone: biz.ownerPhone,
          outletId: biz.id,
        });
      }
    });
  } catch (err) {
    console.warn('Failed to seed owner accounts into authService', err);
  }
}

export const useAppStore = create<StoreState>((set, get) => ({
  currentUser: initial.users.find((u: User) => u.role === 'cashier') || initial.users[0],
  currentRole: 'cashier',
  connectedOutlet: null,
  operationalError: '',

  users: initial.users,
  settings: initial.settings,
  businesses: initial.businesses || INITIAL_BUSINESSES,
  activeBusinessId: initial.activeBusinessId || INITIAL_BUSINESSES[0].id,
  categories: initial.categories,
  products: initial.products,
  addOnGroups: initial.addOnGroups,
  orders: initial.orders,
  tickets: initial.tickets,
  currentShift: initial.currentShift,
  shiftHistory: initial.shiftHistory,
  approvals: initial.approvals,

  heldOrders: initial.heldOrders || [],
  loyaltyCustomers: initial.loyaltyCustomers || [],
  pettyCashExpenses: initial.pettyCashExpenses || [],
  wasteLog: initial.wasteLog || [],
  staffAttendance: initial.staffAttendance || [],
  kitchenAlert: initial.kitchenAlert || null,
  auditLog: initial.auditLog || [],

  cartItems: [],
  orderType: 'takeaway',
  tableNumber: '',
  customerName: 'Guest',
  guestCount: 1,
  cartDiscountPercent: 0,
  lastCreatedOrder: null,

  activeKdsStation: 'All stations',
  kdsSoundEnabled: true,
  isKdsLocked: false,

  // Auth actions
  setCurrentUser: (user) => {
    if (user) {
      set({ currentUser: user, currentRole: user.role });
    } else {
      set({ currentUser: null });
    }
  },

  setCurrentRole: (role) => {
    const matchingUser = get().users.find((u) => u.role === role && u.active);
    set({
      currentRole: role,
      currentUser: matchingUser || get().users[0],
    });
  },

  loginWithPin: (pin, requestedRole) => {
    const user = get().users.find((u) => u.pin === pin && u.active);
    if (!user) {
      return { success: false, error: 'Incorrect PIN. Try again or contact your manager.' };
    }
    if (requestedRole && user.role !== requestedRole && requestedRole !== 'cashier') {
      // Allow manager to access cashier or kitchen if needed, but role-check otherwise
      if (user.role !== 'manager' && user.role !== 'owner') {
        return { success: false, error: `User is registered as ${user.role}, not ${requestedRole}.` };
      }
    }
    set({ currentUser: user, currentRole: requestedRole || user.role });
    return { success: true };
  },

  loginWithPassword: (emailOrPhone, passwordOrPin) => {
    const lower = emailOrPhone.toLowerCase().trim();
    const user = get().users.find(
      (u) =>
        (u.email?.toLowerCase() === lower || u.phone?.includes(lower) || u.name.toLowerCase().includes(lower)) &&
        (passwordOrPin === 'password123' || passwordOrPin === u.pin) &&
        u.active
    );
    if (!user) {
      return { success: false, error: 'Invalid email/phone or password. Please try again.' };
    }
    set({ currentUser: user, currentRole: user.role });
    return { success: true };
  },

  logout: () => {
    set({ currentUser: null, connectedOutlet: null, orders: [], tickets: [], cartItems: [] });
  },

  // Cart actions
  addToCart: (product, quantity = 1, selectedAddOns = []) => {
    const addOnPrice = selectedAddOns.reduce((sum, a) => sum + a.item.price, 0);
    const unitPrice = product.price + addOnPrice;
    const lineTotal = unitPrice * quantity;

    // Check if duplicate item with identical add-ons already exists
    const existingIndex = get().cartItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedAddOns.map((a) => a.item.id).sort().join(',') ===
          selectedAddOns.map((a) => a.item.id).sort().join(',')
    );

    let updatedCart = [...get().cartItems];
    if (existingIndex > -1) {
      const existing = updatedCart[existingIndex];
      const newQty = Math.min(1000, existing.quantity + quantity);
      updatedCart[existingIndex] = {
        ...existing,
        product, selectedAddOns, unitPrice,
        quantity: newQty,
        lineTotal: unitPrice * newQty,
      };
    } else {
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      updatedCart.push({
        cartItemId,
        product,
        quantity,
        selectedAddOns,
        unitPrice,
        lineTotal,
      });
    }

    set({ cartItems: updatedCart });
  },

  updateCartItemQty: (cartItemId, delta) => {
    const updatedCart = get()
      .cartItems.map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = Math.min(1000, item.quantity + delta);
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            lineTotal: item.unitPrice * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    set({ cartItems: updatedCart });
  },

  removeCartItem: (cartItemId) => {
    set({ cartItems: get().cartItems.filter((i) => i.cartItemId !== cartItemId) });
  },

  clearCart: () => {
    set({ cartItems: [], cartDiscountPercent: 0 });
  },

  updateCartItemSpecialInstructions: (cartItemId, instructions) => {
    const updated = get().cartItems.map((item) =>
      item.cartItemId === cartItemId ? { ...item, specialInstructions: instructions } : item
    );
    set({ cartItems: updated });
  },

  setOrderType: (type) => set({ orderType: type }),
  setTableNumber: (table) => set({ tableNumber: table }),
  setCustomerInfo: (name, guests, table) =>
    set({
      customerName: name || 'Guest',
      guestCount: guests || 1,
      tableNumber: table || get().tableNumber,
    }),
  setCartDiscountPercent: (percent) => set({ cartDiscountPercent: percent }),

  // Specialized Cashier Actions
  holdCurrentOrder: (note) => {
    const state = get();
    if (state.cartItems.length === 0) return;
    const nextSeq = state.settings.nextOrderSequence || 335;
    const newHeld: HeldOrder = {
      id: `hold_${Date.now()}`,
      orderNumber: `#${nextSeq}`,
      customerName: state.customerName,
      guestCount: state.guestCount,
      tableNumber: state.tableNumber,
      orderType: state.orderType,
      cartItems: [...state.cartItems],
      cartDiscountPercent: state.cartDiscountPercent,
      note: note || `Held for ${state.customerName}`,
      heldAt: new Date().toISOString(),
    };
    const updatedHeld = [newHeld, ...state.heldOrders];
    set({
      heldOrders: updatedHeld,
      cartItems: [],
      cartDiscountPercent: 0,
      customerName: 'Guest',
      guestCount: 1,
    });
    persistState({ heldOrders: updatedHeld });
    get().logAuditEvent('shift_audit', `Held active order ${newHeld.orderNumber} (${newHeld.customerName})`);
  },

  recallHeldOrder: (id) => {
    const state = get();
    const held = state.heldOrders.find((h) => h.id === id);
    if (!held) return;
    const remainingHeld = state.heldOrders.filter((h) => h.id !== id);
    set({
      heldOrders: remainingHeld,
      cartItems: [...held.cartItems],
      customerName: held.customerName,
      guestCount: held.guestCount,
      tableNumber: held.tableNumber,
      orderType: held.orderType,
      cartDiscountPercent: held.cartDiscountPercent,
    });
    persistState({ heldOrders: remainingHeld });
    get().logAuditEvent('shift_audit', `Recalled held order ${held.orderNumber} into active cart`);
  },

  deleteHeldOrder: (id) => {
    const updatedHeld = get().heldOrders.filter((h) => h.id !== id);
    set({ heldOrders: updatedHeld });
    persistState({ heldOrders: updatedHeld });
  },

  applyLoyaltyCustomer: (customer, redeemDiscount) => {
    const discount = redeemDiscount ? 10 : get().cartDiscountPercent;
    set({
      customerName: customer.name,
      cartDiscountPercent: discount,
    });
    get().logAuditEvent('discount_high', `Applied ${customer.tier} Loyalty profile: ${customer.name} (${customer.points} pts)`);
  },

  triggerNoSaleDrawerOpen: (reason) => {
    const staff = get().currentUser?.name || 'Cashier';
    get().logAuditEvent('no_sale_drawer_open', `Drawer opened (No-Sale): ${reason} by ${staff}`);
  },

  // Checkout action
  checkout: (paymentMode, cashTendered, paymentReference, resume = false) => {
    const state = get();
    const { cartItems, orderType, tableNumber, customerName, guestCount, cartDiscountPercent, settings } = state;
    
    const outlet = state.connectedOutlet;
    const storageKey = outlet && pendingCheckoutKey(outlet.outletId, outlet.id);
    const pending = storageKey ? readPendingCheckout(window.localStorage, storageKey) : null;
    if (resume && !pending) throw new Error('Checkout already resolved. Review today’s orders.');
    if (pending && !resume) throw new Error('Resume the unfinished checkout first.');
    if (!pending && cartItems.length === 0) throw new Error('Add an item before checkout.');
    const taxResult = calculateCheckoutTotals(cartItems, cartDiscountPercent, settings,
      settings.stateCode ?? outlet?.stateCode ?? state.businesses.find((business) => business.id === state.activeBusinessId)?.stateCode);
    if (!pending && paymentMode === 'cash' && (!Number.isFinite(cashTendered) || cashTendered! < taxResult.grandTotal)) {
      throw new Error('Cash tendered must cover the full amount.');
    }
    if (outlet && storageKey) {
      const request = pending ?? {
        id: crypto.randomUUID(), items: cartItems, orderType, tableNumber,
        customerName, guestCount, discountPercent: cartDiscountPercent, paymentMode,
        cashTendered, paymentReference, expectedTotal: taxResult.grandTotal,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(request));
      const clearPending = () => {
        try {
          if (readPendingCheckout(window.localStorage, storageKey)?.id === request.id) window.localStorage.removeItem(storageKey);
        } catch {
          // The original checkout result is still valid if browser storage changed during the request.
        }
      };
      return orderService.checkout(outlet.outletId, request).then((order) => {
        clearPending();
        if (get().connectedOutlet?.outletId !== outlet.outletId || get().currentUser?.id !== outlet.id) return order;
        set({
          lastCreatedOrder: order, cartItems: [], cartDiscountPercent: 0,
          customerName: 'Guest', guestCount: 1, tableNumber: '', orderType: 'takeaway',
        });
        void updateRemoteWorkspace(outlet.outletId);
        return order;
      }, error => {
        if (error instanceof RequestRejected) clearPending();
        throw error;
      });
    }
    const now = new Date();
    const financialYear = getIndianFinancialYear(now).full.slice(2);
    const subtotal = taxResult.grossSubtotal;
    const discount = taxResult.discountTotal;
    const cgst = taxResult.cgstTotal;
    const sgst = taxResult.sgstTotal;
    const tax = taxResult.taxTotal;
    const total = taxResult.grandTotal;

    const nextSeq = settings.nextOrderSequence || 106;
    const invoiceSequence = settings.nextInvoiceSequence ?? 1;
    const prefix = settings.orderPrefix || 'Token #';
    const orderNumber = `${prefix}${nextSeq}`;

    let cashChange = 0;
    if (paymentMode === 'cash' && cashTendered) {
      cashChange = Math.max(0, Number((cashTendered - total).toFixed(2)));
    }

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      invoiceNumber: formatRule46InvoiceNumber("DINV/", invoiceSequence, financialYear),
      receiptSettings: { ...settings },
      posStateCode: state.businesses.find((business) => business.id === state.activeBusinessId)?.stateCode || settings.gstin?.slice(0, 2),
      gstRate: settings.isGstEnabled === false ? 0 : settings.gstRate,
      roundingAdjustment: taxResult.roundingAdjustment,
      type: orderType || 'takeaway',
      customerName: customerName || 'Guest',
      guestCount: guestCount || 1,
      tableNumber: (orderType === 'dine-in' || orderType === 'dine_in') ? tableNumber : undefined,
      items: [...cartItems],
      subtotal,
      discount,
      discountPercent: cartDiscountPercent,
      cgst,
      sgst,
      tax,
      total,
      paymentMode,
      paymentStatus: 'paid',
      cashTendered: paymentMode === 'cash' ? cashTendered : undefined,
      cashChange: paymentMode === 'cash' ? cashChange : undefined,
      paymentReference: paymentReference?.trim(),
      upiRef: paymentMode === 'upi' ? paymentReference?.trim() : undefined,
      cashierId: state.currentUser?.id || 'usr_priya',
      cashierName: state.currentUser?.name || 'Priya Sharma',
      status: 'preparing',
      createdAt: new Date().toISOString(),
    };

    // Create corresponding KDS ticket
    const ticketItems = cartItems.map((ci) => ({
      id: `ti_${ci.cartItemId}`,
      productId: ci.product.id,
      name: ci.product.name,
      quantity: ci.quantity,
      station: ci.product.station,
      modifiers: [...ci.selectedAddOns.map((a) => `+ ${a.item.name}`), ...(ci.specialInstructions ? [ci.specialInstructions] : [])],
      isReady: false,
    }));

    const newTicket: KdsTicket = {
      id: crypto.randomUUID(),
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderType: newOrder.type,
      customerName: newOrder.customerName,
      guestCount: newOrder.guestCount,
      tableNumber: newOrder.tableNumber,
      channel: newOrder.tableNumber ? 'Table Service' : 'Counter Express',
      targetMinutes: settings.kdsTargetMinutes || 12,
      createdAt: newOrder.createdAt,
      status: 'new',
      isRush: false,
      items: ticketItems,
    };

    const updatedOrders = [newOrder, ...state.orders];
    const updatedTickets = [newTicket, ...state.tickets];
    const updatedSettings = {
      ...settings,
      nextOrderSequence: nextSeq + 1,
      nextInvoiceSequence: invoiceSequence + 1,
      lastUsedPaymentMode: paymentMode,
    };

    set({
      orders: updatedOrders,
      tickets: updatedTickets,
      settings: updatedSettings,
      cartItems: [],
      cartDiscountPercent: 0,
      lastCreatedOrder: newOrder,
      customerName: 'Guest',
      guestCount: 1,
      tableNumber: '',
      orderType: 'takeaway',
    });

    persistState({
      orders: updatedOrders,
      tickets: updatedTickets,
      settings: updatedSettings,
    });

    return newOrder;
  },

  cancelOrder: (orderId, reason) => {
    if (get().connectedOutlet) throw new Error('Use a supervisor account to cancel a paid order.');
    const updatedOrders = get().orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'cancelled' as OrderStatus,
          cancelReason: reason,
        };
      }
      return o;
    });

    // Also remove from active KDS tickets if present
    const updatedTickets = get().tickets.filter((t) => t.orderId !== orderId);

    set({ orders: updatedOrders, tickets: updatedTickets });
    persistState({ orders: updatedOrders, tickets: updatedTickets });
  },

  refundOrder: (orderId, reason) => {
    const state = get();
    if (state.connectedOutlet) throw new Error('Use a supervisor account to record a refund.');
    const order = state.orders.find((candidate) => candidate.id === orderId);
    if (!order || order.paymentStatus !== 'paid' || order.status === 'cancelled') return;
    const seq = (state.settings.nextCreditNoteSequence ?? 1);
    const year = getIndianFinancialYear().full.slice(2);
    const orders = state.orders.map((candidate): Order => candidate.id === orderId ? {
      ...candidate,
      status: 'cancelled',
      paymentStatus: 'refunded',
      creditNoteNumber: formatRule46InvoiceNumber('DCN/', seq, year),
      cancelReason: reason,
      refundedAt: new Date().toISOString(),
    } : candidate);
    const tickets = state.tickets.filter((ticket) => ticket.orderId !== orderId);
    const settings = { ...state.settings, nextCreditNoteSequence: seq + 1 };
    set({ orders, tickets, settings });
    persistState({ orders, tickets, settings });
  },

  // KDS actions
  setActiveKdsStation: (station) => set({ activeKdsStation: station }),
  toggleKdsSound: () => set((s) => ({ kdsSoundEnabled: !s.kdsSoundEnabled })),
  setIsKdsLocked: (locked) => set({ isKdsLocked: locked }),

  advanceTicketStatus: (ticketId) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.ticket(outlet.outletId, ticketId, 'advance', get().tickets.find((ticket) => ticket.id === ticketId)?.status));
    const now = new Date().toISOString();
    const updatedTickets = get().tickets.map((t) => {
      if (t.id === ticketId) {
        if (t.status === 'new') {
          return { ...t, status: 'cooking' as KdsTicketStatus, cookingStartedAt: now };
        } else if (t.status === 'cooking') {
          return {
            ...t,
            status: 'ready' as KdsTicketStatus,
            readyAt: now,
            items: t.items.map((i) => ({ ...i, isReady: true })),
          };
        } else if (t.status === 'ready') {
          return { ...t, status: 'bumped' as KdsTicketStatus, bumpedAt: now };
        }
      }
      return t;
    });

    // If bumped or ready, also sync corresponding order status
    const targetTicket = updatedTickets.find((t) => t.id === ticketId);
    let updatedOrders = get().orders;
    if (targetTicket) {
      updatedOrders = updatedOrders.map((o) => {
        if (o.id === targetTicket.orderId && o.status !== 'cancelled') {
          return {
            ...o,
            status: targetTicket.status === 'bumped' ? 'completed' : targetTicket.status === 'ready' ? 'ready' : 'preparing',
            completedAt: targetTicket.status === 'bumped' ? now : o.completedAt,
          };
        }
        return o;
      });
    }

    set({ tickets: updatedTickets, orders: updatedOrders });
    persistState({ tickets: updatedTickets, orders: updatedOrders });
  },

  setTicketStatus: (ticketId, status) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.ticket(outlet.outletId, ticketId, 'status', status));
    const now = new Date().toISOString();
    const updatedTickets = get().tickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status,
          cookingStartedAt: status === 'cooking' ? now : t.cookingStartedAt,
          readyAt: status === 'ready' ? now : t.readyAt,
          bumpedAt: status === 'bumped' ? now : t.bumpedAt,
        };
      }
      return t;
    });

    const ticket = updatedTickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    const orders = get().orders.map((order): Order => order.id !== ticket.orderId || order.status === 'cancelled' ? order : {
      ...order,
      status: ticket.status === 'bumped' ? 'completed' : ticket.status === 'ready' ? 'ready' : 'preparing',
      completedAt: ticket.status === 'bumped' ? ticket.bumpedAt : undefined,
    });
    set({ tickets: updatedTickets, orders });
    persistState({ tickets: updatedTickets, orders });
  },

  toggleTicketItemReady: (ticketId, itemId) => {
    const outlet = get().connectedOutlet;
    if (outlet) {
      const item = get().tickets.find((ticket) => ticket.id === ticketId)?.items.find((item) => item.id === itemId);
      if (!item) return;
      return runRemoteUpdate(outlet.outletId, () => orderService.setTicketItemReady(outlet.outletId, ticketId, itemId, !item.isReady));
    }
    const updatedTickets = get().tickets.map((t): KdsTicket => {
      if (t.id === ticketId) {
        const updatedItems = t.items.map((item) =>
          item.id === itemId ? { ...item, isReady: !item.isReady } : item
        );
        const allItemsReady = updatedItems.every((i) => i.isReady);
        return {
          ...t,
          items: updatedItems,
          status: allItemsReady ? 'ready' : t.status === 'ready' ? 'cooking' : t.status,
          readyAt: allItemsReady ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    const ticket = updatedTickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    const orders = get().orders.map((order): Order => order.id !== ticket.orderId || order.status === 'cancelled' ? order : {
      ...order,
      status: ticket.status === 'bumped' ? 'completed' : ticket.status === 'ready' ? 'ready' : 'preparing',
      completedAt: ticket.status === 'bumped' ? ticket.bumpedAt : undefined,
    });
    set({ tickets: updatedTickets, orders });
    persistState({ tickets: updatedTickets, orders });
  },

  markTicketRush: (ticketId, isRush) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.ticket(outlet.outletId, ticketId, 'rush', String(isRush)));
    const updatedTickets = get().tickets.map((t) =>
      t.id === ticketId ? { ...t, isRush } : t
    );
    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
  },

  recallLastBumpedTicket: () => {
    const bumpedTickets = get()
      .tickets.filter((t) => t.status === 'bumped')
      .sort((a, b) => new Date(b.bumpedAt || 0).getTime() - new Date(a.bumpedAt || 0).getTime());

    if (bumpedTickets.length === 0) return null;
    const lastBumped = bumpedTickets[0];

    get().recallTicketById(lastBumped.id);
    return lastBumped;
  },

  recallTicketById: (ticketId) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.ticket(outlet.outletId, ticketId, 'recall'));
    const updatedTickets = get().tickets.map((t) =>
      t.id === ticketId ? { ...t, status: 'ready' as KdsTicketStatus, bumpedAt: undefined } : t
    );
    const ticket = updatedTickets.find((candidate) => candidate.id === ticketId);
    if (!ticket) return;
    const orders = get().orders.map((order): Order => order.id !== ticket.orderId || order.status === 'cancelled' ? order : {
      ...order,
      status: ticket.status === 'bumped' ? 'completed' : ticket.status === 'ready' ? 'ready' : 'preparing',
      completedAt: ticket.status === 'bumped' ? ticket.bumpedAt : undefined,
    });
    set({ tickets: updatedTickets, orders });
    persistState({ tickets: updatedTickets, orders });
  },

  addTicketPrepNote: (ticketId, note) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.ticket(outlet.outletId, ticketId, 'note', note));
    const updatedTickets = get().tickets.map((t) =>
      t.id === ticketId ? { ...t, prepNote: note } : t
    );
    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
  },

  // Shifts
  addCashMovement: (type, amount, reason) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.shift(outlet.outletId, type, amount, reason));
    const movement = {
      id: `mov_${Date.now()}`,
      type,
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };

    const currentShift = get().currentShift;
    const updatedShift: Shift = {
      ...currentShift,
      movements: [movement, ...currentShift.movements],
    };

    set({ currentShift: updatedShift });
    persistState({ currentShift: updatedShift });
  },

  updateShiftDenominations: (counts) => {
    const currentShift = get().currentShift;
    const countedTotal = Object.entries(counts).reduce(
      (sum, [denom, count]) => sum + Number(denom) * count,
      0
    );

    const cashInTotal = currentShift.movements
      .filter((m) => m.type === 'in')
      .reduce((sum, m) => sum + m.amount, 0);
    const cashOutTotal = currentShift.movements
      .filter((m) => m.type === 'out')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = currentShift.openingCash + currentShift.cashSales - (currentShift.cashRefunds ?? 0) + cashInTotal - cashOutTotal;
    const variance = countedTotal - expectedCash;

    const updatedShift: Shift = {
      ...currentShift,
      denominationCounts: counts,
      countedCash: countedTotal,
      expectedCash,
      variance,
    };

    set({ currentShift: updatedShift });
    persistState({ currentShift: updatedShift });
  },

  closeShift: (countedCash) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.shift(outlet.outletId, 'close', countedCash, undefined, get().currentShift.denominationCounts));
    const now = new Date().toISOString();
    const currentShift = get().currentShift;

    const cashInTotal = currentShift.movements
      .filter((m) => m.type === 'in')
      .reduce((sum, m) => sum + m.amount, 0);
    const cashOutTotal = currentShift.movements
      .filter((m) => m.type === 'out')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = currentShift.openingCash + currentShift.cashSales - (currentShift.cashRefunds ?? 0) + cashInTotal - cashOutTotal;
    const variance = countedCash - expectedCash;

    const closedShift: Shift = {
      ...currentShift,
      status: 'closed',
      endTime: now,
      countedCash,
      expectedCash,
      variance,
    };

    const updatedHistory = [closedShift, ...get().shiftHistory];
    set({ currentShift: closedShift, shiftHistory: updatedHistory });
    persistState({ currentShift: closedShift, shiftHistory: updatedHistory });
  },

  openNewShift: (openingCash) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.shift(outlet.outletId, 'open', openingCash));
    const now = new Date();
    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      shiftNumber: get().shiftHistory.length + 1,
      date: businessDate(now),
      cashierId: get().currentUser?.id || 'usr_priya',
      cashierName: get().currentUser?.name || 'Priya Sharma',
      startTime: now.toISOString(),
      status: 'open',
      openingCash,
      movements: [],
      denominationCounts: {},
      totalOrders: 0,
      cashSales: 0,
      cardSales: 0,
      upiSales: 0,
      grossSales: 0,
      totalDiscount: 0,
      totalTax: 0,
      refunds: 0,
    };

    set({ currentShift: newShift });
    persistState({ currentShift: newShift });
  },

  // Management actions
  updateProduct: (id, updates) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'product', { ...updates, id }));
    const updatedProducts = get().products.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    const saved = persistState({ products: updatedProducts });
    const operationalError = saved ? '' : 'Could not save the product in this browser. Check available storage or choose a smaller image.';
    set({ ...(saved && { products: updatedProducts }), operationalError });
    return saved;
  },

  addProduct: (newProd) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'product', newProd));
    const id = `prod_${crypto.randomUUID()}`;
    const product: Product = { ...newProd, id };
    const updatedProducts = [...get().products, product];
    const saved = persistState({ products: updatedProducts });
    const operationalError = saved ? '' : 'Could not save the product in this browser. Check available storage or choose a smaller image.';
    set({ ...(saved && { products: updatedProducts }), operationalError });
    return saved;
  },

  updateAddOnGroups: (groups) => {
    set({ addOnGroups: groups });
    persistState({ addOnGroups: groups });
  },

  addAddOnGroup: (group) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'group', group));
    const newGroup: AddOnGroup = {
      ...group,
      id: `grp_${Date.now()}`,
    };
    const updated = [...get().addOnGroups, newGroup];
    set({ addOnGroups: updated });
    persistState({ addOnGroups: updated });
  },

  addAddOnItemToGroup: (groupId, item) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'modifier', { ...item, groupId }));
    const newItem: AddOnItem = {
      ...item,
      id: `top_${Date.now()}`,
      isAvailable: true,
    };
    const updated = get().addOnGroups.map((g) => {
      if (g.id === groupId) {
        return { ...g, items: [...g.items, newItem] };
      }
      return g;
    });
    set({ addOnGroups: updated });
    persistState({ addOnGroups: updated });
  },

  updateAddOnItem: (groupId, item) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'modifier', { ...item, groupId }));
    const updated = get().addOnGroups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map((it) => (it.id === item.id ? item : it)),
        };
      }
      return g;
    });
    set({ addOnGroups: updated });
    persistState({ addOnGroups: updated });
  },

  deleteAddOnItem: (groupId, itemId) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'remove_modifier', { groupId, id: itemId }));
    const updated = get().addOnGroups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.filter((it) => it.id !== itemId),
        };
      }
      return g;
    });
    set({ addOnGroups: updated });
    persistState({ addOnGroups: updated });
  },

  toggleAddOnItemStock: (groupId, itemId) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'modifier', { groupId, id: itemId, isAvailable: get().addOnGroups.find((group) => group.id === groupId)?.items.find((item) => item.id === itemId)?.isAvailable === false }));
    const updated = get().addOnGroups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map((it) =>
            it.id === itemId
              ? { ...it, isAvailable: it.isAvailable === false ? true : false }
              : it
          ),
        };
      }
      return g;
    });
    set({ addOnGroups: updated });
    persistState({ addOnGroups: updated });
  },

  toggleProductAvailability: (id) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.catalog(outlet.outletId, 'availability', { id, isAvailable: !get().products.find((product) => product.id === id)?.isAvailable }));
    const updatedProducts = get().products.map((p) =>
      p.id === id ? { ...p, isAvailable: !p.isAvailable } : p
    );
    set({ products: updatedProducts });
    persistState({ products: updatedProducts });
  },

  updatePromoBanner: (active, percent, text) => {
    const updatedSettings = {
      ...get().settings,
      promoDiscountActive: active,
      promoDiscountPercent: percent,
      promoBannerText: text,
    };
    set({ settings: updatedSettings });
    persistState({ settings: updatedSettings });
  },

  addBusiness: (bizData) => {
    const bizId = (bizData as any).id || `biz_${Date.now()}`;
    const newBiz: BusinessTenant = {
      ...bizData,
      id: bizId,
      createdDate: new Date().toISOString().split('T')[0],
      ownerName: bizData.ownerName || `${bizData.brandName} Owner`,
      ownerEmail:
        bizData.ownerEmail ||
        `owner.${bizData.slug || bizId}@${
          bizData.brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'outlet'
        }.in`,
      ownerPassword: bizData.ownerPassword || 'password123',
      ownerPhone: bizData.ownerPhone || bizData.phone || '+91 98450 12345',
      ownerPin: bizData.ownerPin || '8888',
      legalEntityName: bizData.legalEntityName || bizData.brandName,
      stateCode: bizData.stateCode || '29',
      stateName: bizData.stateName || 'Karnataka',
      city: bizData.city || 'Bengaluru',
      pincode: bizData.pincode || '560001',
      upiVpaId: bizData.upiVpaId || `${bizData.slug || 'outlet'}@icici`,
      tableCount: bizData.tableCount || 12,
      kdsTargetMinutes: bizData.kdsTargetMinutes || 7,
      serviceChargePercent: bizData.serviceChargePercent || 0,
      isCompositionScheme: !!bizData.isCompositionScheme,
    };

    // Auto-create Owner User in users array
    const ownerInitials = (newBiz.ownerName || 'OW')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const ownerUser: User = {
      id: `usr_owner_${newBiz.id}`,
      name: newBiz.ownerName,
      role: 'owner',
      pin: newBiz.ownerPin || '8888',
      email: newBiz.ownerEmail,
      phone: newBiz.ownerPhone,
      avatarInitials: ownerInitials || 'OW',
      title: `${newBiz.brandName} Franchise Owner`,
      active: true,
    };

    // Auto-create Head Cashier User in users array
    const cashierUser: User = {
      id: `usr_cashier_${newBiz.id}`,
      name: `Cashier · ${newBiz.name}`,
      role: 'cashier',
      pin: '1234',
      email: `cashier.${newBiz.slug}@${newBiz.email.split('@')[1] || 'posbits.io'}`,
      avatarInitials: 'CA',
      title: 'Counter Cashier',
      active: true,
    };

    // Register owner credentials in authService
    authService.registerAccount({
      email: newBiz.ownerEmail,
      password: newBiz.ownerPassword || 'password123',
      role: 'owner',
      name: newBiz.ownerName,
      title: `${newBiz.brandName} Franchise Owner`,
      initials: ownerInitials,
      pin: newBiz.ownerPin || '8888',
      phone: newBiz.ownerPhone,
      outletId: newBiz.id,
    });

    const updatedBusinesses = [...get().businesses, newBiz];
    const updatedUsers = [
      ...get().users.filter((u) => u.email !== newBiz.ownerEmail),
      ownerUser,
      cashierUser,
    ];

    set({ businesses: updatedBusinesses, users: updatedUsers });
    persistState({ businesses: updatedBusinesses, users: updatedUsers });
  },

  updateBusiness: (id, updates) => {
    const updated = get().businesses.map((b) => (b.id === id ? { ...b, ...updates } : b));
    const targetBiz = updated.find((b) => b.id === id);

    let updatedUsers = [...get().users];
    if (targetBiz && (updates.ownerEmail || updates.ownerName || updates.ownerPassword || updates.ownerPin)) {
      const existingOwnerIdx = updatedUsers.findIndex(
        (u) => u.id === `usr_owner_${id}` || u.email === targetBiz.ownerEmail
      );
      const ownerInitials = (targetBiz.ownerName || 'OW')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const ownerUser: User = {
        id: `usr_owner_${id}`,
        name: targetBiz.ownerName || 'Franchise Owner',
        role: 'owner',
        pin: targetBiz.ownerPin || '8888',
        email: targetBiz.ownerEmail,
        phone: targetBiz.ownerPhone,
        avatarInitials: ownerInitials || 'OW',
        title: `${targetBiz.brandName} Franchise Owner`,
        active: true,
      };

      if (existingOwnerIdx >= 0) {
        updatedUsers[existingOwnerIdx] = ownerUser;
      } else {
        updatedUsers.push(ownerUser);
      }

      authService.registerAccount({
        email: targetBiz.ownerEmail,
        password: targetBiz.ownerPassword || 'password123',
        role: 'owner',
        name: targetBiz.ownerName,
        title: `${targetBiz.brandName} Franchise Owner`,
        initials: ownerInitials,
        pin: targetBiz.ownerPin || '8888',
        phone: targetBiz.ownerPhone,
        outletId: targetBiz.id,
      });
    }

    set({ businesses: updated, users: updatedUsers });
    persistState({ businesses: updated, users: updatedUsers });

    if (get().activeBusinessId === id && targetBiz) {
      const newSettings: Partial<SystemSettings> = {
        storeName: targetBiz.name,
        brandTagline: targetBiz.tagline || targetBiz.brandName,
        address: targetBiz.address,
        phone: targetBiz.phone,
        email: targetBiz.email,
        gstin: targetBiz.gstin,
        fssai: targetBiz.fssai,
        isGstEnabled: targetBiz.features.gstEnabled,
        gstRate: targetBiz.features.gstRate,
        cashTiming: targetBiz.features.cashTiming,
        receiptHeader: targetBiz.features.receiptHeader,
        receiptFooter: targetBiz.features.receiptFooter,
        wifiPassword: targetBiz.features.wifiPassword,
        autoPrintReceipt: targetBiz.features.autoPrintReceipt,
        upiVpaId: targetBiz.upiVpaId || get().settings.upiVpaId,
        kdsTargetMinutes: targetBiz.kdsTargetMinutes || get().settings.kdsTargetMinutes,
      };
      get().updateSettings(newSettings);
    }
  },

  deleteBusiness: (id) => {
    const remaining = get().businesses.filter((b) => b.id !== id);
    if (remaining.length === 0) return;
    const newActiveId = get().activeBusinessId === id ? remaining[0].id : get().activeBusinessId;
    set({ businesses: remaining, activeBusinessId: newActiveId });
    persistState({ businesses: remaining, activeBusinessId: newActiveId });
    if (get().activeBusinessId === id) {
      get().switchActiveBusiness(newActiveId);
    }
  },

  switchActiveBusiness: (id) => {
    if (get().connectedOutlet) return;
    const targetBiz = get().businesses.find((b) => b.id === id);
    if (!targetBiz) return;

    const current = get();
    if (current.activeBusinessId !== id) {
      demoOutletRecords.set(current.activeBusinessId, {
        orders: current.orders, tickets: current.tickets, settings: current.settings,
        currentShift: current.currentShift, shiftHistory: current.shiftHistory, heldOrders: current.heldOrders,
      });
      safeStorage.setItem('tikkit_demo_outlets', JSON.stringify(Object.fromEntries(demoOutletRecords)));
      const target = demoOutletRecords.get(id) ?? {
        orders: [], tickets: [], shiftHistory: [], heldOrders: [], settings: INITIAL_SETTINGS,
        currentShift: {
          ...initial.currentShift, id: crypto.randomUUID(), status: 'closed' as const,
          openingCash: 0, movements: [], denominationCounts: {}, totalOrders: 0, cashSales: 0,
          cardSales: 0, upiSales: 0, grossSales: 0, totalDiscount: 0, totalTax: 0, refunds: 0,
        },
      };
      set({ ...target, activeBusinessId: id, lastCreatedOrder: null, cartItems: [] });
      persistState({ ...target, activeBusinessId: id });
    }

    const newSettings: Partial<SystemSettings> = {
      storeName: targetBiz.name,
      brandTagline: targetBiz.tagline || targetBiz.brandName,
      address: targetBiz.address,
      phone: targetBiz.phone,
      email: targetBiz.email,
      gstin: targetBiz.gstin,
      fssai: targetBiz.fssai,
      isGstEnabled: targetBiz.features.gstEnabled,
      gstRate: targetBiz.features.gstRate,
      cashTiming: targetBiz.features.cashTiming,
      receiptHeader: targetBiz.features.receiptHeader,
      receiptFooter: targetBiz.features.receiptFooter,
      wifiPassword: targetBiz.features.wifiPassword,
      autoPrintReceipt: targetBiz.features.autoPrintReceipt,
      upiVpaId: targetBiz.upiVpaId || get().settings.upiVpaId,
      kdsTargetMinutes: targetBiz.kdsTargetMinutes || get().settings.kdsTargetMinutes,
    };
    get().updateSettings(newSettings);

    // If current logged in user is an owner or cashier, switch currentUser to this business's staff
    const staff = get().currentUser;
    if (staff && staff.role !== 'admin') {
      const matchStaff = get().users.find(
        (u) =>
          (u.email === targetBiz.ownerEmail && staff.role === 'owner') ||
          (u.id === `usr_${staff.role}_${id}`)
      );
      if (matchStaff) {
        set({ currentUser: matchStaff });
      }
    }
  },

  launchAsOwner: (businessId: string) => {
    const targetBiz = get().businesses.find((b) => b.id === businessId);
    if (!targetBiz) {
      return { success: false, targetRoute: '/login' };
    }

    // Switch active business to this outlet
    get().switchActiveBusiness(businessId);

    // Find or create owner user
    let ownerUser = get().users.find(
      (u) => u.email === targetBiz.ownerEmail || u.id === `usr_owner_${businessId}`
    );
    if (!ownerUser) {
      const ownerInitials = (targetBiz.ownerName || 'OW')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      ownerUser = {
        id: `usr_owner_${businessId}`,
        name: targetBiz.ownerName || `${targetBiz.brandName} Owner`,
        role: 'owner',
        pin: targetBiz.ownerPin || '8888',
        email: targetBiz.ownerEmail,
        phone: targetBiz.ownerPhone,
        avatarInitials: ownerInitials || 'OW',
        title: `${targetBiz.brandName} Franchise Owner`,
        active: true,
      };

      const updatedUsers = [...get().users, ownerUser];
      set({ users: updatedUsers });
      persistState({ users: updatedUsers });
    }

    // Register account in authService so subsequent logins succeed
    authService.registerAccount({
      email: targetBiz.ownerEmail,
      password: targetBiz.ownerPassword || 'password123',
      role: 'owner',
      name: targetBiz.ownerName,
      title: `${targetBiz.brandName} Franchise Owner`,
      pin: targetBiz.ownerPin || '8888',
      phone: targetBiz.ownerPhone,
      outletId: businessId,
    });

    set({ currentUser: ownerUser, currentRole: 'owner' });

    return { success: true, targetRoute: '/owner' };
  },

  seedSalesDemoData: (businessId) => {
    const targetBiz = get().businesses.find((b) => b.id === businessId);
    if (!targetBiz) return;

    const freshOrders = generateHistoricalOrders(get().products);
    const { orders: todayOrders, tickets } = generateTodayOrders(get().products);
    const allOrders = [...todayOrders, ...freshOrders];

    set({ orders: allOrders, tickets });
    persistState({ orders: allOrders, tickets });
  },

  addStaff: (user) => {
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}`,
    };
    const updatedUsers = [...get().users, newUser];
    set({ users: updatedUsers });
    persistState({ users: updatedUsers });
  },

  updateStaff: (id, updates) => {
    const updatedUsers = get().users.map((u) =>
      u.id === id ? { ...u, ...updates } : u
    );
    set({ users: updatedUsers });
    persistState({ users: updatedUsers });
  },

  resetStaffPin: (id, newPin) => {
    const updatedUsers = get().users.map((u) =>
      u.id === id ? { ...u, pin: newPin } : u
    );
    set({ users: updatedUsers });
    persistState({ users: updatedUsers });
  },

  toggleStaffStatus: (id) => {
    const updatedUsers = get().users.map((u) =>
      u.id === id ? { ...u, active: !u.active } : u
    );
    set({ users: updatedUsers });
    persistState({ users: updatedUsers });
  },

  requestApproval: (req) => {
    const approval: ApprovalRequest = {
      ...req,
      id: `app_${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    const updatedApprovals = [approval, ...get().approvals];
    set({ approvals: updatedApprovals });
    persistState({ approvals: updatedApprovals });
  },

  resolveApproval: (id, status, reviewer, note) => {
    const updatedApprovals = get().approvals.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status,
          reviewedBy: reviewer,
          reviewedAt: new Date().toISOString(),
          reviewNote: note,
        };
      }
      return a;
    });
    set({ approvals: updatedApprovals });
    persistState({ approvals: updatedApprovals });
  },

  setKitchenAlert: (alert) => {
    set({ kitchenAlert: alert });
    persistState({ kitchenAlert: alert });
  },

  quickToggle86Item: (productId) => {
    if (get().connectedOutlet) return get().toggleProductAvailability(productId);
    get().toggleProductAvailability(productId);
    const prod = get().products.find((p) => p.id === productId);
    get().logAuditEvent(
      'stock_86',
      `Stock status changed: ${prod?.name || productId} is now ${prod?.isAvailable ? 'Out of Stock' : 'In Stock'}`
    );
  },

  addPettyCashExpense: (expense) => {
    const newExp: PettyCashExpense = {
      ...expense,
      id: `pet_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newExp, ...get().pettyCashExpenses];
    set({ pettyCashExpenses: updated });
    persistState({ pettyCashExpenses: updated });
    get().logAuditEvent('shift_audit', `Petty cash disbursement: ₹${expense.amount} for ${expense.reason}`);
  },

  addWasteLogItem: (item) => {
    const newWaste: WasteLogItem = {
      ...item,
      id: `wst_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newWaste, ...get().wasteLog];
    set({ wasteLog: updated });
    persistState({ wasteLog: updated });
    get().logAuditEvent('stock_86', `Logged food waste: ${item.quantity}x ${item.productName} (₹${item.estimatedCost})`);
  },

  updateStaffAttendanceStatus: (id, status) => {
    const updated = get().staffAttendance.map((a) => (a.id === id ? { ...a, status } : a));
    set({ staffAttendance: updated });
    persistState({ staffAttendance: updated });
  },

  logAuditEvent: (type, description, metadata) => {
    const newEvt: AuditLogEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      description,
      staffName: get().currentUser?.name || 'Staff',
      timestamp: new Date().toISOString(),
      metadata,
    };
    const updated = [newEvt, ...get().auditLog.slice(0, 49)];
    set({ auditLog: updated });
    persistState({ auditLog: updated });
  },

  // Settings & System
  updateSettings: (partial) => {
    const outlet = get().connectedOutlet;
    if (outlet) return runRemoteUpdate(outlet.outletId, () => orderService.settings(outlet.outletId, partial));
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    persistState({ settings: updated });
  },

  toggleOfflineSimulated: () => {
    const updated = {
      ...get().settings,
      isSimulatedOffline: !get().settings.isSimulatedOffline,
    };
    set({ settings: updated });
    persistState({ settings: updated });
  },

  togglePrinterSimulated: () => {
    const updated = {
      ...get().settings,
      isSimulatedPrinterDown: !get().settings.isSimulatedPrinterDown,
    };
    set({ settings: updated });
    persistState({ settings: updated });
  },

  resetDemoData: () => {
    if (get().connectedOutlet) return;
    safeStorage.removeItem(STORAGE_KEY);
    const fresh = getDefaultInitialData();
    set({
      users: fresh.users,
      settings: fresh.settings,
      categories: fresh.categories,
      products: fresh.products,
      addOnGroups: fresh.addOnGroups,
      orders: fresh.orders,
      tickets: fresh.tickets,
      currentShift: fresh.currentShift,
      shiftHistory: [],
      approvals: fresh.approvals,
      heldOrders: fresh.heldOrders,
      loyaltyCustomers: fresh.loyaltyCustomers,
      pettyCashExpenses: fresh.pettyCashExpenses,
      wasteLog: fresh.wasteLog,
      staffAttendance: fresh.staffAttendance,
      kitchenAlert: null,
      auditLog: fresh.auditLog,
      cartItems: [],
      lastCreatedOrder: null,
    });
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_UPDATE' });
    }
  },
}));

// Safe client-side rehydration from localStorage to prevent Next.js SSR hydration mismatches
export function rehydrateStoreFromStorage() {
  if (typeof window === 'undefined') return;
  const saved = safeStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    safeStorage.removeItem('pos_dynamic_accounts_v2');
    const storedOutlets = safeStorage.getItem('tikkit_demo_outlets');
    if (storedOutlets) {
      for (const [id, records] of Object.entries(JSON.parse(storedOutlets) as Record<string, DemoOutletRecords>)) {
        demoOutletRecords.set(id, records);
      }
    }
    if (Array.isArray(parsed.businesses)) {
      parsed.businesses = parsed.businesses.map((business: BusinessTenant) => ({
        ...INITIAL_BUSINESSES.find((seed) => seed.id === business.id),
        ...business,
        ownerPassword: undefined,
        ownerPin: undefined,
      }));
    }
    if (Array.isArray(parsed.users)) {
      parsed.users = parsed.users.map((user: User) => ({ ...user, pin: '' }));
    }
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    useAppStore.setState({
      ...(parsed.users && { users: parsed.users }),
      ...(parsed.settings && { settings: parsed.settings }),
      ...(parsed.businesses && { businesses: parsed.businesses }),
      ...(parsed.activeBusinessId && { activeBusinessId: parsed.activeBusinessId }),
      ...(parsed.categories && { categories: parsed.categories }),
      ...(parsed.products && { products: parsed.products }),
      ...(parsed.addOnGroups && { addOnGroups: parsed.addOnGroups }),
      ...(parsed.orders && { orders: parsed.orders }),
      ...(parsed.tickets && { tickets: parsed.tickets }),
      ...(parsed.currentShift && { currentShift: parsed.currentShift }),
      ...(parsed.shiftHistory && { shiftHistory: parsed.shiftHistory }),
      ...(parsed.approvals && { approvals: parsed.approvals }),
      ...(parsed.heldOrders && { heldOrders: parsed.heldOrders }),
      ...(parsed.loyaltyCustomers && { loyaltyCustomers: parsed.loyaltyCustomers }),
      ...(parsed.pettyCashExpenses && { pettyCashExpenses: parsed.pettyCashExpenses }),
      ...(parsed.wasteLog && { wasteLog: parsed.wasteLog }),
      ...(parsed.staffAttendance && { staffAttendance: parsed.staffAttendance }),
      ...(parsed.kitchenAlert !== undefined && { kitchenAlert: parsed.kitchenAlert }),
      ...(parsed.auditLog && { auditLog: parsed.auditLog }),
    });
  } catch (e) {
    console.error('Failed to rehydrate store from localStorage:', e);
  }
}

// Listen to multi-tab sync messages
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (!useAppStore.getState().connectedOutlet && event.data?.type === 'SYNC_UPDATE') {
      rehydrateStoreFromStorage();
    }
  };
}


let latestWorkspaceRequest = 0;

export function activateOutletWorkspace(access: OutletAccess) {
  const state = useAppStore.getState();
  if (state.connectedOutlet?.outletId === access.outletId && state.currentUser?.id === access.id) return;
  latestWorkspaceRequest += 1;
  useAppStore.setState({
    connectedOutlet: access, activeBusinessId: access.outletId, currentUser: access, currentRole: access.role,
    operationalError: '', users: [access], businesses: [], orders: [], tickets: [], products: [],
    categories: [], addOnGroups: [], approvals: [], shiftHistory: [], auditLog: [], heldOrders: [],
    loyaltyCustomers: [], pettyCashExpenses: [], wasteLog: [], staffAttendance: [], kitchenAlert: null,
    settings: emptyOutletSettings(), currentShift: emptyOutletShift(access), cartItems: [],
    lastCreatedOrder: null, cartDiscountPercent: 0, customerName: 'Guest', guestCount: 1, tableNumber: '', orderType: 'takeaway',
  });
}

function emptyOutletSettings(): SystemSettings {
  return {
    ...INITIAL_SETTINGS, storeName: '', brandTagline: '', address: '', phone: '', email: '', gstin: '', fssai: '',
    receiptHeader: '', receiptFooter: '', logoUrl: '', wifiPassword: '', showWifiOnReceipt: false,
    upiVpaId: '', upiId: undefined, isGstEnabled: false, autoPrintReceipt: false,
    isSimulatedOffline: false, isSimulatedPrinterDown: false, lastUsedPaymentMode: undefined,
    defaultPaymentMode: 'cash', nextOrderSequence: 1, activeCashierName: '', promoDiscountActive: false,
  };
}

function emptyOutletShift(access: OutletAccess): Shift {
  return {
    id: '', shiftNumber: 0, date: businessDate(), cashierId: access.id, cashierName: access.name,
    startTime: '', status: 'closed', openingCash: 0, movements: [], denominationCounts: {},
    totalOrders: 0, cashSales: 0, cardSales: 0, upiSales: 0, grossSales: 0, totalDiscount: 0,
    totalTax: 0, refunds: 0, cashRefunds: 0,
  };
}

export async function refreshOutletWorkspace(outletId: string) {
  const request = ++latestWorkspaceRequest;
  const workspace = await orderService.workspace(outletId);
  const state = useAppStore.getState();
  if (request !== latestWorkspaceRequest || state.connectedOutlet?.outletId !== outletId) return;
  const [latest, ...history] = workspace.shifts;
  const shift = latest?.id === state.currentShift.id
    ? { ...latest, denominationCounts: latest.status === 'open' ? state.currentShift.denominationCounts : latest.denominationCounts }
    : latest ?? emptyOutletShift(state.connectedOutlet);
  useAppStore.setState({
    settings: { ...emptyOutletSettings(), ...workspace.settings },
    categories: workspace.categories,
    products: workspace.products.filter((product) => workspace.categories.some((category) => category.id === product.categoryId)),
    addOnGroups: workspace.addOnGroups,
    orders: workspace.orders, tickets: workspace.tickets, currentShift: shift,
    users: workspace.users.length ? workspace.users : [state.connectedOutlet],
    shiftHistory: latest?.status === 'closed' ? workspace.shifts : history,
  });
}

async function updateRemoteWorkspace(outletId: string) {
  try {
    await refreshOutletWorkspace(outletId);
  } catch (error) {
    useAppStore.setState({ operationalError: error instanceof Error ? error.message : 'Could not refresh the outlet.' });
  }
}

async function runRemoteUpdate(outletId: string, action: () => Promise<void>): Promise<boolean> {
  useAppStore.setState({ operationalError: '' });
  try {
    await action();
    await updateRemoteWorkspace(outletId);
    return true;
  } catch (error) {
    useAppStore.setState({ operationalError: error instanceof Error ? error.message : 'Could not save the change.' });
    return false;
  }
}
