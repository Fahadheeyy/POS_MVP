import { KDSPage } from '@/features/kds/KDSPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function KDSRoute() {
  const access = await requireOperationalAccess('kds.access');
  return <OutletWorkspace access={access}><KDSPage /></OutletWorkspace>;
}
