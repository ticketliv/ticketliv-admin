import { Download, FileText } from 'lucide-react';

const Reports = () => {
  return (
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
             <FileText size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Generate Reports</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Export data and analytics for external accounting and audits.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {['General Sales Summary', 'Ticket Inventory Ledger', 'Organizer Payout Records', 'Tax & Service Fee Ledger'].map((report, i) => (
           <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="metric-icon-box indigo" style={{ width: '40px', height: '40px' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{report}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PDF Document</p>
                </div>
             </div>
             <button className="icon-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
               <Download size={18} />
             </button>
           </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
