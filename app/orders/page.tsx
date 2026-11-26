import { TodayOrdersPage } from '@/features/orders/TodayOrdersPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function OrdersRoute() {
  const access = await requireOperationalAccess('orders.view');
  return <OutletWorkspace access={access}><TodayOrdersPage /></OutletWorkspace>;
}
