'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#F3EEE6', color: '#161412', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ background: '#FFF4E0', border: '2px solid #161412', borderRadius: '20px', boxShadow: '4px 4px 0 #161412', maxWidth: '420px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>TIKKIT hit an unexpected error</h1>
            <p style={{ fontSize: '13px', color: '#5E554C', margin: '0 0 18px' }}>
              Tap reload below to restore your workspace session.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={reset}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '2px solid #161412', background: '#FF4F1A', color: '#161412', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                Try again
              </button>
              <a
                href="/login"
                style={{ padding: '10px 18px', borderRadius: '10px', border: '2px solid #161412', background: '#FFFFFF', color: '#161412', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
              >
                Sign in
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
