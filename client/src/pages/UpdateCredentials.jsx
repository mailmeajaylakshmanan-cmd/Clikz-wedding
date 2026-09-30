import React, { useState } from 'react';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function UpdateCredentials() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      return toast.error('Current password is required');
    }

    if (!newEmail && !newPassword) {
      return toast.error('Please enter a new username/email or new password');
    }

    if (newPassword && newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    if (newPassword && newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setLoading(true);
    try {
      const payload = {
        currentPassword,
        ...(newEmail ? { newEmail: newEmail.trim() } : {}),
        ...(newPassword ? { newPassword: newPassword.trim() } : {})
      };

      const res = await api.post('/auth/update', payload);
      toast.success('Credentials updated successfully!');
      
      if (res.data?.email) {
        localStorage.setItem('userEmail', res.data.email);
      }
      
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Security & Credentials</h1>
            <p className="text-xs text-slate-500">Update your administrator username or password.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Current Password <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              New Username / Email
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800 font-medium"
              />
            </div>
          </div>

          {newPassword && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Confirm New Password <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  required={Boolean(newPassword)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-slate-800 font-medium"
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Save Changes
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

