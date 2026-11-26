import Link from 'next/link';
export default function NotFound() {
  return <main className="screen-state"><h1>Page not found</h1><Link className="state-action" href="/">Return to workspace</Link></main>;
}
