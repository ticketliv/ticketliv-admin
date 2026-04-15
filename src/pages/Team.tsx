import { useState } from 'react';
import { useApp, type AdminUser, type PermissionRoute, ALL_ADMIN_ROUTES, DEFAULT_ROLE_PERMISSIONS } from '../context/AppContext';
import { Plus, Search, Edit3, Trash2, X, Shield, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import './Team.css';

const Team = () => {
  const { adminUsers, currentAdminUser, addAdminUser, updateAdminUser, deleteAdminUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<{ id: string, name: string, role: string } | null>(null);
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<AdminUser>>({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    permissions: DEFAULT_ROLE_PERMISSIONS['Admin']
  });

  const filteredUsers = adminUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        permissions: [...user.permissions]
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Admin',
        permissions: [...DEFAULT_ROLE_PERMISSIONS['Admin']]
      });
    }
    setShowPassword(false); // Reset visibility when opening modal
    setIsModalOpen(true);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as AdminUser['role'];
    setFormData(prev => ({
      ...prev,
      role: newRole,
      // Auto-assign default permissions for the new role, unless we're preserving custom tweaks
      permissions: [...DEFAULT_ROLE_PERMISSIONS[newRole]]
    }));
  };

  const handlePermissionToggle = (route: PermissionRoute) => {
    setFormData(prev => {
      const perms = prev.permissions || [];
      if (perms.includes(route)) {
        return { ...prev, permissions: perms.filter(p => p !== route) };
      } else {
        return { ...prev, permissions: [...perms, route] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Cannot downgrade or change permissions of Superadmin if it's the only one, but omitting complex validation for mock
      updateAdminUser(editingUser.id, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        permissions: formData.permissions
      });
    } else {
      addAdminUser({
        id: `ADM-${Date.now()}`,
        name: formData.name as string,
        email: formData.email as string,
        password: formData.password as string,
        role: formData.role as AdminUser['role'],
        permissions: formData.permissions as PermissionRoute[],
        status: 'Active'
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string, name: string, role: string) => {
    if (role === 'Superadmin') {
      alert("Cannot delete a Superadmin from this interface.");
      return;
    }
    if (id === currentAdminUser?.id) {
       alert("You cannot delete your own account.");
       return;
    }
    setUserToDelete({ id, name, role });
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteAdminUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'Super Admin':
      case 'Superadmin': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'Admin': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'Manager': return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' };
      case 'Event Organizer': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      case 'Scanner User': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', color: '#9ca3af' };
    }
  };

  // Helper to make route names readable
  const formatRouteName = (route: string) => {
    return route.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="team-container">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
             <Shield size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Team & Access Control</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Manage admin users, roles, and granular page permissions.</p>
          </div>
        </div>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Admin User
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div className="search-input-container" style={{ flex: 1, position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '13px' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 16px' }}>User</th>
                <th style={{ padding: '10px 16px' }}>Role</th>
                <th style={{ padding: '10px 16px' }}>Access Scope</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar-sm" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', color: 'white' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>
                          {user.name} 
                          {user.id === currentAdminUser?.id && <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>YOU</span>}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: 600,
                      background: getRoleBadgeColor(user.role).bg, color: getRoleBadgeColor(user.role).color
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {user.permissions.length === ALL_ADMIN_ROUTES.length ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>Full Access (All Modules)</span>
                      ) : (
                        user.permissions.slice(0, 3).map(p => (
                          <span key={p} style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {formatRouteName(p)}
                          </span>
                        ))
                      )}
                      {user.permissions.length > 3 && user.permissions.length !== ALL_ADMIN_ROUTES.length && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px 4px' }}>+{user.permissions.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div className="row-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="icon-btn" title="Edit User" onClick={() => handleOpenModal(user)} style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-btn delete-icon" title="Delete User" onClick={() => handleDeleteClick(user.id, user.name, user.role)} style={{ background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                     <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                     <p>No admin users found.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ animation: 'fadeInScale 0.3s ease', maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} className="text-primary" />
                {editingUser ? 'Edit Admin User' : 'Add New Admin User'}
              </h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }} 
                    placeholder="e.g. Jane Doe" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    disabled={!!editingUser}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white', opacity: editingUser ? 0.5 : 1 }} 
                    placeholder="name@company.com" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Account Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 40px 12px 12px', borderRadius: '8px', color: 'white' }} 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Role Profile</label>
                  <select 
                    value={formData.role} 
                    onChange={handleRoleChange}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                  >
                    <option value="Super Admin" style={{background: '#1a1a24'}}>Super Admin (Full Access)</option>
                    <option value="Admin" style={{background: '#1a1a24'}}>Admin (Standard)</option>
                    <option value="Manager" style={{background: '#1a1a24'}}>Manager (Operations)</option>
                    <option value="Event Organizer" style={{background: '#1a1a24'}}>Event Organizer (Restricted)</option>
                    <option value="Scanner User" style={{background: '#1a1a24'}}>Scanner User (Mobile Only)</option>
                  </select>
                </div>
              </div>

              <div className="permissions-section" style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--text-muted)" /> Specific Route Permissions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {ALL_ADMIN_ROUTES.map((route: PermissionRoute) => {
                    const isChecked = formData.permissions?.includes(route);
                    const isSuper = formData.role === 'Super Admin';
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
                          onChange={() => handlePermissionToggle(route)}
                          style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: isSuper ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: isChecked ? 'white' : 'var(--text-secondary)' }}>{formatRouteName(route)}</span>
                      </label>
                    );
                  })}
                </div>
                {formData.role === 'Super Admin' && (
                  <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>* Super Admins automatically inherit full access to all modules and routes.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="add-btn" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
                <button type="button" className="tab-btn" style={{ background: 'rgba(255,255,255,0.05)', padding: '14px 24px' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="glass-panel modal-content" style={{ animation: 'fadeInScale 0.3s ease', maxWidth: '400px', width: '90%', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle size={32} color="#f43f5e" />
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Delete Administrator?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to remove <strong style={{ color: 'white' }}>{userToDelete.name}</strong> from the team? This action cannot be undone and they will immediately lose access to the admin workspace.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setUserToDelete(null)} 
                className="tab-btn" 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="add-btn" 
                style={{ flex: 1, background: '#f43f5e', padding: '12px', justifyContent: 'center' }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
