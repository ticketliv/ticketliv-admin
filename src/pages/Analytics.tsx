import { Ticket, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

import { useApp } from '../context/AppContext';

const Analytics = () => {
  const { dashboardStats } = useApp();
  
  const ticketStats = {
    totalTickets: dashboardStats?.metrics?.total_tickets || 0,
    totalScanned: dashboardStats?.metrics?.total_scanned || 0,
    duplicates: 0, // In production, this would come from a specific anomaly endpoint
    fraudAlerts: 0,
  };

  const attendanceRate = ticketStats.totalTickets > 0 
    ? Math.round((ticketStats.totalScanned / ticketStats.totalTickets) * 100)
    : 0;

  return (
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
               <Activity size={18} color="#fff" />
            </div>
            <div>
               <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Global Ticket & Scan Analytics</h2>
               <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Real-time monitoring of ticket generation, entry flow, and fraud detection</p>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[
          { icon: Ticket, label: 'Tickets Scanned', value: ticketStats.totalScanned, color: '#8b5cf6', subText: 'Valid Entry' },
          { icon: Activity, label: 'Attendance Rate', value: `${attendanceRate}%`, color: '#06b6d4', subText: 'Total Turnout' },
          { icon: ShieldAlert, label: 'Fraud Alerts', value: ticketStats.fraudAlerts, color: '#ec4899', subText: 'Blocked Entries' },
          { icon: AlertTriangle, label: 'Duplicate Scans', value: ticketStats.duplicates, color: '#eab308', subText: 'Flagged Errors' }
        ].map((metric, i) => (
           <div key={i} className="nav-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: `1px solid ${metric.color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                 <metric.icon size={18} color={metric.color} />
                 <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{metric.label}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{metric.value}</div>
              <p style={{ fontSize: '11px', color: metric.color, marginTop: '6px', fontWeight: 600 }}>{metric.subText}</p>
           </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel live-monitoring-section" style={{ 
          padding: '24px', 
          border: '1px solid rgba(99, 102, 241, 0.25)', 
          background: 'linear-gradient(135deg, rgba(13, 14, 30, 0.95) 0%, rgba(20, 21, 45, 0.98) 100%)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Animated Background Mesh */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)', zIndex: 0 }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot" style={{ background: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}></div>
              Real-time Entry Flow
            </h3>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px' }}>
              {(!dashboardStats?.scanTrend || dashboardStats.scanTrend.length === 0) ? (
                <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No scan data for selected period</div>
              ) : (
                  dashboardStats.scanTrend.map((item: any, i: number) => {
                    const maxCount = Math.max(...dashboardStats.scanTrend.map((t: any) => t.count), 1);
                    const height = Math.max((item.count / maxCount) * 150, 4); // Min 4px height
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          flex: 1, 
                          height: `${height}px`, 
                          background: 'linear-gradient(to top, var(--brand-primary), #6366f1)', 
                          borderRadius: '4px 4px 0 0', 
                          opacity: 0.8,
                          transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                        title={`${item.time}: ${item.count} scans`} 
                      />
                    );
                  })
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontWeight: '500' }}>Scans per hour (Last 10 hours)</p>
          </div>
        </div>

        <div className="glass-panel" style={{ 
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(244, 63, 94, 0.05) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.1)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e' }}>
            <AlertTriangle size={18} color="#f43f5e" /> Security Anomalies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!dashboardStats?.activities || dashboardStats.activities.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <ShieldAlert size={32} color="rgba(244, 63, 94, 0.3)" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No security anomalies detected in the last 24h</p>
              </div>
            ) : (
              dashboardStats.activities.slice(0, 3).map((alert: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderBottom: '1px solid rgba(244, 63, 94, 0.1)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 8px', borderRadius: '8px' }}>{new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{alert.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
