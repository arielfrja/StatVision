'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@material/web/icon/icon.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';

import ClientOnlyWrapper from './ClientOnlyWrapper';

import navItems from '@/config/navItems.json';

const SideNav = () => {
    const pathname = usePathname();

    return (
        <ClientOnlyWrapper>
            <nav className="SideNav" style={{ 
                width: '250px', 
                height: '100vh', 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRight: '1px solid var(--md-sys-color-outline-variant)',
                paddingTop: 'var(--spacing-xl)'
            }}>
                <div style={{ padding: '0 var(--spacing-md)' }}>
                    <h2 style={{ 
                        textAlign: 'center', 
                        marginBottom: 'var(--spacing-lg)', 
                        color: 'var(--md-sys-color-primary)' 
                    }}>StatVision</h2>
                </div>
                
                <md-list>
                    {navItems.map((item) => (
                                                                <Link key={item.href} href={item.href} passHref legacyBehavior>
                                                                    <md-list-item 
                                                                        type="link" 
                                                                        selected={pathname === item.href}
                                                                        style={{ 
                                                                            '--md-list-item-container-color': pathname === item.href 
                                                                                ? 'var(--md-sys-color-secondary-container)' 
                                                                                : 'transparent',
                                                                            '--md-list-item-label-text-color': pathname === item.href 
                                                                                ? 'var(--md-sys-color-on-secondary-container)' 
                                                                                : 'var(--md-sys-color-on-surface)',
                                                                            '--md-list-item-icon-color': pathname === item.href 
                                                                                ? 'var(--md-sys-color-on-secondary-container)' 
                                                                                : 'var(--md-sys-color-on-surface-variant)',
                                                                            transition: 'background-color 0.2s ease-in-out',
                                                                        }}
                                                                        // @ts-ignore
                                                                        onMouseEnter={(e) => {
                                                                            if (pathname !== item.href) {
                                                                                e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
                                                                            }
                                                                        }}
                                                                        // @ts-ignore
                                                                        onMouseLeave={(e) => {
                                                                            if (pathname !== item.href) {
                                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                            }
                                                                        }}
                                                                    >
                                                                        <md-icon slot="start">{item.icon}</md-icon>
                                                                        {item.label}
                                                                    </md-list-item>
                                                                </Link>                    ))}
                </md-list>
            </nav>
        </ClientOnlyWrapper>
    );
};

export default SideNav;