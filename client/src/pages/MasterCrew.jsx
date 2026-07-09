import { useState, useMemo } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, X, Search, User } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function MasterCrew() {
  const queryClient = useQueryClient();
  
  const { data: employees = [], isLoading: loading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then(res => res.data),
    staleTime: 5 * 60 * 1000
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Lead Photographer');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [editId, setEditId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !role) return toast.error('Name and Role are required');
    
    const payload = { name, role, phone, status };
    
    try {
      if (editId) {
        await api.put('/employees/' + editId, payload);
        toast.success('Crew member updated');
      } else {
        await api.post('/employees', payload);
        toast.success('Crew member added');
      }
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving crew member');
    }
  }

  function handleAdd() {
    setEditId(null);
    setName('');
    setRole('Lead Photographer');
    setPhone('');
    setStatus('Active');
    setIsModalOpen(true);
  }

  function handleEdit(member) {
    setEditId(member._id);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone || member.contact || '');
    setStatus(member.status || 'Active');
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setEditId(null);
    setName('');
    setRole('Lead Photographer');
    setPhone('');
    setStatus('Active');
    setIsModalOpen(false);
  }

  async function handleStatusChange(id, newStatusStr) {
    try {
      await api.patch(`/employees/${id}/status`, { status: newStatusStr });
      toast.success(`Crew marked ${newStatusStr}`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.contact && c.contact.includes(searchQuery))
    );
  }, [employees, searchQuery]);

  // Helper for random color and initials
  const getAvatarInfo = (nameStr, id) => {
    const initials = nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['bg-slate-100', 'bg-orange-50', 'bg-emerald-50', 'bg-blue-50', 'bg-purple-50', 'bg-rose-50'];
    const colorIndex = (id.charCodeAt(id.length - 1) || 0) % colors.length;
    return { initials, bgClass: colors[colorIndex] };
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-20 font-sans">

      {/* Header */}
      <header className="flex flex-row justify-between items-center gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Crew Management</h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">Review studio crew rosters and statuses.</p>
        </div>
        <button
          onClick={() => handleAdd()}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 shrink-0 whitespace-nowrap"
        >
          <Plus size={16} className="w-4 h-4" />
          <span className="hidden sm:inline">Add Crew Member</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search crew by name, role or phone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-700"
        />
      </div>

      {/* Card list */}
      <div className="space-y-2">
        {loading && <div className="text-center py-10 text-slate-400 text-sm">Loading crew…</div>}
        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No crew members found.</div>
        )}

        {filteredEmployees.map(member => {
          const { initials, bgClass } = getAvatarInfo(member.name, member._id);
          const active = member.status === 'Active';

          const statusStyle = member.status === 'Active'
            ? 'bg-emerald-50 text-emerald-600'
            : member.status === 'On Leave'
            ? 'bg-amber-50 text-amber-600'
            : 'bg-slate-100 text-slate-500';

          return (
            <div key={member._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3 hover:shadow-md hover:border-orange-100 transition-all group">

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-700 text-sm shrink-0 ${bgClass}`}>
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{member.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {member.role}
                  {(member.phone || member.contact) ? ' · ' + (member.phone || member.contact) : ''}
                </p>
              </div>

              {/* Status + actions */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyle}`}>
                  {member.status || 'Active'}
                </span>
                <button onClick={() => handleEdit(member)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleStatusChange(member._id, active ? 'Inactive' : 'Active')}
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
              <h2 className="text-xl font-bold text-slate-800">{editId ? 'Edit Crew Member' : 'Add Crew Member'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full">
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
                    placeholder="e.g. Kishore Ramachandran"
                    required
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Role *</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                  >
                    <option value="Lead Photographer">Lead Photographer</option>
                    <option value="Photographer">Photographer</option>
                    <option value="Cinematographer">Cinematographer</option>
                    <option value="Drone Pilot">Drone Pilot</option>
                    <option value="Editor">Editor</option>
                    <option value="Assistant">Assistant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Phone / Contact</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone Number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">Status *</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 font-semibold transition-all"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="px-6 py-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="bg-white hover:bg-slate-100 text-slate-600 font-bold px-6 py-2.5 rounded-xl border border-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-md shadow-orange-200 text-sm"
                >
                  {editId ? 'Update Crew' : 'Save Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
