import { useState } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';

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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [descriptionsStr, setDescriptionsStr] = useState('');
  const [editId, setEditId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return toast.error('Name is required');
    if (!selectedCategory) return toast.error('Event Category is required');
    
    const descriptions = descriptionsStr
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      name,
      category: selectedCategory.value,
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

  function handleAdd(category = null) {
    setEditId(null);
    setName('');
    setSelectedCategory(category ? { value: category._id, label: category.name } : null);
    setDescriptionsStr('');
    setIsModalOpen(true);
  }

  function handleEdit(srv) {
    setEditId(srv._id);
    setName(srv.name);
    setSelectedCategory(srv.category ? { value: srv.category._id, label: srv.category.name } : null);
    setDescriptionsStr((srv.descriptions || []).join('\n'));
    setIsModalOpen(true);
  }

  function handleCancelEdit() {
    setEditId(null);
    setName('');
    setSelectedCategory(null);
    setDescriptionsStr('');
    setIsModalOpen(false);
  }

  async function handleStatusChange(id, newStatusStr) {
    const isActive = newStatusStr === 'Active';
    try {
      await api.patch(`/services/${id}/status`, { isActive });
      toast.success(`Service marked ${newStatusStr}`);
      queryClient.invalidateQueries({ queryKey: ['servicesData'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  }

  // Group services by category
  const servicesByCategory = categories.map(cat => ({
    category: cat,
    services: services.filter(s => s.category?._id === cat._id)
  }));

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between md:items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Service</h1>
          <p className="text-slate-500 mt-1">Manage studio service catalogs organized by event category</p>
        </div>
        <button 
          onClick={() => handleAdd()} 
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 mt-4 md:mt-0"
        >
          <Plus size={20} />
          <span>Add Service</span>
        </button>
      </header>

      {/* Categories Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading services...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No event categories found. Please create categories first.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {servicesByCategory.map((group) => (
            <div key={group.category._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{group.category.name}</h2>
                <button
                  onClick={() => handleAdd(group.category)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white">Service Name</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white">Descriptions</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right bg-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.services.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-slate-400 text-sm">
                          No services for this category
                        </td>
                      </tr>
                    ) : (
                      group.services.map(srv => (
                        <tr key={srv._id} className="hover:bg-slate-50/50 transition-colors group/row">
                          <td className="px-6 py-4 font-semibold text-slate-800 text-sm align-top">{srv.name}</td>
                          <td className="px-6 py-4 text-slate-600 align-top">
                            {srv.descriptions && srv.descriptions.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {srv.descriptions.map((d, i) => (
                                  <span key={i} className="inline-block bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-6 py-4 text-right align-top">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(srv)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit3 size={15} />
                              </button>
                              <select
                                value={srv.isActive !== false ? 'Active' : 'Inactive'}
                                onChange={(e) => handleStatusChange(srv._id, e.target.value)}
                                className={`text-[11px] font-semibold rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                                  srv.isActive !== false 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Category *</label>
                  <Select
                    options={categories.map(cat => ({ value: cat._id, label: cat.name }))}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="Select event category..."
                    className="text-sm text-slate-700"
                    isClearable
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sub-service Options (One per line)</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium resize-none"
                    rows="4"
                    value={descriptionsStr}
                    onChange={e => setDescriptionsStr(e.target.value)}
                    placeholder="E.g. Traditional Coverage\nCandid Coverage\nHighlight Film"
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
