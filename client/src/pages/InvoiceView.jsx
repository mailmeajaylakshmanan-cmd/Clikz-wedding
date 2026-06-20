// Required install: pnpm add html2pdf.js
// (or: npm install html2pdf.js)

import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, AtSign, MapPin, Calendar,
  Printer, MessageCircle, Pencil, CheckCircle2,
  CreditCard, ChevronDown, Film,
} from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import clikzLogo from '../assets/clikz_logo.png';

// ─── helpers ───────────────────────────────────────────────────────────────
function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function fmtDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Invoice / event dates may be ISO strings or free text like "21/05/2026 & 24/06/2026". */
function displayDate(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
    const formatted = fmtDate(d);
    if (formatted) return formatted;
  }
  return String(d);
}

const STATUS = {
  draft:   { dot: '#9ca3af', bg: '#f3f4f6', text: '#4b5563', label: 'Draft' },
  sent:    { dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', label: 'Sent' },
  partial: { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309', label: 'Partial' },
  paid:    { dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', label: 'Paid' },
};

function buildPayments(invoice) {
  if (invoice.payments?.length > 0) return invoice.payments;

  const payments = [];
  if (Number(invoice.advancePaid) > 0) {
    payments.push({
      date: invoice.advancePaymentDate || invoice.date,
      method: invoice.advancePaymentMethod || 'Cash',
      amount: invoice.advancePaid,
    });
  }
  if (Number(invoice.totalPaid) > 0) {
    payments.push({
      date: invoice.totalPaymentDate || invoice.date,
      method: invoice.totalPaymentMethod || 'Cash',
      amount: invoice.totalPaid,
    });
  }
  return payments;
}

function sumPayments(payments) {
  return payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
}

// ─── component ─────────────────────────────────────────────────────────────
export default function InvoiceView() {
  const { id }         = useParams();
  const printRef       = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.get('/invoices/' + id).then(res => setInvoice(res.data));
  }, [id]);

  async function updateStatus(status) {
    await api.patch('/invoices/' + id + '/status', { status });
    setInvoice(inv => ({ ...inv, status }));
    toast.success('Status updated to ' + status);
  }

  function handlePrint() { window.print(); }

  async function handleWhatsApp() {
    if (!invoice) return;
    setSharing(true);
    try {
      // Dynamically import html2pdf so it doesn't affect initial bundle
      const html2pdf = (await import('html2pdf.js')).default;

      const el = printRef.current;
      const opt = {
        margin:      [10, 10, 10, 10],
        filename:    `CLIKZ-Invoice-${invoice.invoiceNo}.pdf`,
        image:       { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      const pdfBlob = await html2pdf().set(opt).from(el).outputPdf('blob');
      const file    = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

      // Web Share API — works on Android Chrome / Safari iOS to share directly to WhatsApp
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo} — CLIKZ Wedding Films`,
          files: [file],
        });
      } else {
        // Desktop fallback: download PDF, then open WhatsApp with a summary message
        const url = URL.createObjectURL(file);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = opt.filename;
        a.click();
        URL.revokeObjectURL(url);

        const payments = buildPayments(invoice);
        const totalPaid = sumPayments(payments) || Number(invoice.advancePaid) || 0;
        const msg = encodeURIComponent(
          `Hi ${invoice.customer.name}!\n\nPlease find your invoice *${invoice.invoiceNo}* from CLIKZ Wedding Films attached.\n\n` +
          `Event: ${invoice.event || 'N/A'}\nLocation: ${invoice.location || 'N/A'}\n\n` +
          `Total: ${fmt(invoice.total)}\nPaid: ${fmt(totalPaid)}\n` +
          (invoice.balance > 0 ? `Balance Due: ${fmt(invoice.balance)}\n` : '') +
          `\nGrateful to be part of your celebration!\nCLIKZ Wedding Films • +91 9994122652`
        );
        window.open('https://wa.me/91' + invoice.customer.phone + '?text=' + msg, '_blank');
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Could not generate PDF');
    } finally {
      setSharing(false);
    }
  }

  if (!invoice) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #c0556e', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const st         = STATUS[invoice.status] ?? STATUS.draft;
  const date       = fmtDate(invoice.date);
  const eventDate  = displayDate(invoice.eventDate);
  const payments   = buildPayments(invoice);
  const totalPaid  = sumPayments(payments) || Number(invoice.advancePaid) || 0;
  const hasBalance = invoice.balance > 0;
  const showTerms = invoice.showTerms ?? invoice.eventCategory?.showTerms ?? true;
  const termsText = invoice.termsAndConditions || invoice.eventCategory?.termsAndConditions || '';
  const categoryName = invoice.eventCategoryName || invoice.eventCategory?.name || '';

  return (
    <div>
      {/* ── Action bar (hidden on print) ── */}
      <div className="print:hidden" style={bar.wrap}>
        <div style={bar.left}>
          <Link to="/invoices" style={bar.back}>
            <ArrowLeft size={14} />
            <span>Invoices</span>
          </Link>
          <span style={bar.sep}>/</span>
          <span style={bar.title}>{invoice.invoiceNo}</span>
          <span style={{ ...bar.badge, background: st.bg, color: st.text }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
            {st.label}
          </span>
        </div>

        <div style={bar.right}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={invoice.status}
              onChange={e => updateStatus(e.target.value)}
              style={bar.select}
            >
              {Object.entries(STATUS).map(([v, s]) => (
                <option key={v} value={v}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
          </div>

          <button onClick={handleWhatsApp} disabled={sharing} style={{ ...bar.btn, background: '#25d366', color: '#fff', borderColor: '#25d366', opacity: sharing ? 0.7 : 1 }}>
            <MessageCircle size={14} />
            {sharing ? 'Generating PDF…' : 'Share PDF'}
          </button>

          <button onClick={handlePrint} style={bar.btn}>
            <Printer size={14} />
            Print
          </button>

          <Link to={`/invoices/${id}/edit`} style={{ ...bar.btn, background: '#c0556e', color: '#fff', borderColor: '#c0556e', textDecoration: 'none' }}>
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>

      {/* ── Invoice document ── */}
      <div
        id="invoice-print"
        ref={printRef}
        style={doc.wrap}
      >
        {/* Header band */}
        <div style={doc.headerBand}>
          <div style={doc.logoZone}>
            <img src={clikzLogo} alt="CLIKZ" style={doc.logo} />
            <div>
              <p style={doc.brandName}>CLIKZ WEDDING FILMS</p>
              <p style={doc.brandTagline}>Turning moments into memories</p>
            </div>
          </div>
          <div style={doc.invoiceMeta}>
            <p style={doc.invoiceWord}>INVOICE</p>
            <p style={doc.invoiceNum}>{invoice.invoiceNo}</p>
          </div>
        </div>

        {/* Sub-header: contact + dates */}
        <div style={doc.subHeader}>
          <div style={doc.contactRow}>
            <span style={doc.contactItem}><Phone size={11} color="#c0556e" />+91 9994122652</span>
            <span style={doc.contactItem}><Mail size={11} color="#c0556e" />clikzweddingfilms@gmail.com</span>
            <span style={doc.contactItem}><AtSign size={11} color="#c0556e" />clikz_.photography</span>
          </div>
          <div style={doc.dateCol}>
            <span style={doc.dateItem}><Calendar size={11} color="#c0556e" /><b>Date:</b>{date}</span>
          </div>
        </div>

        {/* Bill-to card */}
        <div style={doc.billCard}>
          <p style={doc.sectionLabel}>Bill To</p>
          <div style={doc.billGrid}>
            <div style={doc.billField}>
              <span style={doc.fieldLabel}>Customer</span>
              <span style={doc.fieldValue}>{invoice.customer.name}</span>
            </div>
            <div style={doc.billField}>
              <span style={doc.fieldLabel}>
                <Phone size={10} color="#c0556e" /> Phone
              </span>
              <span style={doc.fieldValue}>{invoice.customer.phone}</span>
            </div>
            {categoryName && (
              <div style={doc.billField}>
                <span style={doc.fieldLabel}>Category</span>
                <span style={doc.fieldValue}>{categoryName}</span>
              </div>
            )}
            {invoice.event && (
              <div style={doc.billField}>
                <span style={doc.fieldLabel}>Event</span>
                <span style={doc.fieldValue}>{invoice.event}</span>
              </div>
            )}
            {eventDate && (
              <div style={doc.billField}>
                <span style={doc.fieldLabel}>
                  <Calendar size={10} color="#c0556e" /> Event Date
                </span>
                <span style={doc.fieldValue}>{eventDate}</span>
              </div>
            )}
            {invoice.location && (
              <div style={{ ...doc.billField, gridColumn: '1 / -1' }}>
                <span style={doc.fieldLabel}>
                  <MapPin size={10} color="#c0556e" /> Location
                </span>
                <span style={doc.fieldValue}>{invoice.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Services table */}
        <div style={doc.tableWrap}>
          <table style={doc.table}>
            <thead>
              <tr>
                <th style={{ ...doc.th, textAlign: 'left', width: '22%', borderRadius: '8px 0 0 0' }}>Service</th>
                <th style={{ ...doc.th, textAlign: 'left', width: '38%' }}>Description</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '20%' }}>Price (₹)</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '20%', borderRadius: '0 8px 0 0' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f9' }}>
                  <td style={{ ...doc.td, fontWeight: 600, color: '#1c1520' }}>{s.service || '—'}</td>
                  <td style={{ ...doc.tdDesc, color: s.description ? '#444' : '#b8a8ae' }}>
                    {s.description?.trim() || '—'}
                  </td>
                  <td style={{ ...doc.td, textAlign: 'right', color: '#444', fontVariantNumeric: 'tabular-nums' }}>
                    {Number(s.price || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ ...doc.td, textAlign: 'right', fontWeight: 600, color: '#1c1520', fontVariantNumeric: 'tabular-nums' }}>
                    {Number(s.total || s.price || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div style={doc.tableWrap}>
            <div style={doc.sectionHeading}>
              <CreditCard size={12} color="#c0556e" />
              <span>Payment History</span>
            </div>
            <table style={{ ...doc.table, marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ ...doc.th, textAlign: 'left',  borderRadius: '8px 0 0 0', fontSize: 11 }}>Date</th>
                  <th style={{ ...doc.th, textAlign: 'center', fontSize: 11 }}>Method</th>
                  <th style={{ ...doc.th, textAlign: 'right', borderRadius: '0 8px 0 0', fontSize: 11 }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8f9' }}>
                    <td style={doc.td}>{fmtDate(p.date)}</td>
                    <td style={{ ...doc.td, textAlign: 'center', textTransform: 'capitalize', color: '#6b5c63' }}>{p.method || 'Cash'}</td>
                    <td style={{ ...doc.td, textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div style={doc.totalsWrap}>
          <div style={doc.totalsBox}>
            <div style={doc.totalRow}>
              <span style={doc.totalLabel}>Sub Total</span>
              <span style={doc.totalVal}>{fmt(invoice.subTotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div style={doc.totalRow}>
                <span style={doc.totalLabel}>Discount</span>
                <span style={{ ...doc.totalVal, color: '#22c55e' }}>− {fmt(invoice.discount)}</span>
              </div>
            )}
            <div style={{ ...doc.totalRow, borderTop: '2px solid #e4d8db', paddingTop: 10, marginTop: 4 }}>
              <span style={{ ...doc.totalLabel, fontWeight: 700, color: '#1c1520', fontSize: 14 }}>Total Amount</span>
              <span style={{ ...doc.totalVal, fontWeight: 700, color: '#1c1520', fontSize: 14 }}>{fmt(invoice.total)}</span>
            </div>
            <div style={doc.totalRow}>
              <span style={doc.totalLabel}>
                {Number(invoice.advancePaid) > 0 && Number(invoice.totalPaid) > 0
                  ? 'Total Paid'
                  : Number(invoice.advancePaid) > 0
                    ? 'Advance Paid'
                    : Number(invoice.totalPaid) > 0
                      ? 'Paid'
                      : 'Advance Paid'}
              </span>
              <span style={{ ...doc.totalVal, color: '#3b82f6' }}>{fmt(totalPaid)}</span>
            </div>
            {hasBalance ? (
              <div style={doc.balanceDue}>
                <span style={{ fontWeight: 700, color: '#9b2c44' }}>Balance Due</span>
                <span style={{ fontWeight: 700, color: '#c0556e', fontSize: 15 }}>{fmt(invoice.balance)}</span>
              </div>
            ) : (
              <div style={doc.paidFull}>
                <CheckCircle2 size={14} color="#22c55e" />
                <span style={{ color: '#15803d', fontWeight: 600, fontSize: 12 }}>Fully Paid</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <p style={doc.notes}>{invoice.notes}</p>
        )}

        {/* Terms & Conditions — only for event categories (not photo products) */}
        {showTerms && termsText && (
          <div style={doc.termsBox}>
            <p style={doc.termsTitle}>Terms &amp; Conditions</p>
            <div style={doc.termsBody}>
              {termsText.split('\n').filter(Boolean).map(function (line, i) {
                return <p key={i} style={doc.termsLine}>{line.trim()}</p>;
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={doc.footer}>
          <Film size={13} color="#c0556e" style={{ flexShrink: 0 }} />
          <span>Thank you for choosing <strong>CLIKZ Wedding Films</strong> — we're honoured to be part of your story.</span>
        </div>
      </div>

      {/* Print / PDF styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          #invoice-print {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── action bar styles ──────────────────────────────────────────────────────
const bar = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  left:  { display: 'flex', alignItems: 'center', gap: 10 },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  back: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 13, color: '#888', textDecoration: 'none',
  },
  sep:   { color: '#ddd', fontSize: 13 },
  title: { fontSize: 16, fontWeight: 600, color: '#1c1520' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '0 14px', height: 34, borderRadius: 8,
    border: '0.5px solid #e4d8db', background: '#fff',
    fontSize: 12, fontWeight: 500, color: '#444',
    cursor: 'pointer', textDecoration: 'none',
  },
  select: {
    appearance: 'none', paddingRight: 28,
    padding: '0 28px 0 12px', height: 34, borderRadius: 8,
    border: '0.5px solid #e4d8db', background: '#fff',
    fontSize: 12, color: '#444', cursor: 'pointer',
  },
};

// ─── invoice document styles ────────────────────────────────────────────────
const doc = {
  wrap: {
    maxWidth: 760, margin: '0 auto',
    background: '#fff', borderRadius: 14,
    boxShadow: '0 2px 24px rgba(28,21,32,0.08)',
    overflow: 'hidden', fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
  },

  // rose top band
  headerBand: {
    background: '#1c1520',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '22px 32px',
  },
  logoZone: { display: 'flex', alignItems: 'center', gap: 14 },
  logo: { height: 48, width: 'auto', objectFit: 'contain' },
  brandName: { fontSize: 15, fontWeight: 700, color: '#f5eef0', letterSpacing: '0.06em', margin: 0 },
  brandTagline: { fontSize: 10, color: '#6b5c63', fontStyle: 'italic', margin: '2px 0 0', letterSpacing: '0.04em' },
  invoiceMeta: { textAlign: 'right' },
  invoiceWord: { fontSize: 11, fontWeight: 700, color: '#c0556e', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 },
  invoiceNum: { fontSize: 22, fontWeight: 700, color: '#f5eef0', margin: '4px 0 0', letterSpacing: '0.04em' },

  // contact strip
  subHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
    padding: '12px 32px', background: '#fdf8f9', borderBottom: '1px solid #f0e6e9',
  },
  contactRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  contactItem: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b5c63', whiteSpace: 'nowrap' },
  dateCol: { display: 'flex', alignItems: 'center', marginLeft: 'auto' },
  dateItem: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b5c63' },

  // bill to
  billCard: {
    margin: '24px 32px 20px',
    background: '#fdf8f9', borderRadius: 10,
    border: '1px solid #f0e6e9', padding: '18px 22px',
  },
  sectionLabel: {
    fontSize: 9, fontWeight: 700, color: '#c0556e',
    letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 14px',
  },
  sectionHeading: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 9, fontWeight: 700, color: '#c0556e',
    letterSpacing: '0.18em', textTransform: 'uppercase',
    marginBottom: 12,
  },
  billGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14, columnGap: 40 },
  billField: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  fieldLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, color: '#9b8a90', fontWeight: 500, letterSpacing: '0.02em',
  },
  fieldValue: { fontSize: 13, color: '#1c1520', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' },

  // table
  tableWrap: { padding: '0 32px', marginBottom: 20, boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', boxSizing: 'border-box' },
  th: {
    background: '#c0556e', color: '#fff',
    padding: '11px 16px', fontSize: 11,
    fontWeight: 600, letterSpacing: '0.04em',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid #f0e6e9', verticalAlign: 'middle' },
  tdDesc: {
    padding: '12px 16px', borderBottom: '1px solid #f0e6e9', verticalAlign: 'middle',
    fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word',
  },

  // totals
  totalsWrap: { display: 'flex', justifyContent: 'flex-end', padding: '0 32px 20px', boxSizing: 'border-box' },
  totalsBox: { width: '100%', maxWidth: 300 },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 0', borderBottom: '1px solid #f5eef0',
  },
  totalLabel: { fontSize: 13, color: '#6b5c63' },
  totalVal:   { fontSize: 13, fontWeight: 500, color: '#1c1520' },
  balanceDue: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, padding: '12px 16px',
    background: '#fef1f4', borderRadius: 8, border: '1px solid #f0c0cc',
  },
  paidFull: {
    display: 'flex', alignItems: 'center', gap: 6,
    marginTop: 10, padding: '8px 0',
  },

  // notes + footer
  notes: {
    margin: '0 32px 16px', padding: '14px 20px',
    background: '#fdf8f9', borderRadius: 8,
    fontSize: 12, color: '#9b8a90', fontStyle: 'italic', textAlign: 'center',
    boxSizing: 'border-box',
  },
  termsBox: {
    margin: '0 32px 20px', padding: '16px 20px',
    background: '#fafafa', borderRadius: 8,
    border: '1px solid #ececec', boxSizing: 'border-box',
  },
  termsTitle: {
    margin: '0 0 10px', fontSize: 10, fontWeight: 700,
    color: '#c0556e', letterSpacing: '0.14em', textTransform: 'uppercase',
  },
  termsBody: { margin: 0 },
  termsLine: {
    margin: '0 0 6px', fontSize: 10.5, lineHeight: 1.55,
    color: '#555', textAlign: 'left',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#1c1520', padding: '14px 32px',
    fontSize: 11, color: '#6b5c63', textAlign: 'center',
  },
};