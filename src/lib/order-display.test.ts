import test from 'node:test';
import assert from 'node:assert/strict';

import { getDisplayCodTotal, getDisplayProductTotal } from './order-display';

test('getDisplayProductTotal sums sale price by quantity without shipping', () => {
  const total = getDisplayProductTotal([
    { salePrice: 120000, quantity: 2 },
    { salePrice: 45000, quantity: 3 },
  ]);

  assert.equal(total, 375000);
});

test('getDisplayCodTotal subtracts deposit from product total only', () => {
  const cod = getDisplayCodTotal({
    items: [
      { salePrice: 120000, quantity: 2 },
      { salePrice: 45000, quantity: 3 },
    ],
    depositAmount: 100000,
  });

  assert.equal(cod, 275000);
});

test('getDisplayCodTotal clamps to zero when deposit is larger than product total', () => {
  const cod = getDisplayCodTotal({
    items: [{ salePrice: 50000, quantity: 1 }],
    depositAmount: 70000,
  });

  assert.equal(cod, 0);
});
