import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios.js';
import { UserPlus, Calendar, Info, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Dispatcher = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [countdown, setCountdown] = useState(5);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dispatcherData'],
    queryFn: async () => {
      const [invRes, crewRes] = await Promise.all([
        axios.get('/invoices?staffingStatus[$ne]=Fully Staffed'),
        axios.get('/employees?status=Active')
      ]);
      return {
        tasks: invRes.data.invoices || invRes.data || [],
        crew: crewRes.data || []
      };
    },
    staleTime: 5 * 60 * 1000
  });

  const tasks = data?.tasks || [];
  const crew = data?.crew || [];

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!loading && tasks.length === 0) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/invoices');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, tasks.length, navigate]);



  const handleAssign = async (invoiceId, employeeId, date) => {
    if (!employeeId) return;
    try {
      // Phase 3: Conflict Check happens on backend
      await axios.post('/dispatch/assign', { invoiceId, employeeId, date });
      toast.success("Crew assigned successfully");
      queryClient.invalidateQueries({ queryKey: ['dispatcherData'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment Error");
    }
  };

  const handleUnassign = async (invoiceId, employeeId) => {
    if (!confirm("Are you sure you want to unassign this crew member?")) return;
    try {
      await axios.post('/dispatch/unassign', { invoiceId, employeeId });
      toast.success("Crew unassigned successfully");
      queryClient.invalidateQueries({ queryKey: ['dispatcherData'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unassignment Error");
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const clientName = (task.customer?.name || task.client?.name || '').toLowerCase();
    const invoiceNo = (task.invoiceNo || '').toLowerCase();
    return clientName.includes(q) || invoiceNo.includes(q);
  });

  return (
    <div className="space-y-6">
      {!loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-xl p-12 text-center max-w-xl mx-auto my-12 animate-in fade-in zoom-in duration-300">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75"></div>
            <div className="relative bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-200">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">All Crew Dispatched!</h2>
          <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
            All active bookings have been fully staffed. Excellent job keeping the schedule complete!
          </p>
          
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6 max-w-xs mx-auto">
            <div 
              className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
          
          <p className="text-xs text-slate-400 mb-6 font-medium">
            Redirecting to Master Invoice in <span className="font-bold text-slate-600">{countdown}s</span>...
          </p>
          
          <button
            onClick={() => navigate('/invoices')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-95 text-sm"
          >
            Go to Master Invoice Now
          </button>
        </div>
      ) : (
        <>
          <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Crew Dispatcher</h1>
              <p className="text-slate-500 text-sm">Assign available staff to confirmed bookings</p>
            </div>
            {tasks.length > 0 && (
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-slate-700"
                  placeholder="Search by client or invoice ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setSearchParams(val ? { search: val } : {});
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchParams({});
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
          </header>

          {loading && (
            <div className="text-center text-slate-400 py-12">Loading dispatcher tasks...</div>
          )}

          {!loading && filteredTasks.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              <p className="font-semibold text-slate-800">No matching events require crew allocation</p>
              <p className="text-xs text-slate-400 mt-1">Adjust your search or check if all matching events are fully staffed.</p>
            </div>
          )}

          <div className="grid gap-6">
            {!loading && filteredTasks.map(invoice => (
              <div key={invoice._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Header info */}
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      invoice.staffingStatus === 'Staffing Pending' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {invoice.staffingStatus || 'Staffing Pending'}
                    </span>
                    <h3 className="font-bold text-slate-800 mt-2">
                      {invoice.customer?.name || invoice.client?.name || "New Client"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{invoice.invoiceNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">STAFF REQUIRED</p>
                    <p className="font-bold text-slate-700">
                      {invoice.staffAllocated?.length || 0} / {invoice.requiredStaff || 0}
                    </p>
                  </div>
                </div>

                {/* Content info */}
                <div className="p-4 grid md:grid-cols-2 gap-6">
                  
                  {/* Left Side: Services Booked & Assigned Crew */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Services to Cover:</p>
                      <div className="space-y-1">
                        {invoice.services?.map((s, i) => (
                          <div key={i} className="text-sm py-1.5 px-2 bg-blue-50 text-blue-700 rounded border border-blue-100">
                            {s.service} - <span className="opacity-70">{s.description}</span>
                          </div>
                        ))}
                        {(!invoice.services || invoice.services.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No services listed.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Allocated Crew:</p>
                      <div className="space-y-1.5">
                        {invoice.staffAllocated?.map(member => (
                          <div key={member.employeeId} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs border border-slate-100">
                            <span className="font-medium text-slate-700">{member.name} ({member.role})</span>
                            <button 
                              onClick={() => handleUnassign(invoice._id, member.employeeId)}
                              className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition"
                              title="Remove assignment"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        ))}
                        {(!invoice.staffAllocated || invoice.staffAllocated.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No crew assigned yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Assignment Tool */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300 self-start">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Quick Assign:</p>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 text-sm border rounded-lg p-2 bg-white outline-none focus:ring-2 ring-blue-500"
                          onChange={(e) => {
                            handleAssign(invoice._id, e.target.value, invoice.eventDates?.length ? invoice.eventDates[0] : null);
                            e.target.value = ""; // Reset
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select available staff...</option>
                          {crew.map(c => {
                            const isAssigned = invoice.staffAllocated?.some(m => m.employeeId.toString() === c._id.toString());
                            if (isAssigned) return null;
                            return (
                              <option key={c._id} value={c._id}>{c.name} ({c.role})</option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1 bg-white p-2.5 rounded border border-slate-100">
                        <p className="font-medium text-slate-700 flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          Event Date: {invoice.eventDate || "TBD"}
                        </p>
                        <p className="text-slate-400">Location: {invoice.location || "TBD"}</p>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <Info size={12}/> Only active crew members are shown here.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dispatcher;
