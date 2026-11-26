/**
 * Automated Tests for RBAC, Permission Overrides & Tenant Isolation
 * POS.BITS Enterprise Restaurant SaaS
 */

import {
  PERMISSION_CODES,
  resolveEffectivePermissions,
  hasPermission,
  isFeatureEntitled,
  DEFAULT_ROLE_PERMISSIONS,
} from '../lib/rbac/permissions';

export function runRbacTests() {
  console.log('--- Running RBAC & Authorization Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Default Role Permissions
  const cashierPerms = resolveEffectivePermissions('cashier');
  assert(cashierPerms.has(PERMISSION_CODES.POS_ACCESS), 'Cashier must have POS access');
  assert(cashierPerms.has(PERMISSION_CODES.PAYMENTS_MANAGE), 'Cashier must have payment access');
  assert(!cashierPerms.has(PERMISSION_CODES.KDS_ACCESS), 'Cashier must NOT have KDS access by default');
  assert(!cashierPerms.has(PERMISSION_CODES.MENU_MANAGE), 'Cashier must NOT have menu management by default');

  const kitchenPerms = resolveEffectivePermissions('kitchen');
  assert(kitchenPerms.has(PERMISSION_CODES.KDS_ACCESS), 'Kitchen staff must have KDS access');
  assert(!kitchenPerms.has(PERMISSION_CODES.POS_ACCESS), 'Kitchen staff must NOT have POS access');

  const ownerPerms = resolveEffectivePermissions('owner');
  assert(ownerPerms.has(PERMISSION_CODES.POS_ACCESS), 'Owner must have POS access');
  assert(ownerPerms.has(PERMISSION_CODES.REPORTS_VIEW), 'Owner must have reports access');
  assert(ownerPerms.has(PERMISSION_CODES.SETTINGS_MANAGE), 'Owner must have settings access');

  // TEST 2: Granular Employee Overrides
  // Case A: A Cashier who is granted custom permission to edit Menu (menu.manage)
  const promotedCashier = resolveEffectivePermissions('cashier', [
    { permissionCode: PERMISSION_CODES.MENU_MANAGE, granted: true },
  ]);
  assert(promotedCashier.has(PERMISSION_CODES.POS_ACCESS), 'Promoted Cashier retains POS access');
  assert(promotedCashier.has(PERMISSION_CODES.MENU_MANAGE), 'Promoted Cashier now has MENU_MANAGE access via override');

  // Case B: A Manager whose order cancellation permission (orders.cancel) is revoked
  const restrictedManager = resolveEffectivePermissions('manager', [
    { permissionCode: PERMISSION_CODES.ORDERS_CANCEL, granted: false },
  ]);
  assert(restrictedManager.has(PERMISSION_CODES.POS_ACCESS), 'Restricted Manager still has POS access');
  assert(!restrictedManager.has(PERMISSION_CODES.ORDERS_CANCEL), 'Restricted Manager has ORDERS_CANCEL revoked');

  // TEST 3: Feature Entitlements per Plan Tier
  // Starter Plan
  assert(isFeatureEntitled('starter', 'pos') === true, 'Starter tier entitles POS');
  assert(isFeatureEntitled('starter', 'kds') === false, 'Starter tier does NOT entitle KDS');
  assert(isFeatureEntitled('starter', 'multi_outlet') === false, 'Starter tier does NOT entitle Multi-outlet');

  // Growth Plan
  assert(isFeatureEntitled('growth', 'pos') === true, 'Growth tier entitles POS');
  assert(isFeatureEntitled('growth', 'kds') === true, 'Growth tier entitles KDS');
  assert(isFeatureEntitled('growth', 'reports_advanced') === true, 'Growth tier entitles Advanced Reports');

  // Enterprise Plan
  assert(isFeatureEntitled('enterprise', 'analytics_advanced') === true, 'Enterprise entitles Advanced Analytics');
  assert(isFeatureEntitled('enterprise', 'custom_roles') === true, 'Enterprise entitles Custom Roles');

  // Tenant Specific Override
  const customOverride = { kds: true };
  assert(
    isFeatureEntitled('starter', 'kds', customOverride) === true,
    'Custom tenant override can grant KDS on starter plan'
  );

  console.log(`\nRBAC Results: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}

if (runRbacTests().failed > 0) process.exitCode = 1;
