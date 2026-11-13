import {
  User,
  BusinessTenant,
  SystemSettings,
  Product,
  Category,
  AddOnGroup,
  Order,
  KdsTicket,
  Shift,
  ApprovalRequest,
  HeldOrder,
  CustomerLoyalty,
  PettyCashExpense,
  WasteLogItem,
  StaffAttendance,
  RecipeSpec,
  AuditLogEvent,
} from '../types';

export const INITIAL_BUSINESSES: BusinessTenant[] = [
  {
    id: 'biz_sign_laban_indiranagar',
    name: 'Sign Laban · Indiranagar',
    brandName: 'Sign Laban',
    slug: 'sign-laban-blr',
    tagline: "India's First Egyptian Dessert Brand",
    category: 'Dessert QSR',
    address: '12th Main Rd, Indiranagar, Bengaluru, KA 560038',
    phone: '+91 80 4123 4567',
    email: 'indiranagar@signlaban.in',
    gstin: '29AABCS1429B1Z8',
    fssai: '11223334000123',
    currency: 'INR',
    currencySymbol: '₹',
    planTier: 'growth',
    status: 'active',
    createdDate: '2026-01-15',
    renewalDate: '2027-01-15',
    themeColor: '#556475',
    logoUrl: '/assets/products/sign_laban/Qashtuta_Classic.png',
    features: {
      kdsEnabled: true,
      gstEnabled: true,
      gstRate: 5,
      addOnsEnabled: true,
      autoPrintReceipt: true,
      cashTiming: 'before',
      enabledPayments: { cash: true, upi: true, card: true },
      loyaltyEnabled: true,
      tableManagement: true,
      receiptHeader: 'Welcome to Sign Laban Indiranagar!',
      receiptFooter: 'Thank you for visiting! Follow @signlaban',
      wifiPassword: 'SignLabanGuest2026',
    },
  },
  {
    id: 'biz_sign_laban_koramangala',
    name: 'Sign Laban · Koramangala',
    brandName: 'Sign Laban',
    slug: 'sign-laban-kora',
    tagline: 'Cloud Kitchen & Express Counter',
    category: 'Express QSR',
    address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru, KA 560034',
    phone: '+91 80 4123 7890',
    email: 'koramangala@signlaban.in',
    gstin: '29AABCS1429B1Z8',
    fssai: '11223334000124',
    currency: 'INR',
    currencySymbol: '₹',
    planTier: 'starter',
    status: 'active',
    createdDate: '2026-02-01',
    renewalDate: '2027-02-01',
    themeColor: '#059669',
    logoUrl: '/assets/products/sign_laban/UmmAli_Lotus.png',
    features: {
      kdsEnabled: true,
      gstEnabled: true,
      gstRate: 5,
      addOnsEnabled: true,
      autoPrintReceipt: true,
      cashTiming: 'before',
      enabledPayments: { cash: true, upi: true, card: true },
      loyaltyEnabled: false,
      tableManagement: false,
      receiptHeader: 'Sign Laban Koramangala Express',
      receiptFooter: 'Order direct for catering: hello@signlaban.in',
      wifiPassword: 'SignLabanKora2026',
    },
  },
  {
    id: 'biz_keventers_demo',
    name: 'Keventers · Brigade Road',
    brandName: 'Keventers',
    slug: 'keventers-demo',
    tagline: 'Iconic Dairy Shakes & Sundaes',
    category: 'Beverages & Dessert',
    address: 'Brigade Rd, Ashok Nagar, Bengaluru, KA 560001',
    phone: '+91 80 4987 6543',
    email: 'brigaderoad@keventers.demo',
    gstin: '29AAACK5512L1Z4',
    fssai: '11223334000888',
    currency: 'INR',
    currencySymbol: '₹',
    planTier: 'trial',
    status: 'trial',
    createdDate: '2026-03-01',
    renewalDate: '2026-04-01',
    themeColor: '#d97706',
    logoUrl: '/assets/products/sign_laban/SAANKORITA.png',
    features: {
      kdsEnabled: false,
      gstEnabled: true,
      gstRate: 5,
      addOnsEnabled: true,
      autoPrintReceipt: true,
      cashTiming: 'before',
      enabledPayments: { cash: true, upi: true, card: true },
      loyaltyEnabled: true,
      tableManagement: false,
      receiptHeader: 'Keventers Brigade Road · The Original Milkshake',
      receiptFooter: 'Keep the glass bottle! Recyclable & vintage.',
      wifiPassword: 'KeventersFreeWiFi',
    },
  },
  {
    id: 'biz_belgian_waffle_demo',
    name: 'The Belgian Waffle Co · Phoenix Mall',
    brandName: 'The Belgian Waffle Co',
    slug: 'bwc-phoenix',
    tagline: 'Warm Waf-wiches & Crispy Delights',
    category: 'Bakery & Waffles',
    address: 'Whitefield Main Rd, Mahadevapura, Bengaluru 560048',
    phone: '+91 80 6720 0000',
    email: 'phoenix@belgianwaffle.demo',
    gstin: '29AABCT8844M1Z9',
    fssai: '11223334000999',
    currency: 'INR',
    currencySymbol: '₹',
    planTier: 'enterprise',
    status: 'active',
    createdDate: '2026-01-10',
    renewalDate: '2027-01-10',
    themeColor: '#7c3aed',
    logoUrl: '/assets/products/sign_laban/Lotus.png',
    features: {
      kdsEnabled: true,
      gstEnabled: true,
      gstRate: 5,
      addOnsEnabled: true,
      autoPrintReceipt: true,
      cashTiming: 'before',
      enabledPayments: { cash: true, upi: true, card: true },
      loyaltyEnabled: true,
      tableManagement: false,
      receiptHeader: 'The Belgian Waffle Co · Warm & Freshly Baked',
      receiptFooter: 'Visit us online: thebelgianwaffle.co',
      wifiPassword: 'WafflePhoenix2026',
    },
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Dev & Sales Operations',
    role: 'admin',
    pin: '0000',
    avatarInitials: 'AD',
    title: 'Platform Super Admin & Solutions Architect',
    active: true,
    email: 'admin@posbits.io',
    phone: '+91 99000 00000',
  },
  {
    id: 'usr_jesselyn',
    name: 'Jesselyn Tan',
    role: 'kitchen',
    pin: '1111',
    avatarInitials: 'JE',
    title: 'Kitchen Lead',
    active: true,
    email: 'jesselyn@signlaban.in',
    phone: '+91 98765 43210',
  },
  {
    id: 'usr_priya',
    name: 'Priya Sharma',
    role: 'cashier',
    pin: '1234',
    avatarInitials: 'PR',
    title: 'Head Cashier',
    active: true,
    email: 'priya@signlaban.in',
    phone: '+91 98765 43211',
  },
  {
    id: 'usr_marcus',
    name: 'Marcus Chen',
    role: 'kitchen',
    pin: '2222',
    avatarInitials: 'MA',
    title: 'Kitchen Staff · Fry/Grill',
    active: true,
    email: 'marcus@signlaban.in',
    phone: '+91 98765 43212',
  },
  {
    id: 'usr_alex',
    name: 'Alex Rivera',
    role: 'manager',
    pin: '9999',
    avatarInitials: 'AL',
    title: 'Shift & Store Manager',
    active: true,
    email: 'alex@signlaban.in',
    phone: '+91 98765 43213',
  },
  {
    id: 'usr_vikram',
    name: 'Vikram Sethi',
    role: 'owner',
    pin: '8888',
    avatarInitials: 'VI',
    title: 'Franchise Owner',
    active: true,
    email: 'vikram@signlaban.in',
    phone: '+91 98765 43214',
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  storeName: 'Sign Laban',
  brandTagline: "India's First Egyptian Dessert",
  logoUrl: '/assets/sign-laban-logo.png',
  address: 'Shop 12, 100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
  phone: '+91 80 4958 2211',
  email: 'hello@signlaban.in',
  gstin: '29AABCS1429B1Z8',
  fssai: '11224333000542',
  gstRate: 5, // 5% GST for standalone restaurants without ITC
  isTaxInclusive: false,
  receiptHeader: "SIGN LABAN\nIndia's First Egyptian Dessert\nBengaluru, KA · Ph: +91 80 4958 2211",
  receiptFooter: "Thank you for visiting Sign Laban!\nFollow us @signlaban on Instagram\nFor franchise & catering: hello@signlaban.in",
  showGstinOnReceipt: true,
  showWifiOnReceipt: true,
  wifiPassword: 'SignLabanGuest2026',
  receiptPrinterConnected: true,
  kitchenPrinterConnected: true,
  printerModel: 'EPSON TM-T88VII Thermal Printer',
  kdsTargetMinutes: 6,
  soundAlertsEnabled: true,
  autoLockMinutes: 5,
  requireStaffPin: true,
  enabledPayments: {
    cash: true,
    card: true,
    upi: true,
  },
  upiVpaId: 'signlaban@icici',
  orderPrefix: 'Token #',
  nextOrderSequence: 106,
  isSimulatedOffline: false,
  isSimulatedPrinterDown: false,
  promoDiscountActive: true,
  promoDiscountPercent: 15,
  promoBannerText: "SIGN LABAN SPECIAL: 15% OFF ON VIRAL DESSERT COMBOS & BOWLS",
  // Initial Setup Defaults
  isGstEnabled: true,
  autoPrintReceipt: true,
  isSetupCompleted: true,
  defaultPaymentMode: 'upi',
  cashTiming: 'before',
  lastUsedPaymentMode: 'upi',
  activeCashierName: 'Priya Sharma',
};

// Generate 30 days of historical realistic order data
export function generateHistoricalOrders(menuProducts: Product[]): Order[] {
  const orders: Order[] = [];
  const now = new Date();
  
  // Seed random deterministic generator
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const paymentModes: ('upi' | 'card' | 'cash')[] = ['upi', 'upi', 'upi', 'card', 'card', 'cash'];
  const customerNames = [
    'Rahul Verma', 'Sneha Patel', 'Ananya Gupta', 'Karan Mehta', 'Rohan Iyer',
    'Aditi Sharma', 'Tanvi Desai', 'Aman Nair', 'Pooja Rao', 'Vikram Malhotra',
    'Nikhil Joshi', 'Deepa Swaminathan', 'Siddharth Roy', 'Neha Kapoor', 'Arjun Das'
  ];

  let seq = 1000;

  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);

    // 25 - 40 orders per day for viral dessert QSR
    const dailyCount = Math.floor(25 + pseudoRandom() * 15);

    for (let i = 0; i < dailyCount; i++) {
      seq++;
      // Hours concentrated around evening/night rush (16 - 23)
      const isNight = pseudoRandom() > 0.35;
      const hour = isNight
        ? Math.floor(17 + pseudoRandom() * 6)
        : Math.floor(13 + pseudoRandom() * 4);
      const minute = Math.floor(pseudoRandom() * 60);

      const orderTime = new Date(targetDate);
      orderTime.setHours(hour, minute, 0, 0);

      const customer = customerNames[Math.floor(pseudoRandom() * customerNames.length)];
      const paymentMode = paymentModes[Math.floor(pseudoRandom() * paymentModes.length)];

      // Pick 1 to 3 items
      const itemCount = Math.floor(1 + pseudoRandom() * 3);
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = menuProducts[Math.floor(pseudoRandom() * menuProducts.length)];
        const qty = pseudoRandom() > 0.85 ? 2 : 1;
        const lineTotal = product.price * qty;
        subtotal += lineTotal;

        items.push({
          cartItemId: `hist_${seq}_${j}`,
          product,
          quantity: qty,
          selectedAddOns: [],
          unitPrice: product.price,
          lineTotal,
        });
      }

      const discountPercent = pseudoRandom() > 0.8 ? 10 : 0;
      const discount = Math.round((subtotal * discountPercent) / 100);
      const taxable = subtotal - discount;
      const cgst = Number(((taxable * 2.5) / 100).toFixed(2));
      const sgst = Number(((taxable * 2.5) / 100).toFixed(2));
      const tax = Number((cgst + sgst).toFixed(2));
      const total = Number((taxable + tax).toFixed(2));

      const isCancelled = pseudoRandom() < 0.02;

      orders.push({
        id: `ord_hist_${seq}`,
        orderNumber: `Token #${seq}`,
        type: 'takeaway',
        customerName: customer,
        guestCount: 1,
        items,
        subtotal,
        discount,
        discountPercent,
        cgst,
        sgst,
        tax,
        total,
        paymentMode,
        paymentStatus: isCancelled ? 'refunded' : 'paid',
        cashierId: 'usr_priya',
        cashierName: 'Priya Sharma',
        status: isCancelled ? 'cancelled' : 'completed',
        createdAt: orderTime.toISOString(),
        completedAt: new Date(orderTime.getTime() + 6 * 60000).toISOString(),
        cancelReason: isCancelled ? 'Customer requested cancellation (Changed mind)' : undefined,
      });
    }
  }

  return orders;
}

// Today's initial orders for Sign Laban
export function generateTodayOrders(menuProducts: Product[]): { orders: Order[]; tickets: KdsTicket[]; shift: Shift; approvals: ApprovalRequest[] } {
  const getProd = (id: string) => menuProducts.find(p => p.id === id) || menuProducts[0];
  const baseTime = new Date();
  const todayStr = baseTime.toISOString().split('T')[0];

  const pQashtuta = getProd('prod_qashtuta_pistachio');
  const pUmmAli = getProd('prod_umm_ali_pistachio_lotus');
  const pSaankorita = getProd('prod_saankorita');
  const pBomb = getProd('prod_bomb');
  const pAseerathulNutella = getProd('prod_aseerathul_nutella');
  const pAseerathulPistachio = getProd('prod_aseerathul_pistachio');
  const pLouaPistachio = getProd('prod_loua_pistachio');
  const pKoushiri = getProd('prod_koushiri_pistachio');
  const pBambooza = getProd('prod_bambooza_pistachio');
  const pMango = getProd('prod_mango_shake');

  // Token #105 (New - Counter)
  const ord105: Order = {
    id: 'ord_105',
    orderNumber: 'Token #105',
    type: 'takeaway',
    customerName: 'Priya S.',
    guestCount: 1,
    items: [
      { cartItemId: 'item_105_1', product: pQashtuta, quantity: 1, selectedAddOns: [], unitPrice: pQashtuta.price, lineTotal: pQashtuta.price },
      { cartItemId: 'item_105_2', product: pAseerathulNutella, quantity: 1, selectedAddOns: [], unitPrice: pAseerathulNutella.price, lineTotal: pAseerathulNutella.price },
    ],
    subtotal: pQashtuta.price + pAseerathulNutella.price,
    discount: 0,
    cgst: Number((((pQashtuta.price + pAseerathulNutella.price) * 2.5) / 100).toFixed(2)),
    sgst: Number((((pQashtuta.price + pAseerathulNutella.price) * 2.5) / 100).toFixed(2)),
    tax: Number((((pQashtuta.price + pAseerathulNutella.price) * 5) / 100).toFixed(2)),
    total: Number(((pQashtuta.price + pAseerathulNutella.price) * 1.05).toFixed(2)),
    paymentMode: 'upi',
    paymentStatus: 'paid',
    cashierId: 'usr_priya',
    cashierName: 'Priya Sharma',
    status: 'preparing',
    createdAt: new Date(baseTime.getTime() - 2 * 60000).toISOString(),
  };

  // Token #104 (New - Counter)
  const ord104: Order = {
    id: 'ord_104',
    orderNumber: 'Token #104',
    type: 'takeaway',
    customerName: 'Ananya G.',
    guestCount: 1,
    items: [
      { cartItemId: 'item_104_1', product: pBomb, quantity: 1, selectedAddOns: [], unitPrice: pBomb.price, lineTotal: pBomb.price },
      { cartItemId: 'item_104_2', product: pUmmAli, quantity: 1, selectedAddOns: [], unitPrice: pUmmAli.price, lineTotal: pUmmAli.price },
    ],
    subtotal: pBomb.price + pUmmAli.price,
    discount: 0,
    cgst: Number((((pBomb.price + pUmmAli.price) * 2.5) / 100).toFixed(2)),
    sgst: Number((((pBomb.price + pUmmAli.price) * 2.5) / 100).toFixed(2)),
    tax: Number((((pBomb.price + pUmmAli.price) * 5) / 100).toFixed(2)),
    total: Number(((pBomb.price + pUmmAli.price) * 1.05).toFixed(2)),
    paymentMode: 'card',
    paymentStatus: 'paid',
    cashierId: 'usr_priya',
    cashierName: 'Priya Sharma',
    status: 'preparing',
    createdAt: new Date(baseTime.getTime() - 4 * 60000).toISOString(),
  };

  // Token #103 (Cooking / Plating - Counter)
  const ord103: Order = {
    id: 'ord_103',
    orderNumber: 'Token #103',
    type: 'takeaway',
    customerName: 'Rohan I.',
    guestCount: 1,
    items: [
      { cartItemId: 'item_103_1', product: pSaankorita, quantity: 1, selectedAddOns: [], unitPrice: pSaankorita.price, lineTotal: pSaankorita.price },
      { cartItemId: 'item_103_2', product: pLouaPistachio, quantity: 1, selectedAddOns: [], unitPrice: pLouaPistachio.price, lineTotal: pLouaPistachio.price },
    ],
    subtotal: pSaankorita.price + pLouaPistachio.price,
    discount: 0,
    cgst: Number((((pSaankorita.price + pLouaPistachio.price) * 2.5) / 100).toFixed(2)),
    sgst: Number((((pSaankorita.price + pLouaPistachio.price) * 2.5) / 100).toFixed(2)),
    tax: Number((((pSaankorita.price + pLouaPistachio.price) * 5) / 100).toFixed(2)),
    total: Number(((pSaankorita.price + pLouaPistachio.price) * 1.05).toFixed(2)),
    paymentMode: 'cash',
    paymentStatus: 'paid',
    cashTendered: 1000,
    cashChange: 349,
    cashierId: 'usr_priya',
    cashierName: 'Priya Sharma',
    status: 'preparing',
    createdAt: new Date(baseTime.getTime() - 6 * 60000).toISOString(),
  };

  // Token #102 (Ready for Pickup)
  const ord102: Order = {
    id: 'ord_102',
    orderNumber: 'Token #102',
    type: 'takeaway',
    customerName: 'Devika R.',
    guestCount: 1,
    items: [
      { cartItemId: 'item_102_1', product: pKoushiri, quantity: 2, selectedAddOns: [], unitPrice: pKoushiri.price, lineTotal: pKoushiri.price * 2 },
      { cartItemId: 'item_102_2', product: pMango, quantity: 1, selectedAddOns: [], unitPrice: pMango.price, lineTotal: pMango.price },
    ],
    subtotal: pKoushiri.price * 2 + pMango.price,
    discount: 0,
    cgst: Number((((pKoushiri.price * 2 + pMango.price) * 2.5) / 100).toFixed(2)),
    sgst: Number((((pKoushiri.price * 2 + pMango.price) * 2.5) / 100).toFixed(2)),
    tax: Number((((pKoushiri.price * 2 + pMango.price) * 5) / 100).toFixed(2)),
    total: Number(((pKoushiri.price * 2 + pMango.price) * 1.05).toFixed(2)),
    paymentMode: 'upi',
    paymentStatus: 'paid',
    cashierId: 'usr_priya',
    cashierName: 'Priya Sharma',
    status: 'ready',
    createdAt: new Date(baseTime.getTime() - 10 * 60000).toISOString(),
  };

  // Token #101 (Ready for Pickup)
  const ord101: Order = {
    id: 'ord_101',
    orderNumber: 'Token #101',
    type: 'takeaway',
    customerName: 'Kabir M.',
    guestCount: 1,
    items: [
      { cartItemId: 'item_101_1', product: pBambooza, quantity: 1, selectedAddOns: [], unitPrice: pBambooza.price, lineTotal: pBambooza.price },
      { cartItemId: 'item_101_2', product: pAseerathulPistachio, quantity: 1, selectedAddOns: [], unitPrice: pAseerathulPistachio.price, lineTotal: pAseerathulPistachio.price },
    ],
    subtotal: pBambooza.price + pAseerathulPistachio.price,
    discount: 0,
    cgst: Number((((pBambooza.price + pAseerathulPistachio.price) * 2.5) / 100).toFixed(2)),
    sgst: Number((((pBambooza.price + pAseerathulPistachio.price) * 2.5) / 100).toFixed(2)),
    tax: Number((((pBambooza.price + pAseerathulPistachio.price) * 5) / 100).toFixed(2)),
    total: Number(((pBambooza.price + pAseerathulPistachio.price) * 1.05).toFixed(2)),
    paymentMode: 'upi',
    paymentStatus: 'paid',
    cashierId: 'usr_priya',
    cashierName: 'Priya Sharma',
    status: 'ready',
    createdAt: new Date(baseTime.getTime() - 12 * 60000).toISOString(),
  };

  // Completed Orders Token #95 - #100
  const completedOrders: Order[] = [
    {
      id: 'ord_100',
      orderNumber: 'Token #100',
      type: 'takeaway',
      customerName: 'Sameer K.',
      guestCount: 1,
      items: [
        { cartItemId: 'c_100_1', product: pQashtuta, quantity: 2, selectedAddOns: [], unitPrice: pQashtuta.price, lineTotal: pQashtuta.price * 2 },
      ],
      subtotal: pQashtuta.price * 2,
      discount: 0,
      cgst: 16.0,
      sgst: 16.0,
      tax: 32.0,
      total: 672.0,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      cashierId: 'usr_priya',
      cashierName: 'Priya Sharma',
      status: 'completed',
      createdAt: new Date(baseTime.getTime() - 25 * 60000).toISOString(),
      completedAt: new Date(baseTime.getTime() - 18 * 60000).toISOString(),
    },
    {
      id: 'ord_99',
      orderNumber: 'Token #99',
      type: 'takeaway',
      customerName: 'Nisha B.',
      guestCount: 1,
      items: [
        { cartItemId: 'c_99_1', product: pSaankorita, quantity: 1, selectedAddOns: [], unitPrice: pSaankorita.price, lineTotal: pSaankorita.price },
        { cartItemId: 'c_99_2', product: pAseerathulPistachio, quantity: 1, selectedAddOns: [], unitPrice: pAseerathulPistachio.price, lineTotal: pAseerathulPistachio.price },
      ],
      subtotal: pSaankorita.price + pAseerathulPistachio.price,
      discount: 0,
      cgst: 15.0,
      sgst: 15.0,
      tax: 30.0,
      total: 630.0,
      paymentMode: 'card',
      paymentStatus: 'paid',
      cashierId: 'usr_priya',
      cashierName: 'Priya Sharma',
      status: 'completed',
      createdAt: new Date(baseTime.getTime() - 40 * 60000).toISOString(),
      completedAt: new Date(baseTime.getTime() - 32 * 60000).toISOString(),
    },
    {
      id: 'ord_98',
      orderNumber: 'Token #98',
      type: 'takeaway',
      customerName: 'Aditya P.',
      guestCount: 1,
      items: [
        { cartItemId: 'c_98_1', product: pBomb, quantity: 2, selectedAddOns: [], unitPrice: pBomb.price, lineTotal: pBomb.price * 2 },
      ],
      subtotal: pBomb.price * 2,
      discount: 0,
      cgst: 19.0,
      sgst: 19.0,
      tax: 38.0,
      total: 798.0,
      paymentMode: 'upi',
      paymentStatus: 'paid',
      cashierId: 'usr_priya',
      cashierName: 'Priya Sharma',
      status: 'completed',
      createdAt: new Date(baseTime.getTime() - 55 * 60000).toISOString(),
      completedAt: new Date(baseTime.getTime() - 46 * 60000).toISOString(),
    },
  ];

  const allTodayOrders = [ord105, ord104, ord103, ord102, ord101, ...completedOrders];

  // KDS Tickets
  const tickets: KdsTicket[] = [
    {
      id: 'tkt_105',
      orderId: ord105.id,
      orderNumber: 'Token #105',
      orderType: 'takeaway',
      customerName: 'Priya S.',
      guestCount: 1,
      channel: 'Counter Express',
      targetMinutes: 6,
      createdAt: ord105.createdAt,
      status: 'new',
      isRush: false,
      items: [
        { id: 'ti_105_1', productId: pQashtuta.id, name: pQashtuta.name, quantity: 1, station: 'Cold', modifiers: ['Pack cold with spoon'], isReady: false },
        { id: 'ti_105_2', productId: pAseerathulNutella.id, name: pAseerathulNutella.name, quantity: 1, station: 'Cold', modifiers: ['Chilled bottle'], isReady: false },
      ],
    },
    {
      id: 'tkt_104',
      orderId: ord104.id,
      orderNumber: 'Token #104',
      orderType: 'takeaway',
      customerName: 'Ananya G.',
      guestCount: 1,
      channel: 'Counter Express',
      targetMinutes: 6,
      createdAt: ord104.createdAt,
      status: 'new',
      isRush: true,
      items: [
        { id: 'ti_104_1', productId: pBomb.id, name: pBomb.name, quantity: 1, station: 'Grill', modifiers: ['Extra warm chocolate lava'], isReady: false },
        { id: 'ti_104_2', productId: pUmmAli.id, name: pUmmAli.name, quantity: 1, station: 'Grill', modifiers: ['Warm freshly baked'], isReady: false },
      ],
    },
    {
      id: 'tkt_103',
      orderId: ord103.id,
      orderNumber: 'Token #103',
      orderType: 'takeaway',
      customerName: 'Rohan I.',
      guestCount: 1,
      channel: 'Counter Express',
      targetMinutes: 6,
      createdAt: ord103.createdAt,
      status: 'cooking',
      isRush: false,
      items: [
        { id: 'ti_103_1', productId: pSaankorita.id, name: pSaankorita.name, quantity: 1, station: 'Cold', modifiers: ['Lotus drizzle & pistachio'], isReady: false },
        { id: 'ti_103_2', productId: pLouaPistachio.id, name: pLouaPistachio.name, quantity: 1, station: 'Fry', modifiers: ['Hot crispy bites'], isReady: false },
      ],
    },
    {
      id: 'tkt_102',
      orderId: ord102.id,
      orderNumber: 'Token #102',
      orderType: 'takeaway',
      customerName: 'Devika R.',
      guestCount: 1,
      channel: 'Counter Express',
      targetMinutes: 6,
      createdAt: ord102.createdAt,
      status: 'ready',
      isRush: false,
      items: [
        { id: 'ti_102_1', productId: pKoushiri.id, name: pKoushiri.name, quantity: 2, station: 'Cold', modifiers: ['Toasted kunafa top'], isReady: true },
        { id: 'ti_102_2', productId: pMango.id, name: pMango.name, quantity: 1, station: 'Cold', modifiers: ['Fresh Alphonso'], isReady: true },
      ],
    },
    {
      id: 'tkt_101',
      orderId: ord101.id,
      orderNumber: 'Token #101',
      orderType: 'takeaway',
      customerName: 'Kabir M.',
      guestCount: 1,
      channel: 'Counter Express',
      targetMinutes: 6,
      createdAt: ord101.createdAt,
      status: 'ready',
      isRush: false,
      items: [
        { id: 'ti_101_1', productId: pBambooza.id, name: pBambooza.name, quantity: 1, station: 'Cold', modifiers: ['Double pistachio'], isReady: true },
        { id: 'ti_101_2', productId: pAseerathulPistachio.id, name: pAseerathulPistachio.name, quantity: 1, station: 'Cold', modifiers: ['Chilled bottle'], isReady: true },
      ],
    },
  ];

  const shift: Shift = {
    id: `shift_${todayStr}_1`,
    shiftNumber: 1,
    date: todayStr,
    cashierId: 'usr_priya',
    cashierName: 'Priya Sharma',
    startTime: new Date(baseTime.getTime() - 4 * 3600000).toISOString(),
    status: 'open',
    openingCash: 5000,
    movements: [
      {
        id: 'mov_1',
        type: 'in',
        amount: 500,
        reason: 'Additional change coins & small notes',
        timestamp: new Date(baseTime.getTime() - 3 * 3600000).toISOString(),
      },
    ],
    denominationCounts: {
      500: 6,
      200: 5,
      100: 8,
      50: 4,
      20: 0,
      10: 0,
    },
    totalOrders: allTodayOrders.length,
    cashSales: allTodayOrders.filter(o => o.paymentMode === 'cash').reduce((sum, o) => sum + o.total, 0),
    cardSales: allTodayOrders.filter(o => o.paymentMode === 'card').reduce((sum, o) => sum + o.total, 0),
    upiSales: allTodayOrders.filter(o => o.paymentMode === 'upi').reduce((sum, o) => sum + o.total, 0),
    grossSales: allTodayOrders.reduce((sum, o) => sum + o.total, 0),
    totalDiscount: allTodayOrders.reduce((sum, o) => sum + o.discount, 0),
    totalTax: allTodayOrders.reduce((sum, o) => sum + o.tax, 0),
    refunds: 0,
  };

  const approvals: ApprovalRequest[] = [
    {
      id: 'app_1',
      type: 'refund',
      orderId: 'ord_100',
      orderNumber: 'Token #100',
      amount: 672.0,
      reason: 'Guest ordered wrong flavor (wanted Pistachio instead of Lotus)',
      requestedBy: 'Priya Sharma',
      requestedAt: new Date(baseTime.getTime() - 15 * 60000).toISOString(),
      status: 'pending',
    },
  ];

  return { orders: allTodayOrders, tickets, shift, approvals };
}

// Specialized Seed Datasets

export const INITIAL_HELD_ORDERS: HeldOrder[] = [
  {
    id: 'hold_331',
    orderNumber: '#331',
    customerName: 'Rahul Verma',
    guestCount: 2,
    tableNumber: 'T-04',
    orderType: 'takeaway',
    cartItems: [
      {
        cartItemId: 'c_h1',
        product: {
          id: 'sign_1',
          name: 'Qashtuta Pistachio (Classic)',
          categoryId: 'cat_qashtuta',
          price: 299,
          image: '/assets/products/sign_laban/Qashtuta_Classic.png',
          isPopular: true,
          description: 'Tres Leches cake soaked in rich milk, whipped cream, crushed pistachio & sauce',
          station: 'Cold',
          isAvailable: true,
          addOnGroupIds: ['grp_sauces'],
        },
        quantity: 2,
        selectedAddOns: [],
        unitPrice: 299,
        lineTotal: 598,
        specialInstructions: 'Extra pistachio drizzle',
      },
      {
        cartItemId: 'c_h2',
        product: {
          id: 'sign_16',
          name: 'Saankorita Mango & Cream',
          categoryId: 'cat_signatures',
          price: 349,
          image: '/assets/products/sign_laban/Saankorita_Mango.png',
          isPopular: true,
          description: 'Toasted butter kunafa base, fresh Alfonso mango pulp, sweet cream & pistachio',
          station: 'Cold',
          isAvailable: true,
          addOnGroupIds: ['grp_toppings'],
        },
        quantity: 1,
        selectedAddOns: [],
        unitPrice: 349,
        lineTotal: 349,
      },
    ],
    cartDiscountPercent: 0,
    note: 'Customer taking a phone call outside; requested hold',
    heldAt: new Date(Date.now() - 6 * 60000).toISOString(),
  },
];

export const INITIAL_LOYALTY_CUSTOMERS: CustomerLoyalty[] = [
  {
    id: 'cust_1',
    phone: '9876543210',
    name: 'Rohan Sharma',
    points: 420,
    tier: 'Gold',
    visitsCount: 18,
    favoriteItem: 'Qashtuta Pistachio (Classic)',
    lastVisit: 'Yesterday at 7:30 PM',
  },
  {
    id: 'cust_2',
    phone: '9811223344',
    name: 'Ananya Roy',
    points: 850,
    tier: 'VIP',
    visitsCount: 32,
    favoriteItem: 'Saankorita Mango & Cream',
    lastVisit: '3 days ago',
  },
  {
    id: 'cust_3',
    phone: '9701234567',
    name: 'Kabir Patel',
    points: 190,
    tier: 'Silver',
    visitsCount: 7,
    favoriteItem: 'Umm Ali Warm Egyptian Pudding',
    lastVisit: '5 days ago',
  },
  {
    id: 'cust_4',
    phone: '9988776655',
    name: 'Devika Sen',
    points: 80,
    tier: 'Regular',
    visitsCount: 3,
    favoriteItem: 'Aseerathul Royal Mango Shake',
    lastVisit: '2 weeks ago',
  },
];

export const INITIAL_PETTY_CASH: PettyCashExpense[] = [
  {
    id: 'pet_1',
    category: 'Produce & Veg',
    amount: 340,
    paidTo: 'Rajesh Daily Greens',
    receiptNo: 'RC-8812',
    reason: 'Emergency purchase: Fresh Mint, Coriander & Organic Lemons',
    approvedBy: 'Alex Rivera (Manager)',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'pet_2',
    category: 'Packaging & Ice',
    amount: 220,
    paidTo: 'Polar Crystal Ice',
    receiptNo: 'RC-8819',
    reason: 'Food-grade crushed ice 10kg for Beverage & Cold Station rush',
    approvedBy: 'Alex Rivera (Manager)',
    timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
  },
  {
    id: 'pet_3',
    category: 'Repairs & Maint',
    amount: 450,
    paidTo: 'Cyber Hub Electronics',
    receiptNo: 'INV-40192',
    reason: 'Counter 2 Thermal Printer High-Speed USB Interface Cable',
    approvedBy: 'Alex Rivera (Manager)',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

export const INITIAL_WASTE_LOG: WasteLogItem[] = [
  {
    id: 'wst_1',
    productId: 'prod_qashtuta_pistachio',
    productName: 'Qashtuta Pistachio Sponge Base',
    quantity: 1,
    estimatedCost: 120,
    reason: 'Burnt during rush',
    loggedBy: 'Jesselyn Tan',
    station: 'Fry',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'wst_2',
    productId: 'sign_1',
    productName: 'Qashtuta Cake Sponge Base',
    quantity: 2,
    estimatedCost: 70,
    reason: 'Dropped / Spilled',
    loggedBy: 'Marcus Chen',
    station: 'Cold',
    timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
  },
  {
    id: 'wst_3',
    productId: 'sign_25',
    productName: 'Aseerathul Mango Shake Blend',
    quantity: 1,
    estimatedCost: 45,
    reason: 'Quality rejection',
    loggedBy: 'Jesselyn Tan',
    station: 'Expo',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
];

export const INITIAL_ATTENDANCE: StaffAttendance[] = [
  {
    id: 'att_1',
    staffId: 'usr_cashier_1',
    staffName: 'Priya Sharma',
    role: 'cashier',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '09:30 AM',
    status: 'clocked-in',
    hoursWorked: 6.5,
  },
  {
    id: 'att_2',
    staffId: 'usr_kitchen_1',
    staffName: 'Jesselyn Tan',
    role: 'kitchen',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '09:00 AM',
    status: 'clocked-in',
    hoursWorked: 7.0,
  },
  {
    id: 'att_3',
    staffId: 'usr_kitchen_2',
    staffName: 'Marcus Chen',
    role: 'kitchen',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '10:15 AM',
    status: 'on-break',
    hoursWorked: 5.75,
  },
  {
    id: 'att_4',
    staffId: 'usr_manager_1',
    staffName: 'Alex Rivera',
    role: 'manager',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '08:45 AM',
    status: 'clocked-in',
    hoursWorked: 7.25,
  },
  {
    id: 'att_5',
    staffId: 'usr_owner_1',
    staffName: 'Vikram Sethi',
    role: 'owner',
    date: new Date().toISOString().split('T')[0],
    clockInTime: '10:00 AM',
    status: 'clocked-in',
    hoursWorked: 4.0,
  },
];

export const RECIPE_SPECS: RecipeSpec[] = [
  {
    productId: 'sign_1',
    productName: 'Qashtuta Pistachio (Classic)',
    prepTimeSecs: 90,
    cookTemp: 'Chilled (4°C)',
    station: 'Cold',
    allergens: ['Dairy', 'Gluten', 'Pistachio (Tree Nuts)'],
    assemblySteps: [
      'Take 1 chilled sponge cake base pre-soaked in whole milk and sweetened cream from cold display.',
      'Pipe 60g whipped authentic Egyptian fresh Qashta cream across the surface in smooth waves.',
      'Generously drizzle 25g warm Belgian pistachio cream in chevron pattern.',
      'Sprinkle 10g finely roasted Iranian green pistachios across the top.',
      'Place in branded Sign Laban dessert box with golden spoon and seal.',
    ],
  },
  {
    productId: 'sign_5',
    productName: 'Umm Ali Warm Egyptian Pudding',
    prepTimeSecs: 240,
    cookTemp: '220°C Broiler Oven',
    station: 'Grill',
    allergens: ['Dairy', 'Gluten', 'Almonds (Tree Nuts)'],
    assemblySteps: [
      'Place oven-safe clay bowl with crushed puff pastry, golden raisins, and slivered almonds.',
      'Pour 180ml hot sweetened milk infused with Egyptian vanilla essence.',
      'Dollop 40g fresh clotted cream (Ishta) over top layer.',
      'Flash bake in high-heat salamander oven for 3 mins until top crust turns blistering golden caramel.',
      'Dust lightly with cinnamon and toasted hazelnuts; serve steaming hot.',
    ],
  },
  {
    productId: 'sign_16',
    productName: 'Saankorita Mango & Cream',
    prepTimeSecs: 120,
    cookTemp: 'Chilled (4°C)',
    station: 'Cold',
    allergens: ['Dairy', 'Gluten', 'Tree Nuts'],
    assemblySteps: [
      'Layer 80g golden butter-toasted crispy Kunafa noodles at bottom of bowl.',
      'Pour 50ml sweet milk cream soak.',
      'Spread 60g fresh Alphonso mango compote with ripe fruit cubes.',
      'Layer fresh Egyptian whipped qashta cream to rim.',
      'Crown with roasted crushed pistachios and edible gold leaf flake.',
    ],
  },
  {
    productId: 'sign_10',
    productName: 'Bambooza Lotus Biscoff',
    prepTimeSecs: 100,
    cookTemp: 'Ambient / Chilled',
    station: 'Cold',
    allergens: ['Dairy', 'Gluten', 'Soy'],
    assemblySteps: [
      'Unmold 1 freshly baked Egyptian milk sponge slice into rectangular tray.',
      'Warm Lotus Biscoff spread to 40°C for pouring consistency.',
      'Coat cake completely with 35g melted Lotus Biscoff spread.',
      'Garnish with 1 whole Lotus Biscoff cookie and fine biscuit crumb border.',
    ],
  },
  {
    productId: 'sign_25',
    productName: 'Aseerathul Royal Mango Shake',
    prepTimeSecs: 90,
    cookTemp: 'Chilled Blender',
    station: 'Expo',
    allergens: ['Dairy'],
    assemblySteps: [
      'Combine 150g sweet ripe mango pulp, 120ml whole cold milk, and 2 scoops vanilla ice cream.',
      'Pulse on high velocity commercial blender for 25 seconds until silky smooth.',
      'Drizzle mango syrup along interior walls of 400ml branded PET takeaway cup.',
      'Pour thick shake, top with 20g fresh mango cubes and dollop of whipped cream.',
      'Cap with dome lid and wide boba straw.',
    ],
  },
];

export const INITIAL_AUDIT_LOG: AuditLogEvent[] = [
  {
    id: 'aud_1',
    type: 'no_sale_drawer_open',
    description: 'Cash Drawer opened without sale: Provided change (2x ₹100 for ₹200)',
    staffName: 'Priya Sharma (Cashier)',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 'aud_2',
    type: 'discount_high',
    description: 'Applied 20% Promotional Discount to Order #334 (Approved by Alex Rivera PIN: 9999)',
    staffName: 'Priya Sharma (Cashier)',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    metadata: { orderNumber: '#334', discount: 154 },
  },
  {
    id: 'aud_3',
    type: 'stock_86',
    description: 'Stock status updated: Pistachio Cream Drizzle marked In Stock after fresh prep batch',
    staffName: 'Jesselyn Tan (Kitchen Lead)',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];


