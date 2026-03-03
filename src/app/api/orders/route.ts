import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            customerName,
            customerPhone,
            customerAddress,
            shippingFee,
            hasDeposit,
            depositAmount,
            receiptImage,
            items // Array of { productId, quantity, price }
        } = body;

        const newOrder = await prisma.order.create({
            data: {
                customerName,
                customerPhone,
                customerAddress,
                shippingFee: parseFloat(shippingFee || 0),
                hasDeposit,
                depositAmount: depositAmount ? parseFloat(depositAmount) : null,
                receiptImage,
                orderItems: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity, 10),
                        price: parseFloat(item.price), // Snapshot price
                    }))
                }
            }
        });

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error) {
        console.error("Failed to create order:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
