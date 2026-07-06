'use client';

import Link from 'next/link';
import '@material/web/icon/icon.js';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '9999px',
          background: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
        }}
      >
        <md-icon
          style={{
            fontSize: '2.25rem',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          error_outline
        </md-icon>
      </div>
      <h1
        style={{
          fontSize: '1.875rem',
          lineHeight: '2.25rem',
          fontWeight: 700,
          color: 'var(--md-sys-color-on-surface)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '-0.025em',
        }}
      >
        Resource Not Found
      </h1>
      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          color: 'var(--md-sys-color-on-surface-variant)',
          marginBottom: '40px',
          maxWidth: '320px',
          marginLeft: 'auto',
          marginRight: 'auto',
          fontWeight: 500,
        }}
      >
        The analytical data or segment you requested does not exist or has been
        archived.
      </p>
      <Link
        href="/dashboard"
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
          textDecoration: 'none',
          transition: 'filter 0.15s ease',
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
