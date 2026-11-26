import { ManagerConsolePage } from '@/features/manager/ManagerConsolePage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function ManagerRoute() {
  const access = await requireOperationalAccess('staff.manage');
  return <OutletWorkspace access={access}><ManagerConsolePage /></OutletWorkspace>;
}
