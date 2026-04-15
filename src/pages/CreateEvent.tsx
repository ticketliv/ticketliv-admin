import React, { useState, useEffect } from 'react';
import { Save, MapPin, Calendar, Clock, Tag, Ticket, Plus, Trash2, Info, CheckSquare, XCircle, AlertTriangle, AlertCircle, Globe, Star, Play, Video, FileText, Sparkles, Camera, PieChart, Infinity as InfinityIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useApp, type AppEvent, type TicketCategory, type MediaItem } from '../context/AppContext';

const getSponsorIcon = (iconName: string) => {
  switch (iconName) {
    case 'brush': return <Camera size={18} />;
    case 'rocket': return <Sparkles size={18} />;
    case 'musical-notes': return <Plus size={18} />;
    case 'card': return <Ticket size={18} />;
    case 'people': return <Globe size={18} />;
    case 'diamond': return <Star size={18} />;
    case 'globe': return <Globe size={18} />;
    case 'phone-portrait': return <Plus size={18} />;
    default: return <Globe size={18} />;
  }
};

const getHighlightIcon = (iconName: string) => {
  switch (iconName) {
    case 'people-outline': return <Plus size={18} />;
    case 'time-outline': return <Clock size={18} />;
    case 'car-outline': return <Plus size={18} />;
    case 'ticket-outline': return <Ticket size={18} />;
    case 'navigate-outline': return <MapPin size={18} />;
    case 'shield-checkmark-outline': return <CheckSquare size={18} />;
    case 'flash-outline': return <Sparkles size={18} />;
    case 'flame-outline': return <Sparkles size={18} />;
    case 'clock-outline': return <Clock size={18} />;
    default: return <Star size={18} />;
  }
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const presetHighlightIcons = [
  { name: 'People/Limit', value: 'people-outline' },
  { name: 'Timing/Hours', value: 'time-outline' },
  { name: 'Parking/Vehicle', value: 'car-outline' },
  { name: 'Max Tickets', value: 'ticket-outline' },
  { name: 'Navigation', value: 'navigate-outline' },
  { name: 'Security/Shield', value: 'shield-checkmark-outline' },
  { name: 'Flash/Live', value: 'flash-outline' },
  { name: 'Flame/Hot', value: 'flame-outline' },
];

const presetSponsorIcons = [
  { name: 'Art', value: 'brush' },
  { name: 'Tech', value: 'rocket' },
  { name: 'Music', value: 'musical-notes' },
  { name: 'Finance', value: 'card' },
  { name: 'Community', value: 'people' },
  { name: 'Brand', value: 'diamond' },
  { name: 'Global', value: 'globe' },
  { name: 'Mobile', value: 'phone-portrait' },
];


const CreateEvent = () => {
  const { addEvent, updateEvent, events, categories, currentAdminUser } = useApp();
  const navigate = useNavigate();
  const locationState = useLocation();
  const queryParams = new URLSearchParams(locationState.search);
  const editId = queryParams.get('id');

  const [existingEvent, setExistingEvent] = useState<AppEvent | null>(null);

  // Event Basic Details
  const [title, setTitle] = useState('');
  const [presenterName, setPresenterName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [termsStr, setTermsStr] = useState('Standard Terms Apply');

  // Time Helpers
  const getTimeComponents = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return { hour: '12', minute: '00', period: 'PM' };
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    let hour = h % 12;
    if (hour === 0) hour = 12;
    return {
      hour: hour.toString(),
      minute: m.toString().padStart(2, '0'),
      period
    };
  };

  const updateTimeFromComponents = (h: string, m: string, p: string) => {
    let hour = parseInt(h);
    if (p === 'PM' && hour < 12) hour += 12;
    if (p === 'AM' && hour === 12) hour = 0;
    const timeStr = `${hour.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
    setTime(timeStr);
  };

  // Date Helpers
  const getDateComponents = (dateStr: string) => {
    let d = new Date();
    if (dateStr && dateStr.includes('-')) {
      const [y, m, day] = dateStr.split('-').map(Number);
      d = new Date(y, m - 1, day);
    }
    return {
      day: d.getDate().toString(),
      month: (d.getMonth() + 1).toString(),
      year: d.getFullYear().toString()
    };
  };

  const updateDateFromComponents = (d: string, m: string, y: string) => {
    const formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    setDate(formattedDate);
  };

  // Modern UI Styles
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px 16px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
    background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.6))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: React.ReactNode;
    status: string | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
    icon: null,
    status: null
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<(number | string)[]>([]);
  // Extra Info State
  const [extraInfo, setExtraInfo] = useState({
    specialInstructions: '',
    maxTicketsPerUser: 'unlimited',
  });

  const [highlights, setHighlights] = useState<{ label: string, value: string, icon: string }[]>([]);

  // Metadata state

  // Image Upload State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [layoutPreview, setLayoutPreview] = useState<string | null>(null);

  // New Multi-Media State
  const [mainMedia, setMainMedia] = useState<MediaItem[]>([]);
  const [layoutMedia, setLayoutMedia] = useState<MediaItem[]>([]);

  // Ticket Categories State
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([
    { id: 1, name: 'General Admission', price: 0, capacity: 100, sales: 0, max_limit: 10 }
  ]);

  // Gallery State
  const [gallery, setGallery] = useState<string[]>([]);

  // Sponsors State
  const [sponsors, setSponsors] = useState<{ name: string, tier: string, icon: string, color: string }[]>([]);
  const [galleryMetadata, setGalleryMetadata] = useState<{ name: string, size: number, id: string, file?: File }[]>([]);

  // Policies State
  const [prohibitedItems, setProhibitedItems] = useState<{ label: string, icon: string }[]>([]);
  const [refundPolicy, setRefundPolicy] = useState('Non-refundable unless event is cancelled.');
  const [entryPolicy, setEntryPolicy] = useState('Valid Govt ID required at entrance.');
  const [supportEmail, setSupportEmail] = useState('support@ticketliv.com');
  const [supportPhone, setSupportPhone] = useState('');
  const [gates, setGates] = useState<string[]>([]);
  const [gateInput, setGateInput] = useState('');

  // Field Config (Mandatory/Optional)
  const [fieldConfig, setFieldConfig] = useState<Record<string, 'Mandatory' | 'Optional'>>({
    gallery: 'Optional',
    sponsors: 'Optional',
    prohibited_items: 'Optional',
    refund_policy: 'Mandatory',
    entry_policy: 'Mandatory',
    support_contact: 'Mandatory',
    highlights: 'Optional',
    special_instructions: 'Optional',
    about_host: 'Optional',
    policies_trust: 'Optional',
    terms_conditions: 'Optional'
  });


  // Pricing Modifiers
  const [gstEnabled, setGstEnabled] = useState(false);
  const [cgstRate, setCgstRate] = useState<number>(9);
  const [sgstRate, setSgstRate] = useState<number>(9);
  const [convenienceFeeEnabled, setConvenienceFeeEnabled] = useState(false);
  const [convenienceFeeRate, setConvenienceFeeRate] = useState<number>(0);
  const [convenienceFeeType, setConvenienceFeeType] = useState<'fixed' | 'percentage'>('percentage');

  // Load existing event data if in edit mode
  useEffect(() => {
    const loadEvent = async () => {
      if (editId) {
        const eventToEdit = events.find(e => e.id === editId.toString());
        if (eventToEdit) {
          setExistingEvent(eventToEdit);
          setTitle(eventToEdit.title || '');
          setDate(eventToEdit.date || '');
          setTime(eventToEdit.time || '');
          setLocation(eventToEdit.location || '');
          setVenueAddress(eventToEdit.venue_address || '');
          setMapUrl(eventToEdit.map_url || '');
          setDescription(eventToEdit.description || '');
          setSelectedCategoryIds(eventToEdit.categoryIds ? eventToEdit.categoryIds : (eventToEdit.category_id ? [eventToEdit.category_id] : []));
          if (eventToEdit.terms) setTermsStr(eventToEdit.terms.join('\n'));

          if (eventToEdit.more_info) setHighlights(eventToEdit.more_info);
          if (eventToEdit.ticketCategories && eventToEdit.ticketCategories.length > 0) {
            setTicketCategories(eventToEdit.ticketCategories);
          }
          if (eventToEdit.financials) {
            setGstEnabled(eventToEdit.financials.gstEnabled || false);
            setCgstRate(eventToEdit.financials.cgstRate || 9);
            setSgstRate(eventToEdit.financials.sgstRate || 9);
            setConvenienceFeeEnabled(eventToEdit.financials.platformFeeEnabled || eventToEdit.financials.convenienceFeeEnabled || false);
            setConvenienceFeeRate(eventToEdit.financials.platformFeeRate || eventToEdit.financials.convenienceFeeRate || 0);
            setConvenienceFeeType(eventToEdit.financials.platformFeeType || eventToEdit.financials.convenienceFeeType || 'percentage');
          }
          // status fields removed
          setPresenterName(eventToEdit.presenter_name || '');
          setOrganizerName(eventToEdit.organizer_name || '');

          if (eventToEdit.extra_info) {
            setExtraInfo(prev => ({ ...prev, ...eventToEdit.extra_info }));
          }
          if (eventToEdit.layout_image) setLayoutPreview(eventToEdit.layout_image);
          if (eventToEdit.image_url) setImagePreview(eventToEdit.image_url);
          if (eventToEdit.video_url) setVideoPreview(eventToEdit.video_url);

          if (eventToEdit.mainMedia && eventToEdit.mainMedia.length > 0) {
            setMainMedia(eventToEdit.mainMedia);
          } else if (eventToEdit.image_url) {
            setMainMedia([{ url: eventToEdit.image_url, type: 'image' }]);
          }

          if (eventToEdit.layoutMedia && eventToEdit.layoutMedia.length > 0) {
            setLayoutMedia(eventToEdit.layoutMedia);
          } else if (eventToEdit.layout_image) {
            setLayoutMedia([{ url: eventToEdit.layout_image, type: 'image' }]);
          }

          if (eventToEdit.gates) setGates(eventToEdit.gates);
          if (eventToEdit.gallery) {
            setGallery(eventToEdit.gallery);
            const savedMetadata = eventToEdit.extra_info?.galleryMetadata;
            if (savedMetadata && Array.isArray(savedMetadata)) {
              setGalleryMetadata(savedMetadata);
            } else {
              setGalleryMetadata(eventToEdit.gallery.map(url => ({ name: url, size: 0, id: url })));
            }
          }
        }
      }
    };
    loadEvent();
  }, [editId, events]);



  // Load Draft on Mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!editId) {
        const savedDraft = localStorage.getItem('ticketliv_event_draft');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.title) setTimeout(() => setTitle(draft.title), 0);
            if (draft.presenterName) setTimeout(() => setPresenterName(draft.presenterName), 0);
            if (draft.organizerName) setTimeout(() => setOrganizerName(draft.organizerName), 0);
            if (draft.date) setTimeout(() => setDate(draft.date), 0);
            if (draft.time) setTime(draft.time);
            if (draft.location) setLocation(draft.location);
            if (draft.description) setDescription(draft.description);
            if (draft.venueAddress) setVenueAddress(draft.venueAddress);
            if (draft.mapUrl) setMapUrl(draft.mapUrl);
            if (draft.termsStr) setTermsStr(draft.termsStr);
            // status fields removed
            if (draft.selectedCategoryIds) setSelectedCategoryIds(draft.selectedCategoryIds);
            if (draft.extraInfo) setExtraInfo(draft.extraInfo);
            if (draft.highlights) setHighlights(draft.highlights);
            if (draft.ticketCategories) setTicketCategories(draft.ticketCategories);
            if (draft.gstEnabled !== undefined) setGstEnabled(draft.gstEnabled);
            if (draft.cgstRate) setCgstRate(draft.cgstRate);
            if (draft.sgstRate) setSgstRate(draft.sgstRate);
            if (draft.convenienceFeeEnabled !== undefined) setConvenienceFeeEnabled(draft.convenienceFeeEnabled);
            if (draft.convenienceFeeRate) setConvenienceFeeRate(draft.convenienceFeeRate);
            if (draft.convenienceFeeType) setConvenienceFeeType(draft.convenienceFeeType);
            if (draft.gates) setGates(draft.gates);
            if (draft.mainMedia) setMainMedia(draft.mainMedia);
            if (draft.layoutMedia) setLayoutMedia(draft.layoutMedia);
            if (draft.gallery) {
              setGallery(draft.gallery);
              setGalleryMetadata(draft.gallery.map((url: string) => ({ name: url, size: 0, id: url })));
            }
          } catch (e) {
            console.error("Failed to load draft", e);
          }
        }
      }
    };
    loadDraft();
  }, [editId]);

  // Auto-Save Logic
  useEffect(() => {
    // Only save if we are not in edit mode, and have at least a title
    if (!editId && title.trim() !== '') {
      const saveTimer = setTimeout(() => {
        const draftData = {
          title, presenterName, organizerName, date, time, location, description, venueAddress, mapUrl, termsStr,
          selectedCategoryIds, extraInfo, highlights,
          ticketCategories, gstEnabled, cgstRate, sgstRate, convenienceFeeEnabled, convenienceFeeRate, convenienceFeeType,
          video_url: videoPreview,
          image_url: imagePreview,
          mainMedia,
          layoutMedia,
          timestamp: Date.now()
        };
        localStorage.setItem('ticketliv_event_draft', JSON.stringify(draftData));
        // Draft saved to localStorage
      }, 2000); // 2 second delay for stability
      return () => clearTimeout(saveTimer);
    }
  }, [
    title, presenterName, organizerName, date, time, location, description, venueAddress, mapUrl, termsStr,
    selectedCategoryIds, extraInfo, highlights,
    ticketCategories, gstEnabled, cgstRate, sgstRate, convenienceFeeEnabled, convenienceFeeRate, convenienceFeeType,
    imagePreview, videoPreview, layoutPreview, mainMedia, layoutMedia, gallery, sponsors, prohibitedItems, refundPolicy, entryPolicy, supportEmail, supportPhone, fieldConfig, editId, gates
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local blob URL for preview
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local blob URL for preview
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleLayoutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLayoutPreview(url);
    }
  };

  const handleMediaAdd = (type: 'main' | 'layout', mediaType: 'image' | 'video', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newItem: MediaItem = { url, type: mediaType, file };
      if (type === 'main') {
        setMainMedia(prev => [...prev, newItem]);
        if (mediaType === 'image' && !imagePreview) setImagePreview(url);
        if (mediaType === 'video' && !videoPreview) setVideoPreview(url);
      } else {
        setLayoutMedia(prev => [...prev, newItem]);
        if (!layoutPreview) setLayoutPreview(url);
      }
    }
  };

  const removeMediaItem = (type: 'main' | 'layout', index: number) => {
    if (type === 'main') {
      setMainMedia(prev => prev.filter((_, i) => i !== index));
    } else {
      setLayoutMedia(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addTicketCategory = () => {
    setTicketCategories([
      ...ticketCategories,
      { id: Date.now(), name: '', price: 0, capacity: 100, sales: 0 }
    ]);
  };

  const removeTicketCategory = (id: number | string) => {
    if (ticketCategories.length > 1) {
      setTicketCategories(ticketCategories.filter(cat => cat.id !== id));
    }
  };

  const updateTicketCategory = (id: number | string, field: string, value: string | number) => {
    setTicketCategories(ticketCategories.map(cat =>
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };


  const addHighlight = () => {
    setHighlights([...highlights, { label: '', value: '', icon: 'information-circle-outline' }]);
  };

  const removeHighlight = (index: number) => {
    const newHighlights = [...highlights];
    newHighlights.splice(index, 1);
    setHighlights(newHighlights);
  };

  const updateHighlight = (index: number, field: string, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = { ...newHighlights[index], [field]: value };
    setHighlights(newHighlights);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const uniqueNewFiles: File[] = [];
      const duplicateNames: string[] = [];

      newFiles.forEach(file => {
        // Check if file is already in metadata (current session)
        const isDuplicate = galleryMetadata.some(m => m.name === file.name && m.size === file.size);
        if (!isDuplicate) {
          uniqueNewFiles.push(file);
        } else {
          duplicateNames.push(file.name);
        }
      });

      if (duplicateNames.length > 0) {
        toast.error(`Skipped ${duplicateNames.length} duplicate image${duplicateNames.length > 1 ? 's' : ''}`);
      }

      if (uniqueNewFiles.length > 0) {
        const newImages = uniqueNewFiles.map(file => URL.createObjectURL(file));
        const newMeta = uniqueNewFiles.map((file, i) => ({
          name: file.name,
          size: file.size,
          id: newImages[i],
          file: file
        }));

        setGallery([...gallery, ...newImages]);
        setGalleryMetadata([...galleryMetadata, ...newMeta]);
      }
    }
  };

  const removeGalleryItem = (index: number) => {
    const newGallery = [...gallery];
    newGallery.splice(index, 1);
    setGallery(newGallery);

    const newMeta = [...galleryMetadata];
    newMeta.splice(index, 1);
    setGalleryMetadata(newMeta);
  };

  const addSponsor = () => {
    setSponsors([...sponsors, { name: '', tier: '', icon: 'star', color: '#3b82f6' }]);
  };

  const removeSponsor = (index: number) => {
    const newSponsors = [...sponsors];
    newSponsors.splice(index, 1);
    setSponsors(newSponsors);
  };

  const updateSponsor = (index: number, field: string, value: string) => {
    const newSponsors = [...sponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    setSponsors(newSponsors);
  };

  const addProhibitedItem = () => {
    setProhibitedItems([...prohibitedItems, { label: '', icon: 'wine' }]);
  };

  const removeProhibitedItem = (index: number) => {
    const newItems = [...prohibitedItems];
    newItems.splice(index, 1);
    setProhibitedItems(newItems);
  };

  const updateProhibitedItem = (index: number, field: string, value: string) => {
    const newItems = [...prohibitedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setProhibitedItems(newItems);
  };

  const toggleFieldMandatory = (field: string) => {
    setFieldConfig(prev => ({
      ...prev,
      [field]: prev[field] === 'Mandatory' ? 'Optional' : 'Mandatory'
    }));
  };

  const addGate = () => {
    if (gateInput.trim()) {
      setGates([...gates, gateInput.trim()]);
      setGateInput('');
    }
  };

  const removeGate = (index: number) => {
    setGates(gates.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }) as any;
    if (res?.success && res.data?.url) {
      return res.data.url;
    }
    throw new Error('File upload failed');
  };


  const handleSubmit = async (status: 'Live' | 'Cancelled' | 'Sold Out' | 'Completed' | 'Draft') => {
    if (!title.trim()) {
      toast.error("Event Title is required!");
      return;
    }

    if (status !== 'Draft' && selectedCategoryIds.length === 0) {
      toast.error("At least one category is required for publishing!");
      return;
    }

    const canDirectPublish = currentAdminUser && ['Super Admin', 'Admin', 'Manager'].includes(currentAdminUser.role);
    const finalStatus = (status === 'Live' && !canDirectPublish) ? 'Pending Approval' : status;

    const toastId = toast.loading(status === 'Draft' ? "Saving draft..." : "Publishing event...");

    try {
      // 1. Upload Main Media files
      const finalMainMedia = await Promise.all(mainMedia.map(async (item) => {
        if (item.file) {
          const url = await uploadFile(item.file);
          return { ...item, url, file: undefined };
        }
        return item;
      }));

      // 2. Upload Layout Media files
      const finalLayoutMedia = await Promise.all(layoutMedia.map(async (item) => {
        if (item.file) {
          const url = await uploadFile(item.file);
          return { ...item, url, file: undefined };
        }
        return item;
      }));

      // 3. Upload Gallery files
      const finalGalleryUrls = await Promise.all(galleryMetadata.map(async (m) => {
        if (m.file) {
          return await uploadFile(m.file);
        }
        return m.id; // Existing URL
      }));

      // 4. Update Gallery Metadata with new URLs
      const finalGalleryMetadata = galleryMetadata.map((m, i) => ({
        name: m.name,
        size: m.size,
        id: finalGalleryUrls[i]
      }));

      const eventPayload = {
        title,
        date,
        time,
        event_date: date && time ? `${date}T${time}:00Z` : '',
        location,
        venue_address: venueAddress,
        map_url: mapUrl,
        description,
        extra_info: { ...extraInfo, galleryMetadata: finalGalleryMetadata },
        category_id: selectedCategoryIds[0],
        categoryIds: selectedCategoryIds,
        ticketCategories,
        price: ticketCategories.length > 0 ? Number(ticketCategories[0].price) : 0,
        image_url: finalMainMedia.find(m => m.type === 'image')?.url || '',
        video_url: finalMainMedia.find(m => m.type === 'video')?.url || '',
        presenter_name: presenterName,
        organizer_name: organizerName,
        more_info: highlights,
        layout_image: finalLayoutMedia[0]?.url || '',
        gallery: finalGalleryUrls,
        sponsors: sponsors,
        prohibited_items: prohibitedItems,
        refund_policy: refundPolicy,
        entry_policy: entryPolicy,
        support_email: supportEmail,
        support_phone: supportPhone,
        field_config: fieldConfig,
        financials: {
          gstEnabled,
          cgstRate,
          sgstRate,
          convenienceFeeEnabled,
          convenienceFeeRate,
          convenienceFeeType
        },
        gates: gates,
        mainMedia: finalMainMedia,
        layoutMedia: finalLayoutMedia,
        status: finalStatus,
        sales: 0,
        revenue: 0,
        revenueCurrency: 'INR'
      };

      if (editId) {
        await updateEvent(editId, eventPayload as Partial<AppEvent>);
        toast.success(status === 'Draft' ? "Draft Saved Successfully!" : `Event ${status === 'Cancelled' ? 'Cancelled' : 'Updated'} Successfully!`, { id: toastId });
      } else {
        await addEvent(eventPayload as unknown as AppEvent);
        // Clear local backup once saved to cloud/DB
        localStorage.removeItem('ticketliv_event_draft');

        let successMsg = "Event Published Successfully!";
        if (finalStatus === 'Pending Approval') {
          successMsg = "Event submitted for approval!";
        } else if (status === 'Draft') {
          successMsg = "Draft saved successfully!";
        }
        toast.success(successMsg, { id: toastId });
      }
      navigate('/events');
    } catch (err: any) {
      console.error('Submit Error:', err);
      toast.error(`Failed to save event: ${err.message || 'Check your connection.'}`, { id: toastId });
    }
  };

  return (
    <>
      <div className="dashboard-content" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>{editId ? 'Edit Event Details' : 'Add New Event'}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>{editId ? 'Refine your event details and manage its current status for your audience.' : 'Tell us about your event to get it listed on the TicketLiv mobile app.'}</p>
            </div>
          </div>
          <div />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 01 Basic Details */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>01</span>
                  <FileText size={20} color="#3b82f6" /> Primary Details
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Set the essential identity of your event, including the name, date, and core venue information.</p>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '10px', color: '#3b82f6', fontSize: '10px', fontWeight: 700 }}>MANDATORY</div>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Event Name</label>
              <div style={{ position: 'relative' }}>
                <Sparkles size={18} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, color: '#3b82f6' }} />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Neon Echoes: Sunset Sessions"
                  style={{ ...inputStyle, fontSize: '16px', fontWeight: 600, paddingRight: '50px', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label style={labelStyle}>Presenter Name</label>
                <div style={{ position: 'relative' }}>
                  <Star size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input type="text" value={presenterName} onChange={(e) => setPresenterName(e.target.value)} placeholder="e.g. TicketLiv Studios" style={{ ...inputStyle, paddingLeft: '44px' }} />
                </div>
              </div>
              <div className="form-group">
                <label style={labelStyle}>Organizer Name</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                  <input type="text" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} placeholder="e.g. Live Nation India" style={{ ...inputStyle, paddingLeft: '44px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '24px' }}>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label style={labelStyle}>Event Date</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }} />
                    <select
                      value={getDateComponents(date).day}
                      onChange={(e) => updateDateFromComponents(e.target.value, getDateComponents(date).month, getDateComponents(date).year)}
                      style={{ ...inputStyle, paddingLeft: '36px', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d} style={{ background: '#13141f' }}>{d.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ position: 'relative', flex: 1.8 }}>
                    <select
                      value={getDateComponents(date).month}
                      onChange={(e) => updateDateFromComponents(getDateComponents(date).day, e.target.value, getDateComponents(date).year)}
                      style={{ ...inputStyle, paddingLeft: '16px', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}
                    >
                      {monthNames.map((name: string, i: number) => (
                        <option key={name} value={i + 1} style={{ background: '#13141f' }}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ position: 'relative', flex: 1.2 }}>
                    <select
                      value={getDateComponents(date).year}
                      onChange={(e) => updateDateFromComponents(getDateComponents(date).day, getDateComponents(date).month, e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '16px', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                        <option key={y} value={y} style={{ background: '#13141f' }}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ minWidth: 0 }}>
                <label style={labelStyle}>Start Time</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Clock size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }} />
                    <select
                      value={getTimeComponents(time).hour}
                      onChange={(e) => updateTimeFromComponents(e.target.value, getTimeComponents(time).minute, getTimeComponents(time).period)}
                      style={{ ...inputStyle, paddingLeft: '36px', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h} style={{ background: '#13141f' }}>{h.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <select
                      value={getTimeComponents(time).minute}
                      onChange={(e) => updateTimeFromComponents(getTimeComponents(time).hour, e.target.value, getTimeComponents(time).period)}
                      style={{ ...inputStyle, paddingLeft: '16px', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}
                    >
                      {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                        <option key={m} value={m} style={{ background: '#13141f' }}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', height: '51px' }}>
                    {['AM', 'PM'].map(p => (
                      <button type="button" key={p} onClick={() => updateTimeFromComponents(getTimeComponents(time).hour, getTimeComponents(time).minute, p)} style={{ padding: '0 12px', border: 'none', background: getTimeComponents(time).period === p ? '#3b82f6' : 'transparent', color: getTimeComponents(time).period === p ? 'white' : 'var(--text-muted)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ minWidth: 0 }}>
                <label style={labelStyle}>Max Tickets Per Person</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Ticket size={15} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)', zIndex: 1, pointerEvents: 'none' }} />
                    <input type="number" value={extraInfo.maxTicketsPerUser === 'unlimited' ? '' : extraInfo.maxTicketsPerUser} onChange={(e) => setExtraInfo({ ...extraInfo, maxTicketsPerUser: e.target.value || 'unlimited' })} disabled={extraInfo.maxTicketsPerUser === 'unlimited'} placeholder={extraInfo.maxTicketsPerUser === 'unlimited' ? '∞' : 'Qty'} style={{ ...inputStyle, paddingLeft: '40px', cursor: extraInfo.maxTicketsPerUser === 'unlimited' ? 'not-allowed' : 'text' }} />
                  </div>
                  <button type="button" onClick={() => setExtraInfo({ ...extraInfo, maxTicketsPerUser: extraInfo.maxTicketsPerUser === 'unlimited' ? '4' : 'unlimited' })} style={{ display: 'flex', alignItems: 'center', height: '51px', padding: '0 16px', background: extraInfo.maxTicketsPerUser === 'unlimited' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${extraInfo.maxTicketsPerUser === 'unlimited' ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', cursor: 'pointer' }}>
                    <InfinityIcon size={14} color={extraInfo.maxTicketsPerUser === 'unlimited' ? '#3b82f6' : 'var(--text-muted)'} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
              <div className="form-group">
                <label style={labelStyle}>Venue / Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Madison Square Garden, NY" style={{ ...inputStyle, paddingLeft: '48px' }} />
                </div>
              </div>
              <div className="form-group">
                <label style={labelStyle}>Exact Address</label>
                <input type="text" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Complete physical address..." style={inputStyle} />
              </div>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Event Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event here. Keep it simple and helpful for your audience..." style={{ ...inputStyle, minHeight: '160px', borderRadius: '16px', lineHeight: '1.6' }} />
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>02</span>
                  <Video size={20} color="#ec4899" /> Photos & Videos
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Make your event stand out with a beautiful poster, a teaser video, and a layout map.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              {/* Main Media Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={labelStyle}>Main Media Showcase (Poster/Teasers)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => document.getElementById('main-image-upload')?.click()} style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>+ Image</button>
                    <button type="button" onClick={() => document.getElementById('main-video-upload')?.click()} style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>+ Video</button>
                  </div>
                  <input id="main-image-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaAdd('main', 'image', e)} />
                  <input id="main-video-upload" type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleMediaAdd('main', 'video', e)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '160px' }}>
                  {mainMedia.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '1' }}>
                      {item.type === 'video' ? (
                        <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={24} color="#ec4899" />
                        </div>
                      ) : (
                        <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <button type="button" onClick={() => removeMediaItem('main', idx)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', color: 'white', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>×</button>
                    </div>
                  ))}
                  {mainMedia.length === 0 && (
                    <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                      <Camera size={32} style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '11px' }}>No media added yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Layout Media Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={labelStyle}>Venue Layout & Entry Maps</label>
                  <button type="button" onClick={() => document.getElementById('layout-media-upload')?.click()} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>+ Add Map</button>
                  <input id="layout-media-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaAdd('layout', 'image', e)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '160px' }}>
                  {layoutMedia.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '1' }}>
                      <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => removeMediaItem('layout', idx)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', color: 'white', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>×</button>
                    </div>
                  ))}
                  {layoutMedia.length === 0 && (
                    <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                      <MapPin size={32} style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '11px' }}>No layout maps added</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 03 Event Category */}
          <div style={cardStyle}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '24px' }}>
              <h3 style={sectionHeaderStyle}>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>03</span>
                <Sparkles size={20} color="#8b5cf6" /> Event Category
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Select the categories where your event will be featured to help users discover it easily.</p>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Select Categories (tap to choose)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.filter(c => c.status === 'Active').map(cat => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                        else setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#a78bfa' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                        transition: 'all 0.2s',
                        textTransform: 'capitalize'
                      }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              {selectedCategoryIds.length === 0 && (
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} /> Please select at least one primary category.
                </p>
              )}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>04</span>
                  <Tag size={20} color="#06b6d4" /> Ticket Categories
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Create different ticket types like VIP or General and set their prices and limits.</p>
              </div>
              <button
                onClick={addTicketCategory}
                style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '8px 20px', fontSize: '13px', color: '#06b6d4', fontWeight: 700, cursor: 'pointer' }}
              >
                + Add Tier
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {ticketCategories.map((cat: TicketCategory) => (
                <div key={cat.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', position: 'relative' }}>
                  {ticketCategories.length > 1 && (!editId || (cat.sales ?? 0) === 0) && (
                    <button onClick={() => removeTicketCategory(cat.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  )}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Tier Label</label>
                    <input type="text" value={cat.name} onChange={(e) => updateTicketCategory(cat.id, 'name', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label style={labelStyle}>Price (₹)</label>
                      <input type="number" value={cat.price || ''} onChange={(e) => updateTicketCategory(cat.id, 'price', Number(e.target.value))} style={inputStyle} />
                    </div>
                    <div className="form-group">
                      <label style={labelStyle}>Total Tickets</label>
                      <input type="number" value={cat.capacity || ''} onChange={(e) => updateTicketCategory(cat.id, 'capacity', Number(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gate & Entry Management Section */}
          <div style={cardStyle}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <h3 style={sectionHeaderStyle}>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>05</span>
                <CheckSquare size={20} color="#3b82f6" /> Entry Gates
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Define specific entry points to help guide your attendees smoothly into the venue.</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={labelStyle}>Gate Name</label>
                <input
                  type="text"
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGate())}
                  placeholder="e.g. North Gate (Main Entry)"
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={addGate}
                style={{ padding: '16px 24px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', height: '51px' }}
              >
                Add Gate
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {gates.map((gate, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{gate}</span>
                  <button type="button" onClick={() => removeGate(idx)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                </div>
              ))}
              {gates.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No specific gates defined. Default entry is active.</p>}
            </div>
          </div>

          {/* Special Instructions Section */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>06</span>
                  <Info size={20} color="#6366f1" /> Important Instructions
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Share essential arrival tips, entry rules, and helpful guidance for your attendees.</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldMandatory('special_instructions')}
                style={{
                  background: fieldConfig.special_instructions === 'Mandatory' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  color: fieldConfig.special_instructions === 'Mandatory' ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {fieldConfig.special_instructions.toUpperCase()}
              </button>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Special Instructions</label>
              <textarea
                value={extraInfo.specialInstructions}
                onChange={(e) => setExtraInfo({ ...extraInfo, specialInstructions: e.target.value })}
                placeholder="e.g. Please bring a physical copy of your ID. Doors close 15 minutes before the start time."
                style={inputStyle}
                rows={4}
              />
              <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>This will be shown clearly to users on the event page.</p>
            </div>
          </div>

          {/* 05 Experience Highlights Section */}
          <div style={cardStyle}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>07</span>
                  <Camera size={20} color="#ec4899" /> Experience Highlights
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Add quick facts like duration or age limits to give users a snapshot of the experience.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => toggleFieldMandatory('highlights')}
                  style={{
                    background: fieldConfig.highlights === 'Mandatory' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    color: fieldConfig.highlights === 'Mandatory' ? '#ec4899' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {fieldConfig.highlights.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={addHighlight}
                  style={{ padding: '10px 20px', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '12px', color: '#ec4899', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Add New Fact
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {highlights.map((highlight, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 40px', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getHighlightIcon(highlight.icon)}
                  </div>
                  <input
                    type="text"
                    value={highlight.label}
                    onChange={(e) => updateHighlight(index, 'label', e.target.value)}
                    placeholder="Label (e.g. Duration)"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={highlight.value}
                    onChange={(e) => updateHighlight(index, 'value', e.target.value)}
                    placeholder="Value (e.g. 3 Hours)"
                    style={inputStyle}
                  />
                  <select
                    value={highlight.icon}
                    onChange={(e) => updateHighlight(index, 'icon', e.target.value)}
                    style={inputStyle}
                  >
                    {presetHighlightIcons.map((icon: { name: string, value: string }) => <option key={icon.value} value={icon.value}>{icon.name}</option>)}
                  </select>
                  <button type="button" onClick={() => removeHighlight(index)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {highlights.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No highlights added yet.</p>}
            </div>
          </div>

          {/* 06 Official Partners Section */}
          <div style={cardStyle}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>08</span>
                  <Globe size={20} color="#3b82f6" /> Sponsors & Partners
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Highlight the brands and collaborators supporting your event with their logos.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => toggleFieldMandatory('sponsors')}
                  style={{
                    background: fieldConfig.sponsors === 'Mandatory' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    color: fieldConfig.sponsors === 'Mandatory' ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {fieldConfig.sponsors.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={addSponsor}
                  style={{ padding: '10px 20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Add Partner
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {sponsors.map((sponsor, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 1fr 40px', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getSponsorIcon(sponsor.icon)}
                  </div>
                  <input
                    type="text"
                    value={sponsor.name}
                    onChange={(e) => updateSponsor(index, 'name', e.target.value)}
                    placeholder="Partner Name"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={sponsor.tier}
                    onChange={(e) => updateSponsor(index, 'tier', e.target.value)}
                    placeholder="Tier (e.g. Gold)"
                    style={inputStyle}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={sponsor.icon}
                      onChange={(e) => updateSponsor(index, 'icon', e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    >
                      {presetSponsorIcons.map((icon: { name: string, value: string }) => <option key={icon.value} value={icon.value}>{icon.name}</option>)}
                    </select>
                    <input type="color" value={sponsor.color} onChange={(e) => updateSponsor(index, 'color', e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                  </div>
                  <button type="button" onClick={() => removeSponsor(index)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {sponsors.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No partners added yet.</p>}
            </div>
          </div>



          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>09</span>
                  <Camera size={20} color="#f97316" /> Event Memories
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Share photos from past events or professional shots to show users the mood of your event.</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldMandatory('gallery')}
                style={{
                  background: fieldConfig.gallery === 'Mandatory' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  color: fieldConfig.gallery === 'Mandatory' ? '#f97316' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {fieldConfig.gallery.toUpperCase()}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
              {gallery.map((img: string, idx: number) => (
                <div key={idx} style={{ aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={img} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeGalleryItem(idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', color: 'white', width: '24px', height: '24px', cursor: 'pointer', border: 'none' }}>×</button>
                </div>
              ))}
              <label style={{ aspectRatio: '1', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleGalleryUpload} />
                <Plus size={24} color="var(--text-muted)" />
              </label>
            </div>
          </div>

          {/* 07 Prohibited Items Section */}
          <div style={cardStyle}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>10</span>
                  <AlertCircle size={20} color="#f43f5e" /> Prohibited Items
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>List the items that aren't allowed at the venue to ensure a safe experience.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => toggleFieldMandatory('prohibited_items')}
                  style={{
                    background: fieldConfig.prohibited_items === 'Mandatory' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    color: fieldConfig.prohibited_items === 'Mandatory' ? '#f43f5e' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {fieldConfig.prohibited_items.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={addProhibitedItem}
                  style={{ padding: '10px 20px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', color: '#f43f5e', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {prohibitedItems.map((item: { label: string, icon: string }, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(244,63,94,0.08)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(244,63,94,0.15)',
                  transition: 'transform 0.2s ease'
                }}>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateProhibitedItem(index, 'label', e.target.value)}
                    placeholder="e.g. Alcohol"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      fontWeight: 500
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeProhibitedItem(index)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#f43f5e',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {prohibitedItems.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>No prohibited items listed.</p>}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>11</span>
                  <CheckSquare size={20} color="#10b981" /> Policies & Trust
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Set your refund rules and contact details to build confidence with your ticket buyers.</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldMandatory('policies_trust')}
                style={{
                  background: fieldConfig.policies_trust === 'Mandatory' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  color: fieldConfig.policies_trust === 'Mandatory' ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {fieldConfig.policies_trust.toUpperCase()}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={labelStyle}>Refund Policy</label>
                  <button onClick={() => toggleFieldMandatory('refund_policy')} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: fieldConfig.refund_policy === 'Mandatory' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: fieldConfig.refund_policy === 'Mandatory' ? '#10b981' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{fieldConfig.refund_policy}</button>
                </div>
                <input type="text" value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} style={inputStyle} />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={labelStyle}>Entry Policy</label>
                  <button onClick={() => toggleFieldMandatory('entry_policy')} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: fieldConfig.entry_policy === 'Mandatory' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: fieldConfig.entry_policy === 'Mandatory' ? '#10b981' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{fieldConfig.entry_policy}</button>
                </div>
                <input type="text" value={entryPolicy} onChange={(e) => setEntryPolicy(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label style={labelStyle}>Support Email</label>
                <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} style={inputStyle} />
              </div>
              <div className="form-group">
                <label style={labelStyle}>Support Phone</label>
                <input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={sectionHeaderStyle}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>12</span>
                  <FileText size={20} color="#a855f7" /> Terms & Conditions
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Add the detailed rules and conditions to keep your event organized and clear.</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldMandatory('terms_conditions')}
                style={{
                  background: fieldConfig.terms_conditions === 'Mandatory' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  color: fieldConfig.terms_conditions === 'Mandatory' ? '#a855f7' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {fieldConfig.terms_conditions.toUpperCase()}
              </button>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Manual Terms (One per line)</label>
              <textarea
                value={termsStr}
                onChange={(e) => setTermsStr(e.target.value)}
                placeholder="e.g. 1. No refunds&#10;2. Valid ID required"
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>
          </div>




          <div style={cardStyle}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
              <h3 style={sectionHeaderStyle}>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)', opacity: 0.8, letterSpacing: '2px' }}>13</span>
                <PieChart size={20} color="#8b5cf6" /> Tax & Extra Fees
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Manage your tax settings and add any extra service fees for ticket sales.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Apply GST Tax</label>
                  <input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }} />
                </div>
                {gstEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>CGST %</label>
                      <input type="number" value={cgstRate} onChange={(e) => setCgstRate(Number(e.target.value))} style={inputStyle} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>SGST %</label>
                      <input type="number" value={sgstRate} onChange={(e) => setSgstRate(Number(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Convenience Fee</label>
                  <input type="checkbox" checked={convenienceFeeEnabled} onChange={(e) => setConvenienceFeeEnabled(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }} />
                </div>
                {convenienceFeeEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Fee Type</label>
                      <select value={convenienceFeeType} onChange={(e) => setConvenienceFeeType(e.target.value as any)} style={{ ...inputStyle, padding: '8px' }}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Amount</label>
                      <input type="number" value={convenienceFeeRate} onChange={(e) => setConvenienceFeeRate(Number(e.target.value))} style={inputStyle} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>          {editId && existingEvent?.status !== 'Cancelled' && (
            <div className="glass-attached" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setConfirmModal({
                  isOpen: true,
                  title: 'Stop Event?',
                  message: 'Are you sure you want to cancel this event? This will stop sales and notify users. This action cannot be undone.',
                  confirmText: 'Yes, Cancel Event',
                  confirmColor: '#f43f5e',
                  icon: <AlertTriangle size={32} />,
                  status: 'Cancelled'
                })}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#f43f5e',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
              >
                <XCircle size={16} /> Cancel Event
              </button>

              <button
                onClick={() => setConfirmModal({
                  isOpen: true,
                  title: 'Mark as Sold Out?',
                  message: 'This will hide tickets from the app. You can change this later if you get more tickets.',
                  confirmText: 'Mark Sold Out',
                  confirmColor: '#f59e0b',
                  icon: <Tag size={32} />,
                  status: 'Sold Out'
                })}
                disabled={existingEvent?.status === 'Sold Out'}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: existingEvent?.status === 'Sold Out' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)',
                  color: existingEvent?.status === 'Sold Out' ? 'var(--text-muted)' : 'white',
                  border: `1px solid ${existingEvent?.status === 'Sold Out' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: existingEvent?.status === 'Sold Out' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Tag size={16} /> Mark as Sold Out
              </button>

              <button
                onClick={() => setConfirmModal({
                  isOpen: true,
                  title: 'Move to Past Events?',
                  message: 'This will move the event to the history section. Use this only after the event is finished.',
                  confirmText: 'Yes, Finish it',
                  confirmColor: '#10b981',
                  icon: <CheckSquare size={32} />,
                  status: 'Completed'
                })}
                disabled={existingEvent?.status === 'Completed'}
                style={{
                  gridColumn: 'span 2',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(10, 185, 129, 0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
              >
                <CheckSquare size={16} /> Mark as Completed
              </button>
            </div>
          )}


          <div className="glass-attached" style={{ padding: '24px', display: 'flex', gap: '16px' }}>
            <button
              type="button"
              onClick={() => setConfirmModal({
                isOpen: true,
                title: 'Save for later?',
                message: 'Your progress will be saved but the event will not be shown to users yet.',
                confirmText: 'Save Now',
                confirmColor: '#a1a1aa',
                icon: <FileText size={32} />,
                status: 'Draft'
              })}
              style={{
                flex: 0.4,
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: 600,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <FileText size={20} /> Save for Later
            </button>

            <button
              type="button"
              onClick={() => setConfirmModal({
                isOpen: true,
                title: editId ? 'Update Event?' : 'Publish Event?',
                message: editId
                  ? 'Your changes will show up on the app immediately.'
                  : 'This will make the event LIVE and visible to everyone on the TicketLiv app.',
                confirmText: editId ? 'Update Now' : 'Publish Live',
                confirmColor: '#06b6d4',
                icon: <Sparkles size={32} />,
                status: 'Live'
              })}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
                color: 'white',
                border: 'none',
                fontWeight: 700,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px var(--glow-primary)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px var(--glow-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px var(--glow-primary)'; }}
            >
              <Save size={20} /> {editId ? 'Update Event' : 'Publish Event Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '40px 32px',
            textAlign: 'center',
            background: `linear-gradient(180deg, ${confirmModal.confirmColor}15 0%, rgba(30,32,44,0.98) 100%)`,
            border: `1px solid ${confirmModal.confirmColor}35`,
            boxShadow: `0 24px 70px rgba(0,0,0,0.6), 0 0 40px ${confirmModal.confirmColor}15`,
            animation: 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: `${confirmModal.confirmColor}20`,
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: confirmModal.confirmColor,
              transform: 'rotate(-5deg)',
              boxShadow: `0 8px 20px ${confirmModal.confirmColor}20`
            }}>
              {confirmModal.icon}
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px', color: 'white' }}>{confirmModal.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                Go Back
              </button>
              <button
                onClick={async () => {
                  if (confirmModal.status) await handleSubmit(confirmModal.status as any);
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: confirmModal.confirmColor,
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 20px ${confirmModal.confirmColor}40`,
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateEvent;
