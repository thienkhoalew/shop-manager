'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InvoicePrintControls() {
    return (
        <div className="flex items-center justify-between gap-3 print:hidden">
            <Button asChild variant="outline">
                <Link href="/orders" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {'Quay lai don hang'}
                </Link>
            </Button>
            <Button onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" />
                {'In lai'}
            </Button>
        </div>
    );
}
