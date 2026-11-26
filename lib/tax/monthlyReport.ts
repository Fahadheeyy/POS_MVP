import type { Order } from '@/types';
import { businessDate } from '@/utils/businessDate';

export function monthlyTaxReport(orders: Order[], month: string) {
  const entries = orders.flatMap((order) => {
    if (!order.invoiceNumber || !order.receiptSettings?.gstin || order.receiptSettings.isGstEnabled === false) return [];
    const { gstin } = order.receiptSettings;
    const common = {
      gstin,
      stateCode: order.posStateCode ?? gstin.slice(0, 2),
      gstRate: order.gstRate ?? order.receiptSettings.gstRate,
      invoiceNumber: order.invoiceNumber,
    };
    const invoices = businessDate(order.createdAt).startsWith(month + '-') ? [{
      ...common,
      documentType: 'Invoice',
      documentNumber: order.invoiceNumber,
      date: businessDate(order.createdAt),
      taxableValue: order.subtotal - order.discount,
      cgst: order.cgst,
      sgst: order.sgst,
      total: order.total,
    }] : [];
    if (order.creditNoteNumber && order.refundedAt && businessDate(order.refundedAt).startsWith(month + '-')) {
      invoices.push({
        ...common,
        documentType: 'Credit note',
        documentNumber: order.creditNoteNumber,
        date: businessDate(order.refundedAt),
        taxableValue: -(order.subtotal - order.discount),
        cgst: -order.cgst,
        sgst: -order.sgst,
        total: -order.total,
      });
    }
    return invoices;
  });
  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.documentNumber.localeCompare(b.documentNumber));
}
