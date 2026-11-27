import { SettingsPage } from '@/features/settings/SettingsPage';
import { requireOperationalWorkspace } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function SettingsRoute() {
  const { access, initialWorkspace } = await requireOperationalWorkspace('settings.manage', 'counter');
  return <OutletWorkspace access={access} initialWorkspace={initialWorkspace}><SettingsPage /></OutletWorkspace>;
}
