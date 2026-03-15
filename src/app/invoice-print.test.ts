import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildInvoicePrintDocument } from '../lib/print-invoice';

const newOrderPage = readFileSync('src/app/orders/new/page.tsx', 'utf8');
const printInvoiceSource = readFileSync('src/lib/print-invoice.ts', 'utf8');

test('buildInvoicePrintDocument wraps invoice content in a printable document', () => {
  const html = buildInvoicePrintDocument({
    title: 'Hoa don ban hang',
    invoiceHtml: '<section id="bill-content">Invoice body</section>',
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<title>Hoa don ban hang<\/title>/);
  assert.match(html, /<body class="invoice-print-document">/);
  assert.match(html, /<div class="invoice-print-shell">/);
  assert.match(html, /<section id="bill-content">Invoice body<\/section>/);
  assert.match(html, /@page\s*\{/);
  assert.match(html, /\.invoice-print-document\s+#bill-content/);
});

test('new order page still prints through the isolated invoice helper', () => {
  assert.match(newOrderPage, /printInvoiceFromElement/);
  assert.doesNotMatch(newOrderPage, /window\.print\(\)/);
});

test('print helper does not open a noopener blank tab that cannot be populated', () => {
  assert.doesNotMatch(printInvoiceSource, /noopener,noreferrer/);
  assert.match(printInvoiceSource, /window\.open\('about:blank', '_blank'\)/);
});
