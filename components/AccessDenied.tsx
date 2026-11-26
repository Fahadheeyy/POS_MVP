import Link from 'next/link';
import { Lock } from 'lucide-react';

export function AccessDenied() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-surface-canvas">
      <div className="bg-white border rounded-2xl p-8 max-w-md text-center shadow-card">
        <Lock size={26} className="mx-auto mb-4 text-red-700" />
        <h1 className="text-xl font-bold text-gray-900">Access restricted</h1>
        <p className="text-sm text-gray-600 my-4">Your outlet assignment does not grant access to this page.</p>
        <Link href="/" className="text-sm font-semibold underline">Return to my workspace</Link>
      </div>
    </main>
  );
}
