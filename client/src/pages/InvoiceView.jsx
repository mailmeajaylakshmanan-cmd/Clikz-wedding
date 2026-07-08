import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, AtSign, MapPin, Calendar,
  Printer, MessageCircle, Pencil, CheckCircle2,
  CreditCard, ChevronDown, Film, AlertTriangle, PhoneCall,
  Clock, ShieldCheck, Camera, Sparkles, X, Video, Image as ImageIcon, Package,
  Aperture, Clapperboard, BookOpen, HardDrive, MonitorPlay, Plane, FileText
} from 'lucide-react';
import { parseSafeDate } from '../utils/dateFormatter.js';
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
  const parsed = parseSafeDate(d);
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
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [masterDeliverables, setMasterDeliverables] = useState([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState(new Set());
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [savingQuotation, setSavingQuotation] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);

  useEffect(() => {
    api.get('/invoices/' + id).then(res => {
      setInvoice(res.data);
      if (res.data.assignedDeliverables) {
        setSelectedDeliverables(new Set(res.data.assignedDeliverables.map(d => d.name)));
      }
    });
    api.get('/deliverables').then(res => setMasterDeliverables(res.data));
  }, [id]);

  useEffect(() => {
    if (invoice) {
      document.title = `Invoice ${invoice.invoiceNo} — CLIKZ WEDDING FILMS`;
    } else {
      document.title = 'CLIKZ WEDDING FILMS';
    }
    return () => { document.title = 'CLIKZ WEDDING FILMS'; };
  }, [invoice]);

  function toggleDeliverable(name) {
    const next = new Set(selectedDeliverables);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedDeliverables(next);
  }

  function handleOpenQuotationModal() {
    setQuotationModalOpen(true);
  }

  async function handleGenerateQuotation() {
    setSavingQuotation(true);
    try {
      const toSave = masterDeliverables.filter(d => selectedDeliverables.has(d.name)).map(d => ({ name: d.name, description: d.description }));
      await api.put(`/invoices/${id}`, { assignedDeliverables: toSave });
      setInvoice(inv => ({ ...inv, assignedDeliverables: toSave }));
      setQuotationModalOpen(false);
      navigate(`/quotations/${id}`);
    } catch (err) {
      toast.error('Failed to generate quotation');
    } finally {
      setSavingQuotation(false);
    }
  }

  function getIconForName(itemName, size = 13) {
    const name = (itemName || '').toLowerCase();
    if (name.includes('traditional')) return <Aperture size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('candid') || name.includes('photo') || name.includes('shoot') || name.includes('portrait')) return <Camera size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('cinematography')) return <Clapperboard size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('video') || name.includes('teaser') || name.includes('highlight') || name.includes('reels')) return <Video size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('book') || name.includes('magazine')) return <BookOpen size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('album') || name.includes('print') || name.includes('frame') || name.includes('canvas')) return <ImageIcon size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('pendrive') || name.includes('hard drive') || name.includes('usb') || name.includes('drive')) return <HardDrive size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('led') || name.includes('tv') || name.includes('screen') || name.includes('display')) return <MonitorPlay size={size} color="#D4AF37" strokeWidth={1.5} />;
    if (name.includes('drone') || name.includes('crane') || name.includes('aerial')) return <Plane size={size} color="#D4AF37" strokeWidth={1.5} />;
    return <Sparkles size={size} color="#D4AF37" strokeWidth={1.5} />;
  }

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
      toast.error('Could not download PDF');
    } finally {
      setDownloading(false);
    }
  }

  async function handleWhatsApp() {
    if (!invoice) return;
    setShareModalOpen(true);
    setSharing(true);
    setShareFile(null);
    try {
      const blob = await fetchPDFBlob();
      const file = new File([blob], `CLIKZ-Invoice-${invoice.invoiceNo}.pdf`, { type: 'application/pdf' });
      setShareFile(file);
    } catch (err) {
      toast.error('Could not generate PDF for sharing');
      setShareModalOpen(false);
    } finally {
      setSharing(false);
    }
  }

  function handleDirectShare() {
    if (navigator.share && navigator.canShare?.({ files: [shareFile] })) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNo} — CLIKZ WEDDING FILMS`,
        files: [shareFile],
      }).catch(e => {
        if (e.name !== 'AbortError') console.error(e);
      });
    } else {
      const url = URL.createObjectURL(shareFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = shareFile.name;
      a.click();
      URL.revokeObjectURL(url);
      
      const phone = invoice.customer?.phone?.replace(/\D/g, '') || '';
      window.open(`https://wa.me/${phone.length === 10 ? '91' + phone : phone}`, '_blank');
      toast.success("PDF downloaded. Attach it in WhatsApp!");
    }
    setShareModalOpen(false);
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
          
          <button onClick={handleOpenQuotationModal} style={{ ...bar.btn, color: C.gold, borderColor: C.gold, background: '#fef3c7' }}>
            <Sparkles size={14} />
            Generate Quotation
          </button>
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
        <div style={{ ...doc.tableWrap, marginBottom: 24 }}>
          <div style={doc.sectionHeading}>
            <span style={{ verticalAlign: 'middle' }}>Services</span>
          </div>
          <table style={doc.table}>
            <thead>
              <tr>
                <th style={{ ...doc.th, textAlign: 'center', width: '60%' }}>Service</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '20%' }}>Price (₹)</th>
                <th style={{ ...doc.th, textAlign: 'right', width: '20%' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services && invoice.services.length > 0 ? (
                <tr style={{ background: C.white }}>
                  <td style={{ ...doc.td, fontWeight: 600, color: C.ink, verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                      {invoice.services.map(s => s.service).filter(Boolean).join(', ').split(',').filter(x => x.trim()).map((service, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#f8fafc',
                          border: `1px solid #e2e8f0`,
                          color: '#334155',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          {getIconForName(service.trim(), 13)}
                          <span>{service.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...doc.td, verticalAlign: 'middle', textAlign: 'right', color: C.muted, fontVariantNumeric: 'tabular-nums' }}>
                    {Number(invoice.subTotal || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ ...doc.td, verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
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
                  <th style={{ ...doc.th, textAlign: 'center' }}>Date</th>
                  <th style={{ ...doc.th, textAlign: 'center' }}>Method</th>
                  <th style={{ ...doc.th, textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} style={{ background: C.white }}>
                    <td style={{ ...doc.td, textAlign: 'center' }}>{fmtDate(p.date)}</td>
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

            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />

            <div style={doc.totalRow}>
              <span style={{ ...doc.totalLabel, fontWeight: 700, color: C.ink, fontSize: 13 }}>Total Amount</span>
              <span style={{ ...doc.totalVal, fontWeight: 800, color: C.ink, fontSize: 14 }}>{fmt(invoice.total)}</span>
            </div>
            <div style={doc.totalRow}>
              <span style={doc.totalLabel}>
                {totalPaid > 0 ? 'Total Paid' : 'Amount Paid'}
              </span>
              <span style={{ ...doc.totalVal, color: C.muted }}>{fmt(totalPaid)}</span>
            </div>

            {hasBalance ? (
              <div style={doc.balanceDue}>
                <span style={{ fontWeight: 700, color: C.redBal, fontSize: 13 }}>Balance Due</span>
                <span style={{ fontWeight: 800, color: C.redBal, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{fmt(invoice.balance)}</span>
              </div>
            ) : (
              <div style={doc.paidFull}>
                <CheckCircle2 size={16} color={C.greenPaid} />
                <span>Paid</span>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="terms-page-break" style={doc.termsBox}>
          <p style={doc.termsTitle}>Terms &amp; Conditions</p>
          <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 11, lineHeight: 1.4, listStyleType: 'disc' }}>
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
          .terms-page-break { page-break-inside: avoid; margin-top: 4px !important; border: none !important; background: transparent !important; }
          #invoice-print {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            overflow: visible !important;
          }
          .invoice-parties { grid-template-columns: 1fr 1fr !important; gap: 16px !important; margin: 12px 32px !important; }
          #invoice-print th, #invoice-print td { padding: 4px 8px !important; }
          .invoice-parties p { margin: 0 0 4px !important; }
        }
      `}</style>

      {quotationModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', padding: 16 }} onClick={() => setQuotationModalOpen(false)}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, width: 540, maxWidth: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 20, color: '#0f172a' }}>Select Deliverables</h3>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>Choose which deliverables to include in this quotation.</p>
              </div>
              <button onClick={() => setQuotationModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: 6, borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: 24 }}>
              {masterDeliverables.map(d => (
                <div key={d.name} onClick={() => toggleDeliverable(d.name)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selectedDeliverables.has(d.name) ? '#f0f9ff' : '#fff', borderColor: selectedDeliverables.has(d.name) ? '#bae6fd' : '#e2e8f0' }}>
                  <div style={{ marginTop: 2 }}>
                    {selectedDeliverables.has(d.name) ? <CheckCircle2 size={18} color="#0284c7" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{d.name}</h4>
                    {d.description && <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{d.description}</p>}
                  </div>
                </div>
              ))}
              {masterDeliverables.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No deliverables found in master list.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setQuotationModalOpen(false)} 
                style={{ padding: '10px 16px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateQuotation}
                disabled={savingQuotation}
                style={{ padding: '10px 24px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: savingQuotation ? 'not-allowed' : 'pointer', opacity: savingQuotation ? 0.7 : 1 }}
              >
                {savingQuotation ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', padding: 16 }} onClick={() => setShareModalOpen(false)}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, width: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 20, color: '#0f172a' }}>Share Document</h3>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>Send the PDF directly via WhatsApp or download it to your device.</p>
              </div>
              <button onClick={() => setShareModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: 6, borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 24, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <FileText size={24} color="#D4AF37" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>CLIKZ-Invoice-{invoice.invoiceNo}.pdf</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>PDF Document • {shareFile ? (shareFile.size / 1024).toFixed(0) + ' KB' : 'Generating...'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => { setShareModalOpen(false); handleDownloadPDF(); }} 
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
              >
                Download Only
              </button>
              <button 
                onClick={handleDirectShare}
                disabled={!shareFile}
                style={{ flex: 1, padding: '10px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: shareFile ? 'pointer' : 'not-allowed', opacity: shareFile ? 1 : 0.5 }}
              >
                Share Now
              </button>
            </div>
          </div>
        </div>
      )}
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
const SECTION_GAP = 12;
const PAGE_PAD = 32;

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
    padding: `16px ${PAGE_PAD}px`,
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
    margin: `16px ${PAGE_PAD}px`,
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
    marginBottom: 12,
  },
  partyName: { fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px', lineHeight: 1.3, wordBreak: 'break-word' },
  partyLines: { display: 'flex', flexDirection: 'column', gap: 4 },
  partyLine: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4b5563', lineHeight: 1.5, wordBreak: 'break-word' },

  tableWrap: { padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', boxSizing: 'border-box' },
  th: {
    background: '#f8fafc', color: '#475569',
    padding: '6px 12px', fontSize: 10,
    fontWeight: 700, letterSpacing: '0.05em',
    border: `1px solid ${C.border}`,
    textTransform: 'uppercase',
  },
  td: { padding: '6px 12px', border: `1px solid ${C.border}`, verticalAlign: 'middle' },

  totalsWrap: { padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box', width: '100%', display: 'flex', justifyContent: 'flex-end' },
  totalsBox: { pageBreakInside: 'avoid', width: '100%', maxWidth: 340, background: '#f8fafc', borderRadius: 8, padding: '12px 20px', border: `1px solid ${C.border}` },
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
    background: '#1e293b', borderTop: `1px solid #0f172a`,
    padding: `20px ${PAGE_PAD}px`,
    fontSize: 12, color: '#94a3b8', textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
};
