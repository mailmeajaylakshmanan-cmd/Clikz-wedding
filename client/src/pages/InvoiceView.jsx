import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, AtSign, MapPin, Calendar,
  Printer, MessageCircle, Pencil, CheckCircle2,
  CreditCard, ChevronDown, Film, Building2,
} from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import clikzLogo from '../assets/clikz_logo.png';
// ─── color palette ───────────────────────────────────────────────────────────
const C = {
  navy: '#0d1b2a',
  navyMid: '#1a3a5c',
  gold: '#b8960c',
  goldLight: '#f0c040',
  ink: '#0d1b2a',
  muted: '#556b7d',
  faint: '#e8eef3',
  border: '#d0dce6',
  white: '#ffffff',
  greenPaid: '#16a34a',
  bluePaid: '#1d4ed8',
  redBal: '#b91c1c',
};
// ─── helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}
function fmtDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function displayDate(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(String(d))) {
    const formatted = fmtDate(d);
    if (formatted) return formatted;
  }
  return String(d);
}
const STATUS = {
  draft: { dot: '#9ca3af', bg: '#f3f4f6', text: '#4b5563', label: 'Draft' },
  sent: { dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', label: 'Sent' },
  partial: { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309', label: 'Partial' },
  paid: { dot: '#16a34a', bg: '#f0fdf4', text: '#15803d', label: 'Paid' },
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
// ─── component ───────────────────────────────────────────────────────────────
export default function InvoiceView() {
  const { id } = useParams();
  const printRef = useRef(null);
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
      const html2pdf = (await import('html2pdf.js')).default;
      const el = printRef.current;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `CLIKZ-Invoice-${invoice.invoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      const pdfBlob = await new Promise((resolve, reject) => {
        // Yield to the main thread to allow "Generating PDF..." UI to render
        setTimeout(() => {
          html2pdf().set(opt).from(el).outputPdf('blob').then(resolve).catch(reject);
        }, 50);
      });
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo} — CLIKZ Wedding Films`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
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
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${C.gold}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  const st = STATUS[invoice.status] ?? STATUS.draft;
  const date = fmtDate(invoice.date);
  const eventDate = displayDate(invoice.eventDate);
  const payments = buildPayments(invoice);
  const totalPaid = sumPayments(payments) || Number(invoice.advancePaid) || 0;
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
          <Link to={`/invoices/${id}/edit`} style={{ ...bar.btn, background: C.navyMid, color: '#fff', borderColor: C.navyMid, textDecoration: 'none' }}>
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>
      {/* ── Invoice document ── */}
      <div id="invoice-print" ref={printRef} style={doc.wrap}>
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
            {date && (
              <p style={doc.invoiceDate}>
                <Calendar size={11} style={{ marginRight: 5, verticalAlign: -1.5 }} />
                {date}
              </p>
            )}
          </div>
        </div>
        {/* Gold accent rule */}
        <div style={doc.goldRule} />
        {/* Billed By / Bill To */}
        <div className="invoice-parties" style={doc.partiesWrap}>
          <div style={doc.partyCard}>
            <p style={doc.sectionLabel}>
              <Building2 size={11} style={{ verticalAlign: -2 }} /> BILLED BY
            </p>
            <p style={doc.partyName}>CLIKZ Wedding Films</p>
            <div style={doc.partyLines}>
              <span style={doc.partyLine}><Phone size={11} color={C.gold} />+91 9994122652</span>
              <span style={doc.partyLine}><Mail size={11} color={C.gold} />clikzweddingfilms@gmail.com</span>
              <span style={doc.partyLine}><AtSign size={11} color={C.gold} />clikz_.photography</span>
            </div>
          </div>
          <div style={doc.partyCard}>
            <p style={doc.sectionLabel}>BILL TO</p>
            <p style={doc.partyName}>{invoice.customer.name}</p>
            <div style={doc.partyLines}>
              <span style={doc.partyLine}><Phone size={11} color={C.gold} />{invoice.customer.phone}</span>
              {categoryName && (
                <span style={doc.partyLine}>{categoryName}{invoice.event ? ' · ' + invoice.event : ''}</span>
              )}
              {eventDate && (
                <span style={doc.partyLine}><Calendar size={11} color={C.gold} />{eventDate}</span>
              )}
              {invoice.location && (
                <span style={doc.partyLine}><MapPin size={11} color={C.gold} />{invoice.location}</span>
              )}
            </div>
          </div>
        </div>
        {/* Services table */}
        <div style={doc.tableWrap}>
          <div style={doc.sectionHeading}><span>SERVICES</span></div>
          <table style={doc.table}>
            <thead>
              <tr>
                <th style={{ ...doc.th, textAlign: 'left', width: '22%', borderRadius: '8px 0 0 8px' }}>Service</th>
                <th style={{ ...doc.th, textAlign: 'left', width: '38%' }}>Description</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '20%' }}>Price (₹)</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '20%', borderRadius: '0 8px 8px 0' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.faint }}>
                  <td style={{ ...doc.td, fontWeight: 600, color: C.ink }}>{s.service || '—'}</td>
                  <td style={{ ...doc.tdDesc, color: s.description ? '#334155' : '#94a3b8' }}>
                    {s.description?.trim() || '—'}
                  </td>
                  <td style={{ ...doc.td, textAlign: 'right', color: C.muted, fontVariantNumeric: 'tabular-nums' }}>
                    {Number(s.price || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ ...doc.td, textAlign: 'right', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
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
              <CreditCard size={12} color={C.gold} />
              <span>PAYMENT HISTORY</span>
            </div>
            <table style={{ ...doc.table, marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ ...doc.th, textAlign: 'left', borderRadius: '8px 0 0 8px', fontSize: 11 }}>Date</th>
                  <th style={{ ...doc.th, textAlign: 'center', fontSize: 11 }}>Method</th>
                  <th style={{ ...doc.th, textAlign: 'right', borderRadius: '0 8px 8px 0', fontSize: 11 }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.faint }}>
                    <td style={doc.td}>{fmtDate(p.date)}</td>
                    <td style={{ ...doc.td, textAlign: 'center', textTransform: 'capitalize', color: C.muted }}>{p.method || 'Cash'}</td>
                    <td style={{ ...doc.td, textAlign: 'right', fontWeight: 700, color: C.greenPaid, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.amount)}</td>
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
                <span style={{ ...doc.totalVal, color: C.greenPaid }}>− {fmt(invoice.discount)}</span>
              </div>
            )}
            <div style={{ borderTop: `2px solid ${C.navyMid}`, margin: '6px 0' }} />
            <div style={doc.totalRow}>
              <span style={{ ...doc.totalLabel, fontWeight: 700, color: C.ink, fontSize: 14 }}>Total Amount</span>
              <span style={{ ...doc.totalVal, fontWeight: 800, color: C.ink, fontSize: 14 }}>{fmt(invoice.total)}</span>
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
              <span style={{ ...doc.totalVal, color: C.bluePaid }}>{fmt(totalPaid)}</span>
            </div>
            {hasBalance ? (
              <div style={doc.balanceDue}>
                <span style={{ fontWeight: 700, color: C.redBal }}>Balance Due</span>
                <span style={{ fontWeight: 800, color: C.redBal, fontSize: 15 }}>{fmt(invoice.balance)}</span>
              </div>
            ) : (
              <div style={doc.paidFull}>
                <CheckCircle2 size={16} color={C.greenPaid} />
                <span style={{ color: C.greenPaid, fontWeight: 700, fontSize: 13 }}>Fully Paid</span>
              </div>
            )}
          </div>
        </div>
        {/* Notes */}
        {/* {invoice.notes && (
          <p style={doc.notes}>{invoice.notes}</p>
        )} */}
        {/* Terms & Conditions */}
        {showTerms && termsText && (
          <div style={doc.termsBox}>
            <p style={doc.termsTitle}>Terms &amp; Conditions</p>
            <div style={doc.termsBody}>
              {termsText.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} style={doc.termsLine}>{line.trim()}</p>
              ))}
            </div>
          </div>
        )}
        {/* Footer */}
        <div style={doc.footer}>
          <Film size={13} color={C.gold} style={{ flexShrink: 0 }} />
          <span>Thank you for choosing <strong style={{ color: C.white }}>CLIKZ Wedding Films</strong> — we're honoured to be part of your story.</span>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 560px) {
          .invoice-parties { grid-template-columns: 1fr !important; }
        }
        @media print {
          .print\\:hidden { display: none !important; }
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
// ─── action bar styles ────────────────────────────────────────────────────────
const bar = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  right: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  back: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', textDecoration: 'none' },
  sep: { color: '#ddd', fontSize: 13 },
  title: { fontSize: 16, fontWeight: 700, color: '#0d1b2a' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '0 14px', height: 34, borderRadius: 7,
    border: '1px solid #d0dce6', background: '#fff',
    fontSize: 12, fontWeight: 500, color: '#334155',
    cursor: 'pointer', textDecoration: 'none',
  },
  select: {
    appearance: 'none', padding: '0 28px 0 12px', height: 34, borderRadius: 7,
    border: '1px solid #d0dce6', background: '#fff',
    fontSize: 12, color: '#334155', cursor: 'pointer',
  },
};
// ─── invoice document styles ──────────────────────────────────────────────────
const SECTION_GAP = 28;
const PAGE_PAD = 32;
const doc = {
  wrap: {
    maxWidth: 780, margin: '0 auto',
    background: '#ffffff', borderRadius: 12,
    boxShadow: '0 4px 40px rgba(13,27,42,0.13)',
    overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box',
  },
  // dark navy header
  headerBand: {
    background: '#0d1b2a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: `28px ${PAGE_PAD}px`,
  },
  logoZone: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { height: 48, width: 'auto', objectFit: 'contain' },
  brandName: { fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em', margin: 0 },
  brandTagline: { fontSize: 10, color: '#8ba7be', fontStyle: 'italic', margin: '4px 0 0', letterSpacing: '0.05em' },
  invoiceMeta: { textAlign: 'right' },
  invoiceWord: { fontSize: 10, fontWeight: 700, color: '#b8960c', letterSpacing: '0.28em', textTransform: 'uppercase', margin: 0 },
  invoiceNum: { fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '5px 0 0', letterSpacing: '0.03em' },
  invoiceDate: { fontSize: 11, color: '#8ba7be', margin: '6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  // gold gradient accent line
  goldRule: {
    height: 3,
    background: 'linear-gradient(90deg, #b8960c 0%, #f0c040 50%, #b8960c 100%)',
  },
  // billed by / bill to
  partiesWrap: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
    margin: `${SECTION_GAP}px ${PAGE_PAD}px`,
    boxSizing: 'border-box',
  },
  partyCard: {
    background: '#f8fafc', borderRadius: 10,
    border: '1px solid #d0dce6', padding: '18px 20px',
    boxSizing: 'border-box', minWidth: 0,
  },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 9.5, fontWeight: 800, color: '#b8960c',
    letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 10px',
  },
  sectionHeading: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 9.5, fontWeight: 800, color: '#1a3a5c',
    letterSpacing: '0.18em', textTransform: 'uppercase',
    marginBottom: 10,
  },
  partyName: { fontSize: 14, fontWeight: 700, color: '#0d1b2a', margin: '0 0 10px', lineHeight: 1.3, wordBreak: 'break-word' },
  partyLines: { display: 'flex', flexDirection: 'column', gap: 6 },
  partyLine: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#556b7d', lineHeight: 1.4, wordBreak: 'break-word' },
  // tables
  tableWrap: { padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', boxSizing: 'border-box' },
  th: {
    background: '#1a3a5c', color: '#ffffff',
    padding: '11px 16px', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.04em',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid #d0dce6', verticalAlign: 'middle' },
  tdDesc: { padding: '12px 16px', borderBottom: '1px solid #d0dce6', verticalAlign: 'middle', fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word' },
  // totals
  totalsWrap: { display: 'flex', justifyContent: 'flex-end', padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box', pageBreakInside: 'avoid' },
  totalsBox: { width: '100%', maxWidth: 300 },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #e8eef3' },
  totalLabel: { fontSize: 13, color: '#556b7d' },
  totalVal: { fontSize: 13, fontWeight: 500, color: '#0d1b2a', fontVariantNumeric: 'tabular-nums' },
  balanceDue: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, padding: '12px 16px',
    background: '#fff1f2', borderRadius: 8, border: '1.5px solid #fecdd3',
  },
  paidFull: { display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, padding: '8px 0' },
  // notes + terms + footer
  notes: {
    margin: `0 ${PAGE_PAD}px ${SECTION_GAP}px`, padding: '14px 20px',
    background: '#f8fafc', borderRadius: 8,
    borderLeft: '4px solid #b8960c',
    fontSize: 12, color: '#556b7d', fontStyle: 'italic',
    boxSizing: 'border-box',
  },
  termsBox: {
    margin: `0 ${PAGE_PAD}px ${SECTION_GAP}px`, padding: '16px 20px',
    background: '#f8fafc', borderRadius: 8,
    border: '1px solid #d0dce6', boxSizing: 'border-box', pageBreakInside: 'avoid'
  },
  termsTitle: { margin: '0 0 10px', fontSize: 10, fontWeight: 800, color: '#1a3a5c', letterSpacing: '0.16em', textTransform: 'uppercase' },
  termsBody: { margin: 0 },
  termsLine: { margin: '0 0 5px', fontSize: 11, lineHeight: 1.6, color: '#475569' },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#0d1b2a', borderTop: '3px solid #b8960c',
    padding: `18px ${PAGE_PAD}px`,
    fontSize: 11, color: '#8ba7be', textAlign: 'center',
  },
};