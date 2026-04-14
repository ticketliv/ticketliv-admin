import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PieChart,
  IndianRupee,
  Users,
  Settings,
  Calendar,
  PlusSquare,
  LogOut,
  Bell,
  Search,
  Megaphone,
  ClipboardList,
  Ticket,
  Shield,
  Tag,
  Zap,
  CreditCard,
  UserCheck,
  ArrowRight,
  Layout,
  FileSearch,
  ShieldCheck
} from 'lucide-react';
import './AdminLayout.css';
import { useApp, type PermissionRoute } from '../context/AppContext';

const NAV_PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Attendees', path: '/attendees', icon: ClipboardList },
  { label: 'Create Event', path: '/create-event', icon: PlusSquare },
  { label: 'Categories', path: '/categories', icon: Users },
  { label: 'Ads Management', path: '/ads', icon: Megaphone },
  { label: 'Marketing', path: '/marketing', icon: Zap },
  { label: 'Analytics', path: '/analytics', icon: PieChart },
  { label: 'Finance', path: '/finance', icon: IndianRupee },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Bulk Generation', path: '/bulk-tickets', icon: FileSearch },
  { label: 'Seat Map Designer', path: '/seat-map', icon: Layout },
  { label: 'Admin Control', path: '/admin-control', icon: ShieldCheck },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { events, categories, currentAdminUser, attendees, adminUsers, coupons, discounts, transactions, refreshEvents, refreshDashboardStats } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh layout display & fetch fresh data when navigating to any page
  useEffect(() => {
    // 1. Reset scroll position seamlessly
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
    
    // 2. Refresh critical application contexts asynchronously 
    // so the new page displays fresh DB stats instantly without manual clicks
    refreshEvents?.().catch(() => {});
    refreshDashboardStats?.().catch(() => {});
  }, [location.pathname, refreshEvents, refreshDashboardStats]);

  const currentPage = useMemo(() =>
    NAV_PAGES.find(p => p.path === location.pathname),
    [location.pathname]);

  const hasAccess = useCallback((route: string) =>
    currentAdminUser?.permissions?.includes(route as PermissionRoute) || false,
    [currentAdminUser]);

  const handleLogout = () => {
    navigate('/login');
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return null;

    return {
      pages: NAV_PAGES.filter(p => p.label.toLowerCase().includes(q) && hasAccess(p.path)).slice(0, 3),
      events: events.filter(e => e.title.toLowerCase().includes(q) || (e.location && e.location.toLowerCase().includes(q))).slice(0, 3),
      categories: categories.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3),
      attendees: attendees.filter(a => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.mobileNumber.includes(q)).slice(0, 3),
      team: adminUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)).slice(0, 3),
      coupons: coupons.filter(c => c.code.toLowerCase().includes(q)).slice(0, 3),
      discounts: discounts.filter(d => d.name.toLowerCase().includes(q)).slice(0, 3),
      transactions: transactions.filter(t => t.to.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.amount.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [searchQuery, events, categories, attendees, adminUsers, coupons, discounts, transactions, hasAccess]);

  const hasResults = searchResults ? Object.values(searchResults).some(arr => arr.length > 0) : false;

  const handleSelectResult = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h1 className="logo sidebar-logo">
            TICKET<span className="liv-capsule">LIV</span>
          </h1>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {NAV_PAGES.map((page) => {
              const Icon = page.icon || LayoutDashboard;
              if (!hasAccess(page.path)) return null;
              
              return (
                <li key={page.path}>
                  <NavLink
                    to={page.path}
                    className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                  >
                    <Icon size={20} className="nav-icon" />
                    <span>{page.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Sticky Header */}
        {(location.pathname === '/dashboard' || location.pathname === '/') && (
          <header className="top-header">
            <div className="header-greeting">
              {/* Dynamic Greeting Title based on route could go here, but omitted for simplicity across generic paths */}
              <h2>{currentPage?.label || 'Admin Workspace'}</h2>
              <p className="desktop-only text-muted hide-on-mobile" style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Manage the TicketLiv Mobile App ecosystem</p>
            </div>

            <div className="header-actions">
              <div className="search-wrapper">
                {!isSearchActive ? (
                  <button className="icon-btn" onClick={() => setIsSearchActive(true)}>
                    <Search size={20} />
                  </button>
                ) : (
                  <div className="search-input-container" style={{ position: 'relative' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Search everything..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      onBlur={() => {
                        setTimeout(() => {
                          if (!searchQuery) setIsSearchActive(false);
                        }, 200);
                      }}
                    />

                    {/* Global Search Dropdown */}
                    {searchQuery && searchResults && (
                      <div className="glass-panel" style={{
                        position: 'absolute',
                        top: '110%',
                        left: 0,
                        width: '360px',
                        background: 'rgba(20, 20, 28, 0.98)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '8px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        maxHeight: '480px',
                        overflowY: 'auto'
                      }}>
                        {!hasResults ? (
                          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No results found for "{searchQuery}"
                          </div>
                        ) : (
                          <>
                            {/* Quick Navigation Pages */}
                            {searchResults.pages.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Pages</p>
                                {searchResults.pages.map(page => {
                                  const PageIcon = page.icon;
                                  return (
                                    <button key={page.path} onClick={() => handleSelectResult(page.path)} className="search-result-btn">
                                      <PageIcon size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                      <span className="search-result-text">{page.label}</span>
                                      <ArrowRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Events */}
                            {searchResults.events.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Events</p>
                                {searchResults.events.map(event => (
                                  <button key={event.id} onClick={() => handleSelectResult('/events')} className="search-result-btn">
                                    <Calendar size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
                                    <span className="search-result-text">{event.title}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: (event.status === 'Live') ? '#10b981' : '#eab308', flexShrink: 0 }}>{event.status || 'Live'}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Categories */}
                            {searchResults.categories.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Categories</p>
                                {searchResults.categories.map(cat => (
                                  <button key={cat.id} onClick={() => handleSelectResult('/categories')} className="search-result-btn">
                                    <Tag size={14} style={{ color: '#06b6d4', flexShrink: 0 }} />
                                    <span className="search-result-text">{cat.name}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: cat.status === 'Active' ? '#10b981' : 'var(--text-muted)', flexShrink: 0 }}>{cat.status}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Attendees */}
                            {searchResults.attendees.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Attendees</p>
                                {searchResults.attendees.map(att => (
                                  <button key={att.id} onClick={() => handleSelectResult('/attendees')} className="search-result-btn">
                                    <UserCheck size={14} style={{ color: '#ec4899', flexShrink: 0 }} />
                                    <span className="search-result-text">{att.fullName}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{att.status}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Team (Admin Users) */}
                            {searchResults.team.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Team</p>
                                {searchResults.team.map(user => (
                                  <button key={user.id} onClick={() => handleSelectResult('/team')} className="search-result-btn">
                                    <Shield size={14} style={{ color: '#a855f7', flexShrink: 0 }} />
                                    <span className="search-result-text">{user.name}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>{user.role}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Coupons */}
                            {searchResults.coupons.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Promo Codes</p>
                                {searchResults.coupons.map(coupon => (
                                  <button key={coupon.id} onClick={() => handleSelectResult('/marketing')} className="search-result-btn">
                                    <Ticket size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                    <span className="search-result-text" style={{ fontFamily: 'monospace' }}>{coupon.code}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: coupon.status === 'Active' ? '#10b981' : '#f43f5e', flexShrink: 0 }}>{coupon.status}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Discounts */}
                            {searchResults.discounts.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Discount Rules</p>
                                {searchResults.discounts.map(disc => (
                                  <button key={disc.id} onClick={() => handleSelectResult('/marketing')} className="search-result-btn">
                                    <Zap size={14} style={{ color: '#eab308', flexShrink: 0 }} />
                                    <span className="search-result-text">{disc.name}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: disc.status === 'Active' ? '#10b981' : 'var(--text-muted)', flexShrink: 0 }}>{disc.status}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Transactions */}
                            {searchResults.transactions.length > 0 && (
                              <div style={{ marginBottom: '6px' }}>
                                <p className="search-section-label">Transactions</p>
                                {searchResults.transactions.map(trx => (
                                  <button key={trx.id} onClick={() => handleSelectResult('/finance')} className="search-result-btn">
                                    <CreditCard size={14} style={{ color: '#06b6d4', flexShrink: 0 }} />
                                    <span className="search-result-text">{trx.to}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: trx.type === 'Income' ? '#10b981' : '#f43f5e', flexShrink: 0 }}>{trx.amount}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button className="icon-btn">
                <Bell size={20} />
              </button>
              <div
                className="user-profile"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ position: 'relative' }}
              >
                <div className="avatar">{currentAdminUser?.name?.charAt(0) || 'A'}</div>
                <div className="user-info">
                  <span className="user-name">{currentAdminUser?.name || 'Admin'}</span>
                  <span className="user-role">{currentAdminUser?.role || 'User'}</span>
                </div>

                {isProfileOpen && (
                  <div className="profile-dropdown glass-panel">
                    <div className="profile-dropdown-header">
                      <p className="profile-dropdown-email">{currentAdminUser?.email}</p>
                      <p className="profile-dropdown-id">ID: {currentAdminUser?.id}</p>
                    </div>
                    <button
                      className="profile-dropdown-btn signout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Dynamic Nested Content */}
        <div ref={scrollContainerRef} className="scrollable-container" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
