import { Link } from 'react-router-dom';
import {
  IndianRupee, Calendar, Users, Activity,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock,
  MapPin, Phone, MessageSquare
} from 'lucide-react';
import api from '../api/axios.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';

const defaultMockData = {
  netProfit: 185000,
  pendingAdvances: 65000,
  todaysAssignments: 3,
  activeEvents: 8,
  weeklySchedule: [
    { id: 1, title: 'Ananya & Vikram Pre-Shoot', time: '06:00 AM - 06:00 PM', location: 'Bandra Fort, Mumbai', role: 'Drone + Cinematic', status: 'Confirmed', day: 15 },
    { id: 2, title: 'Siddharth & Riya Reception', time: '04:00 PM - 11:30 PM', location: 'ITC Grand Chola, Chennai', role: 'Traditional Photo', status: 'In Progress', day: 18 },
    { id: 3, title: 'Meera & Arjun Sangeet', time: '05:30 PM - 11:00 PM', location: 'Sheraton Grand, Bangalore', role: 'Candid Photography', status: 'Confirmed', day: 22 }
  ],
  recentTransactions: [
    { id: 1, type: 'income', amount: 50000, description: 'Priya & Karthik Advance (UPI)', date: 'Today, 2:30 PM', category: 'Wedding Films' },
    { id: 2, type: 'expense', amount: 8000, description: 'Memory Cards & Battery Buy', date: 'Today, 11:00 AM', category: 'Equipment' },
    { id: 3, type: 'income', amount: 85000, description: 'Sneha & Rahul Full Settlement', date: 'Yesterday', category: 'Photography' },
    { id: 4, type: 'expense', amount: 15000, description: 'Freelancer Assistant Day Rate', date: 'June 17', category: 'Staffing' }
  ],
  pipeline: [
    { id: 1, stage: 'Enquiry', client: 'Meera & Arjun', service: 'Engagement Film', date: 'Sept 02, 2026', value: 45000 },
    { id: 2, stage: 'Confirmed', client: 'Priya & Karthik', service: 'Full Wedding Package', date: 'Aug 15, 2026', value: 150000 },
    { id: 3, stage: 'In Progress', client: 'Ananya & Vikram', service: 'Pre-Wedding Shoot', date: 'Sept 10, 2026', value: 65000 },
    { id: 4, stage: 'Completed', client: 'Sneha & Rahul', service: 'Reception Coverage', date: 'July 20, 2026', value: 85000 }
  ],
  monthlyRevenueData: [
    { month: 'Jan', revenue: 120000 },
    { month: 'Feb', revenue: 150000 },
    { month: 'Mar', revenue: 180000 },
    { month: 'Apr', revenue: 130000 },
    { month: 'May', revenue: 210000 },
    { month: 'Jun', revenue: 185000 },
    { month: 'Jul', revenue: 240000 },
    { month: 'Aug', revenue: 290000 },
    { month: 'Sep', revenue: 160000 },
    { month: 'Oct', revenue: 310000 },
    { month: 'Nov', revenue: 350000 },
    { month: 'Dec', revenue: 420000 }
  ]
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => api.get('/dashboard').then(res => {
      const mapStage = { draft: 'Enquiry', sent: 'Confirmed', partial: 'In Progress', paid: 'Completed' };
      
      const newPipeline = res.data.pipelineInvoices?.map(inv => ({
        id: inv._id,
        stage: mapStage[inv.status] || 'Enquiry',
        client: inv.customer?.name || 'Unknown',
        service: inv.eventCategoryName || 'Event Service',
        date: inv.eventDates && inv.eventDates.length > 0 ? new Date(inv.eventDates[0]).toLocaleDateString() : 'TBD',
        value: inv.total || 0
      })) || [];

      const newSchedule = res.data.upcomingSchedule?.map(inv => ({
        id: inv._id,
        title: `${inv.customer?.name || 'Unknown'} - ${inv.eventCategoryName || 'Event'}`,
        time: 'Schedule pending', 
        location: inv.location || 'TBD',
        role: inv.staffAllocated?.map(s => s.role).join(', ') || 'Staffing pending',
        status: inv.staffingStatus || 'Staffing Pending',
        day: inv.eventDates && inv.eventDates.length > 0 ? new Date(inv.eventDates[0]).getDate() : Math.floor(Math.random() * 28) + 1
      })) || [];

      return {
        netProfit: res.data.totalReceived || 0,
        pendingAdvances: res.data.totalBalance || 0,
        activeEvents: res.data.totalInvoices || 0,
        todaysAssignments: res.data.todaysAssignments || 0,
        pipeline: newPipeline.length > 0 ? newPipeline : defaultMockData.pipeline,
        weeklySchedule: newSchedule.length > 0 ? newSchedule : defaultMockData.weeklySchedule,
        recentTransactions: res.data.recentPayments?.length > 0 ? res.data.recentPayments : defaultMockData.recentTransactions,
        monthlyRevenueData: defaultMockData.monthlyRevenueData
      };
    }).catch(() => defaultMockData),
    staleTime: 5 * 60 * 1000 // Cache for 5 mins
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Activity className="animate-spin text-emerald-500 mr-2" size={20} />
        <span>Loading Command Center...</span>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Financial health &amp; studio operational pipeline</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Link to="/invoices/new" className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors">
            + Create New Invoice
          </Link>
        </div>
      </div>

      {/* KPI metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Net Profit Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3 group-hover:scale-110 transition-transform">
            <IndianRupee size={120} className="text-emerald-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
            <span className="inline-flex items-center text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
              <ArrowUpRight size={12} className="mr-0.5" /> +12.4%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              ₹{Number(data.netProfit).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Total revenue collected this month</p>
          </div>
        </div>

        {/* Pending Advances Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
            <Clock size={120} className="text-amber-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Advances</span>
            <span className="inline-flex items-center text-xs font-semibold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
              Awaiting
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-amber-500 tracking-tight">
              ₹{Number(data.pendingAdvances).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Outstanding invoice balance dues</p>
          </div>
        </div>

        {/* Today's Assignments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
            <Users size={120} className="text-teal-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Assignments</span>
            <span className="inline-flex items-center text-xs font-semibold bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded">
              Live Now
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-teal-400 tracking-tight">
              {data.todaysAssignments} Shoots
            </h3>
            <p className="text-xs text-slate-500 mt-1">Crew dispatched on-site today</p>
          </div>
        </div>

        {/* Active Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
            <Calendar size={120} className="text-slate-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Pipeline</span>
            <span className="inline-flex items-center text-xs font-semibold bg-slate-500/15 text-slate-400 px-2 py-0.5 rounded">
              Booked
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">
              {data.activeEvents} Projects
            </h3>
            <p className="text-xs text-slate-500 mt-1">Total active bookings in database</p>
          </div>
        </div>

      </div>

      {/* Revenue Graph */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Monthly Revenue & Projections</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
                dx={-10}
              />
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event Pipeline Tracker (Horizontal Kanban Flow) */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Event Status Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {['Enquiry', 'Confirmed', 'In Progress', 'Completed'].map((stage) => {
            const items = data.pipeline.filter(p => p.stage === stage);
            const getStageColors = (s) => {
              switch(s) {
                case 'Enquiry': return 'bg-amber-50/50 border-amber-100 text-amber-700 decoration-amber-300';
                case 'Confirmed': return 'bg-blue-50/50 border-blue-100 text-blue-700 decoration-blue-300';
                case 'In Progress': return 'bg-indigo-50/50 border-indigo-100 text-indigo-700 decoration-indigo-300';
                case 'Completed': return 'bg-emerald-50/50 border-emerald-100 text-emerald-700 decoration-emerald-300';
                default: return 'bg-slate-50 border-slate-100 text-slate-600 decoration-slate-300';
              }
            };
            const colors = getStageColors(stage);

            return (
              <div key={stage} className={`border rounded-xl p-4 flex flex-col justify-between ${colors}`}>
                <div>
                  <div className="flex items-center justify-between border-b border-inherit pb-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider">{stage}</span>
                    <span className="text-[11px] font-bold bg-white/60 px-2 py-0.5 rounded-full shadow-sm">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm border border-white hover:border-inherit transition-all hover:shadow-md cursor-pointer relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent to-transparent group-hover:from-inherit group-hover:to-inherit opacity-50"></div>
                        <p className="text-sm font-bold text-slate-800 truncate">{item.client}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{item.service}</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{item.date}</span>
                          <span className="text-[11px] font-extrabold text-slate-700">₹{item.value.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="border-2 border-dashed border-inherit/30 rounded-lg py-6 flex items-center justify-center">
                        <p className="text-xs font-medium opacity-60">Empty stage</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Split view: Schedule (Left) vs Ledger Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Event Schedule Calendar */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-emerald-500" />
              Event Schedule Calendar
            </h2>
            <Link to="/dispatcher" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline">
              Manage Dispatcher →
            </Link>
          </div>
          <div className="p-5 flex-1 bg-slate-50/30">
            <div className="grid grid-cols-7 gap-1.5 h-full">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase tracking-widest">{d}</div>
              ))}
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const dayEvents = data.weeklySchedule.filter(s => s.day === day || (!s.day && [15, 18, 22].includes(day)));
                const hasEvent = dayEvents.length > 0;
                
                return (
                  <div 
                    key={day} 
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border-2 transition-all ${
                      hasEvent 
                        ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 hover:border-emerald-400 cursor-pointer shadow-sm z-10 scale-[1.02]' 
                        : 'border-transparent bg-white hover:border-slate-200 cursor-default'
                    } group`}
                  >
                    <span className={`text-sm font-bold ${hasEvent ? 'text-emerald-700' : 'text-slate-600'}`}>{day}</span>
                    
                    {hasEvent && (
                      <div className="absolute bottom-2 flex gap-1">
                        {dayEvents.map((e, ei) => (
                          <div key={ei} className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></div>
                        ))}
                      </div>
                    )}

                    {/* Hover Tooltip */}
                    {hasEvent && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                        {dayEvents.map((e, ei) => (
                          <div key={ei} className="mb-2 last:mb-0 border-b border-slate-700 last:border-0 pb-2 last:pb-0 text-left">
                            <p className="font-bold text-emerald-400 truncate">{e.title}</p>
                            <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1"><MapPin size={10}/> {e.location}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={10}/> {e.time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Ledger Feed */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Ledger Feed</h2>
            <Link to="/invoices" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline">
              View Ledger →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{tx.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tx.date} • {tx.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                  </p>
                  <span className={`inline-block text-[9px] font-semibold uppercase px-1 py-0.2 rounded mt-1 ${
                    tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {tx.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
