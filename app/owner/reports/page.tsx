import { ReportsPage } from '@/features/reports/ReportsPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function ReportsRoute() {
  const access = await requireOperationalAccess('reports.view');
  return <OutletWorkspace access={access}><ReportsPage /></OutletWorkspace>;
}
