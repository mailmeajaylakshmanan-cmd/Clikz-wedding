import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import {
  User, Phone, Calendar, MapPin, Plus, Trash2,
  Settings, BadgeCheck, Sparkles, Layers, Receipt,
  AlertCircle, ShoppingBag, Hash, Home, CheckSquare, Copy
} from 'lucide-react';
import Select from 'react-select';

// "2026-05-21" -> "21/05/2026"
function toDisplayDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!d || !m || !y) return iso;
  return d + '/' + m + '/' + y;
}

export default function InvoiceForm({ initial, onSubmit, loading, onCustomerSelect }) {
  // Global form state (Customer, Payments, Discount)
  const [globalForm, setGlobalForm] = useState(() => {
    const base = {
      customer: { name: '', phone: '', address: '' },
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
      showAdvance: false,
      showAdvance2: false,
      showAdvance3: false,
      showFinal: false,
    };
    if (!initial) return base;
    return {
      ...base,
      customer: initial.customer || base.customer,
      discount: initial.discount || 0,
      showAdvance: Number(initial.advancePaid) > 0,
      showAdvance2: Number(initial.advancePaid2) > 0,
      showAdvance3: Number(initial.advancePaid3) > 0,
      showFinal: Number(initial.totalPaid) > 0,
      advancePaid: initial.advancePaid || 0,
      advancePaymentDate: initial.advancePaymentDate || base.advancePaymentDate,
      advancePaymentMethod: initial.advancePaymentMethod || base.advancePaymentMethod,
      advancePaid2: initial.advancePaid2 || 0,
      advancePaymentDate2: initial.advancePaymentDate2 || base.advancePaymentDate2,
      advancePaymentMethod2: initial.advancePaymentMethod2 || base.advancePaymentMethod2,
      advancePaid3: initial.advancePaid3 || 0,
      advancePaymentDate3: initial.advancePaymentDate3 || base.advancePaymentDate3,
      advancePaymentMethod3: initial.advancePaymentMethod3 || base.advancePaymentMethod3,
      totalPaid: initial.totalPaid || 0,
      totalPaymentDate: initial.totalPaymentDate || base.totalPaymentDate,
      totalPaymentMethod: initial.totalPaymentMethod || base.totalPaymentMethod,
    };
  });

  // Events Array State
  const [events, setEvents] = useState(() => {
    if (initial) {
      // Load initial flat invoice into a single event
      return [{
        id: 1,
        eventCategory: initial.eventCategory?._id || initial.eventCategory || '',
        eventCategoryName: initial.eventCategoryName || initial.event || 'Main Event',
        event: initial.event || '',
        eventDate: initial.eventDate ? initial.eventDate.split('&')[0].trim() : '', // Simplify for multi-event
        location: initial.location || '',
        services: initial.services || [],
        subTotal: initial.subTotal || 0,
        requiredStaff: initial.requiredStaff || 0,
        notes: initial.notes || 'Grateful to be part of your celebration.'
      }];
    }
    return [{
      id: Date.now(),
      eventCategory: '',
      eventCategoryName: 'New Event',
      event: '',
      eventDate: '',
      location: '',
      services: [],
      subTotal: 0,
      requiredStaff: 0,
      notes: 'Grateful to be part of your celebration.'
    }];
  });

  const [activeEventId, setActiveEventId] = useState(events[0].id);
  const [eventCategories, setEventCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceOptionsCache, setServiceOptionsCache] = useState({});

  useEffect(() => {
    api.get('/event-categories').then(res => setEventCategories(res.data));
    api.get('/customers').then(res => setCustomers(res.data));
  }, []);

  const activeEventIndex = events.findIndex(e => e.id === activeEventId);
  const activeEvent = events[activeEventIndex] || events[0];

  useEffect(() => {
    // Fetch services for active category if not cached
    if (activeEvent.eventCategory && !serviceOptionsCache[activeEvent.eventCategory]) {
      api.get('/services', { params: { category: activeEvent.eventCategory } }).then(res => {
        setServiceOptionsCache(prev => ({ ...prev, [activeEvent.eventCategory]: res.data }));
      });
    }
  }, [activeEvent.eventCategory, serviceOptionsCache]);

  const serviceOptions = serviceOptionsCache[activeEvent.eventCategory] || [];

  const addEvent = () => {
    const newId = Date.now();
    setEvents([...events, {
      id: newId,
      eventCategory: '',
      eventCategoryName: 'New Event',
      event: '',
      eventDate: '',
      location: '',
      services: [],
      subTotal: 0,
      requiredStaff: 0,
      notes: 'Grateful to be part of your celebration.'
    }]);
    setActiveEventId(newId);
  };

  const removeEvent = (id) => {
    if (events.length <= 1) return;
    const nextEvents = events.filter(e => e.id !== id);
    setEvents(nextEvents);
    if (activeEventId === id) setActiveEventId(nextEvents[0].id);
  };

  const duplicateEvent = (id) => {
    const evToDup = events.find(e => e.id === id);
    if (!evToDup) return;
    const newId = Date.now();
    setEvents([...events, { ...evToDup, id: newId, eventCategoryName: evToDup.eventCategoryName + ' (Copy)' }]);
    setActiveEventId(newId);
  };

  const updateActiveEvent = (updates) => {
    setEvents(events.map(ev => ev.id === activeEventId ? { ...ev, ...updates } : ev));
  };

  const handleCategoryChange = (categoryId) => {
    const category = eventCategories.find(c => c._id === categoryId);
    updateActiveEvent({
      eventCategory: categoryId,
      eventCategoryName: category?.name || 'New Event',
      event: category?.name || activeEvent.event,
      services: [] // Clear services when category changes
    });
  };

  const toggleService = (serviceName, isChecked, defaultDescription = '') => {
    if (isChecked) {
      updateActiveEvent({
        services: [...activeEvent.services, { service: serviceName, description: defaultDescription, price: 0, total: 0 }]
      });
    } else {
      updateActiveEvent({
        services: activeEvent.services.filter(s => s.service !== serviceName)
      });
    }
  };

  const updateServiceDescription = (serviceName, description) => {
    updateActiveEvent({
      services: activeEvent.services.map(s => s.service === serviceName ? { ...s, description } : s)
    });
  };

  const totalEventPrices = events.reduce((sum, ev) => sum + Number(ev.subTotal || 0), 0);
  const finalTotal = totalEventPrices - Number(globalForm.discount || 0);
  const totalPaidSum = Number(globalForm.advancePaid) + Number(globalForm.advancePaid2) + Number(globalForm.advancePaid3) + Number(globalForm.totalPaid);
  const balance = finalTotal - totalPaidSum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!globalForm.customer.name) return alert("Please select a customer.");
    
    // Flattening Logic (Option A)
    const firstEvent = events[0];
    const mergedEventLabel = events.map(e => e.event || e.eventCategoryName).filter(Boolean).join(' & ');
    
    // Convert yyyy-mm-dd to dd/mm/yyyy for saving
    const mergedDates = events.map(e => {
        if (!e.eventDate) return '';
        const [y, m, d] = e.eventDate.split('-');
        if (!y || !m || !d) return e.eventDate;
        return `${d}/${m}/${y}`;
    }).filter(Boolean).join(' & ');

    const mergedLocations = Array.from(new Set(events.map(e => e.location).filter(Boolean))).join(' & ');
    
    // Prefix services with event name to distinguish
    const mergedServices = events.flatMap(ev => 
      ev.services.map(s => ({
        ...s,
        description: `[${ev.eventCategoryName}] ` + (s.description || '')
      }))
    );

    const mergedNotes = events.map(e => `${e.eventCategoryName}: ${e.notes}`).join('\n\n');
    const maxRequiredStaff = Math.max(...events.map(e => Number(e.requiredStaff) || 0));

    const payload = {
      ...globalForm,
      subTotal: totalEventPrices,
      total: finalTotal,
      balance,
      eventCategory: firstEvent.eventCategory,
      eventCategoryName: firstEvent.eventCategoryName,
      event: mergedEventLabel,
      eventDate: mergedDates,
      location: mergedLocations,
      services: mergedServices,
      requiredStaff: maxRequiredStaff,
      notes: mergedNotes,
      status: finalTotal > 0 && balance <= 0 ? 'paid' : (balance < finalTotal ? 'partial' : 'pending'),
      showTerms: true
    };
    
    onSubmit(payload);
  };

  const selectedCustomer = globalForm.customer?.name && globalForm.customer?._id 
    ? { value: globalForm.customer._id, label: `${globalForm.customer.name} — ${globalForm.customer.phone}` }
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Top Navigation: Event Tab Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {events.map((ev, idx) => {
            const isActive = activeEventId === ev.id;
            let displayDate = 'No Date';
            if (ev.eventDate) {
              const [y,m,d] = ev.eventDate.split('-');
              if (y && m && d) displayDate = `${d}/${m}/${y.slice(-2)}`;
              else displayDate = ev.eventDate;
            }

            return (
              <div
                key={ev.id}
                onClick={() => setActiveEventId(ev.id)}
                className={`cursor-pointer px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-3 border ${isActive ? 'bg-white text-orange-600 border-orange-300 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <span>{ev.eventCategoryName || `Event ${idx + 1}`} - {displayDate}</span>
                {isActive && (
                  <div className="flex items-center gap-1.5 border-l pl-2 ml-1 border-orange-200">
                    <Copy size={14} className="text-orange-400 hover:text-orange-600 transition-colors" onClick={(e) => { e.stopPropagation(); duplicateEvent(ev.id); }} title="Duplicate Event" />
                    {events.length > 1 && (
                      <Trash2 size={14} className="text-slate-400 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); removeEvent(ev.id); }} title="Delete Event" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addEvent}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors whitespace-nowrap flex items-center gap-1.5 border border-orange-100 shadow-sm"
          >
            <Plus size={16} /> Add Another Event
          </button>
        </div>
      </div>

      {/* 3-Column Unified Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Event Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-5 border-t-4 border-t-orange-500 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <User size={18} className="text-orange-500" /> Client (Global)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Client *</label>
                <div className="relative z-50">
                  <Select
                    isClearable
                    placeholder="Search master..."
                    options={customers.filter(c => c.isActive !== false || c._id === globalForm.customer?._id).map(c => ({ value: c._id, label: `${c.name} — ${c.phone}`, customer: c }))}
                    value={selectedCustomer}
                    onChange={(selected) => {
                      if (!selected) {
                        setGlobalForm(f => ({ ...f, customer: { name: '', phone: '', address: '' } }));
                      } else {
                        const matched = selected.customer;
                        setGlobalForm(f => ({ ...f, customer: { _id: matched._id, name: matched.name, phone: matched.phone, address: matched.address || '' } }));
                        if (onCustomerSelect) onCustomerSelect(matched);
                      }
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        padding: '2px',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#cbd5e1' }
                      })
                    }}
                  />
                </div>
              </div>
              
              {globalForm.customer.name && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Phone size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                      <div className="text-sm font-medium text-slate-700">{globalForm.customer.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Home size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</div>
                      <div className="text-sm font-medium text-slate-700">{globalForm.customer.address || <span className="italic text-slate-400">No address</span>}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-orange-500" /> Active Event Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Event Category *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <ShoppingBag size={14} />
                  </span>
                  <select
                    className="input pl-9 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8 w-full border-slate-200"
                    value={activeEvent.eventCategory || ''}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {eventCategories.filter(c => c.isActive !== false || c._id === activeEvent.eventCategory).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Event Label</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Sparkles size={14} />
                  </span>
                  <input
                    className="input pl-9 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 w-full border-slate-200"
                    value={activeEvent.event}
                    onChange={(e) => updateActiveEvent({ event: e.target.value })}
                    placeholder="E.g. Pre-Wedding Shoot"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Event Date</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                     <Calendar size={14} />
                   </span>
                   <input
                     type="date"
                     className="input pl-9 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 w-full border-slate-200"
                     value={activeEvent.eventDate || ''}
                     onChange={(e) => updateActiveEvent({ eventDate: e.target.value })}
                   />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={14} />
                  </span>
                  <input
                    className="input pl-9 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 w-full border-slate-200"
                    value={activeEvent.location}
                    onChange={(e) => updateActiveEvent({ location: e.target.value })}
                    placeholder="Venue, City"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Active Event Production */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Layers size={18} className="text-orange-500" /> Active Event Production
            </h2>
            
            {!activeEvent.eventCategory ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-medium text-slate-400 flex items-center justify-center gap-2">
                  <AlertCircle size={16} /> Select a category first
                </p>
              </div>
            ) : serviceOptions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {serviceOptions.filter(opt => opt.isActive !== false).map((opt) => {
                  const isChecked = activeEvent.services.some(s => s.service === opt.name);
                  const currentService = activeEvent.services.find(s => s.service === opt.name);
                  
                  return (
                    <div key={opt._id} className={`border rounded-xl p-4 transition-all ${isChecked ? 'border-orange-300 bg-orange-50/30 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <span className={`font-bold text-sm ${isChecked ? 'text-orange-700' : 'text-slate-700'}`}>{opt.name}</span>
                        {/* iOS style toggle */}
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isChecked ? 'bg-orange-500' : 'bg-slate-200'}`}>
                          <input type="checkbox" className="sr-only" checked={isChecked} onChange={(e) => toggleService(opt.name, e.target.checked, opt.descriptions?.[0] || '')} />
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isChecked ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </label>
                      {isChecked && (
                        <div className="mt-3 pt-3 border-t border-orange-100/50">
                          <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 block">Custom Details</label>
                          {opt.descriptions && opt.descriptions.length > 0 ? (
                             <select
                               className="input py-1.5 text-xs focus:ring-orange-500/20 focus:border-orange-500 rounded-lg bg-white border-orange-200 w-full"
                               value={currentService?.description || ''}
                               onChange={(e) => updateServiceDescription(opt.name, e.target.value)}
                             >
                               {opt.descriptions.map((desc, i) => <option key={i} value={desc}>{desc}</option>)}
                             </select>
                          ) : (
                             <input
                               className="input py-1.5 text-xs focus:ring-orange-500/20 focus:border-orange-500 rounded-lg bg-white border-orange-200 w-full"
                               placeholder="Optional details..."
                               value={currentService?.description || ''}
                               onChange={(e) => updateServiceDescription(opt.name, e.target.value)}
                             />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
               <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-medium text-slate-400">No services found for this category.</p>
              </div>
            )}
          </div>

          <div className="card p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
             <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 uppercase tracking-wider">
               Staffing & Notes
             </h2>
             <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Staff Count</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={activeEvent.requiredStaff}
                      onChange={e => updateActiveEvent({ requiredStaff: Number(e.target.value) })}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="w-10 text-center font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg py-1.5 text-sm">{activeEvent.requiredStaff}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-1">
                    <span>0</span><span>10</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Note to Customer</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 text-slate-700 font-medium resize-none"
                    rows="3"
                    value={activeEvent.notes}
                    onChange={(e) => updateActiveEvent({ notes: e.target.value })}
                    placeholder="Specific notes for this event..."
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Column 3: Shared Billing Timeline */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <div className="card bg-slate-900 rounded-2xl shadow-xl border-none overflow-hidden relative">
            {/* Soft glowing orange background accent */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none"></div>
            
            <div className="p-6 relative z-10">
              <h2 className="font-bold text-white text-xl mb-6 flex items-center justify-between">
                <span>Total Project<br/><span className="text-slate-400 font-medium text-sm">(Unified Breakdown)</span></span>
              </h2>
              
              <div className="space-y-3 mb-6">
                {events.map((ev, i) => (
                  <div key={ev.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex-1">
                      <span className="font-bold text-slate-200 text-sm block truncate pr-2">{ev.eventCategoryName || `Event ${i+1}`}</span>
                    </div>
                    <div className="relative w-32 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-7 pr-2 text-right focus:ring-orange-500 focus:border-orange-500 font-mono py-1.5 font-bold text-sm"
                        value={ev.subTotal}
                        onChange={(e) => setEvents(events.map(eItem => eItem.id === ev.id ? {...eItem, subTotal: e.target.value} : eItem))}
                        min="0"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center px-2 mt-4 pt-2 border-t border-slate-700">
                  <span className="text-slate-400 text-sm font-medium">Global Discount</span>
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                    <input
                      type="number"
                      className="w-full bg-transparent border-b border-slate-700 text-orange-400 pl-6 pr-1 text-right focus:outline-none focus:border-orange-500 font-mono py-1 text-sm font-bold"
                      value={globalForm.discount}
                      onChange={(e) => setGlobalForm(f => ({ ...f, discount: e.target.value }))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-between items-center font-bold text-white px-2">
                  <span>Grand Total</span>
                  <span className="text-orange-500 text-2xl font-extrabold font-mono">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 4-Step Payment Timeline */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 mb-6 relative">
                 <div className="absolute left-[27px] top-8 bottom-8 w-px bg-slate-700"></div>

                 {/* Step 1: 1st Advance */}
                 <div className="relative flex items-start gap-4 mb-4 group">
                    <div className="mt-1 relative z-10">
                      <input type="checkbox" checked={globalForm.showAdvance} onChange={e => setGlobalForm(f => ({...f, showAdvance: e.target.checked}))} className="w-5 h-5 rounded-full accent-orange-500 bg-slate-900 border-slate-600" />
                    </div>
                    <div className={`flex-1 transition-all ${globalForm.showAdvance ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-200">1st Advance <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded ml-1">Paid</span></span>
                       </div>
                       {globalForm.showAdvance && (
                          <div className="flex flex-col gap-2 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Amount</span>
                               <input type="number" className="w-24 bg-transparent border-b border-slate-600 text-white text-right font-mono text-sm p-0 pb-1 focus:ring-0 focus:border-orange-500" value={globalForm.advancePaid} onChange={e => setGlobalForm(f => ({...f, advancePaid: e.target.value}))} />
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Date</span>
                               <input type="date" className="w-28 bg-transparent border-none text-slate-300 text-xs p-0 focus:ring-0" value={globalForm.advancePaymentDate} onChange={e => setGlobalForm(f => ({...f, advancePaymentDate: e.target.value}))} />
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Step 2: Mid-Payment */}
                 <div className="relative flex items-start gap-4 mb-4 group">
                    <div className="mt-1 relative z-10">
                      <input type="checkbox" checked={globalForm.showAdvance2} onChange={e => setGlobalForm(f => ({...f, showAdvance2: e.target.checked}))} className="w-5 h-5 rounded-full accent-orange-500 bg-slate-900 border-slate-600" />
                    </div>
                    <div className={`flex-1 transition-all ${globalForm.showAdvance2 ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-200">Mid-Payment <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded ml-1">Due</span></span>
                       </div>
                       {globalForm.showAdvance2 && (
                          <div className="flex flex-col gap-2 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Amount</span>
                               <input type="number" className="w-24 bg-transparent border-b border-slate-600 text-white text-right font-mono text-sm p-0 pb-1 focus:ring-0 focus:border-orange-500" value={globalForm.advancePaid2} onChange={e => setGlobalForm(f => ({...f, advancePaid2: e.target.value}))} />
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Date</span>
                               <input type="date" className="w-28 bg-transparent border-none text-slate-300 text-xs p-0 focus:ring-0" value={globalForm.advancePaymentDate2} onChange={e => setGlobalForm(f => ({...f, advancePaymentDate2: e.target.value}))} />
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Step 3: Pre-Event */}
                 <div className="relative flex items-start gap-4 mb-4 group">
                    <div className="mt-1 relative z-10">
                      <input type="checkbox" checked={globalForm.showAdvance3} onChange={e => setGlobalForm(f => ({...f, showAdvance3: e.target.checked}))} className="w-5 h-5 rounded-full accent-orange-500 bg-slate-900 border-slate-600" />
                    </div>
                    <div className={`flex-1 transition-all ${globalForm.showAdvance3 ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-200">Pre-Event <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded ml-1">Upcoming</span></span>
                       </div>
                       {globalForm.showAdvance3 && (
                          <div className="flex flex-col gap-2 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Amount</span>
                               <input type="number" className="w-24 bg-transparent border-b border-slate-600 text-white text-right font-mono text-sm p-0 pb-1 focus:ring-0 focus:border-orange-500" value={globalForm.advancePaid3} onChange={e => setGlobalForm(f => ({...f, advancePaid3: e.target.value}))} />
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Date</span>
                               <input type="date" className="w-28 bg-transparent border-none text-slate-300 text-xs p-0 focus:ring-0" value={globalForm.advancePaymentDate3} onChange={e => setGlobalForm(f => ({...f, advancePaymentDate3: e.target.value}))} />
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Step 4: Final Delivery */}
                 <div className="relative flex items-start gap-4 group">
                    <div className="mt-1 relative z-10">
                      <input type="checkbox" checked={globalForm.showFinal} onChange={e => setGlobalForm(f => ({...f, showFinal: e.target.checked}))} className="w-5 h-5 rounded-full accent-emerald-500 bg-slate-900 border-slate-600" />
                    </div>
                    <div className={`flex-1 transition-all ${globalForm.showFinal ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-200">Final Balance <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded ml-1">Delivery</span></span>
                       </div>
                       {globalForm.showFinal && (
                          <div className="flex flex-col gap-2 mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Amount</span>
                               <input type="number" className="w-24 bg-transparent border-b border-slate-600 text-white text-right font-mono text-sm p-0 pb-1 focus:ring-0 focus:border-orange-500" value={globalForm.totalPaid} onChange={e => setGlobalForm(f => ({...f, totalPaid: e.target.value}))} />
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-medium">Date</span>
                               <input type="date" className="w-28 bg-transparent border-none text-slate-300 text-xs p-0 focus:ring-0" value={globalForm.totalPaymentDate} onChange={e => setGlobalForm(f => ({...f, totalPaymentDate: e.target.value}))} />
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Live Combined Balance</div>
                <div className={`text-3xl font-black font-mono tracking-tight ${balance > 0 ? 'text-white' : 'text-emerald-400'}`}>
                  ₹{Math.max(0, balance).toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-500 ml-1">PENDING</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-70 disabled:cursor-not-allowed text-lg"
              >
                <BadgeCheck size={24} />
                {loading ? 'Processing...' : (initial ? 'Update Combined Invoice' : 'Generate Combined Invoice')}
              </button>

            </div>
          </div>
        </div>

      </div>

    </form>
  );
}
