import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, AtSign, MapPin, Calendar,
  Printer, MessageCircle, Pencil, CheckCircle2,
  CreditCard, ChevronDown, Film, Building2, Camera
} from 'lucide-react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import clikzLogo from '../assets/clikz_logo.png';

// ─── color palette ───────────────────────────────────────────────────────────
const C = {
  ink: '#111827',
  muted: '#6b7280',
  faint: '#f9fafb',
  border: '#e5e7eb',
  white: '#ffffff',
  gold: '#b8960c',
  greenPaid: '#059669',
  bluePaid: '#2563eb',
  redBal: '#dc2626',
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
  paid: { dot: '#10b981', bg: '#ecfdf5', text: '#047857', label: 'Paid' },
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
  if (Number(invoice.advancePaid2) > 0) {
    payments.push({
      date: invoice.advancePaymentDate2 || invoice.date,
      method: invoice.advancePaymentMethod2 || 'Cash',
      amount: invoice.advancePaid2,
    });
  }
  if (Number(invoice.advancePaid3) > 0) {
    payments.push({
      date: invoice.advancePaymentDate3 || invoice.date,
      method: invoice.advancePaymentMethod3 || 'Cash',
      amount: invoice.advancePaid3,
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
  const [invoice, setInvoice] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/invoices/' + id).then(res => setInvoice(res.data));
  }, [id]);

  async function updateStatus(status) {
    await api.patch('/invoices/' + id + '/status', { status });
    setInvoice(inv => ({ ...inv, status }));
    toast.success('Status updated to ' + status);
  }

  function handlePrint() {
    window.print();
  }

  async function fetchPDFBlob() {
    const response = await api.get(`/invoices/${id}/pdf`);
    const base64 = response.data.base64;
    
    // Decode base64 to Blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
  }

  async function handleDownloadPDF() {
    if (!invoice) return;
    setDownloading(true);
    try {
      const blob = await fetchPDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CLIKZ-Invoice-${invoice.invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download Error:", err);
      let errMsg = 'Could not download PDF';
      if (err.response?.data) {
        try {
          const decodedString = String.fromCharCode.apply(null, new Uint8Array(err.response.data));
          const errorData = JSON.parse(decodedString);
          errMsg = errorData.error || errorData.message || errMsg;
        } catch(e) {}
      }
      toast.error(errMsg);
    } finally {
      setDownloading(false);
    }
  }

  async function handleWhatsApp() {
    if (!invoice) return;
    setSharing(true);
    try {
      // Open the window immediately to bypass popup blockers
      const waWindow = window.open('about:blank', '_blank');
      
      const blob = await fetchPDFBlob();
      const file = new File([blob], `CLIKZ-Invoice-${invoice.invoiceNo}.pdf`, { type: 'application/pdf' });

      // Automatically download the PDF so the user can easily attach it
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      // Automatically redirect the new tab to WhatsApp (without text message, as requested)
      const phone = invoice.customer?.phone?.replace(/\D/g, '') || '';
      waWindow.location.href = `https://wa.me/${phone.length === 10 ? '91' + phone : phone}`;
      toast.success("PDF downloaded. Attach it in WhatsApp!");
    } catch (err) {
      if (waWindow) waWindow.close();
      console.error("PDF Generation Error:", err);
      let errMsg = 'Could not generate PDF for sharing';
      if (err.response?.data) {
        try {
          const decodedString = String.fromCharCode.apply(null, new Uint8Array(err.response.data));
          const errorData = JSON.parse(decodedString);
          errMsg = errorData.error || errorData.message || errMsg;
        } catch(e) {}
      }
      toast.error(errMsg);
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

  const staticTerms = [
    "20% advance payment is required to confirm the booking.",
    "Balance payment must be completed on or before the event date.",
    "Photo and video editing will be done in our professional style.",
    "Delivery time for photos, videos, and album will be 30–45 working days.",
    "Any additional hours or services will be charged extra.",
    "Album printing will start only after client approval of the design.",
    "Travel and accommodation charges may apply for outstation events.",
    "Raw photos will be provided only if the client provides their own SSD or storage device.",
    "Additional sheets will be charged at RS:500 each.",
    "Once the booking is confirmed, the advance amount is non-refundable."
  ];

  const categoryName = invoice.eventCategoryName || invoice.eventCategory?.name || '';
  const iconStyle = { verticalAlign: 'middle', marginRight: 8, position: 'relative', top: '-1px' };

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
            {sharing ? 'Generating...' : 'WhatsApp'}
          </button>
          
          <button onClick={handleDownloadPDF} disabled={downloading} style={{ ...bar.btn, opacity: downloading ? 0.7 : 1 }}>
            <Printer size={14} />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          
          <button onClick={handlePrint} style={bar.btn}>
            <Printer size={14} />
            Print
          </button>
          
          <Link to={`/invoices/${id}/edit`} style={{ ...bar.btn, background: '#0f172a', color: '#fff', borderColor: '#0f172a', textDecoration: 'none' }}>
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>

      {/* ── Invoice document ── */}
      <div id="invoice-print" style={{ ...doc.wrap, position: 'relative' }}>

        {/* Subtle Watermark */}
        <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
          <img src={clikzLogo} alt="" style={{ width: 500, height: 'auto', filter: 'grayscale(100%)' }} />
        </div>

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
              <div style={doc.invoiceDate}>
                <Calendar size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Billed By / Bill To */}
        <div className="invoice-parties" style={doc.partiesWrap}>
          <div style={doc.partyCard}>
            <p style={doc.sectionLabel}>
              <span>Billed By</span>
            </p>
            <p style={doc.partyName}>CLIKZ WEDDING FILMS</p>
            <div style={doc.partyLines}>
              <div style={doc.partyLine}>
                <Phone size={13} color={C.muted} style={{ flexShrink: 0 }} />
                <span>+91 9994122652</span>
              </div>
              <div style={doc.partyLine}>
                <Mail size={13} color={C.muted} style={{ flexShrink: 0 }} />
                <span>clikzweddingfilms@gmail.com</span>
              </div>
              <div style={doc.partyLine}>
                <AtSign size={13} color={C.muted} style={{ flexShrink: 0 }} />
                <span>clikz_.photography</span>
              </div>
            </div>
          </div>
          <div style={doc.partyCard}>
            <p style={doc.sectionLabel}>
              <span>Billed To</span>
            </p>
            <p style={doc.partyName}>{invoice.customer.name}</p>
            <div style={doc.partyLines}>
              <div style={doc.partyLine}>
                <Phone size={13} color={C.muted} style={{ flexShrink: 0 }} />
                <span>{invoice.customer.phone}</span>
              </div>
              {categoryName || invoice.event ? (
                <div style={doc.partyLine}>
                  <Film size={13} color={C.muted} style={{ flexShrink: 0 }} />
                  <span>
                    {(() => {
                      const catStr = (categoryName || '').trim();
                      const evtStr = (invoice.event || '').trim();
                      if (!catStr) return evtStr;
                      if (!evtStr) return catStr;
                      if (catStr.toLowerCase() === evtStr.toLowerCase()) return catStr;

                      const sortWords = s => s.toLowerCase().split(/[,\s&\-]+/).filter(Boolean).sort().join(' ');
                      if (sortWords(catStr) === sortWords(evtStr)) return catStr;

                      if (catStr.toLowerCase().includes(evtStr.toLowerCase())) return catStr;
                      if (evtStr.toLowerCase().includes(catStr.toLowerCase())) return evtStr;

                      return `${catStr} · ${evtStr}`;
                    })()}
                  </span>
                </div>
              ) : null}
              {eventDate && (
                <div style={doc.partyLine}>
                  <Calendar size={13} color={C.muted} style={{ flexShrink: 0 }} />
                  <span>{eventDate}</span>
                </div>
              )}
              {invoice.location && (
                <div style={doc.partyLine}>
                  <MapPin size={13} color={C.muted} style={{ flexShrink: 0 }} />
                  <span>{invoice.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services table */}
        <div style={doc.tableWrap}>
          <div style={doc.sectionHeading}>
            <span style={{ verticalAlign: 'middle' }}>Services</span>
          </div>
          <table style={doc.table}>
            <thead>
              <tr>
                <th style={{ ...doc.th, textAlign: 'left', width: '28%' }}>Service</th>
                <th style={{ ...doc.th, textAlign: 'left', width: '38%' }}>Description</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '17%' }}>Price (₹)</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '17%' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services && invoice.services.length > 0 ? (
                <tr style={{ background: C.white }}>
                  <td style={{ ...doc.td, fontWeight: 600, color: C.ink }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Camera size={13} color={C.muted} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ lineHeight: 1.5, textTransform: 'uppercase' }}>
                        {invoice.services.map(s => s.service).join(', ')}
                      </span>
                    </div>
                  </td>
                  <td style={doc.tdDesc}>
                    {invoice.services.map(s => s.description?.trim()).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={{ ...doc.td, textAlign: 'right', color: C.muted, fontVariantNumeric: 'tabular-nums' }}>
                    {Number(invoice.subTotal || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ ...doc.td, textAlign: 'right', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {Number(invoice.subTotal || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ) : (
                <tr style={{ background: C.white }}>
                  <td colSpan="4" style={{ ...doc.td, textAlign: 'center', color: C.muted }}>No services added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div style={{ ...doc.tableWrap, marginBottom: SECTION_GAP }}>
            <div style={doc.sectionHeading}>
              <span style={{ verticalAlign: 'middle' }}>Payment History</span>
            </div>
            <table style={{ ...doc.table, marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ ...doc.th, textAlign: 'left' }}>Date</th>
                  <th style={{ ...doc.th, textAlign: 'center' }}>Method</th>
                  <th style={{ ...doc.th, textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ background: C.white }}>
                    <td style={doc.td}>{fmtDate(p.date)}</td>
                    <td style={{ ...doc.td, textAlign: 'center', textTransform: 'capitalize', color: C.muted }}>{p.method || 'Cash'}</td>
                    <td style={{ ...doc.td, textAlign: 'right', fontWeight: 600, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.amount)}</td>
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

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />

            <div style={doc.totalRow}>
              <span style={{ ...doc.totalLabel, fontWeight: 700, color: C.ink, fontSize: 14 }}>Total Amount</span>
              <span style={{ ...doc.totalVal, fontWeight: 800, color: C.ink, fontSize: 15 }}>{fmt(invoice.total)}</span>
            </div>
            <div style={doc.totalRow}>
              <span style={doc.totalLabel}>
                {totalPaid > 0 ? 'Total Paid' : 'Amount Paid'}
              </span>
              <span style={{ ...doc.totalVal, color: C.muted }}>{fmt(totalPaid)}</span>
            </div>

            {hasBalance ? (
              <div style={doc.balanceDue}>
                <span style={{ fontWeight: 700, color: C.redBal, fontSize: 14 }}>Balance Due</span>
                <span style={{ fontWeight: 800, color: C.redBal, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmt(invoice.balance)}</span>
              </div>
            ) : (
              <div style={doc.paidFull}>
                <CheckCircle2 size={16} color={C.greenPaid} />
                <span>Paid</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ clear: 'both' }}></div>

        {/* Terms & Conditions */}
        <div className="terms-page-break" style={doc.termsBox}>
          <p style={doc.termsTitle}>Terms &amp; Conditions</p>
          <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 11, lineHeight: 1.6, listStyleType: 'disc' }}>
            {staticTerms.map((term, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{term}</li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div style={doc.footer}>
          <Film size={13} color={C.gold} style={{ flexShrink: 0 }} />
          <span>Thank you for choosing <strong style={{ color: C.white }}>CLIKZ WEDDING FILMS</strong> — we're honoured to be part of your story.</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 560px) {
          .invoice-parties { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
        }
        @media print {
          .print\\:hidden { display: none !important; }
          .terms-page-break { page-break-inside: avoid; margin-top: 40px !important; border: none !important; background: transparent !important; }
          #invoice-print {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            overflow: visible !important;
          }
          /* Revert any mobile responsive grids/gaps back to desktop style for PDF */
          .invoice-parties { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── action bar styles ────────────────────────────────────────────────────────
const bar = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  right: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  back: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  sep: { color: '#cbd5e1', fontSize: 14 },
  title: { fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '0 16px', height: 36, borderRadius: 8,
    border: '1px solid #cbd5e1', background: '#fff',
    fontSize: 13, fontWeight: 500, color: '#334155',
    cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s'
  },
  select: {
    appearance: 'none', padding: '0 32px 0 16px', height: 36, borderRadius: 8,
    border: '1px solid #cbd5e1', background: '#fff',
    fontSize: 13, color: '#334155', cursor: 'pointer', fontWeight: 500
  },
};

// ─── invoice document styles ──────────────────────────────────────────────────
const SECTION_GAP = 24;
const PAGE_PAD = 40;

const doc = {
  wrap: {
    maxWidth: 820, margin: '0 auto',
    background: '#ffffff', borderRadius: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
    overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif",
    boxSizing: 'border-box', border: '1px solid #f1f5f9',
  },

  headerBand: {
    background: '#1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: `24px ${PAGE_PAD}px`,
    width: '100%',
    boxSizing: 'border-box',
    borderBottom: '1px solid #0f172a',
  },
  logoZone: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { height: 54, width: 'auto', objectFit: 'contain' },
  brandName: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', margin: 0 },
  brandTagline: { fontSize: 11, color: '#94a3b8', margin: '4px 0 0', letterSpacing: '0.05em' },
  invoiceMeta: { textAlign: 'right' },
  invoiceWord: { fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 },
  invoiceNum: { fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 0', letterSpacing: '-0.02em' },
  invoiceDate: { fontSize: 12, color: '#cbd5e1', margin: '8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },

  partiesWrap: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
    margin: `24px ${PAGE_PAD}px`,
    boxSizing: 'border-box',
  },
  partyCard: {
    boxSizing: 'border-box', minWidth: 0,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: C.muted,
    letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px',
    borderBottom: `1px solid ${C.border}`, paddingBottom: 6,
  },
  sectionHeading: {
    fontSize: 13, fontWeight: 700, color: C.ink,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 16,
  },
  partyName: { fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px', lineHeight: 1.3, wordBreak: 'break-word' },
  partyLines: { display: 'flex', flexDirection: 'column', gap: 4 },
  partyLine: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', lineHeight: 1.5, wordBreak: 'break-word' },

  tableWrap: { padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', boxSizing: 'border-box' },
  th: {
    background: '#f8fafc', color: '#475569',
    padding: '12px 16px', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.05em',
    borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
    textTransform: 'uppercase',
  },
  td: { padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' },
  tdDesc: { padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', fontSize: 13, lineHeight: 1.5, color: '#4b5563' },

  totalsWrap: { padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box', width: '100%' },
  totalsBox: { pageBreakInside: 'avoid', float: 'right', width: '100%', maxWidth: 340, background: '#f8fafc', borderRadius: 8, padding: '16px 20px', border: `1px solid ${C.border}` },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' },
  totalLabel: { fontSize: 14, color: '#4b5563' },
  totalVal: { fontSize: 14, fontWeight: 600, color: C.ink, fontVariantNumeric: 'tabular-nums' },
  balanceDue: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTop: `2px solid ${C.border}`,
  },
  paidFull: {
    display: 'flex', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTop: `2px solid ${C.border}`,
    color: C.greenPaid, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'flex-end'
  },

  termsBox: {
    margin: `0 ${PAGE_PAD}px ${SECTION_GAP}px`,
    boxSizing: 'border-box', pageBreakInside: 'avoid'
  },
  termsTitle: { margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: '0.1em', textTransform: 'uppercase' },
  termsBody: { margin: 0 },
  termsLine: { margin: '0 0 5px', fontSize: 11, lineHeight: 1.6, color: '#6b7280' },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#f8fafc', borderTop: `1px solid ${C.border}`,
    padding: `28px ${PAGE_PAD}px`,
    fontSize: 12, color: '#64748b', textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
};
