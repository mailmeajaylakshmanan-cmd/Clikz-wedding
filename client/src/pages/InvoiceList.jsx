import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit3, Trash2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  if (typeof dateStr === 'string' && dateStr.includes('&')) {
    return dateStr;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const d = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return dateStr;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  
  // Payment modal state
  const [selectedPaymentInvoiceId, setSelectedPaymentInvoiceId] = useState(null);

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices', { params: { limit: 10000 } }).then(res => {
      const allInvoices = res.data.invoices || res.data || [];
      const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const balanceDue = allInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
      const fullyStaffed = allInvoices.filter(inv => inv.staffingStatus === 'Fully Staffed').length;
      const staffingPending = allInvoices.filter(inv => inv.staffingStatus !== 'Fully Staffed').length;

      return {
        allInvoices,
        stats: { totalRevenue, balanceDue, fullyStaffed, staffingPending }
      };
    }),
    staleTime: 5 * 60 * 1000
  });

  const invoices = data?.allInvoices || [];
  const stats = data?.stats || { totalRevenue: 0, staffingPending: 0, balanceDue: 0, fullyStaffed: 0 };
  const selectedPaymentInvoice = selectedPaymentInvoiceId ? invoices.find(i => i._id === selectedPaymentInvoiceId) : null;

  async function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;
    try {
      await api.delete('/invoices/' + id);
      toast.success('Invoice deleted');
      refetch();
    } catch {
      toast.error('Failed to delete invoice');
    }
  }

  // Filter in memory for instant feedback
  const filtered = invoices.filter((inv) => {
    // Filter by staffing status
    if (status === 'Fully Staffed') {
      if (inv.staffingStatus !== 'Fully Staffed') return false;
    } else if (status === 'Pending Staff') {
      if (inv.staffingStatus === 'Fully Staffed') return false;
    }
    
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNo = inv.invoiceNo?.toLowerCase().includes(q);
      const matchName = inv.customer?.name?.toLowerCase().includes(q);
      const matchEvent = inv.event?.toLowerCase().includes(q);
      const matchCategory = inv.eventCategoryName?.toLowerCase().includes(q);
      return matchNo || matchName || matchEvent || matchCategory;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Invoice</h1>
          <p className="text-slate-500 mt-1">Manage your bookings and track staffing pipeline</p>
        </div>
        <Link 
          to="/invoices/new" 
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          <span>New Invoice</span>
        </Link>
      </header>

      {/* 2. Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: fmt(stats.totalRevenue) },
          { label: 'Staffing Pending', value: `${stats.staffingPending} Events` },
          { label: 'Balance Due', value: fmt(stats.balanceDue) },
          { label: 'Fully Staffed', value: String(stats.fullyStaffed) },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by customer or invoice ID..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-600"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Fully Staffed">Fully Staffed</option>
          <option value="Pending Staff">Pending Staff</option>
        </select>
      </div>

      {/* 4. The Modern Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Invoice ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client & Event</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Shoot Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Staffing</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Payment</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400 text-sm">
                  Loading invoices...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400 text-sm">
                  No invoices found
                </td>
              </tr>
            )}
            {!loading && filtered.map((inv) => {
              const projectType = inv.eventCategoryName || inv.event || '—';
              return (
                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-orange-600 text-sm">#{inv.invoiceNo || 'INV-XXX'}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800 text-sm">{inv.customer?.name || '—'}</p>
                    <p className="text-xs text-slate-400 font-medium">{projectType}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatDate(inv.eventDate)}</td>
                  
                  {/* Redirecting Staffing Badge */}
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate('/dispatcher?search=' + encodeURIComponent(inv.customer?.name || ''))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all hover:opacity-80 active:scale-95 ${
                        inv.staffingStatus === 'Fully Staffed'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : inv.staffingStatus === 'Partially Staffed'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                      title="Click to allocate staff for this client in Dispatcher"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        inv.staffingStatus === 'Fully Staffed' ? 'bg-emerald-500' :
                        inv.staffingStatus === 'Partially Staffed' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {inv.staffingStatus === 'Staffing Pending' ? 'Pending Staff' : inv.staffingStatus}
                    </button>
                  </td>

                  {/* Payment Badge with Details Eye Icon */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : inv.status === 'sent'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : inv.status === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {inv.status}
                      </span>
                      <button
                        onClick={() => setSelectedPaymentInvoiceId(inv._id)}
                        className="p-1 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                        title="View Payment details"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/invoices/${inv._id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details"><Eye size={16}/></Link>
                      <Link to={`/invoices/${inv._id}/edit`} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Edit"><Edit3 size={16}/></Link>
                      <button onClick={() => deleteInvoice(inv._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Details Modal */}
      {selectedPaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Payment Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPaymentInvoice.invoiceNo} • {selectedPaymentInvoice.customer?.name}</p>
              </div>
              <button 
                onClick={() => setSelectedPaymentInvoiceId(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Financial Summaries */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                  <span className="text-lg font-extrabold text-slate-800 mt-1 block">
                    {fmt(selectedPaymentInvoice.total)}
                  </span>
                </div>
                <div className={`p-4 rounded-xl border ${
                  selectedPaymentInvoice.balance > 0 
                    ? 'bg-rose-50/50 border-rose-100 text-rose-700' 
                    : 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                }`}>
                  <span className="text-[10px] font-bold opacity-75 uppercase tracking-wider block">Balance Due</span>
                  <span className="text-lg font-extrabold mt-1 block">
                    {fmt(selectedPaymentInvoice.balance)}
                  </span>
                </div>
              </div>

              {/* Itemized Payments */}
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                <div className="flex justify-between p-3 bg-slate-50/30">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-800">{fmt(selectedPaymentInvoice.subTotal)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50/30">
                  <span className="text-slate-500">Discount Applied</span>
                  <span className="font-semibold text-slate-800">-{fmt(selectedPaymentInvoice.discount)}</span>
                </div>
                
                {/* Advance Paid Details */}
                <div className="p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Advance Paid</span>
                    <span className="font-semibold text-slate-800">{fmt(selectedPaymentInvoice.advancePaid)}</span>
                  </div>
                  {selectedPaymentInvoice.advancePaid > 0 && (
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Paid on: {selectedPaymentInvoice.advancePaymentDate || '—'}</span>
                      <span>Method: {selectedPaymentInvoice.advancePaymentMethod || 'Cash'}</span>
                    </div>
                  )}
                </div>

                {/* Final Paid Details */}
                <div className="p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Final Settlement Paid</span>
                    <span className="font-semibold text-slate-800">{fmt(selectedPaymentInvoice.totalPaid)}</span>
                  </div>
                  {selectedPaymentInvoice.totalPaid > 0 && (
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Paid on: {selectedPaymentInvoice.totalPaymentDate || '—'}</span>
                      <span>Method: {selectedPaymentInvoice.totalPaymentMethod || 'Cash'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedPaymentInvoiceId(null)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-200 transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
