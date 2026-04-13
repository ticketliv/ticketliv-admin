import { useState, useEffect } from 'react';
import {
  Plus, X, Save, Edit2, Trash2, Search, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';
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
    name: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const filteredCategories = categories.filter(cat => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;

    // 1. Direct Category Match
    if (cat.name.toLowerCase().includes(q)) return true;

    // 2. Mapped Event Match  
    const mappedEvents = events.filter(e => e.categoryIds?.includes(cat.id));
    return mappedEvents.some(evt =>
      evt.title.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      status: cat.status
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
    <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Event Categories</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Organize your events into collections that make it easy for users to find what they are looking for.</p>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
        {filteredCategories.map(cat => {
          const isDeleting = deleteConfirmId === cat.id;
          return (
            <div
              key={cat.id}
              className="glass-panel hover-card"
              style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                borderColor: isDeleting ? 'rgba(244,63,94,0.3)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cat.status === 'Active' ? '#10b981' : '#6b7280', flexShrink: 0 }} />
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize' }}>{cat.name}</h3>
              </div>

              {isDeleting ? (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                      padding: '5px 12px', color: 'white', fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmDelete(cat.id)}
                    style={{
                      background: '#f43f5e', border: 'none', borderRadius: '8px',
                      padding: '5px 12px', color: 'white', fontSize: '11px', fontWeight: 700,
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(244,63,94,0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
                      width: '30px', height: '30px', color: 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    style={{
                      background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: '8px',
                      width: '30px', height: '30px', color: '#f43f5e',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All Categories Overview */}
      <div style={{
        marginTop: '40px',
        padding: '24px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>All Categories</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>A quick view of all group sections available on the TicketLiv mobile application home screen.</p>
            </div>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '14px', textTransform: 'uppercase' }}>
              Mobile App Sections
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '8px'
          }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                className="hover-scale"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.05)',
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
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Creation / Edit Modal Overlay */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 1000, animation: 'fadeIn 0.3s ease forwards',
            padding: '20px',
            paddingTop: '4vh'
          }}
        >
          <div
            className="glass-panel"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.3s ease-out'
            }}
          >

            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'rgba(255,255,255,0.05)', border: 'none',
                borderRadius: '50%', width: '30px', height: '30px',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.color = 'white'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: 'white' }}>
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Create or update category names to improve event discovery on the mobile platform.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sports"
                  autoFocus
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', color: 'white', fontSize: '14px', textTransform: 'capitalize' }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="hover-scale"
              style={{
                width: '100%', padding: '13px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
                color: 'white', border: 'none', fontWeight: 700, fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                cursor: 'pointer', boxShadow: '0 8px 20px var(--glow-primary)', marginTop: '4px'
              }}
            >
              <Save size={16} /> {editingId ? 'Save Changes' : 'Create Category'}
            </button>

          </div>
        </div>
      )}



      {/* Category Distribution & Status Section */}
      <div style={{ marginTop: '36px', animation: 'fadeInUp 0.8s ease forwards' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Plus size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Events Under Each Category</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 2.5fr 0.8fr', padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Qty</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Event Names</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Status</span>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {(() => {
              // Only show categories that have events
              const activeCategories = categories.filter(cat => {
                const categoryEvents = events.filter(e =>
                  e.category_id === cat.id || (e.categoryIds && e.categoryIds.includes(cat.id))
                );
                return categoryEvents.length > 0;
              });

              if (activeCategories.length === 0) {
                return (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <AlertTriangle size={26} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>No active assignments found. Categories only appear here once events are mapped to them.</p>
                  </div>
                );
              }

              return activeCategories.map(cat => {
                const categoryEvents = events.filter(e =>
                  e.category_id === cat.id || (e.categoryIds && e.categoryIds.includes(cat.id))
                );

                return (
                  <div
                    key={cat.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.5fr 2.5fr 0.8fr',
                      padding: '10px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      alignItems: 'start',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--glow-primary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{cat.name}</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '5px' }}>
                        {categoryEvents.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {categoryEvents.map((evt, idx) => (
                        <span key={idx} style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {evt.title}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      {categoryEvents.map((evt, idx) => {
                        const status = evt.status || 'Live';
                        const isCancelled = status === 'Cancelled';
                        const isCompleted = status === 'Completed';
                        return (
                          <span
                            key={idx}
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: isCancelled ? '#f43f5e' : (isCompleted ? '#3b82f6' : '#10b981'),
                              background: isCancelled ? 'rgba(244, 63, 94, 0.1)' : (isCompleted ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                              padding: '1px 7px',
                              borderRadius: '100px',
                              textTransform: 'uppercase',
                              border: `1px solid ${isCancelled ? 'rgba(244, 63, 94, 0.2)' : (isCompleted ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)')}`,
                              letterSpacing: '0.04em'
                            }}
                          >
                            {status}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {categories.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No category data available to display statistics.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Categories;
