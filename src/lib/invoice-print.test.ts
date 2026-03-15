import test from 'node:test';
import assert from 'node:assert/strict';

import { buildInvoicePrintDocument } from './print-invoice';

test('buildInvoicePrintDocument injects stylesheet markup and invoice content into a printable document', () => {
  const html = buildInvoicePrintDocument({
    title: 'Hoa Don',
    headMarkup: '<style>.invoice { color: red; }</style>',
    invoiceHtml: '<section id="bill-content" class="invoice">Hello invoice</section>',
  });

  assert.match(html, /<title>Hoa Don<\/title>/);
  assert.match(html, /<style>\.invoice \{ color: red; \}<\/style>/);
  assert.match(html, /<section id="bill-content" class="invoice">Hello invoice<\/section>/);
  assert.match(html, /class="invoice-print-shell"/);
});
