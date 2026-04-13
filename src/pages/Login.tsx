import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Key, Lock, CheckCircle, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';
import './Login.css';

type FlowStep = 'login' | 'forgot-email' | 'forgot-otp' | 'reset-password' | 'success';

const Login = () => {
  const navigate = useNavigate();
  const { adminUsers, loginUser, updateAdminUser } = useApp();
  
  // Flow State
  const [step, setStep] = useState<FlowStep>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification State
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resetUserId, setResetUserId] = useState<string | null>(null);

  // Helper to change step and clear error
  const changeStep = (newStep: FlowStep) => {
    setError('');
    setStep(newStep);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Local Development Test Credentials Bypass
    if (email === 'admin@ticketliv.com' && password === 'admin') {
      const mockUser = {
        id: 'ADM-TEST-1',
        name: 'Test Administrator',
        email: 'admin@ticketliv.com',
        role: 'Superadmin',
        permissions: ['/dashboard', '/events', '/marketing', '/attendees', '/create-event', '/categories', '/ads', '/analytics', '/finance', '/reports', '/settings', '/team', '/ticket-design', '/bulk-tickets', '/seat-map']
      };
      
      loginUser(mockUser as any, 'mock-local-token');
      navigate('/dashboard');
      return;
    }

    try {
      const res = await AuthService.login(email, password) as any;
      
      if (res?.token && res?.data) {
        loginUser(res.data, res.token);
        navigate('/dashboard');
      } else {
        setError('Unexpected authentication error.');
      }
    } catch (err: unknown) {
       const errorMessage = err instanceof Error ? err.message : 'Invalid email or password. Please try again.';
       setError(errorMessage);
    }
  };

  const handleForgotEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      // Generate a mock 6-digit OTP
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setResetUserId(user.id);
      
      // In a real app, this would be sent via email
      
      changeStep('forgot-otp');
    } else {
      setError('No administrator account found with this email.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp === generatedOtp) {
      changeStep('reset-password');
    } else {
      setError('Invalid OTP. Please check your email and try again.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (resetUserId) {
      updateAdminUser(resetUserId, { password: newPassword });
      changeStep('success');
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'forgot-email':
        return (
          <>
            <div className="login-header">
              <button className="back-button" onClick={() => changeStep('login')}>
                <ArrowLeft size={18} />
              </button>
              <h2 className="step-title">Reset Password</h2>
              <p className="login-subtitle">Enter your email to receive a verification code</p>
            </div>
            
            <form onSubmit={handleForgotEmail} className="login-form">
              <div className="input-group">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="admin@ticketliv.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="login-button">
                <span>Send Code</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        );

      case 'forgot-otp':
        return (
          <>
            <div className="login-header">
              <button className="back-button" onClick={() => changeStep('forgot-email')}>
                <ArrowLeft size={18} />
              </button>
              <h2 className="step-title">Verify OTP</h2>
              <p className="login-subtitle">We've sent a 6-digit code to <br/><strong>{email}</strong></p>
            </div>
            
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div className="input-group">
                <label htmlFor="otp">Security Code</label>
                <div className="input-with-icon">
                  <ShieldCheck className="input-icon" size={18} />
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    style={{ letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}
                  />
                </div>
                <p className="resend-text">
                  Didn't receive code? <button type="button" className="text-link" onClick={handleForgotEmail}>Resend</button>
                </p>
              </div>
              <button type="submit" className="login-button">
                <span>Verify Code</span>
                <ArrowRight size={18} />
              </button>
            </form>
            {/* Mock Helper for Tester */}
            <div style={{ marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Debug: OTP is {generatedOtp}
            </div>
          </>
        );

      case 'reset-password':
        return (
          <>
            <div className="login-header">
              <h2 className="step-title">New Password</h2>
              <p className="login-subtitle">Create a strong password for your account</p>
            </div>
            
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="input-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <Key className="input-icon" size={18} />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="login-button">
                <span>Update Password</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        );

      case 'success':
        return (
          <div className="success-step" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="success-icon-container">
              <CheckCircle size={64} color="#10b981" />
            </div>
            <h2 className="step-title" style={{ marginTop: '20px' }}>Password Updated!</h2>
            <p className="login-subtitle">Your password has been changed successfully. You can now log in with your new credentials.</p>
            <button 
              className="login-button" 
              style={{ marginTop: '24px' }}
              onClick={() => changeStep('login')}
            >
              <span>Back to Login</span>
            </button>
          </div>
        );

      default:
        return (
          <>
            <div className="login-header">
              <div className="logo-container">
                <h1 className="logo-text">
                  TICKET<span className="liv-capsule">LIV</span>
                </h1>
              </div>
              <p className="login-subtitle">Sign in to your admin workspace</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@ticketliv.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <div className="password-header">
                  <label htmlFor="password">Password</label>
                  <button type="button" className="forgot-link" onClick={() => changeStep('forgot-email')}>Forgot?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button type="submit" className="login-button">
                <span>Sign In</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="login-container">
      <div className="login-graphics">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>
      
      <div className="login-card glass-panel">
        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.2)', 
            color: '#f43f5e', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '13px', 
            marginBottom: '20px',
            textAlign: 'center',
            animation: 'shake 0.4s ease-in-out'
          }}>
            {error}
          </div>
        )}

        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default Login;
