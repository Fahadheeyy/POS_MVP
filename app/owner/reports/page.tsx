import { ReportsPage } from '@/features/reports/ReportsPage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function ReportsRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('reports.view', 'reports');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><ReportsPage /></OutletWorkspace>;
}
