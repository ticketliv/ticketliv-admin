import { useState, useEffect } from 'react';
import {
  Plus, X, Save, Edit2, Trash2, Search, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import './Categories.css';
import type { Category } from '../context/AppContext';

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, events, refreshEvents } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // 0. Auto-refresh data on mount
  useEffect(() => {
    refreshEvents?.();
  }, [refreshEvents]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: ''
  });

  const filteredCategories = categories.filter(cat => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;

    // 1. Direct Category Match
    if (cat.name.toLowerCase().includes(q)) return true;

    // 2. Mapped Event Match  
    const currentCatId = String(cat.id || '');
    const mappedEvents = events.filter(e => {
        const eCatId = String(e.category_id || '');
        const inArray = e.categoryIds?.map(String).includes(currentCatId);
        return eCatId === currentCatId || inArray;
    });
    return mappedEvents.some(evt =>
      evt.title?.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number | string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: number | string) => {
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully!');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error('Failed to delete category.');
    }
  };


  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    // Duplicate check (case-insensitive, exclude self when editing)
    const isDuplicate = categories.some(cat =>
      cat.name.toLowerCase() === formData.name.trim().toLowerCase() && cat.id !== editingId
    );
    if (isDuplicate) {
      toast.error(`"${formData.name.trim()}" already exists.`);
      return;
    }

    try {
      if (editingId) {
        // Update
        await updateCategory(editingId, formData);
        toast.success("Category updated successfully!");
      } else {
        // Create
        await addCategory(formData);
        toast.success("Category created successfully!");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || err.response?.data?.message || err.toString() || "Failed to save category");
    }
  };

  return (
    <>
      <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>

        {/* Header & Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
               <AlertTriangle size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Event Categories</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Organize your events into collections that make it easy for users to find what they are looking for.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '7px 14px',
              width: '240px',
              transition: 'border-color 0.2s',
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search categories & events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '13px',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>
            <button
              className="icon-btn hover-scale"
              onClick={handleOpenCreate}
              style={{ width: 'auto', padding: '0 16px', borderRadius: '10px', gap: '6px', background: 'var(--accent-primary)', color: 'white', border: 'none', boxShadow: '0 4px 16px var(--glow-primary)', fontSize: '13px' }}
            >
              <Plus size={16} /> New Category
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="categories-grid">
          {filteredCategories.map(cat => {
            const isDeleting = deleteConfirmId === cat.id;
            return (
              <div
                key={cat.id}
                className="category-card"
                style={{ 
                  borderColor: isDeleting ? 'rgba(244,63,94,0.4)' : 'rgba(255,255,255,0.06)' 
                }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px' }}>
                   <div style={{ 
                     fontSize: '10px', 
                     fontWeight: 800, 
                     textTransform: 'uppercase', 
                     letterSpacing: '0.05em',
                     padding: '4px 8px',
                     borderRadius: '6px',
                     background: cat.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                     color: cat.status === 'Active' ? '#10b981' : '#9ca3af',
                     border: `1px solid ${cat.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`
                   }}>
                     {cat.status}
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="category-icon-box">
                    <Search size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>{cat.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {events.filter(e => {
                          const eCatId = String(e.category_id || '');
                          const currentCatId = String(cat.id || '');
                          const inArray = e.categoryIds?.map(String).includes(currentCatId);
                          return eCatId === currentCatId || inArray;
                      }).length} Active Events
                    </p>
                  </div>
                </div>

                {isDeleting ? (
                  <div className="inline-confirm">
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f43f5e', marginRight: '10px' }}>Sure?</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="inline-btn-yes" onClick={() => confirmDelete(cat.id)}>Yes</button>
                      <button className="inline-btn-no" onClick={() => setDeleteConfirmId(null)}>No</button>
                    </div>
                  </div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          padding: '8px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        style={{
                          flex: 1,
                          background: 'rgba(244, 63, 94, 0.08)',
                          border: '1px solid rgba(244, 63, 94, 0.15)',
                          borderRadius: '10px',
                          padding: '8px',
                          color: '#f43f5e',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                )}
              </div>
            );
          })}
        </div>

        {/* All Categories Overview */}
        <div style={{
          padding: '24px',
          background: 'rgba(255,255,255,0.01)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background glow */}
          <div style={{ position: 'absolute', top: '-10% ', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '-10% ', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.04) 0%, transparent 70%)', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>All Categories</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>A quick view of all group sections available on the TicketLiv mobile application home screen.</p>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '14px', textTransform: 'uppercase' }}>
                Mobile App Sections
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="hover-scale"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '10px 18px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'default',
                    textAlign: 'center'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                     {cat.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '36px', animation: 'fadeInUp 0.8s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '12px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <Search size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>Events Under Each Category</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0' }}>Detailed mapping of events assigned to specific app sections.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {(() => {
              const activeCategories = categories.filter(cat => {
                const categoryEvents = events.filter(e => {
                  const eCatId = String(e.category_id || '');
                  const currentCatId = String(cat.id || '');
                  const inArray = e.categoryIds?.map(String).includes(currentCatId);
                  return eCatId === currentCatId || inArray;
                });
                return categoryEvents.length > 0;
              });

              if (activeCategories.length === 0) {
                return (
                  <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', gridColumn: '1 / -1' }}>
                    <AlertTriangle size={32} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600 }}>No active category mappings found.</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Events must be assigned to categories in the Event Creation portal.</p>
                  </div>
                );
              }

              return activeCategories.map(cat => {
                const categoryEvents = events.filter(e => {
                  const eCatId = String(e.category_id || '');
                  const currentCatId = String(cat.id || '');
                  const inArray = e.categoryIds?.map(String).includes(currentCatId);
                  return eCatId === currentCatId || inArray;
                }).sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());

                const totalRevenue = categoryEvents.reduce((acc, e) => acc + (e.revenue || 0), 0);
                const totalSales = categoryEvents.reduce((acc, e) => acc + (e.sales || 0), 0);

                return (
                  <div key={cat.id} className="glass-panel hover-scale" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 800, boxShadow: '0 8px 16px var(--glow-primary)' }}>
                          {cat.name ? cat.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0 }}>{cat.name}</h4>
                          <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>{categoryEvents.length} Matched Events</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-primary)' }}>₹{totalRevenue.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>Total Category Revenue</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div>
                         <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Sold Tickets</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{totalSales.toLocaleString()}</div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Avg Growth</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>+12.4%</div>
                       </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Event Activity</div>
                      {categoryEvents.slice(0, 3).map((evt, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{evt.title}</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)', textTransform: 'uppercase' }}>{evt.status || 'Live'}</span>
                        </div>
                      ))}
                      {categoryEvents.length > 3 && (
                        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                          Viewing 3 of {categoryEvents.length} events
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Creation / Edit Modal Overlay - OUTSIDE dashboard-content to prevent stacking context constraints */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', top: '24px', right: '24px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', width: '36px', height: '36px',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <X size={20} />
            </button>

            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'white' }}>
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                Configure categorical discovery rules for the live app.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sports"
                  autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px', borderRadius: '12px', color: 'white', fontSize: '15px' }}
                />
              </div>

              <button
                onClick={handleSave}
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
                  color: 'white', border: 'none', fontWeight: 800, fontSize: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  cursor: 'pointer', boxShadow: '0 8px 30px var(--glow-primary)', marginTop: '10px'
                }}
              >
                <Save size={18} /> {editingId ? 'Save Changes' : 'Publish Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

};

export default Categories;
