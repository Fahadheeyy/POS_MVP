/**
 * Automated Tests for Indian GST Engine
 * Validates Rule 46 Tax Invoices, Place of Supply, and Rounding rules.
 */

import {
  calculateGst,
  formatRule46InvoiceNumber,
  getIndianFinancialYear,
  roundToNearestRupee,
} from '../lib/tax/gstEngine';

export function runGstEngineTests() {
  console.log('--- Running GST Calculation Engine Tests ---');
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

  // TEST 1: Standard Intrastate 5% Restaurant GST (Karnataka 29 -> 29)
  const order1 = calculateGst({
    items: [
      { name: 'Qashtuta Classic', unitPrice: 280, quantity: 1 },
      { name: 'Umm Ali Lotus', unitPrice: 320, quantity: 1 },
    ],
    outletStateCode: '29',
    placeOfSupplyStateCode: '29',
    standardGstRate: 5.0,
  });

  assert(order1.grossSubtotal === 600, 'Subtotal should be 600.00');
  assert(order1.isInterState === false, 'Should be intra-state');
  assert(order1.cgstRate === 2.5, 'CGST rate should be 2.5%');
  assert(order1.sgstRate === 2.5, 'SGST rate should be 2.5%');
  assert(order1.igstRate === 0.0, 'IGST rate should be 0%');
  assert(order1.cgstTotal === 15.0, 'CGST amount should be 15.00');
  assert(order1.sgstTotal === 15.0, 'SGST amount should be 15.00');
  assert(order1.grandTotal === 630, 'Grand total should be 630.00');

  // TEST 2: Rounding to nearest Rupee (Rule 46)
  const order2 = calculateGst({
    items: [
      { name: 'Pistachio Drizzle Slice', unitPrice: 199, quantity: 1 },
    ],
    outletStateCode: '29',
    standardGstRate: 5.0,
  });
  // 199 * 2.5% = 4.975 -> 4.98 CGST, 4.98 SGST -> Tax = 9.96. Total = 208.96 -> Rounds to 209
  assert(order2.cgstTotal === 4.98, 'CGST 2.5% of 199 is 4.98');
  assert(order2.sgstTotal === 4.98, 'SGST 2.5% of 199 is 4.98');
  assert(order2.preRoundingTotal === 208.96, 'Pre-rounding total is 208.96');
  assert(order2.grandTotal === 209, 'Grand total rounded to nearest rupee is 209');
  assert(order2.roundingAdjustment === 0.04, 'Rounding adjustment is +0.04');

  // TEST 3: Inter-state Supply applies full IGST 5% (Karnataka 29 -> Maharashtra 27)
  const order3 = calculateGst({
    items: [
      { name: 'Catering Bulk Box', unitPrice: 2000, quantity: 1 },
    ],
    outletStateCode: '29',
    placeOfSupplyStateCode: '27',
    standardGstRate: 5.0,
  });

  assert(order3.isInterState === true, 'Should detect inter-state supply');
  assert(order3.cgstTotal === 0, 'Intrastate CGST must be 0 for interstate');
  assert(order3.sgstTotal === 0, 'Intrastate SGST must be 0 for interstate');
  assert(order3.igstTotal === 100.0, 'IGST should be 5% = 100.00');
  assert(order3.grandTotal === 2100, 'Grand total should be 2100');

  // TEST 4: Service Charge is subject to GST
  const order4 = calculateGst({
    items: [
      { name: 'Dine-in Feast', unitPrice: 1000, quantity: 1 },
    ],
    outletStateCode: '29',
    standardGstRate: 5.0,
    serviceChargePercent: 5.0, // 5% service charge = 50.00
  });
  // Taxable Base = 1000 + 50 = 1050. GST 5% of 1050 = 52.50 (CGST 26.25, SGST 26.25). Total = 1102.50 -> 1103 or 1102
  assert(order4.serviceCharge === 50, 'Service charge should be 50.00');
  assert(order4.taxableValue === 1050, 'Taxable value includes service charge = 1050.00');
  assert(order4.taxTotal === 52.5, 'Tax on 1050 @ 5% is 52.50');

  // TEST 5: GST Rule 46 Invoice Number Format (<= 16 chars)
  const invoiceNum = formatRule46InvoiceNumber('INV-SLI/', 42, '2627');
  assert(invoiceNum === 'INV-SLI/26/0042', `Invoice number is ${invoiceNum}`);
  assert(invoiceNum.length <= 16, `Length must be <= 16 chars (actual: ${invoiceNum.length})`);

  // Summary
  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}

// Execute tests directly
runGstEngineTests();
