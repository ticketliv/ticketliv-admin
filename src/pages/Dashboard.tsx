import { useNavigate } from 'react-router-dom';
import { 
  Ticket,
  TrendingUp,
  CreditCard,
  Users,
  UserPlus,
  DollarSign,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { dashboardStats } = useApp();

  const metrics = {
    bookings: dashboardStats?.metrics?.total_bookings || 0,
    users: dashboardStats?.metrics?.total_users || 0,
    revenue: Math.round((dashboardStats?.metrics?.total_revenue || 0) / 1000), // in k
    scanned: dashboardStats?.metrics?.total_scanned || 0,
    totalTickets: dashboardStats?.metrics?.total_tickets || 0,
    revenueData: dashboardStats?.revenueTrend || [],
    venueRevenue: dashboardStats?.venueRevenue || [],
    recentActivitiesList: dashboardStats?.activities?.map((a: any) => ({
      ...a,
      icon: a.type === 'booking' ? Ticket : UserPlus,
      color: a.type === 'booking' ? '#6366f1' : '#ec4899'
    })) || [],
    recentScansList: dashboardStats?.scans?.map((s: any) => ({
      ...s,
      icon: s.type === 'success' ? CheckCircle2 : AlertTriangle,
      color: s.type === 'success' ? '#10b981' : '#f43f5e'
    })) || [],
    loading: !dashboardStats
  };

  const attendancePercent = metrics.totalTickets > 0 
    ? Math.round((metrics.scanned / metrics.totalTickets) * 100)
    : 0;

  if (metrics.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', flexDirection: 'column', gap: '1rem' }}>
        <div className="pulse-dot" style={{ width: '40px', height: '40px', background: '#3b82f6', boxShadow: '0 0 20px #3b82f6' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading real-time analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards', padding: '1.5rem' }}>
      
      {/* Metrics Summary */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="metric-card glass-panel" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
          <div className="metric-header">
            <div className="metric-icon-box indigo"><Ticket size={24} /></div>
            <div className="metric-trend positive"><TrendingUp size={14} /><span>+12.5%</span></div>
          </div>
          <div className="metric-body">
            <h3>{metrics.bookings.toLocaleString()}</h3>
            <p className="metric-label">Total Bookings</p>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-header">
            <div className="metric-icon-box pink"><Users size={24} /></div>
            <div className="metric-trend positive"><TrendingUp size={14} /><span>+8.2%</span></div>
          </div>
          <div className="metric-body">
            <h3>{metrics.users.toLocaleString()}</h3>
            <p className="metric-label">Active Users</p>
          </div>
        </div>

        <div className="metric-card glass-panel" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)' }}>
          <div className="metric-header">
            <div className="metric-icon-box cyan"><CreditCard size={24} /></div>
            <div className="metric-trend positive"><TrendingUp size={14} /><span>+24.8%</span></div>
          </div>
          <div className="metric-body">
            <h3>₹{metrics.revenue}k</h3>
            <p className="metric-label">Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Growth & Design Studio Launchpad */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Growth & Design Studio</h3>
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
      {metrics.recentActivitiesList.length > 0 && (
         <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Recent System Activity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
               {metrics.recentActivitiesList.map((activity: any) => (
                  <div key={activity.id} className="nav-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', background: `${activity.color === 'indigo' ? '#6366f1' : '#ec4899'}15`, color: activity.color === 'indigo' ? '#6366f1' : '#ec4899' }}>
                         <activity.icon size={18} />
                      </div>
                      <div>
                         <div style={{ fontWeight: 700, fontSize: '14px' }}>{activity.text}</div>
                         <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activity.user_name} • {new Date(activity.time).toLocaleTimeString()}</div>
                      </div>
                  </div>
               ))}
            </div>
         </div>
      )}
      {/* Live Check-in Stats - REAL-TIME SYNC WITH SCANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(13, 14, 30, 0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div className="pulse-dot" style={{ background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                Live Entry Monitoring
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Real-time sync with Ticketliv Scanner v2.1</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <div className="status-badge" style={{ height: '32px', fontSize: '10px' }}>
                TOTAL SCANS: {metrics.scanned.toLocaleString()}
             </div>
             <div className="status-badge" style={{ height: '32px', fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                FRAUD DETECTED: 0
             </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
           <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Entry Progress</span>
                 <span style={{ fontSize: '12px', fontWeight: 700 }}>{attendancePercent}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                 <div style={{ width: `${attendancePercent}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)', boxShadow: '0 0 10px #6366f1' }}></div>
              </div>
              <p style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>{metrics.scanned.toLocaleString()} / {metrics.totalTickets.toLocaleString()} Checked-in</p>
           </div>

           <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inventory Released</span>
              <h4 style={{ fontSize: '24px', fontWeight: 900, marginTop: '5px' }}>{metrics.totalTickets.toLocaleString()}</h4>
              <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>HIGH CAPACITY MODE ACTIVE</p>
           </div>

           <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Monitor Gates</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                 {['A', 'B', 'VVIP'].map(gate => (
                    <div key={gate} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--indigo-400)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                       {gate}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>


      {/* Main Charts area */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="chart-section glass-panel" style={{ padding: '1.5rem' }}>
           <div className="section-header" style={{ marginBottom: '1.5rem' }}>
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
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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

        <div className="activity-section glass-panel" style={{ padding: '1.5rem' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Scanner Live Audit</h3>
           <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             {metrics.recentScansList.map((activity: any) => (
                  <div key={activity.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: `${activity.color}15`, color: activity.color }}>
                      <activity.icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 800 }}>{activity.text}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activity.user_name} • {new Date(activity.time).toLocaleTimeString()}</p>
                    </div>
                  </div>
             ))}
             {metrics.recentScansList.length === 0 && (
               <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No recent scans recorded</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
