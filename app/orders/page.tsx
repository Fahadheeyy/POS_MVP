import { TodayOrdersPage } from '@/features/orders/TodayOrdersPage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function OrdersRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('orders.view', 'counter');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><TodayOrdersPage /></OutletWorkspace>;
}
