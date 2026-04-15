import { useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Video, Link as LinkIcon, Save, CheckCircle, Eye, MousePointerClick, Trash2 } from 'lucide-react';
import api from '../services/api';
import { CONFIG } from '../config/constants';
import { getMediaUrl } from '../utils/imageUtils';
import './Ads.css';

interface AdData {
  type: 'image' | 'video';
  fileUrl: string | null;
  link: string;
}

const Ads = () => {
  const [adData, setAdData] = useState<AdData>({
    type: 'image',
    fileUrl: null,
    link: ''
  });
  const [isHovering, setIsHovering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [adsList, setAdsList] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({
    isOpen: false,
    id: '',
    title: ''
  });

  const [fileObject, setFileObject] = useState<File | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await api.get('/ads') as any;
      if (res.success) {
        setAdsList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch ads', err);
    }
  };

  // Simulate picking a file locally for preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileObject(file);
      const url = URL.createObjectURL(file);
      setAdData({ ...adData, fileUrl: url });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileObject(file);
      const url = URL.createObjectURL(file);
      setAdData({ ...adData, fileUrl: url });
    }
  };

  const handleSave = async () => {
    if (!fileObject && !adData.fileUrl) return;
    setIsSaving(true);
    
    try {
      let uploadedUrl = adData.fileUrl;

      // 1. Upload file to our media folder
      if (fileObject) {
        const formData = new FormData();
        formData.append('file', fileObject);
        
        const uploadRes = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }) as any;
        
        if (uploadRes?.success && uploadRes.data?.url) {
          uploadedUrl = uploadRes.data.url;
        } else {
          throw new Error('File upload failed.');
        }
      }

      // 2. Publish ad record to database
      await api.post('/ads', {
        title: `Mobile App ${adData.type === 'video' ? 'Video' : 'Banner'} Ad`,
        type: adData.type === 'video' ? 'video' : 'banner',
        media_url: adData.type === 'image' ? uploadedUrl : null,
        video_url: adData.type === 'video' ? uploadedUrl : null,
        target_url: adData.link || 'https://ticketliv.com',
        placement: 'home',
        status: 'Active'
      });

      setSaveSuccess(true);
      fetchAds();
      setAdData({ type: 'image', fileUrl: null, link: '' });
      setFileObject(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save ad', err);
      alert('Error saving ad banner to live app.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      id,
      title
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.id) return;
    const id = confirmModal.id;
    
    // Save previous state for rollback
    const previousAds = [...adsList];
    
    // Optimistic Update: Remove from UI immediately
    setAdsList(prev => prev.filter(ad => String(ad.id) !== String(id)));
    setConfirmModal({ ...confirmModal, isOpen: false });
    
    try {
      console.log(`[Ads] Attempting to delete ad: ${id}`);
      await api.delete(`/ads/${id}`);
      console.log(`[Ads] Successfully deleted ad: ${id}`);
    } catch (err) {
      console.error('Failed to delete ad', err);
      // Rollback on failure
      setAdsList(previousAds);
      alert('Failed to delete ad. Please try again.');
    }
  };

  return (
    <div className="ads-container">
      <div className="ads-header">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Home Page Ads Manager</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Control the promotional banner or video shown on the TicketLiv mobile app home screen.</p>
        </div>
        <button 
          className={`btn-save ${saveSuccess ? 'success' : ''}`} 
          onClick={handleSave}
          disabled={isSaving || !adData.fileUrl}
        >
          {isSaving ? 'Saving...' : saveSuccess ? <><CheckCircle size={18} /> Saved successfully</> : <><Save size={18} /> Publish to Live App</>}
        </button>
      </div>

      <div className="ads-content-grid">
        {/* Editor Form */}
        <div className="ads-editor glass-panel">
          <h3 className="section-title">Ad Configuration</h3>
          
          <div className="form-group">
            <label>1. Select Media Type</label>
            <div className="type-selector">
              <button 
                className={`type-btn ${adData.type === 'image' ? 'active' : ''}`}
                onClick={() => setAdData({ ...adData, type: 'image', fileUrl: null })}
              >
                <ImageIcon size={20} /> Image Ad (Banner)
              </button>
              <button 
                className={`type-btn ${adData.type === 'video' ? 'active' : ''}`}
                onClick={() => setAdData({ ...adData, type: 'video', fileUrl: null })}
              >
                <Video size={20} /> Video Ad (Reel/Promo)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>2. Upload {adData.type === 'image' ? 'Image' : 'Video'}</label>
            <div 
              className={`upload-zone ${isHovering ? 'hover' : ''} ${adData.fileUrl ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="file-upload" 
                className="hidden-input" 
                accept={adData.type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon-container">
                  <UploadCloud size={32} className="text-muted" />
                </div>
                {adData.fileUrl ? (
                  <p className="upload-text success-text">File successfully loaded. Click or drag to replace.</p>
                ) : (
                  <>
                    <p className="upload-text"><span className="text-primary">Click to upload</span> or drag and drop</p>
                    <p className="upload-hint">
                      {adData.type === 'image' ? 'PNG, JPG, WEBP up to 5MB (Recommend 1200x600px)' : 'MP4, WebM up to 50MB (Recommend 9:16 vertical or 16:9)'}
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>3. Ad Description Page Link (Action URL)</label>
            <p className="field-desc">Where should users be redirected when they tap the ad?</p>
            <div className="input-with-icon">
              <LinkIcon size={18} className="input-icon" />
              <input 
                type="url" 
                placeholder="https://ticketliv.com/promo/summer-fest" 
                value={adData.link}
                onChange={(e) => setAdData({ ...adData, link: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="ads-preview glass-panel">
          <div className="preview-header">
            <h3 className="section-title">Mobile App Preview</h3>
            <span className="live-badge">Live View Simulation</span>
          </div>
          
          <div className="mobile-mockup">
            <div className="mockup-notch"></div>
            <div className="mockup-screen">
              {/* Fake Mobile App UI Header */}
              <div className="mockup-app-header">
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>TicketLiv Home</h4>
                  <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>Find your next experience</p>
                </div>
                <div className="mockup-avatar"></div>
              </div>

              {/* The AD Component */}
              <div className="mockup-ad-container">
                {adData.fileUrl ? (
                    adData.type === 'image' ? (
                      <img src={getMediaUrl(adData.fileUrl)} alt="Ad Preview" className="preview-media image" />
                    ) : (
                      <video src={getMediaUrl(adData.fileUrl)} className="preview-media video" autoPlay loop muted playsInline />
                    )
                ) : (
                  <div className="empty-preview">
                    <ImageIcon size={32} className="text-muted" style={{ marginBottom: '8px' }} />
                    <p>Ad will appear here</p>
                  </div>
                )}
                
                {/* Ad Overlay Text/Badge */}
                <div className="ad-overlay">
                  <span className="sponsored-badge">Sponsored</span>
                  {adData.link && (
                    <button className="ad-action-btn">Learn More</button>
                  )}
                </div>
              </div>

              {/* Fake Content Below Ad */}
              <div className="mockup-content">
                <div className="mockup-card"></div>
                <div className="mockup-card"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ads List Table */}
      <div className="ads-list-section glass-panel">
        <div className="preview-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="section-title" style={{ padding: 0, border: 'none' }}>Active & Past Campaigns</h3>
        </div>
        <table className="ads-table">
          <thead>
            <tr>
              <th>Campaign Details</th>
              <th>Status</th>
              <th>Performance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adsList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No campaigns running yet.</td>
              </tr>
            ) : (
              adsList.map(ad => (
                <tr key={ad.id}>
                  <td>
                    <div className="ad-info">
                      {ad.type === 'video' || ad.video_url ? (
                        <video src={getMediaUrl(ad.video_url || ad.media_url)} className="ad-thumb" muted />
                      ) : (
                        <img src={getMediaUrl(ad.media_url)} className="ad-thumb" alt="Thumbnail" />
                      )}
                      <div>
                        <div className="ad-title">{ad.title}</div>
                        <div className="ad-target">{ad.target_url}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`live-badge`} style={{ background: ad.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.1)', color: ad.status === 'Active' ? '#10b981' : '#fff' }}>
                      {ad.status}
                    </span>
                  </td>
                  <td>
                    <div className="ad-stats">
                      <div className="stat-item" title="Impressions (Views)">
                        <Eye size={16} /> <span>{ad.impressions || 0}</span>
                      </div>
                      <div className="stat-item" title="Clicks">
                        <MousePointerClick size={16} /> <span>{ad.clicks || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button className="btn-delete-ad" onClick={() => handleDelete(ad.id, ad.title)} title="Delete Campaign">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal glass-panel">
            <div className="confirm-modal-icon">
              <Trash2 size={32} />
            </div>
            <h3>Delete Campaign?</h3>
            <p>Are you sure you want to delete "<strong>{confirmModal.title}</strong>"? This will immediately remove it from the mobile app home screen.</p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancel</button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>Delete Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ads;
