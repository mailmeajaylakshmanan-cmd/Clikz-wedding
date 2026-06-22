import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import {
  User, Phone, Calendar, MapPin, Plus, Trash2,
  Settings, BadgeCheck, Sparkles, Layers, Receipt,
  AlertCircle, ShoppingBag, Hash
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';

const emptyService = { service: '', description: '', price: '', total: 0 };

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
      customer: { name: '', phone: '' },
      eventCategory: '',
      event: '',
      eventDate: '',
      location: '',
      services: [{ ...emptyService }],
      discount: 0,
      advancePaid: 0,
      advancePaymentDate: new Date().toISOString().substring(0, 10),
      advancePaymentMethod: 'Cash',
      totalPaid: 0,
      totalPaymentDate: new Date().toISOString().substring(0, 10),
      totalPaymentMethod: 'Cash',
      status: 'draft',
      notes: 'Grateful to be part of your celebration.',
      requiredStaff: 0,
      // checkbox-controlled visibility for the two payment blocks
      showAdvance: false,
      showFinal: false,
    };
    if (!initial) return base;
    return {
      ...base,
      ...initial,
      eventCategory: initial.eventCategory?._id || initial.eventCategory || '',
      customer: initial.customer || base.customer,
      services: initial.services?.length ? initial.services : base.services,
      requiredStaff: initial.requiredStaff || 0,
      // if editing an invoice that already has an amount recorded, open that section by default
      showAdvance: Number(initial.advancePaid) > 0,
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
    // Load the full customer list once — selection is made from this list only.
    api.get('/customers').then(function (res) { setCustomers(res.data); });
  }, []);

  useEffect(function () {
    const categoryId = form.eventCategory || initial?.eventCategory?._id || initial?.eventCategory;
    if (!categoryId) {
      setServiceOptions([]);
      return;
    }
    api.get('/services', { params: { category: categoryId } }).then(function (res) {
      setServiceOptions(res.data);
    });
  }, [form.eventCategory, initial?.eventCategory]);

  // Recalculate totals whenever services or discount change
  const subTotal = form.services.reduce(function (sum, s) { return sum + (Number(s.price) || 0); }, 0);
  const total = subTotal - Number(form.discount || 0);
  const balance = total - Number(form.advancePaid || 0) - Number(form.totalPaid || 0);

  useEffect(function () {
    if (total > 0) {
      if (balance <= 0) {
        if (form.status !== 'paid') {
          setForm(function (f) { return { ...f, status: 'paid' }; });
        }
      } else {
        if (form.status === 'paid') {
          setForm(function (f) { return { ...f, status: 'partial' }; });
        } else if ((Number(form.advancePaid) > 0 || Number(form.totalPaid) > 0) && form.status === 'draft') {
          setForm(function (f) { return { ...f, status: 'partial' }; });
        }
      }
    }
  }, [balance, total, form.status, form.advancePaid, form.totalPaid]);

  // Selecting a customer from the dropdown — this is the ONLY way customer gets set.
  function handleCustomerSelect(customerId) {
    if (!customerId) {
      setForm(function (f) { return { ...f, customer: { name: '', phone: '' } }; });
      return;
    }
    const c = customers.find(function (cu) { return cu._id === customerId; });
    if (!c) return;
    setForm(function (f) { return { ...f, customer: { _id: c._id, name: c.name, phone: c.phone } }; });
    if (onCustomerSelect) onCustomerSelect(c);
  }

  // Try to match the current form.customer back to an entry in the loaded list
  // (handles edit mode, where initial.customer is a snapshot taken at invoice time).
  const matchedCustomer = customers.find(function (c) {
    return c._id === form.customer?._id || (form.customer?.phone && c.phone === form.customer.phone);
  });

  function updateService(idx, field, val) {
    setForm(function (f) {
      const services = f.services.map(function (s, i) {
        if (i !== idx) return s;
        const updated = { ...s, [field]: val };
        updated.total = Number(updated.price) || 0;
        return updated;
      });
      return { ...f, services };
    });
  }

  function addService() {
    setForm(function (f) { return { ...f, services: [...f.services, { ...emptyService }] }; });
  }

  function removeService(idx) {
    setForm(function (f) {
      return { ...f, services: f.services.filter(function (_, i) { return i !== idx; }) };
    });
  }

  // Handle manual category change
  function handleCategoryChange(categoryId) {
    const category = eventCategories.find(function (c) { return c._id === categoryId; });
    setForm(function (f) {
      return {
        ...f,
        eventCategory: categoryId,
        event: category?.name || f.event,
        services: [{ ...emptyService }],
      };
    });
  }

  // Toggle the advance-payment block; clears the amount when hidden so it doesn't
  // silently linger in the total if the user unchecks it.
  function toggleAdvance(checked) {
    setForm(function (f) {
      return { ...f, showAdvance: checked, advancePaid: checked ? f.advancePaid : 0 };
    });
  }

  function toggleFinal(checked) {
    setForm(function (f) {
      return { ...f, showFinal: checked, totalPaid: checked ? f.totalPaid : 0 };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const category = eventCategories.find(function (c) { return c._id === form.eventCategory; });
    onSubmit({
      ...form,
      subTotal,
      total,
      balance,
      eventCategory: form.eventCategory,
      eventCategoryName: category?.name || form.event,
      showTerms: category?.showTerms ?? true,
      termsAndConditions: category?.showTerms ? (category?.termsAndConditions || '') : '',
    });
  }

  const getDescriptions = function (serviceName) {
    const found = serviceOptions.find(function (s) { return s.name === serviceName; });
    return found ? found.descriptions : [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">

      {/* Invoice Number strip */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
          <Hash size={14} />
          Invoice Number
        </div>
        <span className="font-mono font-bold text-slate-800 text-sm">
          {initial?.invoiceNumber || initial?.invoiceId || 'Auto-generated on save'}
        </span>
      </div>

      {/* 1. Customer Details */}
      <div className="card p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
            <User size={16} />
          </div>
          <h2 className="font-semibold text-slate-800">Customer & Event Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer — input with datalist (select or type new) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User size={14} />
              </span>
              <input
                list="customer-list"
                className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500"
                value={form.customer.name}
                onChange={function (e) {
                  const val = e.target.value;
                  const matched = customers.find(c => c.name === val || c.name + ' — ' + c.phone === val);
                  if (matched) {
                    setForm(f => ({ ...f, customer: { _id: matched._id, name: matched.name, phone: matched.phone } }));
                  } else {
                    setForm(f => ({ ...f, customer: { ...f.customer, _id: undefined, name: val } }));
                  }
                }}
                placeholder="Type or select a customer"
                required
              />
              <datalist id="customer-list">
                {customers.map(c => (
                  <option key={c._id} value={c.name} />
                ))}
              </datalist>
            </div>
            {form.customer?.name && !matchedCustomer && (
              <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} />
                New customer. Their details will be saved on this invoice.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={14} />
              </span>
              <input
                className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500"
                value={form.customer.phone}
                onChange={function (e) { setForm(f => ({ ...f, customer: { ...f.customer, phone: e.target.value } })); }}
                placeholder="Phone number"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Event Category *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <ShoppingBag size={14} />
              </span>
              <select
                className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
                value={form.eventCategory || initial?.eventCategory?._id || initial?.eventCategory || ''}
                onChange={function (e) { handleCategoryChange(e.target.value); }}
                required
              >
                <option value="">Select category</option>
                {eventCategories.map(function (c) {
                  return <option key={c._id} value={c._id}>{c.name}</option>;
                })}
              </select>
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

      {/* 2. Services List */}
      <div className="card p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Layers size={16} />
            </div>
            <h2 className="font-semibold text-slate-800">Services & Coverages</h2>
          </div>
          {!form.eventCategory && !(initial?.eventCategory?._id || initial?.eventCategory) && (
            <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
              <AlertCircle size={10} /> Choose Category to load options
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-slate-700 text-sm">
            <thead>
              <tr className="text-left border-b border-slate-100">
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Service</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Description</th>
                <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">Price (₹)</th>
                <th className="pb-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {form.services.map(function (s, idx) {
                return (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 pr-4">
                      <select
                        className="input focus:ring-orange-500/20 focus:border-orange-500"
                        value={s.service}
                        onChange={function (e) { updateService(idx, 'service', e.target.value); }}
                      >
                        <option value="">Select service</option>
                        {serviceOptions.map(function (opt) {
                          return <option key={opt.name} value={opt.name}>{opt.name}</option>;
                        })}
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      {getDescriptions(s.service).length > 0 ? (
                        <select
                          className="input focus:ring-orange-500/20 focus:border-orange-500"
                          value={s.description}
                          onChange={function (e) { updateService(idx, 'description', e.target.value); }}
                        >
                          <option value="">Select description type</option>
                          {getDescriptions(s.service).map(function (d) {
                            return <option key={d} value={d}>{d}</option>;
                          })}
                        </select>
                      ) : (
                        <input
                          className="input focus:ring-orange-500/20 focus:border-orange-500"
                          value={s.description}
                          onChange={function (e) { updateService(idx, 'description', e.target.value); }}
                          placeholder="Provide coverage details..."
                        />
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₹</span>
                        <input
                          type="number"
                          className="input pl-7 focus:ring-orange-500/20 focus:border-orange-500 text-right font-mono"
                          value={s.price}
                          onChange={function (e) { updateService(idx, 'price', e.target.value); }}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {form.services.length > 1 && (
                        <button
                          type="button"
                          onClick={function () { removeService(idx); }}
                          className="p-1 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                          title="Remove service"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addService}
          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold px-3 py-1.5 rounded-lg text-xs mt-3 transition-colors"
        >
          <Plus size={14} /> Add Service Row
        </button>
      </div>

      {/* 3. Payments & Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left Side: Receipt & Payments */}
        <div className="card p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Receipt size={16} />
              </div>
              <h2 className="font-semibold text-slate-800">Billing Breakdown</h2>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal Amount</span>
                <span className="font-semibold text-slate-800 font-mono">₹{subTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center">
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

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-bold text-slate-800">
                <span>Total Amount</span>
                <span className="text-orange-600 text-lg font-extrabold font-mono">₹{total.toLocaleString('en-IN')}</span>
              </div>

              {/* Advance Payment — checkbox-gated */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showAdvance}
                    onChange={function (e) { toggleAdvance(e.target.checked); }}
                    className="w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">Advance Payment Received</span>
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

              {/* Final / Settlement Payment — checkbox-gated */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.showFinal}
                    onChange={function (e) { toggleFinal(e.target.checked); }}
                    className="w-4 h-4 accent-orange-500 rounded border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700">2nd / Final Payment Received</span>
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

          {/* Balance Indicator block */}
          <div className="mt-6">
            {balance <= 0 && total > 0 ? (
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 px-4 py-3.5 rounded-xl shadow-inner">
                <span className="text-orange-800 font-bold text-sm flex items-center gap-1.5">
                  <BadgeCheck size={16} className="text-orange-600 animate-bounce" />
                  Paid in Full
                </span>
                <span className="text-orange-700 font-extrabold text-lg font-mono">₹0</span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-orange-50/50 border border-orange-200/50 px-4 py-3.5 rounded-xl">
                <span className="text-orange-800 font-bold text-sm">Remaining Balance</span>
                <span className="text-orange-700 font-extrabold text-lg font-mono">₹{balance.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Invoice Settings */}
        <div className="card p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <Settings size={16} />
              </div>
              <h2 className="font-semibold text-slate-800">Invoice Status & Settings</h2>
            </div>

            {/* Custom Interactive Status buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Invoice Status</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'draft', label: 'Draft' },
                  { key: 'sent', label: 'Sent' },
                  { key: 'partial', label: 'Partial' },
                  { key: 'paid', label: 'Paid' }
                ].map(item => (
                  <label key={item.key} className="cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={item.key}
                      checked={form.status === item.key}
                      onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                      className="sr-only peer"
                    />
                    <div className="text-center py-2.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl transition-all peer-checked:bg-orange-50 peer-checked:text-orange-700 peer-checked:border-orange-200 hover:bg-orange-50/30 peer-checked:ring-2 peer-checked:ring-orange-500/10">
                      {item.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Required Dispatch Staff</label>
              <input
                type="number"
                className="input focus:ring-orange-500/20 focus:border-orange-500"
                value={form.requiredStaff}
                onChange={function (e) { setForm(function (f) { return { ...f, requiredStaff: Number(e.target.value) || 0 }; }); }}
                placeholder="e.g. 3 crew members"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Invoice Notes</label>
              <textarea
                className="input resize-none focus:ring-orange-500/20 focus:border-orange-500"
                rows={3}
                value={form.notes}
                onChange={function (e) { setForm(function (f) { return { ...f, notes: e.target.value }; }); }}
                placeholder="Message displayed at bottom of bill..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-5">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-orange-100 hover:shadow-orange-200 active:scale-95 text-center text-sm disabled:opacity-50"
            >
              {loading ? 'Saving invoice data...' : 'Save & Compile Bill'}
            </button>
          </div>
        </div>

      </div>

    </form>
  );
}