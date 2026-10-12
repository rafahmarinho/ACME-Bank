import Link from "next/link";
export default function NotFound() {
  return (
    <main className="app-loading">
      <h1>This page took a wrong turn.</h1>
      <p>Let&apos;s get you back to your banking workspace.</p>
      <Link href="/" className="button-link primary">
        Back to ACME Bank
      </Link>
    </main>
  );
}
