import 'dotenv/config';

import { syncSpxOrders } from '@/lib/spx-sync';

async function main() {
  const limitValue = process.env.SPX_SYNC_LIMIT ? Number(process.env.SPX_SYNC_LIMIT) : 20;
  const result = await syncSpxOrders({
    limit: Number.isFinite(limitValue) ? limitValue : 20,
  });

  const now = new Date().toLocaleString('vi-VN', { hour12: false });
  console.log(`[${now}] SPX sync completed`);
  console.log(JSON.stringify(result, null, 2));

  if (result.failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('SPX sync failed:', error);
  process.exit(1);
});
