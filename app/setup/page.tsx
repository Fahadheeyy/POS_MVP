import { SetupWizardPage } from '@/features/setup/SetupWizardPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function SetupRoute() {
  const access = await requireOperationalAccess('settings.manage');
  return <OutletWorkspace access={access}><SetupWizardPage /></OutletWorkspace>;
}
