import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import {
  User, Phone, Calendar, MapPin, Plus, Trash2,
  Settings, BadgeCheck, Sparkles, Layers, Receipt,
  AlertCircle, ShoppingBag, Hash, Home, CheckSquare
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import Select from 'react-select';

// "21/05/2026 & 24/06/2026" -> ["2026-05-21", "2026-06-24"] (native <input type="date"> needs ISO)
function parseEventDateString(str) {
  if (!str) return [''];
  const parts = str.split('&').map(function (part) {
    const trimmed = part.trim();
    const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) return ddmmyyyy[3] + '-' + ddmmyyyy[2] + '-' + ddmmyyyy[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    return '';
  });
  return parts.length ? parts : [''];
}

// "2026-05-21" -> "21/05/2026"
function toDisplayDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y;
}

export default function InvoiceForm({ initial, onSubmit, loading, onCustomerSelect }) {
  const [form, setForm] = useState(function () {
    const base = {
      customer: { name: '', phone: '', address: '' },
      eventCategory: '',
      event: '',
      eventDate: '',
      location: '',
      services: [],
      subTotal: 0,
      discount: 0,
      advancePaid: 0,
      advancePaymentDate: new Date().toISOString().substring(0, 10),
      advancePaymentMethod: 'Cash',
      advancePaid2: 0,
      advancePaymentDate2: new Date().toISOString().substring(0, 10),
      advancePaymentMethod2: 'Cash',
      advancePaid3: 0,
      advancePaymentDate3: new Date().toISOString().substring(0, 10),
      advancePaymentMethod3: 'Cash',
      totalPaid: 0,
      totalPaymentDate: new Date().toISOString().substring(0, 10),
      totalPaymentMethod: 'Cash',
      status: 'pending',
      notes: 'Grateful to be part of your celebration.',
      requiredStaff: 0,
      // checkbox-controlled visibility for the two payment blocks
      showAdvance: false,
      showAdvance2: false,
      showAdvance3: false,
      showFinal: false,
    };
    if (!initial) return base;
    return {
      ...base,
      ...initial,
      eventCategories: initial.eventCategories?.map(c => c._id || c) || (initial.eventCategory ? [initial.eventCategory._id || initial.eventCategory] : []),
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
  const [eventDates, setEventDates] = useState(function () {
    return parseEventDateString(initial?.eventDate || '');
  });

  function syncEventDateString(dates) {
    const joined = dates.filter(Boolean).map(toDisplayDate).join(' & ');
    setForm(function (f) { return { ...f, eventDate: joined }; });
  }

  function updateEventDate(idx, value) {
    setEventDates(function (dates) {
      const next = dates.map(function (d, i) { return i === idx ? value : d; });
      syncEventDateString(next);
      return next;
    });
  }

  function addEventDate() {
    setEventDates(function (dates) {
      const next = [...dates, ''];
      syncEventDateString(next);
      return next;
    });
  }

  function removeEventDate(idx) {
    setEventDates(function (dates) {
      const next = dates.filter(function (_, i) { return i !== idx; });
      const finalDates = next.length ? next : [''];
      syncEventDateString(finalDates);
      return finalDates;
    });
  }

  useEffect(function () {
    api.get('/event-categories').then(function (res) { setEventCategories(res.data); });
    api.get('/customers').then(function (res) { setCustomers(res.data); });
  }, []);

  useEffect(function () {
    const categoryIds = form.eventCategories;
    if (!categoryIds || categoryIds.length === 0) {
      setServiceOptions([]);
      return;
    }
    api.get('/services', { params: { categories: categoryIds.join(',') } }).then(function (res) {
      setServiceOptions(res.data);
    });
  }, [form.eventCategories]);

  const subTotal = Number(form.subTotal || 0);
  const total = subTotal - Number(form.discount || 0);
  const balance = total - Number(form.advancePaid || 0) - Number(form.advancePaid2 || 0) - Number(form.advancePaid3 || 0) - Number(form.totalPaid || 0);

  useEffect(function () {
    if (total > 0) {
      if (balance <= 0) {
        if (form.status !== 'paid') {
          setForm(function (f) { return { ...f, status: 'paid' }; });
        }
      } else if (balance < total) {
        if (form.status !== 'partial') {
          setForm(function (f) { return { ...f, status: 'partial' }; });
        }
      } else {
        if (form.status !== 'pending') {
          setForm(function (f) { return { ...f, status: 'pending' }; });
        }
      }
    }
  }, [balance, total, form.status, form.advancePaid, form.advancePaid2, form.advancePaid3, form.totalPaid]);

  function handleCategoryChange(selectedOptions) {
    const ids = selectedOptions ? selectedOptions.map(o => o.value) : [];
    const names = selectedOptions ? selectedOptions.map(o => o.label).join(', ') : '';
    setForm(function (f) {
      return {
        ...f,
        eventCategories: ids,
        eventCategoryName: names,
        event: names || f.event,
        services: [],
      };
    });
  }

  // Toggle a service checkbox
  function toggleService(serviceName, isChecked, defaultDescription = '') {
    setForm(f => {
      if (isChecked) {
        return {
          ...f,
          services: [...f.services, { service: serviceName, description: defaultDescription, price: 0, total: 0 }]
        };
      } else {
        return {
          ...f,
          services: f.services.filter(s => s.service !== serviceName)
        };
      }
    });
  }

  // Update description for a checked service
  function updateServiceDescription(serviceName, description) {
    setForm(f => {
      const services = f.services.map(s => {
        if (s.service === serviceName) {
          return { ...s, description };
        }
        return s;
      });
      return { ...f, services };
    });
  }

  function toggleAdvance(checked) {
    setForm(function (f) {
      const next = { ...f, showAdvance: checked, advancePaid: checked ? f.advancePaid : 0 };
      if (!checked) {
        next.showAdvance2 = false;
        next.advancePaid2 = 0;
        next.showAdvance3 = false;
        next.advancePaid3 = 0;
      }
      return next;
    });
  }

  function toggleAdvance2(checked) {
    setForm(function (f) {
      const next = { ...f, showAdvance2: checked, advancePaid2: checked ? f.advancePaid2 : 0 };
      if (!checked) {
        next.showAdvance3 = false;
        next.advancePaid3 = 0;
      }
      return next;
    });
  }

  function toggleAdvance3(checked) {
    setForm(function (f) {
      return { ...f, showAdvance3: checked, advancePaid3: checked ? f.advancePaid3 : 0 };
    });
  }

  function toggleFinal(checked) {
    setForm(function (f) {
      return { ...f, showFinal: checked, totalPaid: checked ? f.totalPaid : 0 };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer.name) {
      return alert("Please select a customer.");
    }
    if (!form.eventCategories || form.eventCategories.length === 0) {
      return alert("Please select at least one Event Category.");
    }
    const categories = eventCategories.filter(c => form.eventCategories.includes(c._id));
    const terms = categories.filter(c => c.showTerms).map(c => c.termsAndConditions).filter(Boolean).join('\n\n');
    const showTerms = categories.some(c => c.showTerms);
    const names = categories.map(c => c.name).join(', ');

    onSubmit({
      ...form,
      subTotal,
      total,
      balance,
      eventCategories: form.eventCategories,
      eventCategoryName: names || form.event,
      showTerms,
      termsAndConditions: showTerms ? terms : '',
    });
  }

  const selectedCustomer = form.customer?.name && form.customer?._id 
    ? { value: form.customer._id, label: `${form.customer.name} — ${form.customer.phone}` }
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-5xl mx-auto">

      {/* Invoice Number strip */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <Hash size={14} />
          Invoice Number
        </div>
        <span className="font-mono font-bold text-slate-800 text-sm">
          {initial?.invoiceNumber || initial?.invoiceNo || 'Auto-generated on save'}
        </span>
      </div>

      {/* 1. Customer Details */}
      <div className="card p-4 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
            <User size={16} />
          </div>
          <h2 className="font-semibold text-slate-800">Customer & Event Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer *</label>
            <div className="relative z-50">
              <Select
                isClearable
                placeholder="Select a customer from master..."
                options={customers.filter(c => c.isActive !== false || c._id === form.customer?._id).map(c => ({ value: c._id, label: `${c.name} — ${c.phone}`, customer: c }))}
                value={selectedCustomer}
                onChange={(selected) => {
                  if (!selected) {
                    setForm(f => ({ ...f, customer: { name: '', phone: '', address: '' } }));
                  } else {
                    const matched = selected.customer;
                    setForm(f => ({ ...f, customer: { _id: matched._id, name: matched.name, phone: matched.phone, address: matched.address || '' } }));
                    if (onCustomerSelect) onCustomerSelect(matched);
                  }
                }}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#cbd5e1' }
                  })
                }}
              />
            </div>
          </div>
          
          {/* Read Only Details */}
          {form.customer.name ? (
            <div className="md:col-span-1 bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-slate-400 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                  <div className="text-sm font-medium text-slate-700">{form.customer.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Home size={14} className="text-slate-400 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</div>
                  <div className="text-sm font-medium text-slate-700">{form.customer.address || <span className="italic text-slate-400">No address provided</span>}</div>
                </div>
              </div>
            </div>
          ) : (
             <div className="md:col-span-1 border border-dashed border-slate-200 rounded-lg p-3 flex items-center justify-center text-slate-400 text-sm italic bg-slate-50/50">
               Select a customer to view details
             </div>
          )}

          <div className="md:col-span-2 border-t border-slate-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Event Category *</label>
              <div className="relative z-40">
                <Select
                  isMulti
                  placeholder="Select categories..."
                  options={eventCategories.filter(c => c.isActive !== false || (form.eventCategories || []).includes(c._id)).map(c => ({ value: c._id, label: c.name }))}
                  value={eventCategories.filter(c => (form.eventCategories || []).includes(c._id)).map(c => ({ value: c._id, label: c.name }))}
                  onChange={handleCategoryChange}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: 'none',
                      minHeight: '42px',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Event Label</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Sparkles size={14} />
                </span>
                <input
                  className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500"
                  value={form.event}
                  onChange={function (e) { setForm(function (f) { return { ...f, event: e.target.value }; }); }}
                  placeholder="Engagement & Wedding"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Event Date(s)</label>
              <div className="space-y-2">
                {eventDates.map(function (d, idx) {
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                          <Calendar size={14} />
                        </span>
                        <DatePicker
                          selected={d ? (typeof d === 'string' ? parseISO(d) : d) : null}
                          onChange={function (date) { 
                             updateEventDate(idx, date ? format(date, 'yyyy-MM-dd') : ''); 
                          }}
                          dateFormat="dd/MM/yyyy"
                          className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500 w-full"
                          placeholderText="Select date"
                          wrapperClassName="w-full"
                          portalId="root"
                        />
                      </div>
                      {eventDates.length > 1 && (
                        <button
                          type="button"
                          onClick={function () { removeEventDate(idx); }}
                          className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                          title="Remove date"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addEventDate}
                className="flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold px-2.5 py-1 rounded-lg text-[11px] mt-2 transition-colors"
              >
                <Plus size={12} /> Add another date
              </button>
              {form.eventDate && (
                <p className="text-[11px] text-slate-400 mt-1.5">Saved as: {form.eventDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Location</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin size={14} />
                </span>
                <input
                  className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500"
                  value={form.location}
                  onChange={function (e) { setForm(function (f) { return { ...f, location: e.target.value }; }); }}
                  placeholder="Kulasekharam, Kanyakumari"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Services Selection */}
      <div className="card p-4 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <CheckSquare size={16} />
            </div>
            <h2 className="font-semibold text-slate-800">Required Services</h2>
          </div>
          {(!form.eventCategories || form.eventCategories.length === 0) && (
            <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
              <AlertCircle size={10} /> Choose Category above
            </span>
          )}
        </div>

        {form.eventCategories && form.eventCategories.length > 0 ? (
           serviceOptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceOptions.filter(opt => opt.isActive !== false).map((opt) => {
                const isChecked = form.services.some(s => s.service === opt.name);
                const currentService = form.services.find(s => s.service === opt.name);
                
                return (
                  <div key={opt._id} className={`border rounded-xl p-4 transition-colors ${isChecked ? 'border-orange-400 bg-orange-50/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                        checked={isChecked}
                        onChange={(e) => toggleService(opt.name, e.target.checked, opt.descriptions && opt.descriptions.length > 0 ? opt.descriptions[0] : '')}
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-slate-800 block">{opt.name}</span>
                        {isChecked && opt.descriptions && opt.descriptions.length > 0 && (
                           <div className="mt-3">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description / Details</label>
                             <select
                               className="input py-1.5 text-sm focus:ring-orange-500/20 focus:border-orange-500"
                               value={currentService?.description || ''}
                               onChange={(e) => updateServiceDescription(opt.name, e.target.value)}
                               onClick={(e) => e.preventDefault()}
                             >
                               {opt.descriptions.map((desc, i) => (
                                 <option key={i} value={desc}>{desc}</option>
                               ))}
                             </select>
                           </div>
                        )}
                        {isChecked && (!opt.descriptions || opt.descriptions.length === 0) && (
                           <div className="mt-3">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Custom Details</label>
                             <input
                               className="input py-1.5 text-sm focus:ring-orange-500/20 focus:border-orange-500"
                               placeholder="Optional details..."
                               value={currentService?.description || ''}
                               onChange={(e) => updateServiceDescription(opt.name, e.target.value)}
                               onClick={(e) => e.preventDefault()}
                             />
                           </div>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
           ) : (
            <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
              No services found for this category. Add them in Master Service.
            </div>
           )
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
            Please select an Event Category to view available services.
          </div>
        )}
      </div>

      {/* 3. Payments & Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Left Side: Receipt & Payments */}
        <div className="card p-4 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Receipt size={16} />
              </div>
              <h2 className="font-semibold text-slate-800">Billing Breakdown</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800">Total Event Price *</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    required
                    className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1.5 font-bold"
                    value={form.subTotal}
                    onChange={function (e) { setForm(function (f) { return { ...f, subTotal: e.target.value }; }); }}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center px-1">
                <span>Discount applied</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                    value={form.discount}
                    onChange={function (e) { setForm(function (f) { return { ...f, discount: e.target.value }; }); }}
                    min="0"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-bold text-slate-800 px-1">
                <span>Final Total Amount</span>
                <span className="text-orange-600 text-xl font-extrabold font-mono">₹{total.toLocaleString('en-IN')}</span>
              </div>

              {/* Advance Payment — checkbox-gated */}
              <div className="border-t border-slate-100 pt-3 space-y-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showAdvance}
                    onChange={function (e) { toggleAdvance(e.target.checked); }}
                    className="w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">1st Advance Payment Received</span>
                </label>

                {form.showAdvance && (
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Amount Paid</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                          value={form.advancePaid}
                          onChange={function (e) { setForm(function (f) { return { ...f, advancePaid: e.target.value }; }); }}
                          min="0"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Receipt Date</label>
                        <DatePicker
                          selected={form.advancePaymentDate ? parseISO(form.advancePaymentDate) : null}
                          onChange={function (date) { setForm(function (f) { return { ...f, advancePaymentDate: date ? format(date, 'yyyy-MM-dd') : '' }; }); }}
                          dateFormat="dd/MM/yyyy"
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500 w-full"
                          wrapperClassName="w-full"
                          portalId="root"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                        <select
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500"
                          value={form.advancePaymentMethod}
                          onChange={function (e) { setForm(function (f) { return { ...f, advancePaymentMethod: e.target.value }; }); }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advance 2 */}
              {form.showAdvance && (
              <div className="border-t border-slate-100 pt-3 space-y-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showAdvance2}
                    onChange={function (e) { toggleAdvance2(e.target.checked); }}
                    className="w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">2nd Advance Payment Received</span>
                </label>
                {form.showAdvance2 && (
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Amount Paid</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input type="number" className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                          value={form.advancePaid2} onChange={function(e){setForm(f=>({...f, advancePaid2: e.target.value}))}} min="0" autoFocus />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Receipt Date</label>
                        <DatePicker selected={form.advancePaymentDate2 ? parseISO(form.advancePaymentDate2) : null}
                          onChange={function(date){setForm(f=>({...f, advancePaymentDate2: date ? format(date, 'yyyy-MM-dd') : ''}))}}
                          dateFormat="dd/MM/yyyy" className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500 w-full" wrapperClassName="w-full" portalId="root" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                        <select className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500" value={form.advancePaymentMethod2}
                          onChange={function(e){setForm(f=>({...f, advancePaymentMethod2: e.target.value}))}}>
                          <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Advance 3 */}
              {form.showAdvance2 && (
              <div className="border-t border-slate-100 pt-3 space-y-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showAdvance3}
                    onChange={function (e) { toggleAdvance3(e.target.checked); }}
                    className="w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">3rd Advance Payment Received</span>
                </label>
                {form.showAdvance3 && (
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Amount Paid</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input type="number" className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                          value={form.advancePaid3} onChange={function(e){setForm(f=>({...f, advancePaid3: e.target.value}))}} min="0" autoFocus />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Receipt Date</label>
                        <DatePicker selected={form.advancePaymentDate3 ? parseISO(form.advancePaymentDate3) : null}
                          onChange={function(date){setForm(f=>({...f, advancePaymentDate3: date ? format(date, 'yyyy-MM-dd') : ''}))}}
                          dateFormat="dd/MM/yyyy" className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500 w-full" wrapperClassName="w-full" portalId="root" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                        <select className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500" value={form.advancePaymentMethod3}
                          onChange={function(e){setForm(f=>({...f, advancePaymentMethod3: e.target.value}))}}>
                          <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Final / Settlement Payment — checkbox-gated */}
              <div className="border-t border-slate-100 pt-3 space-y-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showFinal}
                    onChange={function (e) { toggleFinal(e.target.checked); }}
                    className="w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">Last Final Payment Received</span>
                </label>

                {form.showFinal && (
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Amount Paid</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                          value={form.totalPaid}
                          onChange={function (e) { setForm(function (f) { return { ...f, totalPaid: e.target.value }; }); }}
                          min="0"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Settlement Date</label>
                        <DatePicker
                          selected={form.totalPaymentDate ? parseISO(form.totalPaymentDate) : null}
                          onChange={function (date) { setForm(function (f) { return { ...f, totalPaymentDate: date ? format(date, 'yyyy-MM-dd') : '' }; }); }}
                          dateFormat="dd/MM/yyyy"
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500 w-full"
                          wrapperClassName="w-full"
                          portalId="root"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                        <select
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500"
                          value={form.totalPaymentMethod}
                          onChange={function (e) { setForm(function (f) { return { ...f, totalPaymentMethod: e.target.value }; }); }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Pending Balance</span>
            <span className={`text-xl font-bold font-mono ${balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              ₹{Math.max(0, balance).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Right Side: Extras & Submit */}
        <div className="space-y-4">
          <div className="card p-4 border-l-4 border-l-slate-400">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <Settings size={16} />
              </div>
              <h2 className="font-semibold text-slate-800">Additional Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  Required Photographers/Staff
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={form.requiredStaff}
                    onChange={e => setForm(f => ({ ...f, requiredStaff: Number(e.target.value) }))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="w-10 text-center font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded py-1 text-sm">{form.requiredStaff}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Note to Customer (Prints on Invoice)</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium resize-none"
                  rows="3"
                  value={form.notes}
                  onChange={function (e) { setForm(function (f) { return { ...f, notes: e.target.value }; }); }}
                  placeholder="Thank you for your business!"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <BadgeCheck size={20} />
            {loading ? 'Processing...' : (initial ? 'Update Invoice' : 'Generate Final Invoice')}
          </button>
        </div>

      </div>

    </form>
  );
}
