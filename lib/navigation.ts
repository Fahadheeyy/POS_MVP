'use client';

import { useRouter, usePathname } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  return {
    pathname: pathname || '',
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null,
    key: 'default',
  };
}

export function adminDestination(userId: string): string {
  return process.env.NODE_ENV === 'development' && userId === 'usr_admin' ? '/demo/admin' : '/admin';
}
