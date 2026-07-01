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
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('Active');
  const [editId, setEditId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !role) return toast.error('Name and Role are required');
    
    const payload = { name, role, contact, status };
    
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
    setContact('');
    setStatus('Active');
    setIsModalOpen(true);
  }

  function handleEdit(member) {
    setEditId(member._id);
    setName(member.name);
    setRole(member.role);
    setContact(member.contact || member.phone || '');
    setStatus(member.status || 'Active');
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setEditId(null);
    setName('');
    setRole('Lead Photographer');
    setContact('');
    setStatus('Active');
    setIsModalOpen(false);
  }

  async function handleStatusChange(id, newStatusStr) {
    const isActive = newStatusStr === 'Active';
    try {
      await api.patch(`/employees/${id}/status`, { isActive });
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
      (c.contact && c.contact.includes(searchQuery)) ||
      (c.phone && c.phone.includes(searchQuery))
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
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 font-sans">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between md:items-start mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A202C] tracking-tight">Crew Master Management</h1>
          <p className="text-slate-500 mt-1">Review studio crew rosters and operational statuses.</p>
        </div>
        <button 
          onClick={() => handleAdd()} 
          className="flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#e66e00] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>Add Crew Member</span>
        </button>
      </header>

      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search crew by name, role or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Floating Cards List */}
      <div className="space-y-3 relative">
        {loading && <div className="text-center py-10 text-slate-400">Loading crew members...</div>}
        
        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-10 text-slate-400">No crew members found matching your search.</div>
        )}

        {filteredEmployees.map(member => {
          const { initials, bgClass } = getAvatarInfo(member.name, member._id);
          const active = member.isActive !== false;
          
          return (
            <div key={member._id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-3 pr-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md transition-all duration-200 group">
              
              {/* Name & Role Column */}
              <div className="flex items-center gap-4 w-full md:w-[35%] shrink-0 pl-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-slate-700 text-lg shrink-0 ${bgClass}`}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-[15px] truncate">{member.name}</div>
                  <div className="text-[12px] font-bold text-slate-500 uppercase mt-0.5">{member.role}</div>
                </div>
              </div>

              {/* Contact Column */}
              <div className="w-full md:w-[20%] flex flex-col shrink-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact</div>
                <div className="text-slate-700 font-medium text-[14px] mt-0.5">{member.contact || member.phone || '—'}</div>
              </div>

              {/* Status Tag Column */}
              <div className="w-full md:w-[20%] flex items-center shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-tight ${
                  member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                  member.status === 'On Leave' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                  'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    member.status === 'Active' ? 'bg-emerald-500' : 
                    member.status === 'On Leave' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></span>
                  {member.status || 'Active'}
                </span>
              </div>

              {/* Actions Column */}
              <div className="w-full md:flex-1 flex items-center justify-end gap-4 shrink-0">
                <button onClick={() => handleEdit(member)} className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                  <Edit3 size={18} />
                </button>
                
                {/* iOS Toggle */}
                <button
                  onClick={() => handleStatusChange(member._id, active ? 'Inactive' : 'Active')}
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
                    value={contact}
                    onChange={e => setContact(e.target.value)}
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
