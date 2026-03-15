type BuildInvoicePrintDocumentOptions = {
  title: string;
  invoiceHtml: string;
  headMarkup?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getPrintableHeadMarkup() {
  if (typeof document === 'undefined') {
    return '';
  }

  return Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
}

export function buildInvoicePrintDocument({
  title,
  invoiceHtml,
  headMarkup = '',
}: BuildInvoicePrintDocumentOptions) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${headMarkup}
    <style>
      @page {
        size: auto;
        margin: 12mm;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      .invoice-print-document {
        min-height: 100vh;
        background: #ffffff;
      }

      .invoice-print-document #bill-content {
        width: 100%;
        max-width: 820px;
        margin: 0 auto;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .invoice-print-document #bill-content * {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body class="invoice-print-document">
    <div class="invoice-print-shell">
      ${invoiceHtml}
    </div>
  </body>
</html>`;
}

export function printInvoiceFromElement(element: HTMLElement | null, title = 'Hoa don ban hang') {
  if (typeof window === 'undefined' || !element) {
    return false;
  }

  const printWindow = window.open('about:blank', '_blank');
  if (!printWindow) {
    return false;
  }

  const printableHtml = buildInvoicePrintDocument({
    title,
    invoiceHtml: element.outerHTML,
    headMarkup: getPrintableHeadMarkup(),
  });

  printWindow.document.open();
  printWindow.document.write(printableHtml);
  printWindow.document.close();

  const waitUntilReady = () => {
    if (printWindow.document.readyState !== 'complete') {
      window.setTimeout(waitUntilReady, 50);
      return;
    }

    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  waitUntilReady();

  return true;
}
