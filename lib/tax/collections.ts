import type { Order } from '@/types';
import { businessDate } from '@/utils/businessDate';

export function collections(orders: Order[], from: string, through: string) {
  const amounts = {cash: 0, upi: 0, card: 0};
  let sales = 0;
  let refunds = 0;
  let count = 0;
  const includes = (date: string) => {
    const day = businessDate(date);
    return day >= from && day <= through;
  };
  for (const order of orders) {
    if (order.paymentStatus !== 'refunded' && (order.paymentStatus !== 'paid' || order.status === 'cancelled')) continue;
    const amount = Math.round(order.total * 100);
    if (includes(order.createdAt)) {
      sales += amount;
      count++;
      amounts[order.paymentMode] += amount;
    }
    if (order.paymentStatus === 'refunded' && order.refundedAt && includes(order.refundedAt)) {
      refunds += amount;
      amounts[order.paymentMode] -= amount;
    }
  }
  return {count, sales: sales / 100, refunds: refunds / 100, net: (sales-refunds)/100,
    cash: amounts.cash/100, upi: amounts.upi/100, card: amounts.card/100};
}
