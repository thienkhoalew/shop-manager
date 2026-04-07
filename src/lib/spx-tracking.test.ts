import assert from 'node:assert/strict';
import test from 'node:test';

import { mapSpxStatusToOrderStatus } from './spx-tracking';

test('mapSpxStatusToOrderStatus marks delivered statuses as DONE', () => {
  const status = mapSpxStatusToOrderStatus({
    currentStatus: 'Đã giao thành công',
    providerSubgroup: 'Delivered',
  });

  assert.equal(status, 'DONE');
});

test('mapSpxStatusToOrderStatus marks transit statuses as SHIPPING', () => {
  const status = mapSpxStatusToOrderStatus({
    currentStatus: 'Đang vận chuyển',
    events: [{ message: 'In transit to delivery hub' }],
  });

  assert.equal(status, 'SHIPPING');
});

test('mapSpxStatusToOrderStatus marks pickup statuses as WAITING_FOR_GOODS', () => {
  const status = mapSpxStatusToOrderStatus({
    currentStatus: 'Chờ lấy hàng',
  });

  assert.equal(status, 'WAITING_FOR_GOODS');
});
