import { SettingsPage } from '@/features/settings/SettingsPage';
import { requireOperationalAccess } from '@/lib/auth/operationalAccess';
import { OutletWorkspace } from '@/components/OutletWorkspace';

export default async function SettingsRoute() {
  const access = await requireOperationalAccess('settings.manage');
  return <OutletWorkspace access={access}><SettingsPage /></OutletWorkspace>;
}
