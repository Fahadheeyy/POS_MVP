'use client';

import { useEffect } from 'react';
import { rehydrateStoreFromStorage } from '@/store';

export function StoreHydrator() {
  useEffect(() => {
    rehydrateStoreFromStorage();
  }, []);

  return null;
}
