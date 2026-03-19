import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const invoiceRoutePage = readFileSync('src/app/orders/[id]/invoice/page.tsx', 'utf8');
const invoiceDocument = readFileSync('src/components/orders/order-invoice-document.tsx', 'utf8');
const autoPrint = readFileSync('src/components/orders/invoice-auto-print.tsx', 'utf8');
const routePrintMode = readFileSync('src/components/orders/invoice-route-print-mode.tsx', 'utf8');
const ordersPage = readFileSync('src/app/orders/page.tsx', 'utf8');
const invoicePrintControlsBytes = readFileSync('src/components/orders/invoice-print-controls.tsx');
const globalsCss = readFileSync('src/app/globals.css', 'utf8');
const layout = readFileSync('src/app/layout.tsx', 'utf8');

test('invoice route renders order invoice document and order data lookup', () => {
  assert.match(invoiceRoutePage, /prisma\.order\.findUnique/);
  assert.match(invoiceRoutePage, /OrderInvoiceDocument/);
  assert.match(invoiceRoutePage, /InvoiceAutoPrint/);
  assert.match(invoiceRoutePage, /InvoiceRoutePrintMode/);
  assert.match(invoiceRoutePage, /className="invoice-route-root min-h-screen/);
});

test('invoice route auto-print helper prints within the same page context', () => {
  assert.match(autoPrint, /window\.print\(\)/);
  assert.match(autoPrint, /useEffect/);
});

test('order invoice document contains the expected order summary labels', () => {
  assert.match(invoiceDocument, /Tiền COD/);
  assert.match(invoiceDocument, /Tổng tiền hàng/);
  assert.match(invoiceDocument, /Phí vận chuyển/);
});

test('order invoice document accepts nullable customer phone values from Prisma', () => {
  assert.match(invoiceDocument, /customerPhone:\s*string\s*\|\s*null/);
});

test('orders page print action navigates to the dedicated invoice route', () => {
  assert.match(ordersPage, /router\.push\(`\/orders\/\$\{billOrder\.id\}\/invoice`\)/);
  assert.doesNotMatch(ordersPage, /printInvoiceFromElement/);
});

test('orders mobile card shows deposit and cod in summary tiles without duplicate inline row', () => {
  assert.doesNotMatch(ordersPage, /Trạng thái cọc/);
  assert.match(ordersPage, /Tiền COD/);
  assert.match(ordersPage, /Đặt cọc/);
  assert.match(ordersPage, /\{formatCurrency\(order\.depositAmount \|\| 0\)\}/);
  assert.match(ordersPage, /\{formatCurrency\(calculateCodTotal\(order\)\)\}/);
  assert.doesNotMatch(ordersPage, /flex items-center justify-between gap-4 rounded-\[1\.1rem\] border border-border\/60 bg-white\/72 px-4 py-3 text-sm/);
});

test('invoice print controls source is valid utf-8', () => {
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(invoicePrintControlsBytes);
  assert.match(decoded, /InvoicePrintControls/);
});

test('invoice route enables dedicated print mode class on body', () => {
  assert.match(routePrintMode, /document\.body\.classList\.add\('invoice-route-print'\)/);
  assert.match(routePrintMode, /document\.body\.classList\.remove\('invoice-route-print'\)/);
});

test('globals.css keeps route print wrappers visible during invoice printing', () => {
  assert.match(layout, /<body[\s\S]*<div className="relative flex min-h-\[100dvh\]/);
  assert.match(globalsCss, /body\.invoice-route-print > \* \{\s*display:\s*none !important;/);
  assert.match(globalsCss, /body\.invoice-route-print > div \{\s*display:\s*flex !important;/);
  assert.match(globalsCss, /body\.invoice-route-print > div > main \{\s*display:\s*block !important;/);
  assert.match(globalsCss, /body\.invoice-route-print > div > main > div > \*:not\(\.invoice-route-root\)/);
  assert.match(globalsCss, /\.invoice-route-root \{\s*display:\s*block !important;/);
});
