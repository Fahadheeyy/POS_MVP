import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'pos-bits-jwt-super-secret-key-production-2026-sign-laban';

app.use(cors());
app.use(express.json());

// Helper: Authenticate JWT middleware
function requireAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Fast 4-Digit PIN Authentication
app.post('/api/auth/login-pin', async (req: Request, res: Response) => {
  try {
    const { pin, userId, role } = req.body;
    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ success: false, error: 'PIN is required' });
    }

    let targetUser = null;
    if (userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: userId, active: true },
        include: { tenant: true },
      });
      if (targetUser) {
        const isMatch = await bcrypt.compare(pin, targetUser.pinHash);
        if (!isMatch) targetUser = null;
      }
    } else {
      // Find all active users (matching role if provided)
      const users = await prisma.user.findMany({
        where: {
          active: true,
          ...(role ? { role } : {}),
        },
        include: { tenant: true },
      });

      for (const u of users) {
        const isMatch = await bcrypt.compare(pin, u.pinHash);
        if (isMatch) {
          targetUser = u;
          break;
        }
      }
    }

    if (!targetUser) {
      return res.status(401).json({ success: false, error: 'Invalid PIN. Please try again.' });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        userId: targetUser.id,
        name: targetUser.name,
        role: targetUser.role,
        tenantId: targetUser.tenantId,
        avatarInitials: targetUser.avatarInitials,
      },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: targetUser.tenantId,
        type: 'login',
        description: `${targetUser.name} (${targetUser.role}) authenticated via Fast 4-Digit PIN`,
        staffName: targetUser.name,
      },
    });

    return res.json({
      success: true,
      token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        title: targetUser.title,
        avatarInitials: targetUser.avatarInitials,
        pin: pin, // returned for store client compatibility
        active: targetUser.active,
        tenantId: targetUser.tenantId,
        tenantName: targetUser.tenant.name,
      },
    });
  } catch (error) {
    console.error('Error in login-pin:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Email / Phone & Password Authentication
app.post('/api/auth/login-credentials', async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password, role } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, error: 'Credentials required' });
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        active: true,
        OR: [{ email: cleanInput }, { phone: cleanInput }],
        ...(role ? { role } : {}),
      },
      include: { tenant: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatarInitials: user.avatarInitials,
      },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        type: 'login',
        description: `${user.name} (${user.role}) authenticated via Password`,
        staffName: user.name,
      },
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        title: user.title,
        avatarInitials: user.avatarInitials,
        active: user.active,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
    });
  } catch (error) {
    console.error('Error in login-credentials:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify Manager/Supervisor PIN (For modal overrides: refunds, discounts, drawer kicks)
app.post('/api/auth/verify-manager-pin', async (req: Request, res: Response) => {
  try {
    const { pin, actionTitle, staffName } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, error: 'PIN required' });
    }

    const supervisors = await prisma.user.findMany({
      where: {
        active: true,
        role: { in: ['manager', 'owner', 'admin'] },
      },
    });

    let matchedSupervisor = null;
    for (const sup of supervisors) {
      const isMatch = await bcrypt.compare(pin, sup.pinHash);
      if (isMatch) {
        matchedSupervisor = sup;
        break;
      }
    }

    if (!matchedSupervisor) {
      return res.status(403).json({ success: false, error: 'Incorrect Manager PIN' });
    }

    // Log supervisor override
    await prisma.auditLog.create({
      data: {
        tenantId: matchedSupervisor.tenantId,
        type: 'supervisor_override',
        description: `Supervisor override approved by ${matchedSupervisor.name} for: ${actionTitle || 'Manager Override'}`,
        staffName: staffName || matchedSupervisor.name,
      },
    });

    return res.json({
      success: true,
      supervisor: {
        id: matchedSupervisor.id,
        name: matchedSupervisor.name,
        role: matchedSupervisor.role,
      },
    });
  } catch (error) {
    console.error('Error verifying manager pin:', error);
    return res.status(500).json({ success: false, error: 'Verification error' });
  }
});

// Validate Active Session
app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const tokenUser = (req as any).user;
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      include: { tenant: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { tenantId: user.tenantId },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        title: user.title,
        avatarInitials: user.avatarInitials,
        tenantId: user.tenantId,
      },
      settings,
      tenant: user.tenant,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

// ==========================================
// 2. MENU & INVENTORY ENDPOINTS
// ==========================================
app.get('/api/menu', async (_req: Request, res: Response) => {
  try {
    const [categories, products, addOnGroups] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({ orderBy: { name: 'asc' } }),
      prisma.addOnGroup.findMany({ include: { items: true } }),
    ]);

    const formattedProducts = products.map((p) => {
      let addOnGroupIds = [];
      try {
        addOnGroupIds = JSON.parse(p.addOnGroupIdsJson || '[]');
      } catch {}
      return { ...p, addOnGroupIds };
    });

    return res.json({
      success: true,
      categories,
      products: formattedProducts,
      addOnGroups,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch menu' });
  }
});

// Update product (price, availability, station)
app.patch('/api/menu/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const allowed = ['price', 'isAvailable', 'station', 'isPopular', 'description'];
    const updateData: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.json({ success: true, product: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// ==========================================
// 3. ORDERS & KDS TICKETS
// ==========================================
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        kdsTickets: { include: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Create Order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const {
      type = 'takeaway',
      customerName = 'Walk-in Guest',
      guestCount = 1,
      tableNumber,
      items,
      subtotal,
      discount = 0,
      discountPercent = 0,
      cgst = 0,
      sgst = 0,
      tax = 0,
      total,
      paymentMode = 'cash',
      paymentStatus = 'paid',
      cashTendered,
      cashChange,
      cashierId,
      cashierName,
      tenantId = 'biz_sign_laban_indiranagar',
    } = body;

    // Get and increment order sequence
    let settings = await prisma.systemSettings.findUnique({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { tenantId, storeName: 'Sign Laban · Indiranagar', nextOrderSequence: 106 },
      });
    }

    const nextSeq = settings.nextOrderSequence;
    const orderNumber = `${settings.orderPrefix}${nextSeq}`;

    await prisma.systemSettings.update({
      where: { tenantId },
      data: { nextOrderSequence: nextSeq + 1 },
    });

    // Create Order with Items
    const createdOrder = await prisma.order.create({
      data: {
        tenantId,
        orderNumber,
        type,
        customerName: customerName || 'Walk-in Guest',
        guestCount: guestCount || 1,
        tableNumber: tableNumber || null,
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        discountPercent: Number(discountPercent) || 0,
        cgst: Number(cgst) || 0,
        sgst: Number(sgst) || 0,
        tax: Number(tax) || 0,
        total: Number(total) || 0,
        paymentMode,
        paymentStatus,
        cashTendered: cashTendered ? Number(cashTendered) : null,
        cashChange: cashChange ? Number(cashChange) : null,
        cashierId: cashierId || 'usr_priya',
        cashierName: cashierName || 'Priya Sharma',
        status: 'preparing',
        items: {
          create: items.map((itm: any) => ({
            productId: itm.product?.id || itm.productId || 'prod_custom',
            name: itm.product?.name || itm.name,
            quantity: Number(itm.quantity) || 1,
            unitPrice: Number(itm.unitPrice) || Number(itm.product?.price) || 0,
            lineTotal: Number(itm.lineTotal) || 0,
            specialInstructions: itm.specialInstructions || null,
            selectedAddOnsJson: JSON.stringify(itm.selectedAddOns || []),
          })),
        },
      },
      include: { items: true },
    });

    // Create KDS Ticket
    const kdsTicket = await prisma.kdsTicket.create({
      data: {
        orderId: createdOrder.id,
        orderNumber,
        orderType: type,
        customerName: customerName || 'Walk-in Guest',
        targetMinutes: settings.kdsTargetMinutes || 6,
        status: 'new',
        items: {
          create: items.map((itm: any) => ({
            productId: itm.product?.id || itm.productId || 'prod_custom',
            name: itm.product?.name || itm.name,
            quantity: Number(itm.quantity) || 1,
            station: itm.product?.station || 'Cold',
            modifiersJson: JSON.stringify(itm.selectedAddOns || []),
            isReady: false,
          })),
        },
      },
      include: { items: true },
    });

    return res.json({ success: true, order: createdOrder, kdsTicket });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Bump KDS Ticket
app.post('/api/kds/bump', async (req: Request, res: Response) => {
  try {
    const { ticketId, action } = req.body;
    const ticket = await prisma.kdsTicket.findUnique({
      where: { id: ticketId },
      include: { order: true },
    });

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    let newStatus = ticket.status;
    let newOrderStatus = ticket.order.status;

    if (action === 'start') {
      newStatus = 'cooking';
      newOrderStatus = 'preparing';
    } else if (action === 'ready') {
      newStatus = 'ready';
      newOrderStatus = 'ready';
    } else if (action === 'bump') {
      newStatus = 'bumped';
      newOrderStatus = 'completed';
    } else if (action === 'recall') {
      newStatus = 'ready';
      newOrderStatus = 'ready';
    }

    const updated = await prisma.kdsTicket.update({
      where: { id: ticketId },
      data: { status: newStatus },
      include: { items: true, order: true },
    });

    await prisma.order.update({
      where: { id: ticket.orderId },
      data: { status: newOrderStatus },
    });

    return res.json({ success: true, ticket: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to bump ticket' });
  }
});

// 86 Out of stock toggle
app.post('/api/kds/stock-86', async (req: Request, res: Response) => {
  try {
    const { productId, isAvailable, staffName } = req.body;
    const prod = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable: Boolean(isAvailable) },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: prod.tenantId,
        type: 'stock_86',
        description: `Product ${prod.name} marked as ${isAvailable ? 'IN STOCK' : '86 OUT'}`,
        staffName: staffName || 'Kitchen Staff',
      },
    });

    return res.json({ success: true, product: prod });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update 86 status' });
  }
});

// ==========================================
// 4. SHIFTS & AUDIT
// ==========================================
app.get('/api/shifts/active', async (_req: Request, res: Response) => {
  try {
    const active = await prisma.shift.findFirst({
      where: { status: 'open' },
      include: { movements: { orderBy: { timestamp: 'desc' } } },
      orderBy: { startTime: 'desc' },
    });
    return res.json({ success: true, shift: active });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch shift' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 QSR Production API Server running on http://localhost:${PORT}`);
});
