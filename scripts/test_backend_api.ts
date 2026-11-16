import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'pos-bits-jwt-super-secret-key-production-2026-sign-laban';

async function testBackend() {
  console.log('🧪 Testing Option 1 Backend API & Auth...');

  // 1. Test PIN authentication for Priya Sharma (1234)
  const priya = await prisma.user.findFirst({ where: { name: 'Priya Sharma' } });
  if (!priya) throw new Error('Priya Sharma not found');

  const isMatch = await bcrypt.compare('1234', priya.pinHash);
  if (!isMatch) throw new Error('PIN verification failed for 1234');

  const token = jwt.sign(
    {
      userId: priya.id,
      name: priya.name,
      role: priya.role,
      tenantId: priya.tenantId,
    },
    JWT_SECRET,
    { expiresIn: '14d' }
  );

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  if (!decoded || decoded.userId !== priya.id) throw new Error('JWT token invalid');
  console.log('✓ Fast 4-Digit PIN validation (1234) & JWT signing verified.');

  // 2. Test Email / Password authentication for Alex Rivera (9999 / password123)
  const alex = await prisma.user.findFirst({ where: { email: 'alex@signlaban.in' } });
  if (!alex || !alex.passwordHash) throw new Error('Alex Rivera not found');

  const isPasswordMatch = await bcrypt.compare('password123', alex.passwordHash);
  if (!isPasswordMatch) throw new Error('Password verification failed for password123');
  console.log('✓ Email & Password bcrypt verification (password123) verified.');

  // 3. Test Manager PIN override verification (9999)
  const isManagerPinMatch = await bcrypt.compare('9999', alex.pinHash);
  if (!isManagerPinMatch) throw new Error('Manager PIN verification failed for 9999');
  console.log('✓ Supervisor PIN challenge verification (9999) verified.');

  // 4. Test Categories & Products in SQLite DB
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  console.log(`✓ Database verified: ${categories.length} categories, ${products.length} products.`);

  console.log('🎉 ALL BACKEND AUTH & DATABASE CHECKS PASSED!');
}

testBackend()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

