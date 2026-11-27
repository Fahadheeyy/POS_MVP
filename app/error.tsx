'use client';

import { useEffect } from 'react';
import { TikkitErrorScreen } from '@/components/ScreenStates';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error boundary caught:', error);
  }, [error]);

  return (
    <TikkitErrorScreen
      title="This screen couldn’t load"
      message="There was a temporary problem loading this screen. Check your connection and try again."
      onRetry={reset}
    />
  );
}
