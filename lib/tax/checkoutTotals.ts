import type { CartItem, SystemSettings } from '@/types';
import { calculateGst } from './gstEngine';

export function calculateCheckoutTotals(
  items: CartItem[],
  discountPercent: number,
  settings: Pick<SystemSettings, 'isGstEnabled' | 'gstRate' | 'gstin' | 'roundingStrategy'>,
  stateCode = settings.gstin?.slice(0, 2) || '29',
) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return calculateGst({
    items: items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      hsnSacCode: item.product.hsnCode || '996331',
    })),
    outletStateCode: stateCode,
    placeOfSupplyStateCode: stateCode,
    standardGstRate: settings.isGstEnabled === false ? 0 : settings.gstRate ?? 5,
    orderDiscountTotal: Math.round(subtotal * discountPercent) / 100,
    roundingStrategy: settings.isGstEnabled === false ? 'none' : settings.roundingStrategy ?? 'round_half_up',
  });
}
