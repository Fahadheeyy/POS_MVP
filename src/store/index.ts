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
} from '../types';
import menuJson from '../../public/assets/menu.json';
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
} from '../data/seedData';

const STORAGE_KEY = 'sign_laban_pos_v2';
const SYNC_CHANNEL_NAME = 'sign_laban_sync';

interface StoreState {
  // Current session
  currentUser: User | null;
  currentRole: Role;
  
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
  checkout: (paymentMode: PaymentMode, cashTendered?: number) => Order;
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
  addCashMovement: (type: 'in' | 'out', amount: number, reason: string) => void;
  updateShiftDenominations: (counts: { [denom: number]: number }) => void;
  closeShift: (countedCash: number) => void;
  openNewShift: (openingCash: number) => void;
  signOffShift: (shiftId: string, managerPin: string, notes: string) => boolean;

  // Actions - Management
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateAddOnGroups: (groups: AddOnGroup[]) => void;
  addAddOnGroup: (group: Omit<AddOnGroup, 'id'>) => void;
  addAddOnItemToGroup: (groupId: string, item: Omit<AddOnItem, 'id'>) => void;
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
  seedSalesDemoData: (businessId: string) => void;

  // Actions - Settings & System
  updateSettings: (partial: Partial<SystemSettings>) => void;
  toggleOfflineSimulated: () => void;
  togglePrinterSimulated: () => void;
  resetDemoData: () => void;
}

// Initialize seed data
function getInitialData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }

  const menuProducts: Product[] = menuJson.products as Product[];
  const categories: Category[] = menuJson.categories as Category[];
  const addOnGroups: AddOnGroup[] = menuJson.addOnGroups as AddOnGroup[];
  const historicalOrders = generateHistoricalOrders(menuProducts);
  const { orders: todayOrders, tickets, shift, approvals } = generateTodayOrders(menuProducts);

  const initialData = {
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
}

// Broadcast channel for multi-tab synchronization
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
}

function persistState(state: Partial<StoreState>) {
  const currentSaved = localStorage.getItem(STORAGE_KEY);
  let parsed: any = {};
  if (currentSaved) {
    try { parsed = JSON.parse(currentSaved); } catch (e) {}
  }
  
  const updated = {
    ...parsed,
    users: state.users ?? parsed.users,
    settings: state.settings ?? parsed.settings,
    businesses: state.businesses ?? parsed.businesses,
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'SYNC_UPDATE' });
  }
}

const initial = getInitialData();

export const useAppStore = create<StoreState>((set, get) => ({
  currentUser: initial.users.find((u: User) => u.role === 'cashier') || initial.users[0],
  currentRole: 'cashier',

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
  orderType: 'dine-in',
  tableNumber: 'T-16',
  customerName: 'Jesselyn',
  guestCount: 2,
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
    set({ currentUser: null });
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
      const newQty = existing.quantity + quantity;
      updatedCart[existingIndex] = {
        ...existing,
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
          const newQty = item.quantity + delta;
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
  checkout: (paymentMode, cashTendered) => {
    const state = get();
    const { cartItems, orderType, tableNumber, customerName, guestCount, cartDiscountPercent, settings } = state;
    
    const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = Math.round((subtotal * cartDiscountPercent) / 100);
    const taxableAmount = Math.max(0, subtotal - discount);

    const isGstEnabled = settings.isGstEnabled !== false;
    const gstRate = isGstEnabled ? (settings.gstRate ?? 5) : 0;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;

    const cgst = isGstEnabled ? Number(((taxableAmount * cgstRate) / 100).toFixed(2)) : 0;
    const sgst = isGstEnabled ? Number(((taxableAmount * sgstRate) / 100).toFixed(2)) : 0;
    const tax = Number((cgst + sgst).toFixed(2));
    const total = Number((taxableAmount + tax).toFixed(2));

    const nextSeq = settings.nextOrderSequence || 106;
    const prefix = settings.orderPrefix || 'Token #';
    const orderNumber = `${prefix}${nextSeq}`;

    let cashChange = 0;
    if (paymentMode === 'cash' && cashTendered) {
      cashChange = Math.max(0, Number((cashTendered - total).toFixed(2)));
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      type: 'takeaway',
      customerName: customerName || 'Guest',
      guestCount: 1,
      tableNumber: undefined,
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
      upiRef: paymentMode === 'upi' ? `UPI${Date.now().toString().slice(-6)}` : undefined,
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
      modifiers: ci.selectedAddOns.map((a) => `+ ${a.item.name}`),
      isReady: false,
    }));

    const newTicket: KdsTicket = {
      id: `tkt_${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderType: newOrder.type,
      customerName: newOrder.customerName,
      guestCount: newOrder.guestCount,
      tableNumber: newOrder.tableNumber,
      channel: 'Counter Express',
      targetMinutes: settings.kdsTargetMinutes || 12,
      createdAt: newOrder.createdAt,
      status: 'new',
      isRush: false,
      items: ticketItems,
    };

    // Update Shift Totals
    const currentShift = state.currentShift;
    const updatedShift: Shift = {
      ...currentShift,
      totalOrders: currentShift.totalOrders + 1,
      cashSales: currentShift.cashSales + (paymentMode === 'cash' ? total : 0),
      cardSales: currentShift.cardSales + (paymentMode === 'card' ? total : 0),
      upiSales: currentShift.upiSales + (paymentMode === 'upi' ? total : 0),
      grossSales: currentShift.grossSales + total,
      totalDiscount: currentShift.totalDiscount + discount,
      totalTax: currentShift.totalTax + tax,
    };

    const updatedOrders = [newOrder, ...state.orders];
    const updatedTickets = [newTicket, ...state.tickets];
    const updatedSettings = {
      ...settings,
      nextOrderSequence: nextSeq + 1,
      lastUsedPaymentMode: paymentMode,
    };

    set({
      orders: updatedOrders,
      tickets: updatedTickets,
      currentShift: updatedShift,
      settings: updatedSettings,
      cartItems: [],
      cartDiscountPercent: 0,
      lastCreatedOrder: newOrder,
    });

    persistState({
      orders: updatedOrders,
      tickets: updatedTickets,
      currentShift: updatedShift,
      settings: updatedSettings,
    });

    return newOrder;
  },

  cancelOrder: (orderId, reason) => {
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
    const updatedOrders = get().orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'cancelled' as OrderStatus,
          paymentStatus: 'refunded' as const,
          cancelReason: reason,
        };
      }
      return o;
    });

    const targetOrder = get().orders.find((o) => o.id === orderId);
    let updatedShift = get().currentShift;
    if (targetOrder) {
      updatedShift = {
        ...updatedShift,
        refunds: updatedShift.refunds + targetOrder.total,
        grossSales: Math.max(0, updatedShift.grossSales - targetOrder.total),
      };
    }

    set({ orders: updatedOrders, currentShift: updatedShift });
    persistState({ orders: updatedOrders, currentShift: updatedShift });
  },

  // KDS actions
  setActiveKdsStation: (station) => set({ activeKdsStation: station }),
  toggleKdsSound: () => set((s) => ({ kdsSoundEnabled: !s.kdsSoundEnabled })),
  setIsKdsLocked: (locked) => set({ isKdsLocked: locked }),

  advanceTicketStatus: (ticketId) => {
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
        if (o.id === targetTicket.orderId) {
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

    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
  },

  toggleTicketItemReady: (ticketId, itemId) => {
    const updatedTickets = get().tickets.map((t) => {
      if (t.id === ticketId) {
        const updatedItems = t.items.map((item) =>
          item.id === itemId ? { ...item, isReady: !item.isReady } : item
        );
        const allItemsReady = updatedItems.every((i) => i.isReady);
        return {
          ...t,
          items: updatedItems,
          status: allItemsReady ? ('ready' as KdsTicketStatus) : t.status,
          readyAt: allItemsReady ? new Date().toISOString() : t.readyAt,
        };
      }
      return t;
    });

    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
  },

  markTicketRush: (ticketId, isRush) => {
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

    const updatedTickets = get().tickets.map((t) =>
      t.id === lastBumped.id ? { ...t, status: 'ready' as KdsTicketStatus, bumpedAt: undefined } : t
    );

    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
    return lastBumped;
  },

  recallTicketById: (ticketId) => {
    const updatedTickets = get().tickets.map((t) =>
      t.id === ticketId ? { ...t, status: 'ready' as KdsTicketStatus, bumpedAt: undefined } : t
    );
    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
  },

  addTicketPrepNote: (ticketId, note) => {
    const updatedTickets = get().tickets.map((t) =>
      t.id === ticketId ? { ...t, prepNote: note } : t
    );
    set({ tickets: updatedTickets });
    persistState({ tickets: updatedTickets });
  },

  // Shifts
  addCashMovement: (type, amount, reason) => {
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

    const expectedCash = currentShift.openingCash + currentShift.cashSales + cashInTotal - cashOutTotal;
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
    const now = new Date().toISOString();
    const currentShift = get().currentShift;

    const cashInTotal = currentShift.movements
      .filter((m) => m.type === 'in')
      .reduce((sum, m) => sum + m.amount, 0);
    const cashOutTotal = currentShift.movements
      .filter((m) => m.type === 'out')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = currentShift.openingCash + currentShift.cashSales + cashInTotal - cashOutTotal;
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
    const now = new Date();
    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      shiftNumber: get().shiftHistory.length + 1,
      date: now.toISOString().split('T')[0],
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
    const updatedProducts = get().products.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    set({ products: updatedProducts });
    persistState({ products: updatedProducts });
  },

  addProduct: (newProd) => {
    const id = `prod_${Date.now()}`;
    const product: Product = { ...newProd, id };
    const updatedProducts = [...get().products, product];
    set({ products: updatedProducts });
    persistState({ products: updatedProducts });
  },

  updateAddOnGroups: (groups) => {
    set({ addOnGroups: groups });
    persistState({ addOnGroups: groups });
  },

  addAddOnGroup: (group) => {
    const newGroup: AddOnGroup = {
      ...group,
      id: `grp_${Date.now()}`,
    };
    const updated = [...get().addOnGroups, newGroup];
    set({ addOnGroups: updated });
    persistState({ addOnGroups: updated });
  },

  addAddOnItemToGroup: (groupId, item) => {
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
    const newBiz: BusinessTenant = {
      ...bizData,
      id: `biz_${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
    };
    const updated = [...get().businesses, newBiz];
    set({ businesses: updated });
    persistState({ businesses: updated });
  },

  updateBusiness: (id, updates) => {
    const updated = get().businesses.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ businesses: updated });
    persistState({ businesses: updated });

    if (get().activeBusinessId === id) {
      const activeBiz = updated.find((b) => b.id === id);
      if (activeBiz) {
        const newSettings: Partial<SystemSettings> = {
          storeName: activeBiz.name,
          brandTagline: activeBiz.tagline || activeBiz.brandName,
          address: activeBiz.address,
          phone: activeBiz.phone,
          email: activeBiz.email,
          gstin: activeBiz.gstin,
          fssai: activeBiz.fssai,
          isGstEnabled: activeBiz.features.gstEnabled,
          gstRate: activeBiz.features.gstRate,
          cashTiming: activeBiz.features.cashTiming,
          receiptHeader: activeBiz.features.receiptHeader,
          receiptFooter: activeBiz.features.receiptFooter,
          wifiPassword: activeBiz.features.wifiPassword,
          autoPrintReceipt: activeBiz.features.autoPrintReceipt,
        };
        get().updateSettings(newSettings);
      }
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
    const targetBiz = get().businesses.find((b) => b.id === id);
    if (!targetBiz) return;

    set({ activeBusinessId: id });
    persistState({ activeBusinessId: id });

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
    };
    get().updateSettings(newSettings);
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
    get().toggleProductAvailability(productId);
    const prod = get().products.find((p) => p.id === productId);
    get().logAuditEvent(
      'stock_86',
      `Stock status changed: ${prod?.name || productId} is now ${prod?.isAvailable ? 'Out of Stock' : 'In Stock'}`
    );
  },

  signOffShift: (shiftId, managerPin, notes) => {
    if (managerPin !== '9999') return false;
    get().logAuditEvent('shift_audit', `Manager Shift Sign-Off & Audit by Alex Rivera: ${notes}`);
    return true;
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
    localStorage.removeItem(STORAGE_KEY);
    const fresh = getInitialData();
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

// Listen to multi-tab sync messages
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'SYNC_UPDATE') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          useAppStore.setState({
            users: parsed.users,
            settings: parsed.settings,
            categories: parsed.categories,
            products: parsed.products,
            addOnGroups: parsed.addOnGroups,
            orders: parsed.orders,
            tickets: parsed.tickets,
            currentShift: parsed.currentShift,
            shiftHistory: parsed.shiftHistory,
            approvals: parsed.approvals,
            heldOrders: parsed.heldOrders,
            loyaltyCustomers: parsed.loyaltyCustomers,
            pettyCashExpenses: parsed.pettyCashExpenses,
            wasteLog: parsed.wasteLog,
            staffAttendance: parsed.staffAttendance,
            kitchenAlert: parsed.kitchenAlert,
            auditLog: parsed.auditLog,
          });
        } catch (e) {
          console.error('Error synchronizing store across tabs:', e);
        }
      }
    }
  };
}

