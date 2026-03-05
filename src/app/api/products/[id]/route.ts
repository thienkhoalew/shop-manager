import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteImage, getPublicIdFromUrl } from '@/lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, basePrice, salePrice, imageUrl } = body;

        const oldProduct = await prisma.product.findUnique({ where: { id } });

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                basePrice: parseFloat(basePrice) || 0,
                salePrice: parseFloat(salePrice) || 0,
                imageUrl,
            },
        });

        // If imageUrl changed and there was an old one, delete from Cloudinary
        if (imageUrl !== oldProduct?.imageUrl && oldProduct?.imageUrl) {
            const publicId = getPublicIdFromUrl(oldProduct.imageUrl);
            if (publicId) {
                await deleteImage(publicId);
            }
        }

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Failed to update product:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check if product is in any orders
        const orderCount = await prisma.orderItem.count({
            where: { productId: id }
        });

        if (orderCount > 0) {
            return NextResponse.json({
                error: "Sản phẩm này đang có trong đơn hàng, không thể xóa. Vui lòng xóa đơn hàng trước."
            }, { status: 400 });
        }

        // Delete image from Cloudinary if exists
        if (product.imageUrl) {
            const publicId = getPublicIdFromUrl(product.imageUrl);
            if (publicId) {
                await deleteImage(publicId);
            }
        }

        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
