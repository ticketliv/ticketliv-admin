import React, { useState } from 'react';
import { ShieldCheck, Users, CalendarClock, ScanLine, Activity, Search, CheckCircle, XCircle, Trash2, Plus, Edit2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminControl.css';
import { ALL_ADMIN_ROUTES, DEFAULT_ROLE_PERMISSIONS, type PermissionRoute, useApp, type AdminUser } from '../context/AppContext';

// Type definitions based on our schema
type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Event Organizer' | 'Scanner User';
type PublishingStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Published' | 'Archived';

interface EventPending {
  id: string;
  title: string;
  start_date: string;
  status: string;
  publishing_status: PublishingStatus;
  created_at: string;
  organizer_name: string;
}

interface ScannerAssignment {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  assignments: { assignment_id: string; event_id: string; title: string }[];
}

interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  created_at: string;
  target_id: string;
}



const AdminControl = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'publishing' | 'scanners' | 'audit'>('publishing');

  const { adminUsers: users, addAdminUser, updateAdminUser, deleteAdminUser } = useApp();
  const [events, setEvents] = useState<EventPending[]>([]);
  const [scanners, setScanners] = useState<ScannerAssignment[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAssignScannerModalOpen, setIsAssignScannerModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Admin' as UserRole, permissions: [...DEFAULT_ROLE_PERMISSIONS['Admin']] as PermissionRoute[] });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newAssignment, setNewAssignment] = useState({ scannerId: '', eventId: '', eventTitle: '' });

  // ----------------------------------------
  // Handlers
  // ----------------------------------------
  const handleRoleChange = (role: UserRole, isEditing: boolean) => {
    if (isEditing && editingUser) {
      setEditingUser({ ...editingUser, role, permissions: [...DEFAULT_ROLE_PERMISSIONS[role]] });
    } else {
      setNewUser({ ...newUser, role, permissions: [...DEFAULT_ROLE_PERMISSIONS[role]] });
    }
  };

  const handlePermissionToggle = (route: PermissionRoute, isEditing: boolean) => {
    if (isEditing && editingUser) {
      setEditingUser(prev => {
        if (!prev) return prev;
        const perms = prev.permissions || [];
        return {
          ...prev,
          permissions: perms.includes(route) ? perms.filter(p => p !== route) : [...perms, route]
        };
      });
    } else {
      setNewUser(prev => {
        const perms = prev.permissions || [];
        return {
          ...prev,
          permissions: perms.includes(route) ? perms.filter(p => p !== route) : [...perms, route]
        };
      });
    }
  };

  const handleApproveEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.success('Event approved and successfully published!');
    setLogs(prev => [{
      id: `log_${Date.now()}`, user_name: 'Current User', action: 'APPROVE_EVENT', entity_type: 'Event', target_id: id, created_at: new Date().toISOString()
    }, ...prev]);
  };

  const handleRejectEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    toast.error('Event rejected back to organizer.');
    setLogs(prev => [{
      id: `log_${Date.now()}`, user_name: 'Current User', action: 'REJECT_EVENT', entity_type: 'Event', target_id: id, created_at: new Date().toISOString()
    }, ...prev]);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteAdminUser(id);
      toast.success('User deactivated successfully');
    } catch (e) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleUnassignScanner = (assignmentId: string, scannerId: string) => {
    setScanners(prev => prev.map(s => {
      if (s.id === scannerId) {
        return { ...s, assignments: s.assignments.filter(a => a.assignment_id !== assignmentId) };
      }
      return s;
    }));
    toast.success('Scanner assignment removed');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdUser: AdminUser = {
      id: `usr_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      permissions: newUser.permissions,
      status: 'Active',
    };
    
    try {
      await addAdminUser(createdUser);
      setLogs([{
        id: `log_${Date.now()}`, user_name: 'Current User', action: 'CREATE_USER', entity_type: 'User', target_id: createdUser.email, created_at: new Date().toISOString()
      }, ...logs]);
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'Admin', permissions: [...DEFAULT_ROLE_PERMISSIONS['Admin']] });
      toast.success(`${newUser.name} added successfully! (Password: ${newUser.password})`);
    } catch (error) {
      toast.error('Failed to create user. Ensure email is unique.');
    }
  };

  const handleEditUserClick = (user: AdminUser) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateAdminUser(editingUser.id, editingUser);
      setLogs([{
        id: `log_${Date.now()}`, user_name: 'Current User', action: 'UPDATE_USER', entity_type: 'User', target_id: editingUser.id, created_at: new Date().toISOString()
      }, ...logs]);
      setIsEditUserModalOpen(false);
      toast.success(`${editingUser.name} updated successfully!`);
    } catch (error) {
      toast.error('Failed to update user.');
    }
  };

  const handleAssignScanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.scannerId || !newAssignment.eventTitle) {
      toast.error('Please select both scanner and event');
      return;
    }

    const scannerUser = users.find(u => u.id === newAssignment.scannerId);
    if (!scannerUser) return;

    setScanners(prev => {
      const existingScanner = prev.find(s => s.id === newAssignment.scannerId);
      const newAsgn = {
        assignment_id: `asn_${Date.now()}`,
        event_id: newAssignment.eventId || `evt_${Math.floor(Math.random() * 1000)}`,
        title: newAssignment.eventTitle
      };

      if (existingScanner) {
        return prev.map(s => s.id === existingScanner.id ? { ...s, assignments: [...s.assignments, newAsgn] } : s);
      } else {
        return [...prev, {
          id: scannerUser.id,
          name: scannerUser.name,
          email: scannerUser.email,
          is_active: scannerUser.status === 'Active',
          assignments: [newAsgn]
        }];
      }
    });

    setLogs([{
      id: `log_${Date.now()}`, user_name: 'Current User', action: 'ASSIGN_SCANNER', entity_type: 'Scanner_Assignment', target_id: newAssignment.scannerId, created_at: new Date().toISOString()
    }, ...logs]);

    setIsAssignScannerModalOpen(false);
    setNewAssignment({ scannerId: '', eventId: '', eventTitle: '' });
    toast.success('Scanner successfully assigned to event!');
  };

  // ----------------------------------------
  // Render Utils
  // ----------------------------------------
  const getRoleBadgeClass = (role: string) => {
    if (role === 'Super Admin') return 'ac-badge role-super';
    if (role === 'Admin' || role === 'Manager') return 'ac-badge role-admin';
    if (role === 'Scanner User') return 'ac-badge role-scanner';
    return 'ac-badge role-organizer';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatRouteName = (route: string) => {
    return route.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="admin-control-container">
      <div className="ac-header">
        <div>
          <h2><ShieldCheck size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '12px', color: '#818cf8' }} />Admin Control Center</h2>
          <p>Centralized hub for role management, scanner assignments, and publishing workflows.</p>
        </div>
      </div>

      <div className="ac-tabs">
        <button className={`ac-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={18} className="ac-tab-icon" /> User Management
        </button>
        <button className={`ac-tab ${activeTab === 'publishing' ? 'active' : ''}`} onClick={() => setActiveTab('publishing')}>
          <CalendarClock size={18} className="ac-tab-icon" /> Publishing Queue
          {events.length > 0 && <span style={{ background: '#f43f5e', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', marginLeft: '6px' }}>{events.length}</span>}
        </button>
        <button className={`ac-tab ${activeTab === 'scanners' ? 'active' : ''}`} onClick={() => setActiveTab('scanners')}>
          <ScanLine size={18} className="ac-tab-icon" /> Scanner Access
        </button>
        <button className={`ac-tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          <Activity size={18} className="ac-tab-icon" /> Audit Logs
        </button>
      </div>

      <div className="ac-content-section glass-panel" style={{ padding: '24px' }}>

        {/* ====================================
            TAB: PUBLISHING QUEUE
        ==================================== */}
        {activeTab === 'publishing' && (
          <div>
            <div className="ac-list-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Events Awaiting Approval</h3>
              <div className="ac-search-box">
                <Search size={18} className="ac-search-icon" />
                <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="ac-table-container">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Organizer</th>
                    <th>Date Scheduled</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).map(event => (
                    <tr key={event.id}>
                      <td><div style={{ fontWeight: 600, color: '#fff' }}>{event.title}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {event.id}</div></td>
                      <td>{event.organizer_name}</td>
                      <td>{formatDate(event.start_date)}</td>
                      <td><span className="ac-badge pending">{event.publishing_status}</span></td>
                      <td>
                        <div className="ac-actions">
                          <button className="ac-btn-icon ac-btn-approve" onClick={() => handleApproveEvent(event.id)} title="Approve & Publish">
                            <CheckCircle size={18} />
                          </button>
                          <button className="ac-btn-icon ac-btn-reject" onClick={() => handleRejectEvent(event.id)} title="Reject">
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <p>All caught up! No events pending approval.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================
            TAB: USERS
        ==================================== */}
        {activeTab === 'users' && (
          <div>
            <div className="ac-list-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>System Users</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="ac-search-box" style={{ width: '280px' }}>
                  <Search size={18} className="ac-search-icon" />
                  <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <button className="add-btn" style={{ padding: '0 20px' }} onClick={() => setIsAddUserModalOpen(true)}>
                  <Plus size={18} /> Add User
                </button>
              </div>
            </div>

            <div className="ac-table-container">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} style={{ opacity: user.status === 'Active' ? 1 : 0.5 }}>
                      <td><div style={{ fontWeight: 600, color: '#fff' }}>{user.name}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div></td>
                      <td><span className={getRoleBadgeClass(user.role)}>{user.role}</span></td>
                      <td>{user.status}</td>
                      <td>
                        {user.status === 'Active' ?
                          <span style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div> Active</span> :
                          <span style={{ color: '#f43f5e', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }}></div> Inactive</span>
                        }
                      </td>
                      <td>
                        <div className="ac-actions">
                          <button className="ac-btn-icon" title="Edit" onClick={() => handleEditUserClick(user)}><Edit2 size={16} /></button>
                          {user.status === 'Active' && (
                            <button className="ac-btn-icon ac-btn-reject" onClick={() => handleDeleteUser(user.id)} title="Deactivate"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================
            TAB: SCANNERS
        ==================================== */}
        {activeTab === 'scanners' && (
          <div>
            <div className="ac-list-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Scanner Access Management</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="ac-search-box" style={{ width: '280px' }}>
                  <Search size={18} className="ac-search-icon" />
                  <input type="text" placeholder="Find scanner..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <button
                  className="add-btn"
                  style={{ padding: '0 20px', background: 'rgba(20, 184, 166, 0.2)', color: '#2dd4bf', border: '1px solid rgba(20, 184, 166, 0.4)' }}
                  onClick={() => setIsAssignScannerModalOpen(true)}
                >
                  <Plus size={18} /> Assign Scanner
                </button>
              </div>
            </div>

            <div className="ac-table-container" style={{ padding: '16px' }}>
              {scanners.map(scanner => (
                <div key={scanner.id} style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ScanLine size={16} color="#2dd4bf" /> {scanner.name}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{scanner.email}</p>
                    </div>
                    <span className="ac-badge role-scanner">Scanner User</span>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em', fontWeight: 600 }}>Assigned Events</p>
                    {scanner.assignments.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No active assignments.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {scanner.assignments.map(asgn => (
                          <div key={asgn.assignment_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '13px', color: 'white' }}>{asgn.title}</span>
                            <button
                              onClick={() => handleUnassignScanner(asgn.assignment_id, scanner.id)}
                              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                            ><XCircle size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================
            TAB: AUDIT LOGS
        ==================================== */}
        {activeTab === 'audit' && (
          <div>
            <div className="ac-list-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>System Action Audit</h3>
              <div className="ac-search-box" style={{ width: '280px' }}>
                <Search size={18} className="ac-search-icon" />
                <input type="text" placeholder="Search logs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="ac-table-container" style={{ maxHeight: '600px', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
              {logs.filter(l => l.action.toLowerCase().includes(searchQuery.toLowerCase()) || l.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.entity_type.toLowerCase().includes(searchQuery.toLowerCase())).map(log => (
                <div key={log.id} className="ac-log-item">
                  <div className="ac-log-icon">
                    <Activity size={20} />
                  </div>
                  <div className="ac-log-content">
                    <div className="ac-log-title">
                      {log.user_name} performed <span style={{ color: '#818cf8' }}>{log.action}</span>
                    </div>
                    <div className="ac-log-desc">
                      Target {log.entity_type} ID: <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{log.target_id}</span>
                    </div>
                    <div className="ac-log-meta">
                      <span>Log ID: {log.id}</span>
                      <span>•</span>
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', padding: '24px', borderRadius: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="var(--primary-color)" /> Add New System User</h3>

            <form onSubmit={handleCreateUser}>
              <div className="ac-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  className="ac-input"
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="ac-form-group">
                <label>Email Address / Username</label>
                <input
                  type="email"
                  required
                  className="ac-input"
                  placeholder="john@ticketliv.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="ac-form-group">
                <label>Temporary Password</label>
                <input
                  type="text"
                  required
                  className="ac-input"
                  placeholder="Enter a secure password..."
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="ac-form-group">
                <label>System Role</label>
                <select
                  className="ac-input"
                  value={newUser.role}
                  onChange={e => handleRoleChange(e.target.value as UserRole, false)}
                >
                  <option value="Super Admin">Super Admin (Full Access)</option>
                  <option value="Admin">Admin (Standard)</option>
                  <option value="Manager">Manager (Operations)</option>
                  <option value="Event Organizer">Event Organizer (Restricted)</option>
                  <option value="Scanner User">Scanner User (Mobile Only)</option>
                </select>
              </div>

              <div className="permissions-section" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--text-muted)" /> Specific Route Permissions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {ALL_ADMIN_ROUTES.map((route: PermissionRoute) => {
                    const isChecked = newUser.permissions?.includes(route);
                    const isSuper = newUser.role === 'Super Admin';
                    return (
                      <label key={route} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px', background: isChecked ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isChecked ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '8px', cursor: isSuper ? 'not-allowed' : 'pointer',
                        opacity: isSuper ? 0.6 : 1, transition: 'all 0.2s'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuper}
                          onChange={() => handlePermissionToggle(route, false)}
                          style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: isSuper ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', color: isChecked ? 'white' : 'var(--text-secondary)' }}>{formatRouteName(route)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="premium-submit-btn"
              >
                <Plus size={18} /> Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', padding: '24px', borderRadius: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setIsEditUserModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Edit2 size={18} color="var(--primary-color)" /> Edit System User</h3>

            <form onSubmit={handleUpdateUser}>
              <div className="ac-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  className="ac-input"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="ac-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  className="ac-input"
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div className="ac-form-group">
                <label>System Role</label>
                <select
                  className="ac-input"
                  value={editingUser.role}
                  onChange={e => handleRoleChange(e.target.value as UserRole, true)}
                >
                  <option value="Super Admin">Super Admin (Full Access)</option>
                  <option value="Admin">Admin (Standard)</option>
                  <option value="Manager">Manager (Operations)</option>
                  <option value="Event Organizer">Event Organizer (Restricted)</option>
                  <option value="Scanner User">Scanner User (Mobile Only)</option>
                </select>
              </div>

              <div className="permissions-section" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--text-muted)" /> Specific Route Permissions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {ALL_ADMIN_ROUTES.map((route: PermissionRoute) => {
                    const isChecked = editingUser.permissions?.includes(route);
                    const isSuper = editingUser.role === 'Super Admin';
                    return (
                      <label key={route} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px', background: isChecked ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isChecked ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '8px', cursor: isSuper ? 'not-allowed' : 'pointer',
                        opacity: isSuper ? 0.6 : 1, transition: 'all 0.2s'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuper}
                          onChange={() => handlePermissionToggle(route, true)}
                          style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: isSuper ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', color: isChecked ? 'white' : 'var(--text-secondary)' }}>{formatRouteName(route)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="premium-submit-btn"
              >
                <Edit2 size={18} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Scanner Modal */}
      {isAssignScannerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '24px', borderRadius: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setIsAssignScannerModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><ScanLine size={18} color="#2dd4bf" /> Assign Event Scanner</h3>

            <form onSubmit={handleAssignScanner}>
              <div className="ac-form-group">
                <label>Select Scanner User</label>
                <select
                  required
                  className="ac-input"
                  value={newAssignment.scannerId}
                  onChange={e => setNewAssignment({ ...newAssignment, scannerId: e.target.value })}
                >
                  <option value="" disabled>Choose a Scanner User...</option>
                  {users.filter(u => u.role === 'Scanner User' && u.status === 'Active').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                {users.filter(u => u.role === 'Scanner User' && u.status === 'Active').length === 0 && (
                  <p style={{ color: '#f59e0b', fontSize: '12px', marginTop: '8px' }}>No active users with the "Scanner User" role found. Please create one first via User Management.</p>
                )}
              </div>
              <div className="ac-form-group">
                <label>Event Name or ID</label>
                <input
                  type="text"
                  required
                  className="ac-input"
                  placeholder="e.g. Summer Music Fest 2026"
                  value={newAssignment.eventTitle}
                  onChange={e => setNewAssignment({ ...newAssignment, eventTitle: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="premium-submit-btn teal"
              >
                <ScanLine size={18} /> Grant Scanner Access
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminControl;
