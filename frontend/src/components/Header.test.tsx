import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

vi.mock('@/app/user-provider', () => ({
  useAuth0: () => ({
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock('next/link', () => {
  return {
    default: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Header Component', () => {
  it('renders the brand name', () => {
    render(<Header />);
    expect(screen.getByText('StatVision')).toBeInTheDocument();
  });
});