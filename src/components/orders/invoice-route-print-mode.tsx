'use client';

import { useEffect } from 'react';

export function InvoiceRoutePrintMode() {
    useEffect(() => {
        document.body.classList.add('invoice-route-print');

        return () => {
            document.body.classList.remove('invoice-route-print');
        };
    }, []);

    return null;
}
