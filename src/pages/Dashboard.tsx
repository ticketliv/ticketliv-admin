import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket,
  TrendingUp,
  Users,
  UserPlus,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  RefreshCw,
  Clock,
  Calendar,
  BarChart3,
  Filter
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { dashboardStats, refreshDashboardStats, categories, events } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  useEffect(() => {
    refreshDashboardStats(selectedEvent, selectedCategory);
  }, [selectedEvent, selectedCategory, refreshDashboardStats]);

  // 1. Real-time Clock Logic
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter(e => String(e.category_id) === String(selectedCategory));
  }, [events, selectedCategory]);

  const metrics = useMemo(() => {
    if (!dashboardStats) return null;

    const raw = dashboardStats.metrics || {};
    return {
      bookings: raw.total_bookings || 0,
      users: raw.total_users || 0,
      revenue: Math.round((raw.total_revenue || 0) / 1000), // in k
      scanned: raw.total_scanned || 0,
      totalTickets: raw.total_tickets || 0,
      fraudCount: raw.total_fraud || 0,
      events: raw.total_events || 0,
      activeEvents: raw.active_events || 0,
      soldOutEvents: raw.sold_out_events || 0,
      revenueData: dashboardStats.revenueTrend || [],
      venueRevenue: dashboardStats.venueRevenue || [],
      recentActivities: dashboardStats.activities?.slice(0, 6).map((a: any) => ({
        ...a,
        icon: a.type === 'booking' ? Ticket : UserPlus,
        color: a.type === 'booking' ? '#6366f1' : '#ec4899'
      })) || [],
      recentScans: dashboardStats.scans?.slice(0, 8).map((s: any) => ({
        ...s,
        icon: s.type === 'valid' ? CheckCircle2 : AlertTriangle,
        color: s.type === 'valid' ? '#10b981' : '#f43f5e'
      })) || []
    };
  }, [dashboardStats]);

  const attendancePercent = useMemo(() => {
    if (!metrics || metrics.totalTickets === 0) return 0;
    return Math.round((metrics.scanned / metrics.totalTickets) * 100);
  }, [metrics]);

  // 2. High-Fidelity Skeleton Loader
  if (!metrics) {
    return (
      <div className="dashboard-content skeleton-state">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => <div key={i} className="glass-panel" style={{ height: '140px', background: 'rgba(255,255,255,0.02)', animation: 'pulse 2s infinite' }}></div>)}
        </div>
        <div className="glass-panel" style={{ height: '400px', width: '100%', background: 'rgba(255,255,255,0.02)', animation: 'pulse 2s infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
      
      {/* Dashboard Header Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px' }}>
               <Filter size={18} color="#fff" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Analytics Overview</h2>
         </div>
         
         <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <select 
              value={selectedCategory} 
              onChange={(e) => {
                 setSelectedCategory(e.target.value);
                 setSelectedEvent('all');
              }}
              style={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', outline: 'none', fontSize: '14px', minWidth: '260px', maxWidth: '400px', flex: '1 1 auto', cursor: 'pointer', appearance: 'auto', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}
            >
               <option value="all">All Categories</option>
               {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
               ))}
            </select>

            <select 
              value={selectedEvent} 
              onChange={(e) => setSelectedEvent(e.target.value)}
              style={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', outline: 'none', fontSize: '14px', minWidth: '260px', maxWidth: '400px', flex: '1 1 auto', cursor: 'pointer', appearance: 'auto', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}
            >
               <option value="all">All Events</option>
               {filteredEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
               ))}
            </select>
         </div>
      </div>

      {/* Global Platform Intelligence (Merged) */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(79, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <BarChart3 size={20} />
            Global Platform Intelligence
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px', fontWeight: 600 }}>
            Filtered Live Analytics
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          
          <div className="nav-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Users size={18} color="#ec4899" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Platform Users</span>
             </div>
             <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{metrics.users.toLocaleString()}</div>
             <p style={{ fontSize: '11px', color: '#ec4899', marginTop: '6px', fontWeight: 600 }}>↑ Global Community</p>
          </div>

          <div className="nav-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Ticket size={18} color="#8b5cf6" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</span>
             </div>
             <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{metrics.bookings.toLocaleString()}</div>
             <p style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '6px', fontWeight: 600 }}>Processed & Confirmed</p>
          </div>

          <div className="nav-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <DollarSign size={18} color="#10b981" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Gross Revenue</span>
             </div>
             <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>₹{metrics.revenue}k</div>
             <p style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>Live Payouts Ready</p>
          </div>

          <div className="nav-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Calendar size={18} color="#4f46e5" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Showcase</span>
             </div>
             <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{metrics.activeEvents} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {metrics.events}</span></div>
             <p style={{ fontSize: '11px', color: '#4f46e5', marginTop: '6px', fontWeight: 600 }}>Live Event Cycle</p>
          </div>


        </div>
      </div>


      {/* Growth & Design Studio Launchpad */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>Growth & Design Studio</h3>
        <div className="quick-nav-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
                { label: 'Seat Map Designer', path: '/seat-map', icon: Users, color: '#3b82f6', desc: 'Mega stadium & cinema layouts' },
                { label: 'Bulk Generation', path: '/bulk-tickets', icon: Ticket, color: '#fbbf24', desc: 'Mass output & PDF export' },
                { label: 'Marketing Engine', path: '/marketing', icon: TrendingUp, color: '#8b5cf6', desc: 'Coupons, ads & growth funnels' },
                { label: 'Settlement Hub', path: '/finance', icon: DollarSign, color: '#10b981', desc: 'Fund distribution & payouts' }
            ].map((nav, i) => (
                <div key={i} className="nav-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: '0.2s' }} onClick={() => navigate(nav.path)}>
                    <div style={{ padding: '10px', width: 'fit-content', background: `${nav.color}15`, color: nav.color, borderRadius: '8px', marginBottom: '12px' }}>
                        <nav.icon size={20} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{nav.label}</div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{nav.desc}</p>
                </div>
            ))}
        </div>
      </div>

      {/* Recent Activity List Integration */}
      {metrics.recentActivities.length > 0 && (
         <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Recent System Activity</h3>
               <button onClick={() => refreshDashboardStats(selectedEvent, selectedCategory)} className="action-btn-small" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Sync Now
               </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
               {metrics.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="nav-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', background: `${activity.color}15`, color: activity.color }}>
                         <activity.icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{activity.text}</div>
                         <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{activity.user_name} • {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                  </div>
               ))}
            </div>
         </div>
      )}
      {/* Premium Live Entry Monitoring */}
      <div className="glass-panel live-monitoring-section" style={{ 
        padding: '0', 
        border: '1px solid rgba(99, 102, 241, 0.25)', 
        background: 'linear-gradient(135deg, rgba(13, 14, 30, 0.95) 0%, rgba(20, 21, 45, 0.98) 100%)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Animated Background Mesh */}
        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)', zIndex: 0 }}></div>

        <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div className="pulse-dot" style={{ background: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}></div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Live Entry Monitoring</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Sync Active
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                padding: '12px 20px', 
                borderRadius: '16px',
                textAlign: 'right',
                minWidth: '160px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Scans</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{metrics.scanned.toLocaleString()}</div>
              </div>

              <div style={{ 
                background: 'rgba(244, 63, 94, 0.08)', 
                border: '1px solid rgba(244, 63, 94, 0.2)', 
                padding: '12px 20px', 
                borderRadius: '16px',
                textAlign: 'right',
                minWidth: '160px',
                boxShadow: metrics.fraudCount > 0 ? '0 0 20px rgba(244, 63, 94, 0.15)' : 'none'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                   {metrics.fraudCount > 0 && <ShieldAlert size={12} />} Fraud Detected
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: metrics.fraudCount > 0 ? '#f43f5e' : '#fff', lineHeight: 1 }}>{metrics.fraudCount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {/* Progress Visualization */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Entry Progression</span>
                    <h4 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>{attendancePercent}%</h4>
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{metrics.scanned.toLocaleString()} / {metrics.totalTickets.toLocaleString()}</span>
               </div>
               <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ 
                    width: `${attendancePercent}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #6366f1, #a855f7)', 
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
                    borderRadius: '5px',
                    transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}></div>
               </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Zap size={18} color="#fbbf24" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700 }}>Peak Velocity</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>142 <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>scans/min</span></div>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Users size={18} color="#06b6d4" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700 }}>Active Gates</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {['A', 'B', 'VVIP'].map(g => (
                      <span key={g} style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>{g}</span>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Charts area */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="chart-section glass-panel" style={{ padding: '24px' }}>
           <div className="section-header" style={{ marginBottom: '1rem' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Venue Revenue Stream</h3>
           </div>
           <div className="chart-container" style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#13141f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fill="url(#colorRev)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>

           {/* Venue Revenue Breakdown */}
           <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Distribution by Venue</h4>
               <span style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'rgba(79, 70, 229, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>Top 5 Locations</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               {metrics.venueRevenue.length === 0 ? (
                 <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                   <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No venue data recorded yet</p>
                 </div>
               ) : (
                 metrics.venueRevenue.map((venue: any, i: number) => {
                   const topRevenue = metrics.venueRevenue[0].revenue || 1;
                   const percentage = (venue.revenue / topRevenue) * 100;
                   return (
                     <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>{venue.name}</span>
                         <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>₹{venue.revenue.toLocaleString()}</span>
                       </div>
                       <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                         <div 
                           style={{ 
                             width: `${percentage}%`, 
                             height: '100%', 
                             background: 'linear-gradient(90deg, #4f46e5, #9333ea)', 
                             borderRadius: '4px',
                             transition: 'width 1s ease-out'
                           }} 
                         />
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
        </div>

        <div className="activity-section glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Scanner Live Audit</h3>
               <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>SECURE</span>
            </div>
            <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {metrics.recentScans.map((activity: any) => (
                   <div key={activity.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <div style={{ padding: '8px', borderRadius: '8px', background: `${activity.color}15`, color: activity.color }}>
                       <activity.icon size={18} />
                     </div>
                     <div style={{ flex: 1 }}>
                       <p style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{activity.text}</p>
                       <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activity.user_name} • {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                   </div>
              ))}
              {metrics.recentScans.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', opacity: 0.5 }}>
                   <ShieldAlert size={32} style={{ marginBottom: '1rem' }} />
                   <p style={{ fontSize: '12px' }}>Waiting for scanner activity...</p>
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
