import { businessDate } from '@/utils/businessDate';
/**
 * Indian GST & Statutory Compliance Tax Engine
 * Fully compliant with CBIC GST Rule 46, IGST Section 12(4), and Section 34.
 * TIKKIT Enterprise Restaurant SaaS
 */

export interface LineItemTaxInput {
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  hsnSacCode?: string; // Standard default: SAC 996331 (Restaurant services)
  isTaxInclusive?: boolean;
  itemDiscountAmount?: number;
}

export interface GstCalculationParams {
  items: LineItemTaxInput[];
  outletStateCode: string; // e.g. '29' (Karnataka)
  placeOfSupplyStateCode?: string; // Section 12(4) of IGST Act: where service is physically performed
  customerGstin?: string; // Optional B2B recipient GSTIN
  customerName?: string;
  isCompositionScheme?: boolean; // Default false (Regular 5% no-ITC)
  standardGstRate?: number; // Default 5.00%
  serviceChargePercent?: number; // Default 0.00%
  orderDiscountTotal?: number; // Flat discount at order level
  roundingStrategy?: 'round_half_up' | 'none';
}

export interface LineItemTaxBreakdown {
  name: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
  hsnSacCode: string;
}

export interface GstCalculationResult {
  // Classification
  isInterState: boolean;
  b2bOrB2c: 'B2B' | 'B2C_SMALL' | 'B2C_LARGE';
  placeOfSupply: string;
  
  // Line items
  items: LineItemTaxBreakdown[];
  
  // Aggregate Figures (Financial Precision: strictly 2 decimal places)
  grossSubtotal: number;
  discountTotal: number;
  taxableValue: number;
  serviceCharge: number;
  serviceChargeGst: number;
  
  // Tax totals
  cgstRate: number;
  cgstTotal: number;
  sgstRate: number;
  sgstTotal: number;
  igstRate: number;
  igstTotal: number;
  taxTotal: number;
  
  // Final settlement
  preRoundingTotal: number;
  roundingAdjustment: number;
  grandTotal: number;
  
  // GSTR-1 Ready HSN Summary
  hsnSummary: {
    hsnSacCode: string;
    description: string;
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
  }[];
}

/**
 * Standard GST Rule 46 Rounding (Round half-up to nearest rupee)
 * 50 paise or more rounded up to one rupee; less than 50 paise ignored.
 */
export function roundToNearestRupee(value: number): number {
  return Math.round(value);
}

/**
 * Round financial values to 2 decimal places using accurate decimal shift
 * Avoids IEEE-754 floating point precision inaccuracies (e.g., 4.975 -> 4.98)
 */
export function roundCurrency(value: number): number {
  return Number(Math.round(Number(value + 'e2')) + 'e-2');
}

/**
 * Centralized Tax Calculation Engine
 */
export function calculateGst(params: GstCalculationParams): GstCalculationResult {
  const {
    items,
    outletStateCode,
    placeOfSupplyStateCode = outletStateCode, // Under IGST Section 12(4), place of supply for restaurant is location of restaurant
    customerGstin,
    isCompositionScheme = false,
    standardGstRate = 5.0,
    serviceChargePercent = 0.0,
    orderDiscountTotal = 0.0,
    roundingStrategy = 'round_half_up',
  } = params;

  // 1. Determine Interstate vs Intrastate Supply
  const isInterState = outletStateCode !== placeOfSupplyStateCode;
  
  // 2. Determine B2B vs B2C
  const hasValidCustomerGstin = customerGstin && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(customerGstin.trim());
  const b2bOrB2c: 'B2B' | 'B2C_SMALL' | 'B2C_LARGE' = hasValidCustomerGstin ? 'B2B' : 'B2C_SMALL';

  // 3. Tax Rates
  const effectiveGstRate = isCompositionScheme ? 0.0 : standardGstRate;
  const cgstRate = isInterState || isCompositionScheme ? 0.0 : effectiveGstRate / 2;
  const sgstRate = isInterState || isCompositionScheme ? 0.0 : effectiveGstRate / 2;
  const igstRate = isInterState && !isCompositionScheme ? effectiveGstRate : 0.0;

  // 4. Calculate Gross and Preliminary Line Totals
  let grossSubtotal = 0;
  const initialLineTotals = items.map((item) => {
    const gross = roundCurrency(item.unitPrice * item.quantity);
    grossSubtotal += gross;
    return { item, gross };
  });

  // 5. Line-by-Line Tax Computation
  let totalLineTaxable = 0;
  let totalLineCgst = 0;
  let totalLineSgst = 0;
  let totalLineIgst = 0;
  let totalItemDiscounts = 0;

  const processedItems: LineItemTaxBreakdown[] = initialLineTotals.map(({ item, gross }) => {
    // Prorate order-level discount across items based on their gross contribution
    const itemLevelDiscount = item.itemDiscountAmount || 0;
    const proratedOrderDiscount = grossSubtotal > 0
      ? roundCurrency((gross / grossSubtotal) * orderDiscountTotal)
      : 0;
    const itemDiscount = roundCurrency(itemLevelDiscount + proratedOrderDiscount);
    totalItemDiscounts += itemDiscount;

    let taxableValue = 0;
    if (item.isTaxInclusive && !isCompositionScheme) {
      // Reverse calculate: Taxable = (Gross - Discount) / (1 + (Rate / 100))
      const netInclusive = Math.max(0, gross - itemDiscount);
      taxableValue = roundCurrency(netInclusive / (1 + effectiveGstRate / 100));
    } else {
      taxableValue = Math.max(0, roundCurrency(gross - itemDiscount));
    }

    const itemCgst = roundCurrency((taxableValue * cgstRate) / 100);
    const itemSgst = roundCurrency((taxableValue * sgstRate) / 100);
    const itemIgst = roundCurrency((taxableValue * igstRate) / 100);
    const itemTax = roundCurrency(itemCgst + itemSgst + itemIgst);
    const lineTotal = roundCurrency(taxableValue + itemTax);

    totalLineTaxable += taxableValue;
    totalLineCgst += itemCgst;
    totalLineSgst += itemSgst;
    totalLineIgst += itemIgst;

    return {
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      grossAmount: gross,
      discountAmount: itemDiscount,
      taxableValue,
      cgstRate,
      cgstAmount: itemCgst,
      sgstRate,
      sgstAmount: itemSgst,
      igstRate,
      igstAmount: itemIgst,
      totalTax: itemTax,
      lineTotal,
      hsnSacCode: item.hsnSacCode || '996331',
    };
  });

  // 6. Service Charge (Taxable under Indian GST Law)
  const serviceCharge = serviceChargePercent > 0
    ? roundCurrency((totalLineTaxable * serviceChargePercent) / 100)
    : 0.0;
  
  const serviceChargeCgst = roundCurrency((serviceCharge * cgstRate) / 100);
  const serviceChargeSgst = roundCurrency((serviceCharge * sgstRate) / 100);
  const serviceChargeIgst = roundCurrency((serviceCharge * igstRate) / 100);
  const serviceChargeGst = roundCurrency(serviceChargeCgst + serviceChargeSgst + serviceChargeIgst);

  // 7. Aggregate Tax Totals
  const cgstTotal = roundCurrency(totalLineCgst + serviceChargeCgst);
  const sgstTotal = roundCurrency(totalLineSgst + serviceChargeSgst);
  const igstTotal = roundCurrency(totalLineIgst + serviceChargeIgst);
  const taxTotal = roundCurrency(cgstTotal + sgstTotal + igstTotal);
  const totalTaxable = roundCurrency(totalLineTaxable + serviceCharge);

  // 8. Pre-Rounding Final Amount
  const preRoundingTotal = roundCurrency(totalTaxable + taxTotal);

  // 9. GST Rule 46 Rounding (Round half up to nearest Rupee)
  let grandTotal = preRoundingTotal;
  let roundingAdjustment = 0.0;

  if (roundingStrategy === 'round_half_up') {
    grandTotal = roundToNearestRupee(preRoundingTotal);
    roundingAdjustment = roundCurrency(grandTotal - preRoundingTotal);
  }

  // 10. GSTR-1 Ready HSN Summary
  const hsnMap: Record<string, { taxable: number; cgst: number; sgst: number; igst: number }> = {};
  for (const item of processedItems) {
    const code = item.hsnSacCode;
    if (!hsnMap[code]) {
      hsnMap[code] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    hsnMap[code].taxable = roundCurrency(hsnMap[code].taxable + item.taxableValue);
    hsnMap[code].cgst = roundCurrency(hsnMap[code].cgst + item.cgstAmount);
    hsnMap[code].sgst = roundCurrency(hsnMap[code].sgst + item.sgstAmount);
    hsnMap[code].igst = roundCurrency(hsnMap[code].igst + item.igstAmount);
  }

  const hsnSummary = Object.entries(hsnMap).map(([code, values]) => ({
    hsnSacCode: code,
    description: code === '996331' ? 'Restaurant & Food Service' : 'Food Products',
    taxableValue: values.taxable,
    cgstAmount: values.cgst,
    sgstAmount: values.sgst,
    igstAmount: values.igst,
    totalTax: roundCurrency(values.cgst + values.sgst + values.igst),
  }));

  return {
    isInterState,
    b2bOrB2c,
    placeOfSupply: placeOfSupplyStateCode,
    items: processedItems,
    grossSubtotal: roundCurrency(grossSubtotal),
    discountTotal: roundCurrency(totalItemDiscounts),
    taxableValue: totalTaxable,
    serviceCharge,
    serviceChargeGst,
    cgstRate,
    cgstTotal,
    sgstRate,
    sgstTotal,
    igstRate,
    igstTotal,
    taxTotal,
    preRoundingTotal,
    roundingAdjustment,
    grandTotal,
    hsnSummary,
  };
}

/**
 * Generate GST Rule 46 Consecutive Alphanumeric Invoice Number
 * Formatted as e.g. SLI/2627/000042 or INV-SLI/26/0001 (Strictly <= 16 characters per Rule 46(b))
 */
export function formatRule46InvoiceNumber(
  prefix: string,
  sequenceNumber: number,
  financialYear: string = '2627'
): string {
  // Ensure maximum 16 characters strictly
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9\/-]/g, '');
  // Format sequence with padding
  const seqPadded = String(sequenceNumber).padStart(4, '0');
  let full = `${cleanPrefix}${financialYear}/${seqPadded}`;
  if (full.length > 16) {
    // If prefix was too long, use short 2-digit FY prefix e.g. '26'
    const shortFy = financialYear.substring(0, 2);
    full = `${cleanPrefix}${shortFy}/${seqPadded}`;
  }
  return full.substring(0, 16);
}

/**
 * Get current Indian Financial Year (e.g. '2026-27' or short '2627')
 * In India, FY runs from April 1 to March 31.
 */
export function getIndianFinancialYear(date: Date = new Date()): { full: string; short: string } {
  const [year, month] = businessDate(date).split('-').map(Number);

  let startYear = year;
  let endYear = year + 1;

  if (month < 4) {
    // Jan, Feb, Mar belong to previous FY
    startYear = year - 1;
    endYear = year;
  }

  const full = `${startYear}-${String(endYear).substring(2)}`;
  const short = `${String(startYear).substring(2)}${String(endYear).substring(2)}`;

  return { full, short };
}
