import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

// Mock useAuth0
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

// Mock Link from next/link
vi.mock('next/link', () => {
  return {
    default: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('Header Component', () => {
  it('renders the brand name', () => {
    render(<Header />);
    expect(screen.getByText('StatVision')).toBeInTheDocument();
  });
});
