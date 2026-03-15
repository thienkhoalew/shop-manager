import { notFound } from 'next/navigation';
import { InvoiceAutoPrint } from '@/components/orders/invoice-auto-print';
import { InvoiceRoutePrintMode } from '@/components/orders/invoice-route-print-mode';
import { OrderInvoiceDocument } from '@/components/orders/order-invoice-document';
import { InvoicePrintControls } from '@/components/orders/invoice-print-controls';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            orderItems: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!order) {
        notFound();
    }

    return (
        <div className="invoice-route-root min-h-screen bg-slate-100 print:bg-white">
            <InvoiceRoutePrintMode />
            <InvoiceAutoPrint />
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 print:max-w-none print:px-0 print:py-0">
                <InvoicePrintControls />

                <div className="invoice-print-shell">
                    <OrderInvoiceDocument order={order} />
                </div>
            </div>
        </div>
    );
}

