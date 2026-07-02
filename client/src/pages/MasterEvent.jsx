import { useState, useMemo } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, X, Search, Calendar } from 'lucide-react';
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
  
  const [searchQuery, setSearchQuery] = useState('');

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

  async function handleStatusChange(id, newStatusStr) {
    const isActive = newStatusStr === 'Active';
    try {
      await api.patch(`/event-categories/${id}/status`, { isActive });
      toast.success(`Category marked ${newStatusStr}`);
      queryClient.invalidateQueries({ queryKey: ['eventCategories'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  // Helper for random color
  const getAvatarInfo = (id) => {
    const colors = ['bg-orange-50', 'bg-emerald-50', 'bg-blue-50', 'bg-purple-50', 'bg-rose-50', 'bg-slate-100'];
    const colorIndex = (id.charCodeAt(id.length - 1) || 0) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-20 font-sans">

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Event Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage event categories and invoice terms.</p>
        </div>
        <button
          onClick={() => handleAdd()}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 w-full sm:w-auto whitespace-nowrap"
        >
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search event categories…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-700"
        />
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {loading && <div className="text-center py-10 text-slate-400 text-sm">Loading categories…</div>}
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No categories found.</div>
        )}

        {filteredCategories.map(cat => {
          const bgClass = getAvatarInfo(cat._id);
          const active = cat.isActive !== false;

          return (
            <div key={cat._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3 hover:shadow-md hover:border-orange-100 transition-all group">

              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
                <Calendar size={18} className="text-orange-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate uppercase">{cat.name}</p>
                <span className={`inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  cat.showTerms
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {cat.showTerms ? 'Terms On' : 'No Terms'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => handleEdit(cat)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleStatusChange(cat._id, active ? 'Inactive' : 'Active')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${active ? 'bg-orange-400' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editId ? 'Edit Event Category' : 'Add Event Category'}</h2>
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
                    placeholder="e.g. Wedding"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2 pt-1 pl-1">
                  <input
                    type="checkbox"
                    id="showTerms"
                    checked={showTerms}
                    onChange={e => setShowTerms(e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="showTerms" className="text-sm font-semibold text-slate-700">Show Terms & Conditions</label>
                </div>
                {showTerms && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Terms & Conditions</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-medium resize-none transition-all"
                      rows="4"
                      value={termsAndConditions}
                      onChange={e => setTermsAndConditions(e.target.value)}
                      placeholder="Enter specific invoice terms & conditions..."
                    ></textarea>
                  </div>
                )}
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
                  {editId ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
