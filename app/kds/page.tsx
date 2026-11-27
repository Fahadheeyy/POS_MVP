import { KDSPage } from '@/features/kds/KDSPage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function KDSRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('kds.access', 'kitchen');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><KDSPage /></OutletWorkspace>;
}
