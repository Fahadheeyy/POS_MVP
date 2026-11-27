import { OwnerDashboardPage } from '@/features/owner/OwnerDashboardPage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function OwnerRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('reports.view', 'owner');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><OwnerDashboardPage /></OutletWorkspace>;
}
