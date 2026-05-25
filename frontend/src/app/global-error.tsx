'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-primary-bg text-tx-primary flex flex-col items-center justify-center min-h-screen p-10 text-center">
        <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">System Analysis Interrupted</h2>
        <p className="text-sm text-tx-secondary mb-8">A critical error occurred in the intelligence engine.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-accent text-white rounded-md font-bold text-sm uppercase tracking-wider hover:brightness-110"
        >
          Re-initialize Engine
        </button>
      </body>
    </html>
  );
}
