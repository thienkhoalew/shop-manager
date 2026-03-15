'use client';

import { useEffect } from 'react';

export function InvoiceAutoPrint() {
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            window.print();
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, []);

    return null;
}
