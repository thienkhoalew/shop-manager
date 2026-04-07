import { deleteImage, getPublicIdFromUrl } from '@/lib/cloudinary';
import prisma from '@/lib/prisma';
import { fetchSpxTracking, withSpxBrowser } from '@/lib/spx-tracking';

type SyncOutcome = 'updated' | 'skipped' | 'failed';

export type SpxSyncResultItem = {
  orderId: string;
  trackingCode: string | null;
  outcome: SyncOutcome;
  providerStatus?: string | null;
  internalStatus?: string | null;
  sourceUrl?: string | null;
  message?: string;
};

export type SyncSpxOrdersResult = {
  syncedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  results: SpxSyncResultItem[];
};

export type SyncSpxOrdersOptions = {
  orderId?: string;
  limit?: number;
};

async function cleanupReceiptImage(orderId: string, receiptImage: string | null) {
  if (!receiptImage) {
    return;
  }

  try {
    const publicId = getPublicIdFromUrl(receiptImage);
    if (!publicId) {
      return;
    }

    await deleteImage(publicId);
    await prisma.order.update({
      where: { id: orderId },
      data: { receiptImage: null },
    });
  } catch (error) {
    console.error(`Failed to delete Cloudinary receipt for order ${orderId}:`, error);
  }
}

export async function syncSpxOrders(options: SyncSpxOrdersOptions = {}): Promise<SyncSpxOrdersResult> {
  const orderId = options.orderId?.trim();
  const rawLimit = options.limit ?? 20;
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 20;

  const orders = await prisma.order.findMany({
    where: orderId
      ? {
          id: orderId,
          trackingCode: { not: null },
        }
      : {
          status: 'SHIPPING',
          trackingCode: { not: null },
        },
    orderBy: { updatedAt: 'asc' },
    take: limit,
  });

  if (orders.length === 0) {
    return {
      syncedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      results: [],
    };
  }

  const results = await withSpxBrowser(async (browser, context) => {
    const output: SpxSyncResultItem[] = [];

    for (const order of orders) {
      const trackingCode = order.trackingCode?.trim();
      if (!trackingCode) {
        output.push({
          orderId: order.id,
          trackingCode: null,
          outcome: 'skipped',
          message: 'Missing tracking code.',
        });
        continue;
      }

      const lookup = await fetchSpxTracking(trackingCode, browser, context);

      if (!lookup.ok) {
        output.push({
          orderId: order.id,
          trackingCode,
          outcome: 'failed',
          providerStatus: null,
          message: lookup.message,
        });
        continue;
      }

      if (lookup.delivered && order.status !== 'DONE') {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: { status: 'DONE' },
        });

        await cleanupReceiptImage(order.id, updatedOrder.receiptImage);

        output.push({
          orderId: order.id,
          trackingCode,
          outcome: 'updated',
          providerStatus: lookup.currentStatus,
          internalStatus: lookup.internalStatus,
          sourceUrl: lookup.sourceUrl,
        });
        continue;
      }

      output.push({
        orderId: order.id,
        trackingCode,
        outcome: 'skipped',
        providerStatus: lookup.currentStatus,
        internalStatus: lookup.internalStatus,
        sourceUrl: lookup.sourceUrl,
      });
    }

    return output;
  });

  return {
    syncedCount: results.length,
    updatedCount: results.filter((result) => result.outcome === 'updated').length,
    skippedCount: results.filter((result) => result.outcome === 'skipped').length,
    failedCount: results.filter((result) => result.outcome === 'failed').length,
    results,
  };
}
