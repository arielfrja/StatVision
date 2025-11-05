'use client';

import React, { useState, useEffect } from 'react';

/**
 * A wrapper component that ensures its children are only rendered after the component
 * has mounted on the client side. This is used to prevent Hydration Mismatch errors
 * when dealing with custom elements (like Material Web Components) or components
 * that rely on client-side APIs (like window or usePathname).
 */
const ClientOnlyWrapper = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return <>{children}</>;
};

export default ClientOnlyWrapper;