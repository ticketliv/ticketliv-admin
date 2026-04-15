import { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Plus, Edit3, RefreshCw, Search, Trash2, Calendar as CalIcon, MapPin, ChevronDown, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useApp, getEventStatus } from '../context/AppContext';
import './Events.css';

const Events = () => {
  const navigate = useNavigate();
  const { events, refreshEvents, deleteEvent } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorStatus(null);
    try {
      await refreshEvents();
    } catch (err: any) {
      console.error('[Events] Sync error:', err);
      const msg = typeof err === 'string' ? err : (err?.message || "Failed to sync with server. Please check your connection.");
      setErrorStatus(msg);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refreshEvents]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);







  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmHardDelete = async (id: string) => {
    if (!id) return;
    try {
      await deleteEvent(id);
      toast.success("Event deleted successfully!");
      setDeletingId(null);
    } catch (_err) {
      toast.error("Failed to delete event. Please try again.");
    }
  };

  const filteredEvents = events.filter(evt => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = (
      evt.title?.toLowerCase().includes(term) ||
      evt.location?.toLowerCase().includes(term) ||
      evt.organizer_name?.toLowerCase().includes(term)
    );

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && getEventStatus(evt) === statusFilter;
  });

  return (
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <CalIcon size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Event Management</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Manage events published to the TicketLiv mobile app.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="icon-btn"
            style={{ width: 'auto', padding: '0 16px', borderRadius: '8px', gap: '8px', cursor: 'pointer' }}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} style={{ transition: 'transform 0.5s' }} /> Refresh
          </button>
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              className="icon-btn"
              style={{
                width: 'auto',
                padding: '0 16px',
                borderRadius: '8px',
                gap: '8px',
                background: statusFilter !== 'all' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                borderColor: statusFilter !== 'all' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.08)'
              }}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={16} color={statusFilter !== 'all' ? '#818cf8' : 'currentColor'} />
              {statusFilter === 'all' ? 'Filter' : statusFilter}
              <ChevronDown size={14} style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </button>

            {isFilterOpen && (
              <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, padding: '8px', minWidth: '180px', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {['all', 'Live', 'Sold Out', 'Completed', 'Draft', 'Cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setIsFilterOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: statusFilter === status ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: statusFilter === status ? '#818cf8' : 'white',
                      fontSize: '13px',
                      fontWeight: statusFilter === status ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={e => e.currentTarget.style.background = statusFilter === status ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                  >
                    {status === 'all' ? 'All Status' : status}
                    {statusFilter === status && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="icon-btn"
            style={{ width: 'auto', padding: '0 16px', borderRadius: '8px', gap: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none' }}
            onClick={() => navigate('/create-event')}
          >
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search events by title, location, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 14px 12px 38px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '13px',
              transition: 'all 0.3s'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', border: 'none' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)' }}>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Details</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '16px 20px', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', minWidth: '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {errorStatus ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#f43f5e', fontSize: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <p>{errorStatus}</p>
                    <button onClick={handleRefresh} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '6px 16px', borderRadius: '8px', color: '#f43f5e', fontSize: '13px', cursor: 'pointer' }}>Retry Sync</button>
                  </div>
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ opacity: 0.6 }}>
                    <Search size={40} style={{ marginBottom: '16px', margin: '0 auto' }} />
                    <p style={{ fontSize: '16px', fontWeight: 600 }}>No matching events</p>
                    <p style={{ fontSize: '14px' }}>Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              [...filteredEvents].reverse().map((evt) => {
                const categories = evt.ticketCategories ?? [];
                const totalCapacity = categories.reduce((acc, cat) => acc + (cat.capacity || 0), 0);
                const eventSales = evt.sales ?? 0;
                const revenue = evt.revenue || 0;
                const salesStr = totalCapacity > 0 ? `${eventSales.toLocaleString()} / ${totalCapacity.toLocaleString()}` : (eventSales > 0 ? `${eventSales.toLocaleString()}` : '--');

                const status = getEventStatus(evt);
                const getStatusColor = (s: string) => {
                  switch (s) {
                    case 'Live': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
                    case 'Sold Out': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
                    case 'Completed': return { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' };
                    case 'Cancelled': return { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e' };
                    case 'Draft': return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' };
                    default: return { bg: 'rgba(255, 255, 255, 0.05)', text: 'var(--text-muted)' };
                  }
                };
                const statusStyle = getStatusColor(status);

                return (
                  <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{evt.title || 'Untitled Event'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '11px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalIcon size={12} /> {evt.date || '--'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {evt.location || '--'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>₹{revenue.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{evt.revenueCurrency || 'INR'}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{salesStr}</div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '6px', width: '80%', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, (eventSales / (totalCapacity || 1)) * 100)}%`,
                          height: '100%',
                          background: 'var(--accent-primary)',
                          boxShadow: '0 0 8px var(--accent-primary)'
                        }}></div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.text}20`
                      }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', width: '180px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {deletingId === evt.id ? (
                           <div className="inline-confirm">
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f43f5e', marginRight: '8px' }}>Sure?</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                 <button className="inline-btn-yes" onClick={() => confirmHardDelete(evt.id)}>Yes</button>
                                 <button className="inline-btn-no" onClick={() => setDeletingId(null)}>No</button>
                              </div>
                           </div>
                        ) : (
                          <>
                            <button
                              className="icon-btn"
                              onClick={() => navigate(`/create-event?id=${evt.id}`)}
                              title="Edit Event"
                              style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'white' }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => handleDelete(evt.id)}
                              title="Delete Event"
                              style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.08)', border: 'none', borderRadius: '8px', color: '#f43f5e' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>    </div>
  );
};

export default Events;
