import { POSPage } from '@/features/pos/POSPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function POSRoute() {
  const access = await requireOperationalAccess('pos.access');
  return <OutletWorkspace access={access}><POSPage /></OutletWorkspace>;
}
