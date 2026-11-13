export type Role = 'cashier' | 'kitchen' | 'manager' | 'owner' | 'admin';

export interface BusinessTenant {
  id: string;
  name: string;
  brandName: string;
  slug: string;
  tagline?: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  fssai: string;
  currency: string;
  currencySymbol: string;
  planTier: 'trial' | 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'trial' | 'suspended';
  createdDate: string;
  renewalDate: string;
  themeColor: string;
  logoUrl?: string;

  features: {
    kdsEnabled: boolean;
    gstEnabled: boolean;
    gstRate: number;
    addOnsEnabled: boolean;
    autoPrintReceipt: boolean;
    cashTiming: 'before' | 'after';
    enabledPayments: {
      cash: boolean;
      upi: boolean;
      card: boolean;
    };
    loyaltyEnabled: boolean;
    tableManagement: boolean;
    receiptHeader?: string;
    receiptFooter?: string;
    wifiPassword?: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string; // 4-digit PIN for staff/cashier/kitchen, or manager PIN
  email?: string;
  avatarInitials: string;
  title: string;
  active: boolean;
  phone?: string;
}

export type Station = 'All stations' | 'Grill' | 'Fry' | 'Cold' | 'Expo';

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  isDefault?: boolean;
  isAvailable?: boolean;
}

export interface AddOnGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  items: AddOnItem[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  image: string;
  isPopular?: boolean;
  isHighlyRated?: boolean;
  discountPercent?: number;
  description: string;
  station: 'Grill' | 'Fry' | 'Cold' | 'Expo';
  isAvailable: boolean;
  addOnGroupIds: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface SelectedAddOn {
  groupId: string;
  groupName: string;
  item: AddOnItem;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedAddOns: SelectedAddOn[];
  specialInstructions?: string;
  unitPrice: number;
  lineTotal: number;
}

export type OrderType = 'dine-in' | 'takeaway';
export type PaymentMode = 'cash' | 'card' | 'upi';
export type PaymentStatus = 'paid' | 'pending' | 'refunded';
export type OrderStatus = 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string; // e.g. T-16 or #332
  type: OrderType;
  customerName: string;
  guestCount: number;
  tableNumber?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountPercent?: number;
  cgst: number;
  sgst: number;
  tax: number;
  total: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  cashTendered?: number;
  cashChange?: number;
  upiRef?: string;
  cashierId: string;
  cashierName: string;
  status: OrderStatus;
  createdAt: string; // ISO string
  completedAt?: string;
  cancelReason?: string;
  notes?: string;
}

export type KdsTicketStatus = 'new' | 'cooking' | 'ready' | 'bumped';

export interface KdsTicketItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  station: 'Grill' | 'Fry' | 'Cold' | 'Expo';
  modifiers: string[];
  isReady: boolean;
}

export interface KdsTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  customerName: string;
  guestCount: number;
  tableNumber?: string;
  channel: string; // 'POS', 'Swiggy', 'Zomato', 'Takeaway'
  courierInfo?: string;
  targetMinutes: number;
  createdAt: string; // ISO string
  cookingStartedAt?: string;
  readyAt?: string;
  bumpedAt?: string;
  status: KdsTicketStatus;
  isRush: boolean;
  allergyNote?: string;
  prepNote?: string;
  items: KdsTicketItem[];
}

export interface CashMovement {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  shiftNumber: number;
  date: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingCash: number;
  movements: CashMovement[];
  denominationCounts: { [denom: number]: number };
  countedCash?: number;
  expectedCash?: number;
  variance?: number; // counted - expected
  totalOrders: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  grossSales: number;
  totalDiscount: number;
  totalTax: number;
  refunds: number;
}

export interface ApprovalRequest {
  id: string;
  type: 'refund' | 'void' | 'discount';
  orderId: string;
  orderNumber: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface SystemSettings {
  storeName: string;
  brandTagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  fssai: string;
  gstRate: number; // e.g. 5 for restaurant
  isTaxInclusive: boolean;
  receiptHeader: string;
  receiptFooter: string;
  showGstinOnReceipt: boolean;
  showWifiOnReceipt: boolean;
  wifiPassword: string;
  receiptPrinterConnected: boolean;
  kitchenPrinterConnected: boolean;
  printerModel: string;
  kdsTargetMinutes: number;
  soundAlertsEnabled: boolean;
  autoLockMinutes: number;
  requireStaffPin: boolean;
  enabledPayments: {
    cash: boolean;
    card: boolean;
    upi: boolean;
  };
  upiVpaId: string;
  upiId?: string;
  orderPrefix: string;
  nextOrderSequence: number;
  isSimulatedOffline: boolean;
  isSimulatedPrinterDown: boolean;
  promoDiscountActive: boolean;
  promoDiscountPercent: number;
  promoBannerText: string;
  isGstEnabled?: boolean;
  autoPrintReceipt?: boolean;
  // Setup & Payment Flow Preferences
  isSetupCompleted?: boolean;
  defaultPaymentMode?: 'cash' | 'upi' | 'card';
  cashTiming?: 'before' | 'after';
  lastUsedPaymentMode?: PaymentMode;
  activeCashierName?: string;
}

// Specialized Role Extension Types

export interface HeldOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  guestCount: number;
  tableNumber: string;
  orderType: OrderType;
  cartItems: CartItem[];
  cartDiscountPercent: number;
  note?: string;
  heldAt: string;
}

export interface CustomerLoyalty {
  id: string;
  phone: string;
  name: string;
  points: number;
  tier: 'Regular' | 'Silver' | 'Gold' | 'VIP';
  visitsCount: number;
  favoriteItem: string;
  lastVisit: string;
}

export interface PettyCashExpense {
  id: string;
  category: 'Produce & Veg' | 'Dairy & Bread' | 'Packaging & Ice' | 'Repairs & Maint' | 'Logistics & Tips' | 'Staff Tea/Welfare';
  amount: number;
  paidTo: string;
  receiptNo?: string;
  reason: string;
  approvedBy: string;
  timestamp: string;
}

export interface WasteLogItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  estimatedCost: number;
  reason: 'Burnt during rush' | 'Prep shelf-life expired' | 'Dropped / Spilled' | 'Quality rejection';
  loggedBy: string;
  station: string;
  timestamp: string;
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  role: Role;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  status: 'clocked-in' | 'on-break' | 'clocked-out';
  hoursWorked: number;
}

export interface RecipeSpec {
  productId: string;
  productName: string;
  prepTimeSecs: number;
  cookTemp?: string;
  pattyWeightGrams?: number;
  station: 'Grill' | 'Fry' | 'Cold' | 'Expo';
  allergens: string[];
  assemblySteps: string[];
}

export interface KitchenAlert {
  id: string;
  station: string;
  message: string;
  delayMinutes: number;
  active: boolean;
  createdAt: string;
}

export interface AuditLogEvent {
  id: string;
  type: 'no_sale_drawer_open' | 'price_override' | 'discount_high' | 'order_void' | 'pin_reset' | 'stock_86' | 'shift_audit';
  description: string;
  staffName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}


