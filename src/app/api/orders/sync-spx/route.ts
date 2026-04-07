import { NextResponse } from 'next/server';

import { syncSpxOrders } from '@/lib/spx-sync';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: Request) {
  const secret = process.env.SPX_SYNC_SECRET;
  if (!secret) {
    return true;
  }

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const headerSecret = request.headers.get('x-sync-secret');
  return bearer === secret || headerSecret === secret;
}

async function syncOrders(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const url = new URL(request.url);
    const orderId = String(body.orderId ?? url.searchParams.get('orderId') ?? '').trim();
    const limitValue = Number(body.limit ?? url.searchParams.get('limit') ?? 20);
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(limitValue, 50)) : 20;
    const result = await syncSpxOrders({ orderId, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to sync SPX orders:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync SPX orders',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return syncOrders(request);
}

export async function POST(request: Request) {
  return syncOrders(request);
}
