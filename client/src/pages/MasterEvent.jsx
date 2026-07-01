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
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 font-sans">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A202C] tracking-tight">Master Event Management</h1>
          <p className="text-slate-500 mt-1">Manage event categories and print layout terms.</p>
        </div>
        <button 
          onClick={() => handleAdd()} 
          className="flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#e66e00] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Add Event Category</span>
        </button>
      </header>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search event categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Floating Cards List */}
      <div className="space-y-3 relative">
        {loading && <div className="text-center py-10 text-slate-400">Loading event categories...</div>}
        
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-10 text-slate-400">No event categories found matching your search.</div>
        )}

        {filteredCategories.map(cat => {
          const bgClass = getAvatarInfo(cat._id);
          const active = cat.isActive !== false;
          
          return (
            <div key={cat._id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-3 pr-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md transition-all duration-200 group">
              
              {/* Name Column */}
              <div className="flex items-center gap-4 w-full md:w-1/3 shrink-0 pl-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} shrink-0`}>
                  <Calendar size={22} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-lg uppercase truncate">{cat.name}</div>
                </div>
              </div>

              {/* Terms Column */}
              <div className="w-full md:w-1/3 flex flex-col gap-1 shrink-0">
                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Terms & Conditions</div>
                <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-tight ${
                    cat.showTerms 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {cat.showTerms ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Actions Column */}
              <div className="w-full md:flex-1 flex items-center justify-end gap-4 shrink-0">
                <button onClick={() => handleEdit(cat)} className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                  <Edit3 size={18} />
                </button>
                
                {/* iOS Toggle */}
                <button
                  onClick={() => handleStatusChange(cat._id, active ? 'Inactive' : 'Active')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${active ? 'bg-orange-400' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-[22px]' : 'translate-x-1'}`} />
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
