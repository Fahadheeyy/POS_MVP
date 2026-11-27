import { TikkitLoadingScreen } from '@/components/ScreenStates';

export default function OrdersLoading() {
  return <TikkitLoadingScreen title="Loading Today's Orders…" subtitle="Fetching outlet orders, receipts, and payment status" />;
}
