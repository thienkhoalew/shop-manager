import test from 'node:test';
import assert from 'node:assert/strict';

import { getProductSearchResults } from './product-search';

const products = [
  { id: '1', name: 'Son Kem Lì', salePrice: 120000 },
  { id: '2', name: 'Son Bóng Cherry', salePrice: 135000 },
  { id: '3', name: 'Kem Nền Glow', salePrice: 210000 },
];

test('getProductSearchResults matches product names case-insensitively', () => {
  const results = getProductSearchResults({
    products,
    query: 'sOn',
    selectedProductIds: [],
  });

  assert.deepEqual(results.map((product) => product.id), ['1', '2']);
});

test('getProductSearchResults excludes products already added to the order', () => {
  const results = getProductSearchResults({
    products,
    query: 'son',
    selectedProductIds: ['2'],
  });

  assert.deepEqual(results.map((product) => product.id), ['1']);
});

test('getProductSearchResults returns no results for blank queries', () => {
  const results = getProductSearchResults({
    products,
    query: '   ',
    selectedProductIds: [],
  });

  assert.deepEqual(results, []);
});
