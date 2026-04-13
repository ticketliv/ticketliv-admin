import { useState, useEffect } from 'react';
import { Save, Shield, Smartphone, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Settings = () => {
  const { currentAdminUser, updateAdminUser } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  
  // State for profile updates
  const [email, setEmail] = useState(currentAdminUser?.email || '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Sync state if currentAdminUser changes (e.g. from Team page or switch)
  useEffect(() => {
    const syncEmail = async () => {
      if (currentAdminUser && email !== currentAdminUser.email) {
        setEmail(currentAdminUser.email);
      }
    };
    syncEmail();
  }, [currentAdminUser, email]);

  const handleApplyChanges = () => {
    setStatus(null);
    
    if (!email) {
      setStatus({ type: 'error', message: 'Email cannot be empty.' });
      return;
    }

    const updatedData: Partial<{email: string, password?: string}> = { email };
    if (password) {
      if (password.length < 6) {
        setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
        return;
      }
      updatedData.password = password;
    }

    // Update globally in AppContext
    if (currentAdminUser) {
      updateAdminUser(currentAdminUser.id, updatedData);
    }
    
    setStatus({ type: 'success', message: 'Security profile updated successfully!' });
    setPassword(''); // Reset password field after update
    
    // Clear status after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Platform Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Configure global settings for the TicketLiv backend and Mobile Application.</p>
      </div>

      {status && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          borderRadius: '12px', 
          background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${status.type === 'success' ? '#10b981' : '#f43f5e'}`,
          color: status.type === 'success' ? '#10b981' : '#f43f5e',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{status.message}</span>
        </div>
      )}

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Smartphone size={18} className="text-pink-400" /> Mobile App Controls</h3>
           
           <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
             <div>
               <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Maintenance Mode</label>
               <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shows a maintenance screen to all mobile users.</p>
             </div>
             <div style={{ width: '44px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: '2px' }}></div>
             </div>
           </div>


        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={18} className="text-indigo-400" /> Security & Profile</h3>
           
           <div className="form-group">
             <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Admin Email</label>
             <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'white' }} 
             />
           </div>

           <div className="form-group">
             <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Change Password</label>
             <div style={{ position: 'relative' }}>
               <input 
                 type={showPassword ? 'text' : 'password'} 
                 placeholder="Enter new password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', paddingRight: '48px', borderRadius: '8px', color: 'white' }} 
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               >
                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>

           <button 
             onClick={handleApplyChanges}
             style={{ 
               padding: '12px', 
               borderRadius: '8px', 
               background: 'rgba(255,255,255,0.05)', 
               color: 'white', 
               border: '1px solid rgba(255,255,255,0.1)', 
               fontWeight: 600, 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               gap: '8px',
               cursor: 'pointer',
               marginBottom: '16px'
             }}
           >
             <Save size={18} /> Save Profile
           </button>


        </div>
      </div>
    </div>
  );
};

export default Settings;
