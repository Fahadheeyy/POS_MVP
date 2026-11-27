import { TikkitLoadingScreen } from '@/components/ScreenStates';

export default function SettingsLoading() {
  return <TikkitLoadingScreen title="Loading Store Settings…" subtitle="Fetching outlet profile, tax rules, and receipt config" />;
}
