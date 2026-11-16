import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.cashMovement.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.kdsTicketItem.deleteMany({});
  await prisma.kdsTicket.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.addOnItem.deleteMany({});
  await prisma.addOnGroup.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.systemSettings.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 2. Hash default passwords and PINs
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const pin0000 = await bcrypt.hash('0000', 10);
  const pin1111 = await bcrypt.hash('1111', 10);
  const pin1234 = await bcrypt.hash('1234', 10);
  const pin2222 = await bcrypt.hash('2222', 10);
  const pin8888 = await bcrypt.hash('8888', 10);
  const pin9999 = await bcrypt.hash('9999', 10);

  // 3. Create Primary Tenant: Sign Laban Indiranagar
  const tenant = await prisma.tenant.create({
    data: {
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
      themeColor: '#556475',
      logoUrl: '/assets/products/sign_laban/Qashtuta_Classic.png',
      featuresJson: JSON.stringify({
        kdsEnabled: true,
        gstEnabled: true,
        gstRate: 5,
        addOnsEnabled: true,
        autoPrintReceipt: true,
        cashTiming: 'before',
        enabledPayments: { cash: true, upi: true, card: true },
        loyaltyEnabled: true,
        tableManagement: true,
        wifiPassword: 'SignLabanGuest2026',
      }),
    },
  });

  // Secondary tenant
  await prisma.tenant.create({
    data: {
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
      planTier: 'starter',
      themeColor: '#059669',
      logoUrl: '/assets/products/sign_laban/UmmAli_Lotus.png',
    },
  });

  // 4. Create System Settings
  await prisma.systemSettings.create({
    data: {
      tenantId: tenant.id,
      storeName: 'Sign Laban · Indiranagar',
      brandTagline: "India's First Egyptian Dessert Brand",
      gstin: '29AABCS1429B1Z8',
      fssai: '11223334000123',
      gstRate: 5.0,
      isTaxInclusive: false,
      receiptHeader: "SIGN LABAN\nIndia's First Egyptian Dessert\nBengaluru, KA · Ph: +91 80 4123 4567",
      receiptFooter: "Thank you for visiting Sign Laban!\nFollow @signlaban on Instagram\nFor franchise: hello@signlaban.in",
      wifiPassword: 'SignLabanGuest2026',
      showWifiOnReceipt: true,
      autoPrintReceipt: true,
      cashTiming: 'before',
      kdsTargetMinutes: 6,
      soundAlertsEnabled: true,
      orderPrefix: 'Token #',
      nextOrderSequence: 106,
    },
  });

  // 5. Create Staff Users
  const users = [
    {
      id: 'usr_admin',
      tenantId: tenant.id,
      name: 'Dev & Sales Operations',
      email: 'admin@posbits.io',
      phone: '+91 99000 00000',
      role: 'admin',
      pinHash: pin0000,
      passwordHash: defaultPasswordHash,
      avatarInitials: 'AD',
      title: 'Platform Super Admin',
      active: true,
    },
    {
      id: 'usr_vikram',
      tenantId: tenant.id,
      name: 'Vikram Sethi',
      email: 'vikram@signlaban.in',
      phone: '+91 98765 43214',
      role: 'owner',
      pinHash: pin8888,
      passwordHash: defaultPasswordHash,
      avatarInitials: 'VI',
      title: 'Franchise Owner',
      active: true,
    },
    {
      id: 'usr_alex',
      tenantId: tenant.id,
      name: 'Alex Rivera',
      email: 'alex@signlaban.in',
      phone: '+91 98765 43213',
      role: 'manager',
      pinHash: pin9999,
      passwordHash: defaultPasswordHash,
      avatarInitials: 'AL',
      title: 'Store & Shift Manager',
      active: true,
    },
    {
      id: 'usr_priya',
      tenantId: tenant.id,
      name: 'Priya Sharma',
      email: 'priya@signlaban.in',
      phone: '+91 98765 43211',
      role: 'cashier',
      pinHash: pin1234,
      passwordHash: defaultPasswordHash,
      avatarInitials: 'PR',
      title: 'Head Cashier',
      active: true,
    },
    {
      id: 'usr_jesselyn',
      tenantId: tenant.id,
      name: 'Jesselyn Tan',
      email: 'jesselyn@signlaban.in',
      phone: '+91 98765 43210',
      role: 'kitchen',
      pinHash: pin1111,
      passwordHash: defaultPasswordHash,
      avatarInitials: 'JE',
      title: 'Kitchen Lead',
      active: true,
    },
    {
      id: 'usr_marcus',
      tenantId: tenant.id,
      name: 'Marcus Chen',
      email: 'marcus@signlaban.in',
      phone: '+91 98765 43212',
      role: 'kitchen',
      pinHash: pin2222,
      passwordHash: defaultPasswordHash,
      avatarInitials: 'MA',
      title: 'Kitchen Cook',
      active: true,
    },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  // 6. Load menu.json
  const menuPath = path.join(process.cwd(), 'public/assets/menu.json');
  const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));

  // Categories
  let sortOrder = 1;
  for (const cat of menuData.categories) {
    if (cat.id === 'cat_all') continue;
    await prisma.category.create({
      data: {
        id: cat.id,
        tenantId: tenant.id,
        name: cat.name,
        slug: cat.slug,
        sortOrder: sortOrder++,
      },
    });
  }

  // Add-on Groups and Items
  for (const grp of menuData.addOnGroups) {
    const createdGroup = await prisma.addOnGroup.create({
      data: {
        id: grp.id,
        tenantId: tenant.id,
        name: grp.name,
        minSelect: grp.minSelect ?? 0,
        maxSelect: grp.maxSelect ?? 3,
      },
    });

    if (Array.isArray(grp.items)) {
      for (const itm of grp.items) {
        await prisma.addOnItem.create({
          data: {
            id: itm.id,
            groupId: createdGroup.id,
            name: itm.name,
            price: Number(itm.price) || 0,
            isAvailable: itm.isAvailable ?? true,
            isDefault: itm.isDefault ?? false,
          },
        });
      }
    }
  }

  // Products
  for (const prod of menuData.products) {
    await prisma.product.create({
      data: {
        id: prod.id,
        tenantId: tenant.id,
        categoryId: prod.categoryId,
        name: prod.name,
        description: prod.description || '',
        price: Number(prod.price) || 0,
        image: prod.image || '',
        station: prod.station || 'Cold',
        isAvailable: prod.isAvailable ?? true,
        isPopular: prod.isPopular ?? false,
        addOnGroupIdsJson: JSON.stringify(prod.addOnGroupIds || []),
      },
    });
  }

  // 7. Seed Initial Shift
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  await prisma.shift.create({
    data: {
      id: 'shift_today_1',
      tenantId: tenant.id,
      shiftNumber: 1,
      date: todayStr,
      cashierId: 'usr_priya',
      cashierName: 'Priya Sharma',
      startTime: new Date(now.getTime() - 4 * 3600 * 1000),
      status: 'open',
      openingCash: 2000.0,
      totalOrders: 3,
      cashSales: 650.0,
      cardSales: 470.0,
      upiSales: 1620.0,
      grossSales: 2740.0,
      totalTax: 130.0,
      totalDiscount: 0.0,
      movements: {
        create: [
          {
            type: 'in',
            amount: 2000.0,
            reason: 'Opening Register Float',
            timestamp: new Date(now.getTime() - 4 * 3600 * 1000),
          },
        ],
      },
    },
  });

  // 8. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      type: 'login',
      description: 'Cashier Priya Sharma logged in to Terminal 1',
      staffName: 'Priya Sharma',
      timestamp: new Date(now.getTime() - 4 * 3600 * 1000),
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
