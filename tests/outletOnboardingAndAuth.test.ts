/**
 * Automated Tests: Outlet Onboarding, Dynamic Owner Credentials & Multi-Tenant Authentication
 * Run via: npx tsx tests/outletOnboardingAndAuth.test.ts
 */

import { authService } from '../lib/auth/authService';
import { useAppStore } from '../store';
import { BusinessTenant } from '../types';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('--- Running Outlet Onboarding & Owner Authentication Tests ---');

  // Test 1: Dynamic Account Registration in authService
  authService.registerAccount({
    email: 'owner.whitefield@signlaban.in',
    password: 'whitefieldSecret123',
    role: 'owner',
    name: 'Arun Kumar',
    title: 'Sign Laban Whitefield Owner',
    pin: '7788',
    phone: '+91 98450 77889',
    outletId: 'biz_whitefield_test',
  });

  const registered = authService.getAccountByEmail('owner.whitefield@signlaban.in');
  assert(!!registered, 'Registered account must be found by email');
  assert(registered?.name === 'Arun Kumar', 'Owner name must match Arun Kumar');
  assert(registered?.role === 'owner', 'Owner role must be owner');
  assert(registered?.pin === '7788', 'Owner PIN must match 7788');

  // Test 2: Authentication with correct credentials
  const loginSuccess = await authService.signInWithEmail(
    'owner.whitefield@signlaban.in',
    'whitefieldSecret123'
  );
  assert(loginSuccess.success === true, 'Login with correct owner password must succeed');
  assert(loginSuccess.user?.email === 'owner.whitefield@signlaban.in', 'Session user email must match');
  assert(loginSuccess.user?.role === 'owner', 'Session user role must be owner');
  assert(loginSuccess.user?.outletId === 'biz_whitefield_test', 'Session user outletId must be preserved');
  assert(
    loginSuccess.user?.effectivePermissions.includes('reports.view') === true,
    'Owner session must include reports.view permission'
  );
  assert(
    loginSuccess.user?.effectivePermissions.includes('settings.manage') === true,
    'Owner session must include settings.manage permission'
  );

  // Test 3: Authentication with wrong password must fail
  const loginFailPass = await authService.signInWithEmail(
    'owner.whitefield@signlaban.in',
    'wrongPassword'
  );
  assert(loginFailPass.success === false, 'Login with incorrect password must fail');
  assert(
    (loginFailPass.error || '').toLowerCase().includes('incorrect password'),
    'Error message must state incorrect password'
  );

  // Test 4: Authentication with unknown email must fail
  const loginFailEmail = await authService.signInWithEmail(
    'nonexistent.user@unknown.com',
    'anypassword'
  );
  assert(loginFailEmail.success === false, 'Login with unknown email must fail');

  // Test 5: Full Store Outlet Onboarding Flow
  const store = useAppStore.getState();
  const newOutletId = `biz_blr_ecity_${Date.now()}`;

  store.addBusiness({
    name: 'Sign Laban Electronic City',
    brandName: 'Sign Laban',
    slug: 'sign-laban-ecity',
    tagline: "India's First Egyptian Dessert",
    category: 'Dessert QSR',
    address: 'Phase 1, Electronic City, Bengaluru 560100',
    city: 'Bengaluru',
    pincode: '560100',
    phone: '+91 80 4455 6677',
    email: 'ecity@signlaban.in',
    gstin: '29AABCS1429B1Z5',
    fssai: '11223344556600',
    currency: 'INR',
    currencySymbol: '₹',
    planTier: 'growth',
    status: 'active',
    renewalDate: '2027-11-12',
    themeColor: '#2563eb',
    ownerName: 'Deepak Verma',
    ownerEmail: 'deepak.owner@signlaban.in',
    ownerPassword: 'deepakPassword99',
    ownerPhone: '+91 99887 66554',
    ownerPin: '4321',
    legalEntityName: 'Sign Laban E-City Franchise LLP',
    stateCode: '29',
    stateName: 'Karnataka',
    upiVpaId: 'signlaban.ecity@okhdfcbank',
    tableCount: 24,
    kdsTargetMinutes: 8,
    serviceChargePercent: 5,
    isCompositionScheme: false,
    features: {
      kdsEnabled: true,
      gstEnabled: true,
      gstRate: 5,
      addOnsEnabled: true,
      autoPrintReceipt: true,
      cashTiming: 'before',
      tableManagement: true,
      receiptHeader: '*** SIGN LABAN ELECTRONIC CITY ***',
      receiptFooter: 'Thank you for visiting!',
      wifiPassword: 'ECityGuest2026',
      enabledPayments: { cash: true, upi: true, card: true },
      loyaltyEnabled: true,
    },
  });

  const updatedStore = useAppStore.getState();
  const addedBiz = updatedStore.businesses.find((b) => b.slug === 'sign-laban-ecity');
  assert(!!addedBiz, 'Newly onboarded business must exist in businesses store');
  assert(addedBiz?.ownerName === 'Deepak Verma', 'Owner name must be Deepak Verma');
  assert(addedBiz?.ownerEmail === 'deepak.owner@signlaban.in', 'Owner email must match');
  assert(addedBiz?.stateCode === '29', 'State code must be 29 (Karnataka)');
  assert(addedBiz?.tableCount === 24, 'Table count must be 24');

  // Test 6: Associated Owner user record created in users list
  const ownerUser = updatedStore.users.find((u) => u.email === 'deepak.owner@signlaban.in');
  assert(!!ownerUser, 'Owner user record must be auto-created in users list');
  assert(ownerUser?.role === 'owner', 'Auto-created user must have role owner');
  assert(ownerUser?.pin === '4321', 'Auto-created user must have PIN 4321');

  // Test 7: Verify Owner can immediately log in via authService
  const ownerLogin = await authService.signInWithEmail(
    'deepak.owner@signlaban.in',
    'deepakPassword99'
  );
  assert(ownerLogin.success === true, 'Owner of newly created outlet must authenticate successfully');
  assert(ownerLogin.user?.name === 'Deepak Verma', 'Authenticated user name must match Deepak Verma');

  // Test 8: 1-Click Launch as Owner
  if (addedBiz) {
    const launchResult = updatedStore.launchAsOwner(addedBiz.id);
    assert(launchResult.success === true, '1-Click Launch as Owner must succeed');
    assert(launchResult.targetRoute === '/owner', 'Launch target route must be /owner');

    const stateAfterLaunch = useAppStore.getState();
    assert(stateAfterLaunch.activeBusinessId === addedBiz.id, 'Active business ID must switch to new outlet');
    assert(stateAfterLaunch.currentRole === 'owner', 'Current role must be owner');
    assert(stateAfterLaunch.currentUser?.email === 'deepak.owner@signlaban.in', 'Current user must be Deepak Verma');
    assert(stateAfterLaunch.settings.storeName === 'Sign Laban Electronic City', 'System settings storeName must update');
    assert(stateAfterLaunch.settings.gstin === '29AABCS1429B1Z5', 'System settings GSTIN must update to outlet GSTIN');
  }

  console.log(`\nResults: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
