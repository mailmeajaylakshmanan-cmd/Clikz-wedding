import { useState, useEffect, useRef } from 'react';
import api from '../api/axios.js';
import { 
  User, Phone, Calendar, MapPin, Plus, Trash2, 
  Settings, BadgeCheck, Sparkles, Layers, Receipt, 
  AlertCircle, ShoppingBag
} from 'lucide-react';

const emptyService = { service: '', description: '', price: '', total: 0 };

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
    };
    if (!initial) return base;
    return {
      ...base,
      ...initial,
      eventCategory: initial.eventCategory?._id || initial.eventCategory || '',
      customer: initial.customer || base.customer,
      services: initial.services?.length ? initial.services : base.services,
      requiredStaff: initial.requiredStaff || 0,
    };
  });

  const [eventCategories, setEventCategories] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [customerSearch, setCustomerSearch] = useState(initial?.customer?.name || '');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const customerTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(function () {
    api.get('/event-categories').then(function (res) { setEventCategories(res.data); });

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setCustomerSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return function () {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  function searchCustomers(val) {
    clearTimeout(customerTimer.current);
    setCustomerSearch(val);
    if (val.length < 2) { setCustomerSuggestions([]); return; }
    customerTimer.current = setTimeout(function () {
      api.get('/customers', { params: { search: val } }).then(function (res) {
        setCustomerSuggestions(res.data);
      });
    }, 300);
  }

  function selectCustomer(c) {
    clearTimeout(customerTimer.current);
    setForm(function (f) { return { ...f, customer: { name: c.name, phone: c.phone } }; });
    setCustomerSearch(c.name);
    setCustomerSuggestions([]);
    if (onCustomerSelect) onCustomerSelect(c);
  }

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
      
      {/* 1. Customer Details */}
      <div className="card p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
            <User size={16} />
          </div>
          <h2 className="font-semibold text-slate-800">Customer & Event Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer Name Autocomplete */}
          <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Customer Name *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={14} />
              </span>
              <input
                className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500"
                value={customerSearch}
                onChange={function (e) {
                  searchCustomers(e.target.value);
                  setForm(function (f) { return { ...f, customer: { ...f.customer, name: e.target.value } }; });
                }}
                placeholder="Search or type customer name"
                required
              />
            </div>
            
            {customerSuggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {customerSuggestions.map(function (c) {
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={function () { selectCustomer(c); }}
                      className="w-full text-left px-4 py-2 hover:bg-orange-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.phone}</p>
                    </button>
                  );
                })}
              </div>
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
                onChange={function (e) { setForm(function (f) { return { ...f, customer: { ...f.customer, phone: e.target.value } }; }); }}
                placeholder="9842209736"
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Event Date (Supports range/labels)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Calendar size={14} />
              </span>
              <input
                className="input pl-9 focus:ring-orange-500/20 focus:border-orange-500"
                value={form.eventDate}
                onChange={function (e) { setForm(function (f) { return { ...f, eventDate: e.target.value }; }); }}
                placeholder="21/05/2026 & 24/06/2026"
              />
            </div>
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

              {/* Advance Payment Field */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Advance Paid</span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                      value={form.advancePaid}
                      onChange={function(e) { setForm(function(f) { return { ...f, advancePaid: e.target.value }; }); }}
                      min="0"
                    />
                  </div>
                </div>

                {Number(form.advancePaid) > 0 && (
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-xl p-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Advance Receipt Info</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Receipt Date</label>
                        <input
                          type="date"
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500"
                          value={form.advancePaymentDate}
                          onChange={function(e) { setForm(function(f) { return { ...f, advancePaymentDate: e.target.value }; }); }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                        <select
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500"
                          value={form.advancePaymentMethod}
                          onChange={function(e) { setForm(function(f) { return { ...f, advancePaymentMethod: e.target.value }; }); }}
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

              {/* Final Settlement Field */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">2nd / Final Paid</span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      className="input pl-7 text-right focus:ring-orange-500/20 focus:border-orange-500 font-mono py-1"
                      value={form.totalPaid}
                      onChange={function(e) { setForm(function(f) { return { ...f, totalPaid: e.target.value }; }); }}
                      min="0"
                    />
                  </div>
                </div>

                {Number(form.totalPaid) > 0 && (
                  <div className="bg-orange-50/30 border border-orange-100/50 rounded-xl p-3 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Settlement Receipt Info</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Settlement Date</label>
                        <input
                          type="date"
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500"
                          value={form.totalPaymentDate}
                          onChange={function(e) { setForm(function(f) { return { ...f, totalPaymentDate: e.target.value }; }); }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                        <select
                          className="input py-1 text-xs focus:ring-orange-500/20 focus:border-orange-500"
                          value={form.totalPaymentMethod}
                          onChange={function(e) { setForm(function(f) { return { ...f, totalPaymentMethod: e.target.value }; }); }}
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
                    <div className="text-center py-2.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl transition-all peer-checked:bg-orange-55 peer-checked:bg-orange-50 peer-checked:text-orange-700 peer-checked:border-orange-200 hover:bg-orange-50/30 peer-checked:ring-2 peer-checked:ring-orange-500/10">
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
