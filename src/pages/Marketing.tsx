import { useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  Tag, 
  Activity, 
  Zap,
  X,
  PlusCircle,
  TrendingDown
} from 'lucide-react';
import { useApp, type Coupon, type Discount } from '../context/AppContext';
import './Marketing.css';

const Marketing = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, discounts, addDiscount, updateDiscount, deleteDiscount } = useApp();
  const [activeTab, setActiveTab] = useState<'coupons' | 'discounts'>('coupons');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | Discount | null>(null);

  // Filtered Lists
  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (item?: Coupon | Discount) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (item: Coupon | Discount) => {
    if (activeTab === 'coupons') {
      const c = item as Coupon;
      updateCoupon(c.id, { status: c.status === 'Active' ? 'Inactive' : 'Active' });
    } else {
      const d = item as Discount;
      updateDiscount(d.id, { status: d.status === 'Active' ? 'Inactive' : 'Active' });
    }
  };

  return (
    <>
      <div className="marketing-container">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
               <Activity size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>Marketing & Growth</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>Boost ticket sales with custom promo codes and automated discount rules.</p>
            </div>
          </div>
          <button className="add-btn" onClick={() => handleOpenModal()}>
            <Plus size={20} /> {activeTab === 'coupons' ? 'New Coupon' : 'New Discount Rule'}
          </button>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <Tag size={16} style={{ marginRight: '8px' }} /> Promo Codes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'discounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('discounts')}
          >
            <Zap size={16} style={{ marginRight: '8px' }} /> Automatic Discounts
          </button>
        </div>

        {/* Search & Utility Bar */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="search-input-container" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'coupons' ? 'promo codes' : 'discount rules'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '13px' }}
            />
          </div>
        </div>

        {activeTab === 'coupons' ? (
          <div className="marketing-grid">
            {filteredCoupons.map(coupon => (
              <div key={coupon.id} className={`glass-panel promo-card ${coupon.status.toLowerCase()}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="promo-code">{coupon.code}</div>
                    <span className={`discount-badge ${coupon.discountType === 'Percentage' ? 'percentage-badge' : 'fixed-badge'}`}>
                      {coupon.discountType === 'Percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontWeight: 700,
                      background: coupon.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      color: coupon.status === 'Active' ? '#10b981' : '#f43f5e'
                    }}>
                      {coupon.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="stats-row">
                  <div className="stat-item">
                    <span className="stat-label">Usage</span>
                    <span className="stat-value">{coupon.usedCount} / {coupon.usageLimit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Min. Spend</span>
                    <span className="stat-value">₹{coupon.minPurchase}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Expires</span>
                    <span className="stat-value" style={{ fontSize: '13px' }}>{coupon.expiryDate}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="action-btn" title={coupon.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(coupon)}>
                    <Activity size={18} />
                  </button>
                  <button className="action-btn" title="Edit" onClick={() => handleOpenModal(coupon)}>
                    <Edit3 size={18} />
                  </button>
                  <button className="action-btn delete-btn" title="Delete" onClick={() => deleteCoupon(coupon.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filteredCoupons.length === 0 && (
               <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Ticket size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                  <p>No promo codes found matching your search.</p>
               </div>
            )}
          </div>
        ) : (
          <div className="marketing-grid">
            {filteredDiscounts.map(discount => (
              <div key={discount.id} className={`glass-panel promo-card ${discount.status.toLowerCase()}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="promo-code" style={{ fontSize: '18px' }}>{discount.name}</div>
                    <span className={`discount-badge ${discount.discountType === 'Percentage' ? 'percentage-badge' : 'fixed-badge'}`}>
                      {discount.discountType === 'Percentage' ? `${discount.discountValue}% OFF` : `₹${discount.discountValue} FLAT`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontWeight: 700,
                      background: discount.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      color: discount.status === 'Active' ? '#10b981' : 'var(--text-secondary)'
                    }}>
                      {discount.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="stats-row">
                  <div className="stat-item" style={{ flex: 1 }}>
                    <span className="stat-label">Rule Type</span>
                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {discount.ruleType === 'EarlyBird' && <Clock size={14} className="text-cyan-400" />}
                      {discount.ruleType === 'Volume' && <TrendingDown size={14} className="text-pink-400" />}
                      {discount.ruleType === 'Bulk' && <PlusCircle size={14} className="text-yellow-400" />}
                      {discount.ruleType}
                    </span>
                  </div>
                  <div className="stat-item" style={{ flex: 1 }}>
                    <span className="stat-label">Condition</span>
                    <span className="stat-value">{discount.ruleValue} {discount.ruleType === 'EarlyBird' ? '' : '+ tickets'}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="action-btn" title={discount.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(discount)}>
                    <Activity size={18} />
                  </button>
                  <button className="action-btn" title="Edit" onClick={() => handleOpenModal(discount)}>
                    <Edit3 size={18} />
                  </button>
                  <button className="action-btn delete-btn" title="Delete" onClick={() => deleteDiscount(discount.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filteredDiscounts.length === 0 && (
               <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Zap size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                  <p>No automatic discount rules found matching your search.</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Professional Modal - OUTSIDE container */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editingItem ? 'Edit' : 'Create New'} {activeTab === 'coupons' ? 'Promo Code' : 'Discount Rule'}
              </h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="form-grid" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: Record<string, string> = {};
              formData.forEach((value, key) => { data[key] = value.toString(); });
              
              if (activeTab === 'coupons') {
                const coupon: Coupon = {
                  id: editingItem?.id || `C-${Date.now()}`,
                  code: data.code,
                  discountType: data.discountType as Coupon['discountType'],
                  discountValue: Number(data.discountValue),
                  minPurchase: Number(data.minPurchase),
                  expiryDate: data.expiryDate,
                  usageLimit: Number(data.usageLimit),
                  usedCount: editingItem ? (editingItem as Coupon).usedCount : 0,
                  status: editingItem ? (editingItem as Coupon).status : 'Active'
                };
                if (editingItem) {
                  updateCoupon(coupon.id, coupon);
                } else {
                  addCoupon(coupon);
                }
              } else {
                const discount: Discount = {
                  id: editingItem?.id || `D-${Date.now()}`,
                  name: data.name,
                  discountType: data.discountType as Discount['discountType'],
                  discountValue: Number(data.discountValue),
                  ruleType: data.ruleType as Discount['ruleType'],
                  ruleValue: data.ruleValue,
                  status: editingItem ? (editingItem as Discount).status : 'Active'
                };
                if (editingItem) {
                  updateDiscount(discount.id, discount);
                } else {
                  addDiscount(discount);
                }
              }
              setIsModalOpen(false);
            }}>

              {activeTab === 'coupons' ? (
                <>
                  <div className="form-group full-width">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Promo Code</label>
                    <input name="code" defaultValue={(editingItem as Coupon)?.code} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white', textTransform: 'uppercase' }} placeholder="e.g. SUMMER25" />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group full-width">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Rule Name</label>
                    <input name="name" defaultValue={(editingItem as Discount)?.name} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white', textTransform: 'uppercase' }} placeholder="e.g. EARLY BIRD SPECIAL" />
                  </div>
                </>
              )}

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Type</label>
                <select name="discountType" defaultValue={editingItem?.discountType || 'Percentage'} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }}>
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Value</label>
                <input name="discountValue" type="number" defaultValue={editingItem?.discountValue} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }} />
              </div>

              {activeTab === 'coupons' ? (
                <>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Min Purchase (₹)</label>
                    <input name="minPurchase" type="number" defaultValue={(editingItem as Coupon)?.minPurchase || 0} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Usage Limit</label>
                    <input name="usageLimit" type="number" defaultValue={(editingItem as Coupon)?.usageLimit || 100} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }} />
                  </div>
                  <div className="form-group full-width">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Expiry Date</label>
                    <input name="expiryDate" type="date" defaultValue={(editingItem as Coupon)?.expiryDate || '2026-12-31'} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Rule Type</label>
                    <select name="ruleType" defaultValue={(editingItem as Discount)?.ruleType || 'EarlyBird'} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }}>
                      <option value="EarlyBird">Early Bird</option>
                      <option value="Volume">Volume Discount</option>
                      <option value="Bulk">Bulk Bundle</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Condition Value</label>
                    <input name="ruleValue" defaultValue={(editingItem as Discount)?.ruleValue} placeholder="Date or Qty" required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' }} />
                  </div>
                </>
              )}

              <div className="full-width" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button type="submit" className="add-btn" style={{ flex: 1, justifyContent: 'center' }}>
                  {editingItem ? 'Update' : 'Create'} Rule
                </button>
                <button type="button" className="tab-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Marketing;
