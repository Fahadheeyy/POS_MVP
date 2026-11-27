import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Bowlby_One, Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const bowlbyOne = Bowlby_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'TIKKIT — Enterprise QSR POS SaaS Platform',
  description: 'Production Multi-Tenant Quick Service Restaurant POS Platform for India',
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
    <html lang="en" className={`${bowlbyOne.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body className="antialiased bg-surface-canvas text-brand-ink">
        <Suspense fallback={<div className="min-h-screen bg-surface-canvas flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
