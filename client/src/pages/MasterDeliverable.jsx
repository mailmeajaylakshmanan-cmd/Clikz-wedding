import { useState, useMemo } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, X, Search, Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function MasterDeliverable() {
  const queryClient = useQueryClient();
  
  const { data: deliverables = [], isLoading: loading } = useQuery({
    queryKey: ['deliverablesData'],
    queryFn: async () => {
      const res = await api.get('/deliverables');
      return res.data || [];
    },
    staleTime: 5 * 60 * 1000
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState(null);

  const filteredDeliverables = useMemo(() => {
    let filtered = deliverables;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(q) || 
        (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [deliverables, searchQuery]);

  const totalPages = Math.ceil(filteredDeliverables.length / ITEMS_PER_PAGE) || 1;
  const paginatedDeliverables = filteredDeliverables.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return toast.error('Name is required');
    
    try {
      if (editId) {
        await api.put(`/deliverables/${editId}`, { name, description });
        toast.success('Deliverable updated');
      } else {
        await api.post('/deliverables', { name, description });
        toast.success('Deliverable added');
      }
      handleCancelEdit();
      queryClient.invalidateQueries({ queryKey: ['deliverablesData'] });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this deliverable?')) return;
    try {
      await api.delete(`/deliverables/${id}`);
      toast.success('Deliverable deleted');
      queryClient.invalidateQueries({ queryKey: ['deliverablesData'] });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  }

  function handleAdd() {
    setEditId(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  }

  function handleEdit(deliverable) {
    setEditId(deliverable._id);
    setName(deliverable.name);
    setDescription(deliverable.description || '');
    setIsModalOpen(true);
  }

  function handleCancelEdit() {
    setEditId(null);
    setName('');
    setDescription('');
    setIsModalOpen(false);
  }

  // Helper to get initials and random pastel color
  const getAvatarInfo = (nameStr, id) => {
    const initials = nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['bg-slate-200', 'bg-orange-100', 'bg-emerald-100', 'bg-blue-100', 'bg-purple-100', 'bg-rose-100'];
    const colorIndex = (id.charCodeAt(id.length - 1) || 0) % colors.length;
    return { initials, bgClass: colors[colorIndex] };
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-20 font-sans">
      {/* Header */}
      <header className="flex flex-row justify-between items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Master Deliverables</h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">Manage physical and digital items delivered to clients.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 shrink-0 whitespace-nowrap"
        >
          <Plus size={16} className="w-4 h-4" />
          <span className="hidden sm:inline">Add Deliverable</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or description…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-700"
        />
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {loading && <div className="text-center py-10 text-slate-400 text-sm">Loading deliverables…</div>}
        {!loading && paginatedDeliverables.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No deliverables match your search.</div>
        )}

        {paginatedDeliverables.map(deliverable => {
          const { initials, bgClass } = getAvatarInfo(deliverable.name, deliverable._id);
          
          return (
            <div key={deliverable._id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3 hover:shadow-md hover:border-orange-100 transition-all group"
            >
              {/* Avatar / Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-700 shrink-0 ${bgClass}`}>
                <Package size={18} className="opacity-80" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{deliverable.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {deliverable.description && (
                    <span className="text-xs text-slate-500 truncate">{deliverable.description}</span>
                  )}
                  {deliverable.createdAt && (
                    <>
                      {deliverable.description && <span className="text-slate-300 text-[10px]">●</span>}
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        Added {new Date(deliverable.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(deliverable)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit3 size={15} />
                </button>
                <button onClick={() => handleDelete(deliverable._id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                currentPage === page ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editId ? 'Edit Deliverable' : 'Add New Deliverable'}</h2>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Deliverable Name *</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g. 60 Pages Candid Album"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Description</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-medium resize-none transition-all"
                    rows="3"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional details..."
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
                  {editId ? 'Update Deliverable' : 'Save Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
