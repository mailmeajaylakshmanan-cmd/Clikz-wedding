/**
 * InvoiceForm — CLIKZ Wedding Films
 *
 * Required in your global CSS / index.html:
 *   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
 *   body { font-family: 'Inter', sans-serif; }
 */

import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import {
  User, Phone, MapPin, Plus, Trash2, BadgeCheck, Sparkles,
  Receipt, AlertCircle, Hash, Home, CheckSquare, Settings,
  Calendar, IndianRupee,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import Select from 'react-select';

/* ─── helpers ─────────────────────────────────────────────────── */

function parseEventDateString(str) {
  if (!str) return [''];
  const parts = str.split('&').map(p => {
    const t = p.trim();
    const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : '';
  });
  return parts.length ? parts : [''];
}

function toDisplayDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

/* ─── shared select styles ────────────────────────────────────── */
const selectStyles = () => ({
  control: (b, s) => ({
    ...b,
    borderColor: s.isFocused ? '#f97316' : '#e5e7eb',
    borderRadius: '0.5rem',
    boxShadow: s.isFocused ? '0 0 0 3px rgba(249,115,22,.12)' : 'none',
    minHeight: '36px',
    fontSize: '13px',
    backgroundColor: '#fafafa',
    transition: 'all .15s',
    '&:hover': { borderColor: '#f97316' },
  }),
  // Renders via portal on document.body — sits above everything
  menuPortal: b => ({ ...b, zIndex: 9999 }),
  menu: b => ({
    ...b,
    borderRadius: '0.5rem',
    boxShadow: '0 8px 30px rgba(0,0,0,.14)',
    border: '1px solid #f3f4f6',
    overflow: 'hidden',
  }),
  menuList: b => ({ ...b, maxHeight: '220px', padding: '4px' }),
  option: (b, s) => ({
    ...b,
    fontSize: '13px',
    borderRadius: '6px',
    padding: '7px 10px',
    backgroundColor: s.isSelected ? '#f97316' : s.isFocused ? '#fff7ed' : 'white',
    color: s.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
  }),
  multiValue: b => ({ ...b, backgroundColor: '#fff7ed', borderRadius: '4px' }),
  multiValueLabel: b => ({ ...b, color: '#c2410c', fontSize: '12px', fontWeight: 600 }),
  multiValueRemove: b => ({ ...b, color: '#c2410c', ':hover': { backgroundColor: '#fed7aa', color: '#9a3412' } }),
  valueContainer: b => ({ ...b, padding: '2px 8px', gap: '2px' }),
  dropdownIndicator: b => ({ ...b, padding: '0 6px', color: '#9ca3af' }),
  indicatorSeparator: () => ({ display: 'none' }),
  placeholder: b => ({ ...b, color: '#9ca3af', fontSize: '13px' }),
  input: b => ({ ...b, fontSize: '13px' }),
});

/* ─── atomic UI pieces ────────────────────────────────────────── */

const inputCls = [
  'block w-full rounded-lg border border-gray-200 bg-gray-50',
  'px-3 py-1.5 text-[13px] text-gray-800 placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white',
  'transition-all duration-150',
].join(' ');

function Field({ label, required, children, invisibleLabel }) {
  return (
    <div>
      <label
        className={[
          'block text-[11px] font-semibold uppercase tracking-wide mb-1',
          invisibleLabel ? 'invisible select-none' : 'text-gray-500',
        ].join(' ')}
      >
        {label || '\u00A0'}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange, autoFocus, disabled }) {
  return (
    <div className="relative">
      <IndianRupee size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="number" min="0"
        disabled={disabled}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        className={`${inputCls} pl-6 pr-2 text-right font-mono min-w-[7rem] w-full max-w-[9.5rem] disabled:opacity-50`}
      />
    </div>
  );
}

function ChkLabel({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-orange-500 border-orange-500' : 'border-gray-300 group-hover:border-orange-400 bg-white'
        }`}>
        {checked && (
          <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-[2]">
            <polyline points="1,4 4,7 9,1" />
          </svg>
        )}
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      </span>
      <span className="text-[13px] font-medium text-gray-700">{children}</span>
    </label>
  );
}

function PaymentRow({ amount, onAmount, date, onDate, method, onMethod }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number" min="0" autoFocus
        value={amount} onChange={onAmount}
        className={`${inputCls} text-right font-mono min-w-[6.5rem] w-28 shrink-0`}
        placeholder="0"
      />
      <div className="flex-1 min-w-[110px]">
        <DatePicker
          selected={date ? parseISO(date) : null}
          onChange={d => onDate(d ? format(d, 'yyyy-MM-dd') : '')}
          dateFormat="dd/MM/yyyy"
          placeholderText="Date"
          wrapperClassName="w-full"
          portalId="root"
          className={`${inputCls} text-xs`}
        />
      </div>
      <select
        className={`${inputCls} text-xs w-28 shrink-0`}
        value={method} onChange={onMethod}
      >
        <option value="Cash">Cash</option>
        <option value="UPI">UPI</option>
        <option value="Bank Transfer">Bank Transfer</option>
      </select>
    </div>
  );
}

/* Step-numbered section card */
function Section({ step, icon: Icon, title, badge, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200/80 shadow-sm ${className}`}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
          {step}
        </span>
        <Icon size={13} className="text-orange-500 shrink-0" />
        <h2 className="text-[13px] font-semibold text-gray-800 flex-1">{title}</h2>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────── */

export default function InvoiceForm({ initial, onSubmit, loading, onCustomerSelect }) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(() => {
    const base = {
      customer: { name: '', phone: '', address: '' },
      eventCategory: '', event: '', eventDate: '', location: '',
      services: [], subTotal: 0, discount: 0,
      advancePaid: 0, advancePaymentDate: today, advancePaymentMethod: 'Cash',
      advancePaid2: 0, advancePaymentDate2: today, advancePaymentMethod2: 'Cash',
      advancePaid3: 0, advancePaymentDate3: today, advancePaymentMethod3: 'Cash',
      totalPaid: 0, totalPaymentDate: today, totalPaymentMethod: 'Cash',
      status: 'pending', notes: 'Grateful to be part of your celebration.', requiredStaff: 0,
      showAdvance: false, showAdvance2: false, showAdvance3: false, showFinal: false,
    };
    if (!initial) return base;
    return {
      ...base, ...initial,
      eventCategories: initial.eventCategories?.map(c => c._id || c) ||
        (initial.eventCategory ? [initial.eventCategory._id || initial.eventCategory] : []),
      customer: initial.customer || base.customer,
      services: initial.services || [],
      subTotal: initial.subTotal || 0,
      requiredStaff: initial.requiredStaff || 0,
      showAdvance: Number(initial.advancePaid) > 0,
      showAdvance2: Number(initial.advancePaid2) > 0,
      showAdvance3: Number(initial.advancePaid3) > 0,
      showFinal: Number(initial.totalPaid) > 0,
    };
  });

  const [eventCategories, setEventCategories] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [eventDates, setEventDates] = useState(() => parseEventDateString(initial?.eventDate || ''));

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function syncDates(dates) {
    setForm(f => ({ ...f, eventDate: dates.filter(Boolean).map(toDisplayDate).join(' & ') }));
  }
  function updateDate(idx, val) {
    setEventDates(d => { const n = d.map((x, i) => i === idx ? val : x); syncDates(n); return n; });
  }
  function addDate() {
    setEventDates(d => { const n = [...d, '']; syncDates(n); return n; });
  }
  function removeDate(idx) {
    setEventDates(d => { const n = d.filter((_, i) => i !== idx); const f = n.length ? n : ['']; syncDates(f); return f; });
  }

  useEffect(() => {
    api.get('/event-categories').then(r => setEventCategories(r.data));
    api.get('/customers').then(r => setCustomers(r.data));
  }, []);

  useEffect(() => {
    const ids = form.eventCategories;
    if (!ids?.length) { setServiceOptions([]); return; }
    api.get('/services', { params: { categories: ids.join(',') } }).then(r => setServiceOptions(r.data));
  }, [form.eventCategories]);

  const subTotal = Number(form.subTotal || 0);
  const discount = Number(form.discount || 0);
  const discountExceedsTotal = discount > subTotal && subTotal > 0;
  const total = Math.max(0, subTotal - discount);
  const paid = Number(form.advancePaid || 0) + Number(form.advancePaid2 || 0) + Number(form.advancePaid3 || 0) + Number(form.totalPaid || 0);
  const balance = total - paid;

  useEffect(() => {
    if (total <= 0) return;
    const next = balance <= 0 ? 'paid' : balance < total ? 'partial' : 'pending';
    if (form.status !== next) setF('status', next);
  }, [balance, total]);

  function handleCategoryChange(sel) {
    const ids = sel ? sel.map(o => o.value) : [];
    const names = sel ? sel.map(o => o.label).join(', ') : '';
    setForm(f => ({ ...f, eventCategories: ids, eventCategoryName: names, event: names || f.event, services: [] }));
  }

  function toggleService(name, checked, defaultDesc = '') {
    setForm(f => ({
      ...f,
      services: checked
        ? [...f.services, { service: name, description: defaultDesc, price: 0, total: 0 }]
        : f.services.filter(s => s.service !== name),
    }));
  }

  function updateServiceDesc(name, desc) {
    setForm(f => ({ ...f, services: f.services.map(s => s.service === name ? { ...s, description: desc } : s) }));
  }

  function toggleAdvance(c) {
    setForm(f => {
      const n = { ...f, showAdvance: c, advancePaid: c ? f.advancePaid : 0 };
      if (!c) { n.showAdvance2 = false; n.advancePaid2 = 0; n.showAdvance3 = false; n.advancePaid3 = 0; }
      return n;
    });
  }
  function toggleAdvance2(c) {
    setForm(f => {
      const n = { ...f, showAdvance2: c, advancePaid2: c ? f.advancePaid2 : 0 };
      if (!c) { n.showAdvance3 = false; n.advancePaid3 = 0; }
      return n;
    });
  }
  function toggleAdvance3(c) { setForm(f => ({ ...f, showAdvance3: c, advancePaid3: c ? f.advancePaid3 : 0 })); }
  function toggleFinal(c) { setForm(f => ({ ...f, showFinal: c, totalPaid: c ? f.totalPaid : 0 })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer.name) return alert('Please select a customer.');
    if (!form.eventCategories?.length) return alert('Please select at least one Event Category.');
    if (!Number(form.subTotal) || Number(form.subTotal) <= 0)
      return alert('Please enter a valid Total Event Price.');
    const cats = eventCategories.filter(c => form.eventCategories.includes(c._id));
    const terms = cats.filter(c => c.showTerms).map(c => c.termsAndConditions).filter(Boolean).join('\n\n');
    const showTerms = cats.some(c => c.showTerms);
    onSubmit({
      ...form, subTotal, total, balance,
      eventCategories: form.eventCategories,
      eventCategoryName: cats.map(c => c.name).join(', ') || form.event,
      showTerms, termsAndConditions: showTerms ? terms : '',
    });
  }

  const selectedCustomer = form.customer?._id
    ? { value: form.customer._id, label: `${form.customer.name} — ${form.customer.phone}` }
    : null;

  const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    partial: { label: 'Partial', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  };
  const sc = statusConfig[form.status] || statusConfig.pending;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 font-['Inter',sans-serif] pb-8">

      {/* ── Invoice header strip ── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <Hash size={13} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Invoice</span>
        </div>
        <span className="font-mono text-xs text-gray-500 font-medium">
          {initial?.invoiceNumber || initial?.invoiceNo || 'Auto-generated on save'}
        </span>
      </div>

      {/* ── 1. Customer & Event ── */}
      <Section step="1" icon={User} title="Customer & Event Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <Field label="Customer" required>
            <Select
              isClearable
              isSearchable
              placeholder="Search customer…"
              styles={selectStyles()}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              options={customers
                .filter(c => c.isActive !== false || c._id === form.customer?._id)
                .map(c => ({ value: c._id, label: `${c.name} — ${c.phone}`, customer: c }))}
              value={selectedCustomer}
              onChange={sel => {
                if (!sel) { setForm(f => ({ ...f, customer: { name: '', phone: '', address: '' } })); return; }
                const m = sel.customer;
                setForm(f => ({ ...f, customer: { _id: m._id, name: m.name, phone: m.phone, address: m.address || '' } }));
                onCustomerSelect?.(m);
              }}
            />
          </Field>

          {/* Customer info — invisible label keeps this aligned with the Select above */}
          <Field invisibleLabel label="Details">
            {form.customer.name ? (
              <div className="flex flex-col justify-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 h-[36px] md:h-auto">
                <div className="flex items-center gap-2 text-[12px] text-gray-700">
                  <Phone size={11} className="text-gray-400 shrink-0" />
                  <span className="font-medium">{form.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-gray-700">
                  <Home size={11} className="text-gray-400 shrink-0" />
                  <span>{form.customer.address || <span className="italic text-gray-400">No address</span>}</span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs italic min-h-[36px] bg-gray-50/50">
                Select a customer to see details
              </div>
            )}
          </Field>

          {/* Divider row */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 pt-3">

            <Field label="Event Category" required>
              <Select
                isMulti
                isSearchable
                placeholder="Search categories…"
                styles={selectStyles()}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                options={eventCategories
                  .filter(c => c.isActive !== false || (form.eventCategories || []).includes(c._id))
                  .map(c => ({ value: c._id, label: c.name }))}
                value={eventCategories
                  .filter(c => (form.eventCategories || []).includes(c._id))
                  .map(c => ({ value: c._id, label: c.name }))}
                onChange={handleCategoryChange}
              />
            </Field>

            <Field label="Event Label">
              <div className="relative">
                <Sparkles size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className={`${inputCls} pl-7`}
                  value={form.event}
                  onChange={e => setF('event', e.target.value)}
                  placeholder="Engagement & Wedding"
                />
              </div>
            </Field>

            <Field label="Event Date(s)">
              <div className="space-y-1.5">
                {eventDates.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <DatePicker
                        selected={d ? parseISO(d) : null}
                        onChange={date => updateDate(idx, date ? format(date, 'yyyy-MM-dd') : '')}
                        dateFormat="dd/MM/yyyy"
                        className={`${inputCls} pl-7 w-full`}
                        placeholderText="Select date"
                        wrapperClassName="w-full"
                        portalId="root"
                      />
                    </div>
                    {eventDates.length > 1 && (
                      <button type="button" onClick={() => removeDate(idx)}
                        className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addDate}
                className="flex items-center gap-1 text-gray-500 hover:text-orange-500 text-[11px] font-semibold mt-1.5 transition-colors">
                <Plus size={11} /> Add another date
              </button>
              {form.eventDate && (
                <p className="text-[10px] text-gray-400 mt-1">Saved as: {form.eventDate}</p>
              )}
            </Field>

            <Field label="Location">
              <div className="relative">
                <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  className={`${inputCls} pl-7`}
                  value={form.location}
                  onChange={e => setF('location', e.target.value)}
                  placeholder="Kulasekharam, Kanyakumari"
                />
              </div>
            </Field>

          </div>
        </div>
      </Section>

      {/* ── 2. Services ── */}
      <Section
        step="2" icon={CheckSquare} title="Required Services"
        badge={!form.eventCategories?.length && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle size={9} /> Pick category first
          </span>
        )}
      >
        {form.eventCategories?.length ? (
          serviceOptions.filter(o => o.isActive !== false).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {serviceOptions.filter(o => o.isActive !== false).map(opt => {
                const checked = form.services.some(s => s.service === opt.name);
                const cur = form.services.find(s => s.service === opt.name);
                return (
                  <label key={opt._id} className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg border transition-colors ${checked
                    ? 'border-orange-300 bg-orange-50/60'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}>
                    <span className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                      }`}>
                      {checked && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-[2]">
                          <polyline points="1,4 4,7 9,1" />
                        </svg>
                      )}
                      <input type="checkbox" checked={checked} className="sr-only"
                        onChange={e => toggleService(opt.name, e.target.checked, opt.descriptions?.[0] || '')} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold text-gray-800 uppercase tracking-wide">{opt.name}</span>
                      {checked && (
                        <div className="mt-1.5" onClick={e => e.preventDefault()}>
                          {opt.descriptions?.length > 0 ? (
                            <select
                              className={`${inputCls} text-xs`}
                              value={cur?.description || ''}
                              onChange={e => updateServiceDesc(opt.name, e.target.value)}
                            >
                              {opt.descriptions.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                          ) : (
                            <input
                              className={`${inputCls} text-xs`}
                              placeholder="Optional details…"
                              value={cur?.description || ''}
                              onChange={e => updateServiceDesc(opt.name, e.target.value)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              No services found for this category — add them in Master Service.
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            Select an Event Category above to see available services.
          </div>
        )}
      </Section>

      {/* ── 3 + 4. Billing & Settings ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Billing panel */}
        <Section step="3" icon={Receipt} title="Billing & Payments" className="h-fit">

          {/* Price + Discount */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
              <span className="text-[13px] font-semibold text-gray-700">Total Event Price</span>
              <MoneyInput
                value={form.subTotal}
                onChange={e => setF('subTotal', e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] text-gray-500">Discount</span>
                <MoneyInput value={form.discount} onChange={e => setF('discount', e.target.value)} />
              </div>
              {discountExceedsTotal && (
                <p className="flex items-center gap-1 text-[10px] font-medium text-rose-600 mt-1 px-1">
                  <AlertCircle size={10} /> Discount exceeds the event price — total capped at ₹0.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 px-1">
              <span className="text-[13px] font-bold text-gray-800">Final Total</span>
              <span className="text-xl font-extrabold text-orange-500 font-mono tracking-tight">
                ₹{fmt(total)}
              </span>
            </div>
          </div>

          {/* Payment gates */}
          <div className="space-y-2 border-t border-gray-100 pt-3">

            <ChkLabel checked={form.showAdvance} onChange={e => toggleAdvance(e.target.checked)}>
              1st Advance Received
            </ChkLabel>
            {form.showAdvance && (
              <div className="ml-2 pl-3 border-l-2 border-orange-200 bg-orange-50/40 rounded-r-lg p-2.5">
                <PaymentRow
                  amount={form.advancePaid} onAmount={e => setF('advancePaid', e.target.value)}
                  date={form.advancePaymentDate} onDate={v => setF('advancePaymentDate', v)}
                  method={form.advancePaymentMethod} onMethod={e => setF('advancePaymentMethod', e.target.value)}
                />
              </div>
            )}

            {form.showAdvance && (
              <>
                <ChkLabel checked={form.showAdvance2} onChange={e => toggleAdvance2(e.target.checked)}>
                  2nd Advance Received
                </ChkLabel>
                {form.showAdvance2 && (
                  <div className="ml-2 pl-3 border-l-2 border-orange-200 bg-orange-50/40 rounded-r-lg p-2.5">
                    <PaymentRow
                      amount={form.advancePaid2} onAmount={e => setF('advancePaid2', e.target.value)}
                      date={form.advancePaymentDate2} onDate={v => setF('advancePaymentDate2', v)}
                      method={form.advancePaymentMethod2} onMethod={e => setF('advancePaymentMethod2', e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {form.showAdvance2 && (
              <>
                <ChkLabel checked={form.showAdvance3} onChange={e => toggleAdvance3(e.target.checked)}>
                  3rd Advance Received
                </ChkLabel>
                {form.showAdvance3 && (
                  <div className="ml-2 pl-3 border-l-2 border-orange-200 bg-orange-50/40 rounded-r-lg p-2.5">
                    <PaymentRow
                      amount={form.advancePaid3} onAmount={e => setF('advancePaid3', e.target.value)}
                      date={form.advancePaymentDate3} onDate={v => setF('advancePaymentDate3', v)}
                      method={form.advancePaymentMethod3} onMethod={e => setF('advancePaymentMethod3', e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <ChkLabel checked={form.showFinal} onChange={e => toggleFinal(e.target.checked)}>
              Final Settlement Received
            </ChkLabel>
            {form.showFinal && (
              <div className="ml-2 pl-3 border-l-2 border-emerald-200 bg-emerald-50/50 rounded-r-lg p-2.5">
                <PaymentRow
                  amount={form.totalPaid} onAmount={e => setF('totalPaid', e.target.value)}
                  date={form.totalPaymentDate} onDate={v => setF('totalPaymentDate', v)}
                  method={form.totalPaymentMethod} onMethod={e => setF('totalPaymentMethod', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Balance footer — single source of truth for status */}
          <div className={`mt-4 rounded-xl px-4 py-3 flex items-center justify-between ${balance <= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
            }`}>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Pending Balance</div>
              <div className={`text-xl font-extrabold font-mono tracking-tight ${balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{fmt(Math.max(0, balance))}
              </div>
            </div>
            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
        </Section>

        {/* Settings + Submit */}
        <div className="flex flex-col gap-3">
          <Section step="4" icon={Settings} title="Additional Details">
            <div className="space-y-3">
              <Field label="Photographers / Staff Required">
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-400 font-mono w-3">0</span>
                  <input
                    type="range" min="0" max="20"
                    value={form.requiredStaff}
                    onChange={e => setF('requiredStaff', Number(e.target.value))}
                    className="flex-1 accent-orange-500 h-1.5"
                  />
                  <span className="text-[10px] text-gray-400 font-mono w-4">20</span>
                  <span className="w-8 text-center text-sm font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-md py-0.5">
                    {form.requiredStaff}
                  </span>
                </div>
              </Field>
              <Field label="Customer Note (prints on invoice)">
                <textarea
                  className={`${inputCls} resize-none mt-0.5`}
                  rows={4}
                  value={form.notes}
                  onChange={e => setF('notes', e.target.value)}
                  placeholder="Thank you for your business!"
                />
              </Field>
            </div>
          </Section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={[
              'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-[15px] tracking-wide',
              'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
              'shadow-lg shadow-orange-300/40',
              'hover:from-orange-600 hover:to-orange-700 active:scale-[0.99]',
              'transition-all duration-150',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
            ].join(' ')}
          >
            <BadgeCheck size={18} />
            {loading ? 'Processing…' : (initial ? 'Update Invoice' : 'Generate Invoice')}
          </button>
        </div>

      </div>
    </form>
  );
}