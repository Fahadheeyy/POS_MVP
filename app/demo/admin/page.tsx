import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { StoreHydrator } from '@/components/StoreHydrator';
import { AdminPortalPage } from '@/features/admin/AdminPortalPage';

export default async function DemoAdminRoute() {
  if (process.env.NODE_ENV !== 'development') notFound();

  const cookie = (await cookies()).get('pos_session')?.value;
  let session: { id?: string; role?: string } | null = null;
  try {
    session = cookie ? JSON.parse(decodeURIComponent(cookie)) : null;
  } catch {
    // Invalid demo session.
  }
  if (session?.id !== 'usr_admin' || session.role !== 'admin') redirect('/login');

  return <><StoreHydrator /><AdminPortalPage /></>;
}
