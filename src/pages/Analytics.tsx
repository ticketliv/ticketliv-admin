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
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Global Ticket & Scan Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Real-time monitoring of ticket generation, entry flow, and fraud detection</p>
      </div>

      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        {[
          { icon: Ticket, label: 'Tickets Scanned', value: ticketStats.totalScanned, color: 'indigo' },
          { icon: Activity, label: 'Attendance Rate', value: `${attendanceRate}%`, color: 'cyan' },
          { icon: ShieldAlert, label: 'Fraud Alerts', value: ticketStats.fraudAlerts, color: 'pink' },
          { icon: AlertTriangle, label: 'Duplicate Scans', value: ticketStats.duplicates, color: 'yellow' }
        ].map((metric, i) => (
           <div key={i} className="metric-card glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div className={`metric-icon-box ${metric.color}`}>
               <metric.icon size={24} />
             </div>
             <div>
               <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{metric.value}</h3>
               <p className="metric-label">{metric.label}</p>
             </div>
           </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Real-time Entry Flow</h3>
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
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Scans per hour (Last 10 hours)</p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#eab308" /> Security Anomalies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!dashboardStats?.activities || dashboardStats.activities.length === 0) ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No security anomalies detected in the last 24h</p>
            ) : (
              dashboardStats.activities.slice(0, 3).map((alert: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>{new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{alert.text}</span>
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
