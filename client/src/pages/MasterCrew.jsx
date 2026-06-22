import { useState } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
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

  async function handleDelete(id) {
    if (!confirm('Delete this crew member?')) return;
    try {
      await api.delete('/employees/' + id);
      toast.success('Crew member deleted');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting crew member');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crew Master</h1>
          <p className="text-slate-500 mt-1">Review studio crew rosters and operational statuses</p>
        </div>
        <button 
          onClick={handleAdd} 
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          <span>Add Crew Member</span>
        </button>
      </header>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone / Contact</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400 text-sm">
                  Loading crew members...
                </td>
              </tr>
            )}
            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400 text-sm">
                  No crew members registered
                </td>
              </tr>
            )}
            {employees.map(member => (
              <tr key={member._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4.5 font-semibold text-slate-800 text-sm">{member.name}</td>
                <td className="px-6 py-4.5 text-slate-600">
                  <span className="inline-block bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4.5 text-slate-600 font-medium text-sm">
                  {member.contact || member.phone || '—'}
                </td>
                <td className="px-6 py-4.5 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
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
                </td>
                <td className="px-6 py-4.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
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
              <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Crew Member' : 'Add Crew Member'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                    placeholder="e.g. Kishore Ramachandran"
                    required
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role *</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-slate-700 font-medium"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone / Contact</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700 font-medium"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder="Phone Number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status *</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-slate-700 font-medium"
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
              
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
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
