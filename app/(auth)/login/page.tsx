import { AuthPage } from '@/features/auth/AuthPage';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;
  const initialError = error === 'recovery'
    ? 'This sign-in or recovery link could not be opened. Request a new link and open it in the same browser.'
    : error === 'outlet' ? 'Your account has no active outlet assignment. Ask your manager to check your access.' : null;

  return <AuthPage initialError={initialError} passwordUpdated={reset === 'success'} />;
}
