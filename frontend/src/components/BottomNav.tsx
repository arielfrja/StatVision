'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

import ClientOnlyWrapper from './ClientOnlyWrapper';

import navItems from '@/config/navItems.json';

const BottomNav = () => {
    const pathname = usePathname();

    return (
        <ClientOnlyWrapper>
            <nav className="BottomNav" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '64px',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderTop: '1px solid var(--md-sys-color-outline-variant)',
                zIndex: 1000,
            }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const color = isActive 
                        ? 'var(--md-sys-color-primary)' 
                        : 'var(--md-sys-color-on-surface-variant)';

                    return (
                        <Link key={item.href} href={item.href} passHref legacyBehavior>
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                textDecoration: 'none',
                                color: color,
                                fontSize: 'var(--md-sys-typescale-label-small-size)',
                                fontWeight: isActive ? 'bold' : 'normal',
                                padding: '4px 0',
                                transition: 'transform 0.1s ease-out, background-color 0.2s ease-in-out', // Added background-color transition
                                position: 'relative',
                                borderRadius: '50%',
                                width: '56px',
                                height: '56px',
                                justifyContent: 'center',
                            }}
                            // @ts-ignore
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            // @ts-ignore
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            // @ts-ignore
                            onMouseDown={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'}
                            // @ts-ignore
                            onMouseUp={(e) => {
                                const target = e.currentTarget;
                                setTimeout(() => {
                                    if (target) target.style.backgroundColor = 'transparent';
                                }, 100);
                            }}
                            // @ts-ignore
                            onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)'}
                            // @ts-ignore
                            onTouchEnd={(e) => {
                                const target = e.currentTarget;
                                setTimeout(() => {
                                    if (target) target.style.backgroundColor = 'transparent';
                                }, 100);
                            }}
                            >
                                <md-icon style={{ color: color, fontSize: '24px' }}>{item.icon}</md-icon>
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </ClientOnlyWrapper>
    );
};

export default BottomNav;