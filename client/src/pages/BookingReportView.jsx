import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, AtSign, MapPin, Calendar,
  Printer, CheckCircle2, Circle, Clock, Camera, Film,
  FileImage, Send, DollarSign, Package, Users, Settings,
  FileText
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
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function displayDate(d) {
  if (!d) return '—';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return String(d);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STEPS = [
  {
    phase: 'Pre-Event Preparation',
    icon: Settings,
    color: 'text-indigo-500',
    bg: 'bg-indigo-100',
    items: [
      { key: 'advanceCleared', label: 'Advance Payment Cleared', icon: DollarSign },
      { key: 'staffAssigned', label: 'Staff & Crew Assigned', icon: Users },
      { key: 'equipmentCheck', label: 'Equipment Checked & Packed', icon: Camera },
    ]
  },
  {
    phase: 'Event Day Execution',
    icon: Camera,
    color: 'text-orange-500',
    bg: 'bg-orange-100',
    items: [
      { key: 'attendanceLog', label: 'Crew Attendance Logged', icon: Clock },
      { key: 'rawFootageBackup', label: 'Raw Footage Backup Started', icon: Film },
    ]
  },
  {
    phase: 'Post-Event Delivery',
    icon: Package,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
    items: [
      { key: 'selectionLinkSent', label: 'Photo Selection Link Sent', icon: Send },
      { key: 'photoEditingComplete', label: 'Photo Editing Complete', icon: FileImage },
      { key: 'videoMixingComplete', label: 'Video Mixing Complete', icon: Film },
      { key: 'albumPrinting', label: 'Album Printed', icon: Package },
      { key: 'finalDelivery', label: 'Final Delivery & Payment Cleared', icon: CheckCircle2 },
    ]
  }
];

export default function BookingReportView() {
  const { id } = useParams();
  const printRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [operation, setOperation] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/invoices/' + id),
      api.get('/operations/' + id).catch(err => {
        console.warn('Operation not found', err);
        return { data: null };
      })
    ]).then(([invRes, opRes]) => {
      setInvoice(invRes.data);
      setOperation(opRes.data);
    });
  }, [id]);

  function handlePrint() { window.print(); }

  if (!invoice) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${C.gold}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const categoryName = invoice.eventCategoryName || invoice.eventCategory?.name || '';
  const eventDate = displayDate(invoice.eventDate || invoice.date);

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
          <span style={bar.title}>Booking Report: {invoice.invoiceNo}</span>
        </div>
        <div style={bar.right}>
          <button onClick={handlePrint} style={bar.btn}>
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </div>

      {/* ── Report document ── */}
      <div id="invoice-print" ref={printRef} style={{ ...doc.wrap, position: 'relative' }}>
        
        {/* Header band */}
        <div style={doc.headerBand}>
          <div style={doc.logoZone}>
            <img src={clikzLogo} alt="CLIKZ" style={doc.logo} />
            <div>
              <p style={doc.brandName}>CLIKZ WEDDING FILMS</p>
              <p style={doc.brandTagline}>Service Delivery Report</p>
            </div>
          </div>
          <div style={doc.invoiceMeta}>
            <p style={doc.invoiceWord}>BOOKING ORDER</p>
            <p style={doc.invoiceNum}>{invoice.invoiceNo}</p>
          </div>
        </div>

        {/* Studio & Customer Details */}
        <div className="invoice-parties" style={doc.partiesWrap}>
          <div style={doc.partyCard}>
            <p style={doc.sectionLabel}>
              <span>Studio Details</span>
            </p>
            <p style={doc.partyName}>CLIKZ WEDDING FILMS</p>
            <div style={doc.partyLines}>
              <div style={doc.partyLine}>
                <Phone size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>+91 9994122652</span>
              </div>
              <div style={doc.partyLine}>
                <Mail size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>clikzweddingfilms@gmail.com</span>
              </div>
              <div style={doc.partyLine}>
                <AtSign size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>clikz_.photography</span>
              </div>
            </div>
          </div>
          <div style={doc.partyCard}>
            <p style={doc.sectionLabel}>
              <span>Customer & Event</span>
            </p>
            <p style={doc.partyName}>{invoice.customer.name}</p>
            <div style={doc.partyLines}>
              <div style={doc.partyLine}>
                <Phone size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{invoice.customer.phone}</span>
              </div>
              {categoryName && (
                <div style={doc.partyLine}>
                  <Calendar size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{categoryName}{invoice.event ? ' · ' + invoice.event : ''}</span>
                </div>
              )}
              {invoice.location && (
                <div style={doc.partyLine}>
                  <MapPin size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{invoice.location}</span>
                </div>
              )}
              <div style={doc.partyLine}>
                <Clock size={13} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Event Date: {eventDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Services */}
        <div style={doc.tableWrap}>
          <div style={doc.sectionHeading}>
            <span>Assigned Services / Deliverables</span>
          </div>
          <table style={doc.table}>
            <thead>
              <tr>
                <th style={{ ...doc.th, textAlign: 'left', width: '35%' }}>Service Item</th>
                <th style={{ ...doc.th, textAlign: 'left', width: '65%' }}>Details & Description</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((s, i) => (
                <tr key={i} style={{ background: C.white }}>
                  <td style={{ ...doc.td, fontWeight: 600, color: C.ink }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Camera size={14} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{s.service || '—'}</span>
                    </div>
                  </td>
                  <td style={doc.tdDesc}>
                    {s.description?.trim() || '—'}
                  </td>
                </tr>
              ))}
              {invoice.services.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ ...doc.td, textAlign: 'center', color: C.muted }}>No services assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Workflow & Operations Checklist */}
        <div style={doc.tableWrap}>
          <div style={doc.sectionHeading}>
            <span>Production Workflow Status</span>
          </div>
          
          {operation ? (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, background: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
                {STEPS.map((step, sIdx) => {
                  const PhaseIcon = step.icon;
                  return (
                    <div key={sIdx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <PhaseIcon size={18} className={step.color} />
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.ink, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          {step.phase}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {step.items.map((item, iIdx) => {
                          const isChecked = operation[item.key];
                          return (
                            <div key={iIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isChecked ? C.ink : C.muted, fontWeight: isChecked ? 600 : 400 }}>
                              {isChecked ? <CheckCircle2 size={16} color={C.greenPaid} /> : <Circle size={16} color="#cbd5e1" />}
                              <span>{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: C.muted, background: '#f8fafc', borderRadius: 8, border: `1px solid ${C.border}` }}>
              Operations data not initialized for this booking. View Operations Hub to start workflow.
            </div>
          )}
        </div>

        <div style={{ clear: 'both' }}></div>

        {/* Footer */}
        <div style={doc.footer}>
          <Film size={13} color={C.gold} style={{ flexShrink: 0 }} />
          <span>This is an internally generated Booking & Service Delivery Report.</span>
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
            border: none !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const bar = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  right: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  back: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  sep: { color: '#cbd5e1', fontSize: 14 },
  title: { fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '0 16px', height: 36, borderRadius: 8,
    border: '1px solid #cbd5e1', background: '#fff',
    fontSize: 13, fontWeight: 500, color: '#334155',
    cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s'
  }
};

const SECTION_GAP = 24;
const PAGE_PAD = 40;

const doc = {
  wrap: {
    maxWidth: 820, margin: '0 auto',
    background: '#ffffff', borderRadius: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
    overflow: 'hidden', boxSizing: 'border-box', border: '1px solid #f1f5f9',
  },
  headerBand: {
    background: '#1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: `24px ${PAGE_PAD}px`, width: '100%', boxSizing: 'border-box',
    borderBottom: '1px solid #0f172a',
  },
  logoZone: { display: 'flex', alignItems: 'center', gap: 16 },
  logo: { height: 54, width: 'auto', objectFit: 'contain' },
  brandName: { fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', margin: 0 },
  brandTagline: { fontSize: 11, color: '#94a3b8', margin: '4px 0 0', letterSpacing: '0.05em' },
  invoiceMeta: { textAlign: 'right' },
  invoiceWord: { fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 },
  invoiceNum: { fontSize: 26, fontWeight: 800, color: '#ffffff', margin: '4px 0 0', letterSpacing: '-0.02em' },
  partiesWrap: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
    margin: `24px ${PAGE_PAD}px`, boxSizing: 'border-box',
  },
  partyCard: { boxSizing: 'border-box', minWidth: 0 },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px',
    borderBottom: `1px solid ${C.border}`, paddingBottom: 6,
  },
  sectionHeading: {
    fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16,
  },
  partyName: { fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px', lineHeight: 1.3, wordBreak: 'break-word' },
  partyLines: { display: 'flex', flexDirection: 'column', gap: 4 },
  partyLine: { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#4b5563', lineHeight: 1.5, wordBreak: 'break-word' },
  tableWrap: { padding: `0 ${PAGE_PAD}px`, marginBottom: SECTION_GAP, boxSizing: 'border-box', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', boxSizing: 'border-box' },
  th: {
    background: '#f8fafc', color: '#475569', padding: '12px 16px', fontSize: 11,
    fontWeight: 700, letterSpacing: '0.05em', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
    textTransform: 'uppercase',
  },
  td: { padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' },
  tdDesc: { padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', fontSize: 13, lineHeight: 1.5, color: '#4b5563' },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#f8fafc', borderTop: `1px solid ${C.border}`,
    padding: `28px ${PAGE_PAD}px`, fontSize: 12, color: '#64748b', textAlign: 'center',
    width: '100%', boxSizing: 'border-box',
  },
};
