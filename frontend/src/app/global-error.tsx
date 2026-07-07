'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px',
          textAlign: 'center',
          margin: 0,
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            lineHeight: '2rem',
            fontWeight: 700,
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '-0.025em',
          }}
        >
          System Analysis Interrupted
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            color: 'var(--md-sys-color-on-surface-variant)',
            marginBottom: '32px',
          }}
        >
          A critical error occurred in the intelligence engine.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 24px',
            background: 'var(--md-sys-color-primary)',
            color: '#fff',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            cursor: 'pointer',
            transition: 'filter 0.15s ease',
          }}
        >
          Re-initialize Engine
        </button>
      </body>
    </html>
  );
}
