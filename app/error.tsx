'use client';
export default function ErrorPage({reset}: {reset: () => void}) {
  return <main className="screen-state" role="alert"><h1>This screen couldn’t load</h1>
    <p>Check your connection and reopen the screen.</p><button className="state-action" onClick={reset}>Try again</button></main>;
}
