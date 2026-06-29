const fs = require('fs');
const path = 'c:\\\\Our-project\\\\clikz-wedding-bills\\\\clikz-wedding-billing\\\\client\\\\src\\\\pages\\\\InvoiceView.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix html2canvas scrollY
content = content.replace(
  /html2canvas: \{ scale: 2, useCORS: true \}/,
  `html2canvas: { scale: 2, useCORS: true, scrollY: -window.scrollY }`
);

// 2. Add classes to Payment History and Totals
content = content.replace(
  /\{\/\* Payment History \*\/\}\s*<div style=\{doc\.tableWrap\}>/,
  `{/* Payment History */}
          <div className="payment-history" style={doc.tableWrap}>`
);

content = content.replace(
  /\{\/\* Totals \*\/\}\s*<div style=\{doc\.totalsWrap\}>/,
  `{/* Totals */}
        <div className="totals-section" style={doc.totalsWrap}>`
);

// 3. Update style block
const newStyles = `      <style>{\`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 560px) {
          .invoice-parties { grid-template-columns: 1fr !important; }
        }
        .payment-history, .totals-section, .terms-page-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .terms-page-break {
          page-break-before: always;
          break-before: always;
        }
        @media print {
          .print\\\\:hidden { display: none !important; }
          .terms-page-break { margin-top: 40px !important; border: none !important; background: transparent !important; }
          #invoice-print {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      \`}</style>`;

content = content.replace(
  /<style>\{`[\s\S]*?`\}<\/style>/,
  newStyles
);

fs.writeFileSync(path, content);
console.log('Fixed PDF generation in InvoiceView.jsx');
