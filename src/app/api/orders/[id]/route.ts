import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteImage, getPublicIdFromUrl } from '@/lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            status,
            trackingCode,
            customerName,
            customerPhone,
            customerAddress,
            shippingFee,
            hasDeposit,
            depositAmount,
            receiptImage,
            items // Array of { productId, quantity, price }
        } = body;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // If only status/trackingCode are provided (old behavior)
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (trackingCode !== undefined) updateData.trackingCode = trackingCode;
        if (customerName !== undefined) updateData.customerName = customerName;
        if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
        if (customerAddress !== undefined) updateData.customerAddress = customerAddress;
        if (shippingFee !== undefined) updateData.shippingFee = parseFloat(shippingFee || 0);
        if (hasDeposit !== undefined) updateData.hasDeposit = hasDeposit;
        if (depositAmount !== undefined) updateData.depositAmount = depositAmount ? parseFloat(depositAmount) : null;
        if (receiptImage !== undefined) updateData.receiptImage = receiptImage;

        // If items are provided, replace them
        if (items) {
            updateData.orderItems = {
                deleteMany: {},
                create: items.map((item: any) => ({
                    productId: item.productId,
                    quantity: parseInt(item.quantity, 10),
                    price: parseFloat(item.price),
                }))
            };
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: updateData,
        });

        // If receiptImage changed and there was an old one, delete from Cloudinary
        if (receiptImage !== undefined && receiptImage !== order.receiptImage && order.receiptImage) {
            const publicId = getPublicIdFromUrl(order.receiptImage);
            if (publicId) {
                await deleteImage(publicId);
            }
        }

        // If status is DONE AND there is a receiptImage, delete the image
        if (status === 'DONE' && updatedOrder.receiptImage) {
            try {
                const publicId = getPublicIdFromUrl(updatedOrder.receiptImage);
                if (publicId) {
                    await deleteImage(publicId);
                    console.log(`Physically deleted receipt image from Cloudinary: ${publicId}`);
                    await prisma.order.update({
                        where: { id },
                        data: { receiptImage: null }
                    });
                }
            } catch (err) {
                console.error("Failed to delete receipt image from Cloudinary:", err);
            }
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Failed to update order:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        // Delete receipt image from Cloudinary if exists
        if (order.receiptImage) {
            try {
                const publicId = getPublicIdFromUrl(order.receiptImage);
                if (publicId) {
                    await deleteImage(publicId);
                }
            } catch (err) {
                console.error("Failed to delete Cloudinary file on order delete:", err);
            }
        }

        await prisma.order.delete({ where: { id } });
        return NextResponse.json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Failed to delete order:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
