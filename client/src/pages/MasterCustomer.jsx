import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, X, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Custom WhatsApp Icon Component
function WhatsAppIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function MasterCustomer() {
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data),
    staleTime: 5 * 60 * 1000
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !phone) return toast.error('Name and Phone are required');

    try {
      if (editId) {
        await api.put('/customers/' + editId, { name, phone, address });
        toast.success('Customer updated');
      } else {
        await api.post('/customers', { name, phone, address });
        toast.success('Customer added');
      }
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    }
  }

  function handleAdd() {
    setEditId(null);
    setName('');
    setPhone('');
    setAddress('');
    setIsModalOpen(true);
  }

  function handleEdit(customer) {
    setEditId(customer._id);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || '');
    setIsModalOpen(true);
  }

  function handleCancelEdit() {
    setEditId(null);
    setName('');
    setPhone('');
    setAddress('');
    setIsModalOpen(false);
  }

  async function handleStatusChange(id, newStatusStr) {
    const isActive = newStatusStr === 'Active';
    try {
      await api.patch(`/customers/${id}/status`, { isActive });
      toast.success(`Customer marked ${newStatusStr}`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  }

  // Derived state for filtering and pagination
  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
    );
  }, [customers, search]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Helper to get initials and random pastel color
  const getAvatarInfo = (nameStr, id) => {
    const initials = nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['bg-slate-200', 'bg-orange-100', 'bg-emerald-100', 'bg-blue-100', 'bg-purple-100', 'bg-rose-100'];
    const colorIndex = (id.charCodeAt(id.length - 1) || 0) % colors.length;
    return { initials, bgClass: colors[colorIndex] };
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 font-sans">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A202C] tracking-tight">Master Customer Directory</h1>
          <p className="text-slate-500 mt-1">Review customer directories and profiles.</p>
        </div>
        <button
          onClick={() => handleAdd()}
          className="flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#e66e00] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Add New Customer</span>
        </button>
      </header>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone or address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Floating Cards List */}
      <div className="space-y-3 relative">
        {loading && <div className="text-center py-10 text-slate-400">Loading customers...</div>}

        {!loading && paginatedCustomers.length === 0 && (
          <div className="text-center py-10 text-slate-400">No customers found matching your search.</div>
        )}

        {paginatedCustomers.map(customer => {
          const { initials, bgClass } = getAvatarInfo(customer.name, customer._id);
          const active = customer.isActive !== false;

          return (
            <div key={customer._id} className="bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 p-2.5 pr-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md hover:border-orange-100 transition-all duration-200 group">

              {/* Name Column */}
              <div className="flex items-center gap-4 w-full md:w-1/4 shrink-0 pl-2">
                <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center font-bold text-slate-700 text-lg shrink-0 ${bgClass}`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-[15px] truncate">{customer.name}</div>
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">{initials}</div>
                </div>
              </div>

              {/* Phone Column */}
              <div className="w-full md:w-[22%] flex items-center gap-2 text-slate-700 font-medium text-[15px] shrink-0">
                {customer.phone}
                <WhatsAppIcon size={16} className="text-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Address Column */}
              <div className="w-full md:w-[28%] text-slate-600 text-[14px] truncate shrink-0">
                {customer.address || '—'}
              </div>

              {/* Actions Column */}
              <div className="w-full md:flex-1 flex items-center justify-end gap-4 shrink-0">
                <button onClick={() => handleEdit(customer)} className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                  <Edit3 size={18} />
                </button>

                {/* iOS Toggle */}
                <button
                  onClick={() => handleStatusChange(customer._id, active ? 'Inactive' : 'Active')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${active ? 'bg-orange-400' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Add Button */}
      {!loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-10 gap-6">
          <div className="flex-1"></div> {/* Spacer */}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 font-medium text-sm text-slate-500">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 hover:text-slate-800 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${currentPage === page ? 'bg-slate-200 text-slate-800 font-bold' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 hover:text-slate-800 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Fixed bottom-right Add Button relative to the container */}

        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Name *</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g. John Doe"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Phone *</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Address</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-medium resize-none transition-all"
                    rows="3"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="City, State"
                  ></textarea>
                </div>
              </div>

              <div className="px-6 py-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white hover:bg-slate-100 text-slate-600 font-bold px-6 py-2.5 rounded-xl border border-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-md shadow-orange-200 text-sm"
                >
                  {editId ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
