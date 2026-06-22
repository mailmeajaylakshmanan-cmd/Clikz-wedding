import { useState } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function MasterEvent() {
  const queryClient = useQueryClient();
  
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['eventCategories'],
    queryFn: () => api.get('/event-categories').then(res => res.data),
    staleTime: 5 * 60 * 1000
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [showTerms, setShowTerms] = useState(true);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [editId, setEditId] = useState(null);



  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return toast.error('Name is required');
    
    try {
      if (editId) {
        await api.put('/event-categories/' + editId, { name, showTerms, termsAndConditions });
        toast.success('Event Category updated');
      } else {
        await api.post('/event-categories', { name, showTerms, termsAndConditions });
        toast.success('Event Category added');
      }
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['eventCategories'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    }
  }

  function handleAdd() {
    setEditId(null);
    setName('');
    setShowTerms(true);
    setTermsAndConditions('');
    setIsModalOpen(true);
  }

  function handleEdit(cat) {
    setEditId(cat._id);
    setName(cat.name);
    setShowTerms(cat.showTerms);
    setTermsAndConditions(cat.termsAndConditions || '');
    setIsModalOpen(true);
  }

  function handleCancelEdit() {
    setEditId(null);
    setName('');
    setShowTerms(true);
    setTermsAndConditions('');
    setIsModalOpen(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event category?')) return;
    try {
      await api.delete('/event-categories/' + id);
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['eventCategories'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Event</h1>
          <p className="text-slate-500 mt-1">Manage event categories and print layout terms</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          <span>Add Event Category</span>
        </button>
      </header>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Show Terms</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="3" className="text-center py-12 text-slate-400 text-sm">
                  Loading categories...
                </td>
              </tr>
            )}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-12 text-slate-400 text-sm">
                  No event categories found
                </td>
              </tr>
            )}
            {categories.map(cat => (
              <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4.5 font-semibold text-slate-800 text-sm">{cat.name}</td>
                <td className="px-6 py-4.5 text-slate-600">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                    cat.showTerms 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {cat.showTerms ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
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
              <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Event Category' : 'Add Event Category'}</h2>
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
                    placeholder="e.g. Wedding"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="showTerms"
                    checked={showTerms}
                    onChange={e => setShowTerms(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-slate-200 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="showTerms" className="text-sm font-semibold text-slate-600">Show Terms & Conditions</label>
                </div>
                {showTerms && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Terms & Conditions</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium resize-none"
                      rows="4"
                      value={termsAndConditions}
                      onChange={e => setTermsAndConditions(e.target.value)}
                      placeholder="Enter specific invoice terms & conditions..."
                    ></textarea>
                  </div>
                )}
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
