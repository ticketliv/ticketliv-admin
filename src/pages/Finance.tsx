
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { 
  DollarSign, 
  CheckCircle2, 
  Filter, 
  Download,
  CreditCard,
  RefreshCcw,
  Search,
  ChevronDown,
  X,
  FileSpreadsheet
} from 'lucide-react';

import { useApp } from '../context/AppContext';

interface Transaction {
  id: string;
  to: string;
  date: string;
  type: string;
  amount: number | string;
  status: string;
}

const Finance = () => {
  const { transactions: rawTransactions, dashboardStats } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const stats = [
    { 
      label: 'Total Gross Revenue', 
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(dashboardStats?.metrics?.total_revenue || 0), 
      trend: '+0%', 
      icon: DollarSign, 
      color: '#6366f1' 
    },
    { label: 'Settled to Organizers', value: '₹0', trend: 'T+2 Avg.', icon: CheckCircle2, color: '#10b981' },
    { label: 'Platform Commissions', value: '₹0', trend: '10% Avg.', icon: CreditCard, color: '#8b5cf6' },
    { label: 'System Check-ins', value: dashboardStats?.metrics?.total_scanned || 0, trend: 'Live', icon: RefreshCcw, color: '#f59e0b' },
  ];

  const transactions = useMemo(() => {
    return (rawTransactions || []).filter((trx: Transaction) => {
      const matchesSearch = (trx.to || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (trx.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || trx.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rawTransactions, searchTerm, statusFilter]);

  const handleExport = () => {
    const dataToExport = transactions.map((trx: Transaction) => ({
      'Transaction ID': trx.id,
      'Beneficiary': trx.to,
      'Date': trx.date,
      'Type': trx.type,
      'Amount': trx.amount,
      'Status': trx.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reconciliation');
    XLSX.writeFile(wb, `Settlement_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Report exported successfully!', {
      icon: <FileSpreadsheet size={16} color="#10b981" />,
      style: { background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });
  };

  const runSettlementCycle = () => {
    setIsProcessing(true);
    toast.loading('Processing settlement sync...', { id: 'settlement-toast' });
    
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Financial sync complete!', { 
        id: 'settlement-toast',
        style: { background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      });
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'confirmed': return '#10b981';
      case 'processing':
      case 'pending': return '#f59e0b';
      case 'refunded':
      case 'failed':
      case 'cancelled': return '#f43f5e';
      default: return '#94a3b8';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const val = typeof amount === 'number' ? amount : parseFloat(amount || '0');
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="finance-dashboard" style={{ animation: 'fadeIn 0.8s ease-out', padding: '40px', color: '#fff' }}>
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#fff' }}>
            Financial Hub
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Automated reconciliation & real-time settlement tracking</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-glass" 
            onClick={handleExport}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: '0.3s'
            }}
          >
            <Download size={18} /> Export Results
          </button>
          <button 
            className="btn-primary" 
            disabled={isProcessing}
            onClick={runSettlementCycle}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem',
              background: isProcessing ? 'rgba(99, 102, 241, 0.5)' : '#6366f1', 
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
              borderRadius: '12px', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
              transition: '0.3s transform ease'
            }}
            onMouseOver={(e) => !isProcessing && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <RefreshCcw size={18} className={isProcessing ? 'spin' : ''} /> 
            {isProcessing ? 'Process Running...' : 'Run Settlement Sync'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel" style={{ 
            padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
              <stat.icon size={100} color={stat.color} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>{stat.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stat.value}</div>
            <div style={{ fontSize: '0.9rem', color: stat.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: `${stat.color}15` }}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table Section */}
      <div className="glass-panel" style={{ 
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(10px)'
      }}>
        {/* Table Toolbar */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Ledger Activity</h3>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input 
                      type="text" 
                      placeholder="Search entities..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', padding: '0.6rem 1rem 0.6rem 2.5rem', color: '#fff', width: '220px',
                        fontSize: '0.9rem', outline: 'none', transition: '0.3s'
                      }}
                      onFocus={(e) => e.target.style.border = '1px solid rgba(99, 102, 241, 0.5)'}
                      onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                    />
                    {searchTerm && <X size={14} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: 0.5 }} />}
                </div>

                {/* Filter Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 1rem',
                        color: '#fff', cursor: 'pointer', fontSize: '0.9rem'
                      }}
                    >
                        <Filter size={16} /> Status: {statusFilter} <ChevronDown size={14} />
                    </button>
                    
                    {showFilters && (
                        <div style={{ 
                            position: 'absolute', top: '110%', right: 0, width: '150px', 
                            background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', zIndex: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            {['All', 'Success', 'Processing', 'Completed', 'Refunded'].map(status => (
                                <div 
                                    key={status}
                                    onClick={() => { setStatusFilter(status); setShowFilters(false); }}
                                    style={{ 
                                        padding: '0.75rem 1rem', fontSize: '0.9rem', cursor: 'pointer',
                                        background: statusFilter === status ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                        color: statusFilter === status ? '#6366f1' : '#fff',
                                        borderLeft: statusFilter === status ? '3px solid #6366f1' : '3px solid transparent'
                                    }}
                                    onMouseOver={(e) => ! (statusFilter === status) && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                    onMouseOut={(e) => ! (statusFilter === status) && (e.currentTarget.style.background = 'transparent')}
                                >
                                    {status}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Dynamic Table */}
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <th style={{ padding: '10px 20px' }}>Reference</th>
                        <th style={{ padding: '10px 20px' }}>Beneficiary / Entity</th>
                        <th style={{ padding: '10px 20px' }}>Transaction Volume</th>
                        <th style={{ padding: '10px 20px' }}>Category</th>
                        <th style={{ padding: '10px 20px' }}>Live Status</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length > 0 ? transactions.map((trx: Transaction, idx: number) => (
                        <tr key={trx.id} style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.02)', 
                            transition: 'background 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: `fadeInUp 0.4s ease forwards ${idx * 0.05}s`,
                            opacity: 0,
                            transform: 'translateY(10px)'
                        }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '14px 20px' }}>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{trx.id}</span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{trx.to || 'TicketLiv System'}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{new Date(trx.date).toLocaleDateString()}</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: (typeof trx.amount === 'number' ? trx.amount : parseFloat(trx.amount || '0')) < 0 ? '#f43f5e' : '#fff' }}>
                                    {formatCurrency(trx.amount)}
                                </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CreditCard size={14} style={{ opacity: 0.5 }} />
                                    </div>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{trx.type}</span>
                                </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                                <div style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '6px 14px',
                                    borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                                    background: `${getStatusColor(trx.status)}15`,
                                    color: getStatusColor(trx.status),
                                    border: `1px solid ${getStatusColor(trx.status)}30`
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(trx.status), boxShadow: `0 0 10px ${getStatusColor(trx.status)}` }} />
                                    {trx.status}
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.2)' }}>
                                <X size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>No transactions found</div>
                                <div style={{ fontSize: '0.9rem' }}>Try adjusting your filters or search term</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .btn-glass:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.2) !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default Finance;
