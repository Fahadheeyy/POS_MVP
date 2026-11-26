import { OwnerDashboardPage } from '@/features/owner/OwnerDashboardPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function OwnerRoute() {
  const access = await requireOperationalAccess('reports.view');
  return <OutletWorkspace access={access}><OwnerDashboardPage /></OutletWorkspace>;
}
