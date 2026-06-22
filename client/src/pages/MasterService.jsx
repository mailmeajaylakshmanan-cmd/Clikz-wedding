import { useState } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function MasterService() {
  const queryClient = useQueryClient();
  
  const { data, isLoading: loading } = useQuery({
    queryKey: ['servicesData'],
    queryFn: async () => {
      const [servicesRes, categoriesRes] = await Promise.all([
        api.get('/services'),
        api.get('/event-categories')
      ]);
      return {
        services: servicesRes.data || [],
        categories: categoriesRes.data || []
      };
    },
    staleTime: 5 * 60 * 1000
  });

  const services = data?.services || [];
  const categories = data?.categories || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [descriptionsStr, setDescriptionsStr] = useState('');
  const [editId, setEditId] = useState(null);



  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return toast.error('Name is required');
    
    const descriptions = descriptionsStr
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      name,
      eventCategory: eventCategory || null,
      descriptions
    };
    
    try {
      if (editId) {
        await api.put('/services/' + editId, payload);
        toast.success('Service updated');
      } else {
        await api.post('/services', payload);
        toast.success('Service added');
      }
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['servicesData'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving service');
    }
  }

  function handleAdd() {
    setEditId(null);
    setName('');
    setEventCategory('');
    setDescriptionsStr('');
    setIsModalOpen(true);
  }

  function handleEdit(srv) {
    setEditId(srv._id);
    setName(srv.name);
    setEventCategory(srv.eventCategory?._id || '');
    setDescriptionsStr((srv.descriptions || []).join('\n'));
    setIsModalOpen(true);
  }

  function handleCancelEdit() {
    setEditId(null);
    setName('');
    setEventCategory('');
    setDescriptionsStr('');
    setIsModalOpen(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return;
    try {
      await api.delete('/services/' + id);
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['servicesData'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting service');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Service</h1>
          <p className="text-slate-500 mt-1">Manage studio service catalogs and descriptions</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          <span>Add Service</span>
        </button>
      </header>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Event Category</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descriptions</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="4" className="text-center py-12 text-slate-400 text-sm">
                  Loading services...
                </td>
              </tr>
            )}
            {!loading && services.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-12 text-slate-400 text-sm">
                  No services found
                </td>
              </tr>
            )}
            {services.map(srv => (
              <tr key={srv._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4.5 font-semibold text-slate-800 text-sm">{srv.name}</td>
                <td className="px-6 py-4.5 text-slate-600">
                  {srv.eventCategory?.name ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight bg-blue-50 text-blue-600 border border-blue-100">
                      {srv.eventCategory.name}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4.5 text-slate-600">
                  {srv.descriptions && srv.descriptions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {srv.descriptions.map((d, i) => (
                        <span key={i} className="inline-block bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td className="px-6 py-4.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(srv)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(srv._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Name *</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Cinematic Film"
                    required
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Category Link</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-slate-700 font-medium"
                    value={eventCategory}
                    onChange={e => setEventCategory(e.target.value)}
                  >
                    <option value="">-- Unlinked / Generic --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sub-service Options (One per line)</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium resize-none"
                    rows="4"
                    value={descriptionsStr}
                    onChange={e => setDescriptionsStr(e.target.value)}
                    placeholder="E.g. Traditional Coverage&#10;Candid Coverage&#10;Highlight Film"
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
