import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, basePrice, salePrice, imageUrl } = body;

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                basePrice: parseFloat(basePrice) || 0,
                salePrice: parseFloat(salePrice) || 0,
                imageUrl,
            },
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error("Failed to create product:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
