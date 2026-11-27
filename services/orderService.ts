import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import type { AddOnGroup, CartItem, Category, KdsTicket, Order, OrderType, PaymentMode, Product, Shift, SystemSettings, User } from '@/types';

export interface OutletWorkspace {
  settings: Partial<SystemSettings>;
  categories: Category[];
  products: Product[];
  addOnGroups: AddOnGroup[];
  orders: Order[];
  tickets: KdsTicket[];
  shifts: Shift[];
  users: User[];
}

export interface CheckoutRequest {
  id: string;
  items: CartItem[];
  orderType: OrderType;
  customerName: string;
  tableNumber: string;
  guestCount: number;
  discountPercent: number;
  expectedTotal: number;
  paymentMode: PaymentMode;
  paymentReference?: string;
  cashTendered?: number;
}

export class RequestRejected extends Error {}
export class OutletAccessDenied extends RequestRejected {}
export function pendingCheckoutKey(outletId: string, userId: string) {
  return 'tikkit:pending-sale:' + outletId + ':' + userId;
}

const savedCheckoutSchema = z.object({
  id: z.guid(),
  items: z.array(z.object({
    product: z.object({ id: z.string() }),
    quantity: z.number().int().min(1).max(1000),
    specialInstructions: z.string().optional(),
    selectedAddOns: z.array(z.object({ item: z.object({ id: z.string() }) })),
  })).min(1).max(100),
  orderType: z.enum(['dine-in', 'dine_in', 'takeaway', 'delivery']),
  customerName: z.string(),
  tableNumber: z.string(),
  guestCount: z.number(),
  discountPercent: z.number(),
  expectedTotal: z.number(),
  paymentMode: z.enum(['cash', 'upi', 'card']),
  paymentReference: z.string().optional(),
  cashTendered: z.number().optional(),
});

export function readPendingCheckout(storage: Pick<Storage, 'getItem'>, key: string): CheckoutRequest | null {
  const saved = storage.getItem(key);
  if (saved === null) return null;
  try {
    const request: unknown = JSON.parse(saved);
    if (savedCheckoutSchema.safeParse(request).success) return request as CheckoutRequest;
  } catch {
    // A truncated record also requires the cashier to check whether the order was saved.
  }
  throw new Error('The saved checkout is unreadable. Review Today’s Orders before clearing it.');
}

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args).abortSignal(AbortSignal.timeout(15000));
  if (error?.code === '42501') throw new OutletAccessDenied('Your outlet access does not allow this operation.');
  if (error?.code === '23505') throw new RequestRejected('This record already exists. Review the order before retrying.');
  if (error?.code === 'P0001') throw new RequestRejected(error.message);
  if (error) throw new Error('Could not save or load the outlet data. Check your session and connection.');
  return data as T;
}

export const orderService = {
  workspace: (outletId: string) => {
    const path = window.location.pathname;
    const view = path === '/owner/reports' ? 'reports' : path === '/owner' ? 'owner' : path === '/kds' ? 'kitchen' : 'counter';
    return rpc<OutletWorkspace>('get_register_workspace', { p_outlet: outletId, p_view: view });
  },
  checkout: (outletId: string, { items, orderType, ...request }: CheckoutRequest) => rpc<Order>('pos_checkout', {
    p_outlet: outletId,
    p_request: {
      ...request,
      orderType: orderType.replace('-', '_'),
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.specialInstructions,
        addOns: item.selectedAddOns.map((modifier) => modifier.item.id),
      })),
    },
  }),
  shift: (outletId: string, action: 'open' | 'close' | 'in' | 'out', amount: number, reason?: string, counts?: Record<number, number>) =>
    rpc<void>('pos_shift', { p_action: action, p_amount: amount, p_reason: reason, p_counts: counts, p_outlet: outletId }),
  ticket: (outletId: string, ticketId: string, action: 'advance' | 'status' | 'item' | 'rush' | 'recall' | 'note', value?: string) =>
    rpc<void>('pos_ticket', { p_ticket: ticketId, p_action: action, p_value: value, p_outlet: outletId }),
  setTicketItemReady: (outletId: string, ticketId: string, itemId: string, ready: boolean) =>
    rpc<void>('pos_set_ticket_item_ready', { p_ticket: ticketId, p_item: itemId, p_ready: ready, p_outlet: outletId }),
  catalog: (outletId: string, action: 'product' | 'availability' | 'group' | 'modifier' | 'remove_modifier', item: object) =>
    rpc<void>('pos_catalog', { p_action: action, p_item: item, p_outlet: outletId }),
  settings: (outletId: string, settings: Partial<SystemSettings>) =>
    rpc<void>('update_pos_preferences', { p_settings: settings, p_outlet: outletId }),
};
