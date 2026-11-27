import { ManagerConsolePage } from '@/features/manager/ManagerConsolePage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function ManagerRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('staff.manage', 'counter');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><ManagerConsolePage /></OutletWorkspace>;
}
