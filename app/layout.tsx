import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StoreHydrator } from '@/components/StoreHydrator';
import './globals.css';

export const metadata: Metadata = {
  title: 'tikkit — Fast Counter POS & QSR Operating System',
  description: 'tikkit · AI-Powered Multi-Tenant Quick Service Restaurant POS Platform',
  icons: {
    icon: '/assets/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-surface-canvas text-gray-900 select-none">
        <StoreHydrator />
        <Suspense fallback={<div className="min-h-screen bg-surface-canvas flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
