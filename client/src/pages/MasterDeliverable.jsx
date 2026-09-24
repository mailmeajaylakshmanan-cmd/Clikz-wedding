import { useState, useMemo } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X, Search, Package } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState(null);

  const filteredDeliverables = useMemo(() => {
    let filtered = deliverables;
    if (statusFilter === 'active') {
      filtered = filtered.filter(d => d.isActive !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(d => d.isActive === false);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [deliverables, statusFilter, searchQuery]);

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

  async function handleStatusChange(id, newStatusStr) {
    const isActive = newStatusStr === 'Active';
    try {
      await api.patch(`/deliverables/${id}/status`, { isActive });
      toast.success(`Deliverable marked ${newStatusStr}`);
      queryClient.invalidateQueries({ queryKey: ['deliverablesData'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this deliverable permanently? If it is already used in invoices, consider deactivating it instead.')) return;
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

  const activeCount = deliverables.filter(d => d.isActive !== false).length;
  const inactiveCount = deliverables.filter(d => d.isActive === false).length;

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto pb-20 font-sans">
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or description…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-700 shadow-sm"
          />
        </div>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({deliverables.length})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'active' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('inactive'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'inactive' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Compact Cards Grid */}
      {loading && <div className="text-center py-10 text-slate-400 text-sm">Loading deliverables…</div>}
      {!loading && paginatedDeliverables.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          No deliverables match your criteria.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginatedDeliverables.map(deliverable => {
          const { bgClass } = getAvatarInfo(deliverable.name, deliverable._id);
          const isActive = deliverable.isActive !== false;

          return (
            <div
              key={deliverable._id}
              className={`bg-white rounded-xl border transition-all p-3 flex items-center justify-between gap-3 group ${
                isActive ? 'border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200' : 'border-slate-200/80 bg-slate-50/60 opacity-75'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 shrink-0 ${bgClass}`}>
                  <Package size={17} className="opacity-80" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`font-semibold text-xs sm:text-sm truncate leading-tight ${isActive ? 'text-slate-900' : 'text-slate-500 line-through'}`} title={deliverable.name}>
                      {deliverable.name}
                    </h3>
                    {!isActive && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded">
                        OFF
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    {deliverable.description ? (
                      <span className="text-slate-500 truncate max-w-[130px] sm:max-w-[170px]" title={deliverable.description}>
                        {deliverable.description}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Item</span>
                    )}
                    {deliverable.createdAt && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="whitespace-nowrap">
                          {new Date(deliverable.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(deliverable)}
                  title="Edit Deliverable"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit3 size={15} />
                </button>
                
                {/* iOS Style Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleStatusChange(deliverable._id, isActive ? 'Inactive' : 'Active')}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-orange-500' : 'bg-slate-300'
                  }`}
                  title={isActive ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-2' : '-translate-x-2'
                  }`} />
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
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${currentPage === page ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-100 text-slate-500'
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

              <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                {editId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = editId;
                      handleCancelEdit();
                      handleDelete(idToDelete);
                    }}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                ) : <div />}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-white hover:bg-slate-100 text-slate-600 font-bold px-5 py-2.5 rounded-xl border border-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-orange-200 text-sm"
                  >
                    {editId ? 'Update Deliverable' : 'Save Deliverable'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
