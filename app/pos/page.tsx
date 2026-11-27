import { POSPage } from '@/features/pos/POSPage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function POSRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('pos.access', 'counter');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><POSPage /></OutletWorkspace>;
}
