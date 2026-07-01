import { useState } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Customer</h1>
          <p className="text-slate-500 mt-1">Review customer directories and profiles</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </header>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Address</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400 text-sm">
                    Loading customers...
                  </td>
                </tr>
              )}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400 text-sm">
                    No customers found
                  </td>
                </tr>
              )}
              {customers.map(customer => (
                <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4.5 font-semibold text-slate-800 text-sm">{customer.name}</td>
                  <td className="px-6 py-4.5 text-slate-600 font-medium text-sm">{customer.phone}</td>
                  <td className="px-6 py-4.5 text-slate-500 text-sm">{customer.address || '—'}</td>
                  <td className="px-6 py-4.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(customer._id, customer.isActive === false ? 'Active' : 'Inactive')}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          customer.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={customer.isActive !== false ? 'Active' : 'Inactive'}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          customer.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name *</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Customer Name"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone *</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium resize-none"
                    rows="3"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Address (optional)"
                  ></textarea>
                </div>
              </div>
              
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-200 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-sm text-xs"
                >
                  {editId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
