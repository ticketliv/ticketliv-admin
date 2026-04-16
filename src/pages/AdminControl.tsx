import React, { useState } from 'react';
import { ShieldCheck, Users, CalendarClock, ScanLine, Activity, Search, CheckCircle, XCircle, Trash2, Plus, Edit2, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminControl.css';
import { ALL_ADMIN_ROUTES, DEFAULT_ROLE_PERMISSIONS, type PermissionRoute, useApp, type AdminUser } from '../context/AppContext';

// Type definitions based on our schema
type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Event Organizer' | 'Scanner User';

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

  const {
    adminUsers: users,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    currentAdminUser,
    pendingEvents: events,
    approveAdminEvent,
    rejectAdminEvent,
    scanners,
    assignAdminScanner,
    unassignAdminScanner
  } = useApp();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAssignScannerModalOpen, setIsAssignScannerModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Admin' as UserRole, permissions: [...DEFAULT_ROLE_PERMISSIONS['Admin']] as PermissionRoute[] });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newAssignment, setNewAssignment] = useState({ scannerId: '', eventId: '', eventTitle: '' });

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const handleApproveEvent = async (id: string) => {
    try {
      await approveAdminEvent(id);
      toast.success('Event approved and successfully published!');
    } catch (e) {
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (id: string) => {
    try {
      await rejectAdminEvent(id);
      toast.error('Event rejected back to organizer.');
    } catch (e) {
      toast.error('Failed to reject event');
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      await updateAdminUser(user.id, { status: newStatus });
      toast.success(`User ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const confirmHardDelete = async (id: string) => {
    if (!id) return;
    try {
      await deleteAdminUser(id);
      toast.success('User permanently deleted');
      setDeletingUserId(null);
    } catch (e) {
      toast.error('Failed to delete user');
    }
  };

  const handleUnassignScanner = async (assignmentId: string) => {
    try {
      await unassignAdminScanner(assignmentId);
      toast.success('Scanner assignment removed');
    } catch (e) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    const toastId = toast.loading('Creating user...');
    
    try {
      // Backend expects: name, email, password, role
      // permissions are assigned by backend based on role by default if not sent
      const adminData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        permissions: newUser.permissions // Also sending explicit permissions
      };

      await addAdminUser(adminData as AdminUser);
      
      toast.success(`${newUser.name} created successfully!`, { id: toastId });
      setIsAddUserModalOpen(false);
      
      // Reset form
      setNewUser({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'Admin', 
        permissions: [...DEFAULT_ROLE_PERMISSIONS['Admin']] 
      });
      
      // Add local audit log
      setLogs([{
        id: `log_${Date.now()}`, 
        user_name: currentAdminUser?.name || 'Admin', 
        action: 'CREATE_USER', 
        entity_type: 'User', 
        target_id: newUser.email, 
        created_at: new Date().toISOString()
      }, ...logs]);

    } catch (error: any) {
      console.error('Create User Error:', error);
      toast.error(error.response?.data?.message || 'Failed to create user', { id: toastId });
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

  const handleAssignScanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.scannerId || !newAssignment.eventTitle) {
      toast.error('Please select both scanner and event');
      return;
    }

    try {
      // Find event ID if typing title? For now let's assume eventTitle is ID or title
      // In a real system we'd have a dropdown for events too.
      // Let's assume the user enters the event ID or we find it.
      await assignAdminScanner(newAssignment.scannerId, newAssignment.eventId || newAssignment.eventTitle);

      setIsAssignScannerModalOpen(false);
      setNewAssignment({ scannerId: '', eventId: '', eventTitle: '' });
      toast.success('Scanner successfully assigned to event!');
    } catch (error) {
      toast.error('Failed to assign scanner');
    }
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Admin Control Center</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Centralized hub for role management, scanner assignments, and publishing workflows.</p>
          </div>
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
              <div style={{ display: 'flex', gap: '20px' }}>
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
                    <th style={{ textAlign: 'right', width: '220px' }}>Action</th>
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
                          {deletingUserId === user.id ? (
                            <div className="inline-confirm">
                               <span style={{ fontSize: '11px', fontWeight: 600, color: '#f43f5e', marginRight: '8px' }}>Sure?</span>
                               <div style={{ display: 'flex', gap: '4px' }}>
                                  <button className="inline-btn-yes" onClick={() => confirmHardDelete(user.id)}>Yes</button>
                                  <button className="inline-btn-no" onClick={() => setDeletingUserId(null)}>No</button>
                               </div>
                            </div>
                          ) : (
                            <>
                              <button className="ac-btn-icon" title="Edit" onClick={() => handleEditUserClick(user)}><Edit2 size={16} /></button>
    
                              {/* Status Toggle */}
                              <button
                                className={`ac-btn-icon ${user.status === 'Active' ? 'ac-btn-reject' : 'ac-btn-approve'}`}
                                onClick={() => handleToggleStatus(user)}
                                title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                disabled={user.id === currentAdminUser?.id}
                              >
                                {user.status === 'Active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              </button>
    
                              {/* Permanent Delete */}
                              <button
                                className="ac-btn-icon"
                                style={{ background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e' }}
                                onClick={() => setDeletingUserId(user.id)}
                                title="Delete Permanently"
                                disabled={user.id === currentAdminUser?.id}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
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
                        {scanner.assignments.map((asgn: any) => (
                          <div key={asgn.assignment_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '13px', color: 'white' }}>{asgn.title}</span>
                            <button
                              onClick={() => handleUnassignScanner(asgn.assignment_id)}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px', backdropFilter: 'blur(10px)', overflow: 'hidden' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '28px 32px', borderRadius: '24px', position: 'relative', background: 'rgba(23, 23, 33, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 30px 100px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
            <button
              onClick={() => setIsAddUserModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-primary)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <Users size={20} color="white" />
              </div>
              Create System User
            </h3>

            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
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
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    className="ac-input"
                    placeholder="john@ticketliv.com"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
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
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
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
              </div>

              <div className="permissions-section" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px 20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Lock size={14} /> Explicit Route Permissions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {ALL_ADMIN_ROUTES.map((route: PermissionRoute) => {
                    const isChecked = newUser.permissions?.includes(route);
                    const isSuper = newUser.role === 'Super Admin';
                    return (
                      <label key={route} className="hover-scale" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px', background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isChecked ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '12px', cursor: isSuper ? 'not-allowed' : 'pointer',
                        opacity: isSuper ? 0.6 : 1, transition: 'all 0.2s'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuper}
                          onChange={() => handlePermissionToggle(route, false)}
                          style={{ accentColor: '#818cf8', width: '16px', height: '16px', cursor: isSuper ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: isChecked ? 'white' : 'var(--text-secondary)' }}>{formatRouteName(route)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="premium-submit-btn hover-scale"
                style={{ height: '48px', borderRadius: '14px', fontSize: '15px' }}
              >
                <Plus size={18} /> Finalize & Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px', backdropFilter: 'blur(10px)', overflow: 'hidden' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '28px 32px', borderRadius: '24px', position: 'relative', background: 'rgba(23, 23, 33, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 30px 100px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
            <button
              onClick={() => setIsEditUserModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-primary)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <Edit2 size={20} color="white" />
              </div>
              Edit System User
            </h3>

            <form onSubmit={handleUpdateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    className="ac-input"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </div>
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    className="ac-input"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="ac-form-group" style={{ marginBottom: 0 }}>
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
              </div>

              <div className="permissions-section" style={{ background: 'rgba(255,255,255,0.01)', padding: '16px 20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Lock size={14} /> Explicit Route Permissions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {ALL_ADMIN_ROUTES.map((route: PermissionRoute) => {
                    const isChecked = editingUser.permissions?.includes(route);
                    const isSuper = editingUser.role === 'Super Admin';
                    return (
                      <label key={route} className="hover-scale" style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px', background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isChecked ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '12px', cursor: isSuper ? 'not-allowed' : 'pointer',
                        opacity: isSuper ? 0.6 : 1, transition: 'all 0.2s'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuper}
                          onChange={() => handlePermissionToggle(route, true)}
                          style={{ accentColor: '#818cf8', width: '16px', height: '16px', cursor: isSuper ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: isChecked ? 'white' : 'var(--text-secondary)' }}>{formatRouteName(route)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="premium-submit-btn hover-scale"
                style={{ height: '48px', borderRadius: '14px', fontSize: '15px' }}
              >
                <Save size={18} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Scanner Modal */}
      {isAssignScannerModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '15vh 20px', backdropFilter: 'blur(10px)', overflow: 'hidden' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', position: 'relative', background: 'rgba(23, 23, 33, 0.98)', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 30px 100px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
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
