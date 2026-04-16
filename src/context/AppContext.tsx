import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { EventService } from '../services/eventService';
import { CategoryService } from '../services/categoryService';
import { AdminService } from '../services/adminService';
import { PromoService } from '../services/promoService';
import { STORAGE_KEYS } from '../config/constants';

export interface Category {
  id: number | string;
  name: string;
  events: number;
  iconName: string;
  icon_name?: string; // Support for backend response field
  color: string;
  status: 'Active' | 'Inactive';
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  file?: File;
  name?: string;
}

export interface TicketCategory {
  id: number | string;
  name: string;
  price: number;
  capacity: number;
  sales?: number;
  max_limit?: number;
}


export interface AppEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  event_date?: string;
  start_date?: string; // Original backend field
  end_date?: string;
  location: string;
  venue_name?: string; // Align with backend
  venue_address?: string;
  map_url?: string;
  description: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Published' | 'Unpublished' | 'Cancelled' | 'Live' | 'Completed' | 'Sold Out';
  publishingStatus?: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Published' | 'Archived';
  category_id?: number | string;
  categoryIds?: (number | string)[];
  ticketCategories: TicketCategory[];
  price?: number;
  sales: number;
  revenue: number;
  revenueCurrency: string;
  tag?: string;
  tags?: string[];
  created_at?: string;
  createdAt?: string;
  organizer_name?: string;
  organizer_logo?: string;
  terms?: string[];
  timezone?: string;
  latitude?: number;
  longitude?: number;
  organizerId?: string;
  more_info?: { label: string, value: string, icon: string }[];
  extra_info?: {
    ageRestriction?: string;
    parkingAvailable?: boolean;
    specialInstructions: string;
    maxTicketsPerUser: string;
    galleryMetadata?: { name: string, size: number, id: string }[];
  };
  financials?: {
    gstEnabled?: boolean;
    cgstRate?: number;
    sgstRate?: number;
    platformFeeEnabled?: boolean;
    platformFeeRate?: number;
    platformFeeType?: 'fixed' | 'percentage';
    convenienceFeeEnabled?: boolean;
    convenienceFeeRate?: number;
    convenienceFeeType?: 'fixed' | 'percentage';
  };
  updatedAt?: string;
  image_url?: string;
  video_url?: string;
  layout_image?: string;
  gallery?: string[];
  prohibited_items?: { label: string, icon: string }[];
  refund_policy?: string;
  entry_policy?: string;
  support_email?: string;
  support_phone?: string;
  sponsors?: { name: string, tier: string, icon: string, color: string }[];
  field_config?: Record<string, 'Mandatory' | 'Optional'>;
  is_featured?: boolean;
  is_popular?: boolean;
  presenter_name?: string;
  gates?: string[];
  mainMedia?: MediaItem[];
  layoutMedia?: MediaItem[];
}

export interface Attendee {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  category: string;
  eventId: string;
  ticketType: string;
  ticketCount: number;
  bookingDate: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  status: 'Active' | 'Inactive' | 'Expired';
  applicableEventIds?: string[];
}

export interface Discount {
  id: string;
  name: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  ruleType: 'EarlyBird' | 'Volume' | 'Bulk';
  ruleValue: number | string;
  status: 'Active' | 'Inactive';
  applicableEventIds?: string[];
}

export type PermissionRoute = '/dashboard' | '/events' | '/marketing' | '/attendees' | '/create-event' | '/categories' | '/ads' | '/analytics' | '/finance' | '/reports' | '/settings' | '/team' | '/tickets' | '/ticket-design' | '/bulk-tickets' | '/seat-map' | '/admin-control';

export type AdminRole = 'Super Admin' | 'Admin' | 'Manager' | 'Event Organizer' | 'Scanner User';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  type: 'Event' | 'User' | 'System' | 'Auth' | 'Access';
  timestamp: string;
  metadata?: any;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  status: 'Active' | 'Inactive';
  permissions: PermissionRoute[];
  phone?: string;
  assignedEvents?: string[]; // Specifically for Scanner Users
}

export const ALL_ADMIN_ROUTES: PermissionRoute[] = ['/dashboard', '/events', '/marketing', '/attendees', '/create-event', '/categories', '/ads', '/analytics', '/finance', '/reports', '/settings', '/team', '/tickets', '/ticket-design', '/bulk-tickets', '/seat-map', '/admin-control'];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionRoute[]> = {
  'Super Admin': ALL_ADMIN_ROUTES,
  'Superadmin': ALL_ADMIN_ROUTES,
  'Admin': ALL_ADMIN_ROUTES,
  'Manager': ['/dashboard', '/events', '/create-event', '/attendees', '/categories', '/analytics', '/reports', '/tickets', '/ticket-design', '/bulk-tickets', '/seat-map', '/admin-control'],
  'Event Organizer': ['/dashboard', '/events', '/create-event', '/tickets', '/ticket-design', '/admin-control'],
  'Scanner User': ['/dashboard'] // Limited baseline
};

export const getEventStatus = (event: AppEvent): string => {
  if (event.status === 'Cancelled') return 'Cancelled';
  if (['Draft', 'Pending Approval', 'Rejected', 'Unpublished'].includes(event.status)) return event.status;
  if (event.status === 'Approved') return 'Ready to Publish';
  if (event.status === 'Published') return 'Published';

  const categories = event.ticketCategories ?? [];
  const totalCapacity = categories.reduce((acc, cat) => acc + (cat.capacity || 0), 0);
  const eventSales = event.sales ?? 0;
  if (totalCapacity > 0 && eventSales >= totalCapacity) {
    return 'Sold Out';
  }

  // Simplified Date Check (Just checking if event date string has passed for mock purposes)
  // Real implementation would parse 'event.date' + 'event.time' correctly into Date object
  const today = new Date();
  const eventDate = new Date(event.date);
  if (!isNaN(eventDate.getTime()) && today > eventDate) {
    return 'Completed';
  }

  return 'Live';
};

export interface Transaction {
  id: string;
  to: string;
  amount: string;
  date: string;
  type: string;
  status: string;
}

interface AppContextType {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  events: AppEvent[];
  addEvent: (event: AppEvent) => void;
  updateEvent: (id: string, updatedData: Partial<AppEvent>) => void;
  deleteEvent: (id: string) => void;
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (id: number | string, updatedData: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number | string) => Promise<void>;
  transactions: Transaction[];
  attendees: Attendee[];
  adminUsers: AdminUser[];
  currentAdminUser: AdminUser | null;
  addAdminUser: (user: AdminUser) => void;
  updateAdminPermissions: (id: string, permissions: PermissionRoute[]) => void;
  updateAdminUser: (id: string, updatedData: Partial<AdminUser>) => void;
  deleteAdminUser: (id: string) => void;
  switchCurrentUser: (id: string) => void;
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, updatedData: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  discounts: Discount[];
  addDiscount: (discount: Discount) => void;
  updateDiscount: (id: string, updatedData: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  removeEventFromScanner: (userId: string, eventId: string) => void;
  pendingEvents: any[];
  approveAdminEvent: (id: string) => Promise<void>;
  rejectAdminEvent: (id: string) => Promise<void>;
  scanners: any[];
  assignAdminScanner: (scannerId: string, eventId: string) => Promise<void>;
  unassignAdminScanner: (assignmentId: string) => Promise<void>;
  dashboardStats: any; // metrics, revenueTrend, scanTrend, venueRevenue, activities, scans
  refreshDashboardStats: (eventId?: string, categoryId?: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, type: AuditLog['type'], metadata?: any) => void;
  assignEventToScanner: (userId: string, eventId: string) => void;
  loginUser: (user: AdminUser, token: string) => void;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}


// --- Global Initialization ---
const initialCategories: Category[] = [];
const initialEvents: AppEvent[] = [];
const initialTransactions: Transaction[] = [];
const initialAttendees: Attendee[] = [];
const initialAdminUsers: AdminUser[] = [];

const formatDate = (dateInput: string | null | undefined): string => {
  if (!dateInput) return '';
  const dateStr = String(dateInput);
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapCategory = (cat: any): Category => ({
  id: cat.id,
  name: cat.name 
    ? cat.name.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '',
  iconName: cat.icon_name || cat.iconName || 'Sparkles',
  icon_name: cat.icon_name || cat.iconName || 'Sparkles',
  color: cat.color || 'indigo',
  status: cat.status || 'Active',
  events: parseInt(cat.event_count || cat.events || '0')
});

const mapCoupon = (c: any): Coupon => ({
  id: c.id,
  code: (c.code || '').toUpperCase(),
  discountType: c.discount_type || c.discountType,
  discountValue: parseFloat(c.discount_value || c.discountValue || '0'),
  minPurchase: parseFloat(c.min_purchase || c.minPurchase || '0'),
  maxDiscount: parseFloat(c.max_discount || c.maxDiscount || '0'),
  expiryDate: formatDate(c.expiry_date || c.expiryDate),
  usageLimit: parseInt(c.usage_limit || c.usageLimit || '0'),
  usedCount: parseInt(c.used_count || c.usedCount || '0'),
  status: c.status || 'Active',
  applicableEventIds: c.applicable_event_ids || c.applicableEventIds || []
});

const mapDiscount = (d: any): Discount => ({
  id: d.id,
  name: (d.name || '').toUpperCase(),
  discountType: d.discount_type || d.discountType,
  discountValue: parseFloat(d.discount_value || d.discountValue || '0'),
  ruleType: d.rule_type || d.ruleType,
  ruleValue: d.rule_value || d.ruleValue,
  status: d.status || 'Active',
  applicableEventIds: d.applicable_event_ids || d.applicableEventIds || []
});

const mapEvent = (e: any): AppEvent => ({
  ...e,
  date: formatDate(e.date || e.start_date || e.event_date),
  time: e.time || (e.start_date ? new Date(e.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
  start_date: formatDate(e.start_date),
  end_date: formatDate(e.end_date),
  createdAt: formatDate(e.created_at || e.createdAt),
  updatedAt: formatDate(e.updated_at || e.updatedAt),
  location: e.location || e.venue_name || '',
  sales: parseInt(e.total_sales || e.sales || '0'),
  revenue: parseFloat(e.total_revenue || e.revenue || '0'),
  ticketCategories: Array.isArray(e.ticket_categories) ? e.ticket_categories : (e.ticketCategories || []),
  image_url: e.image_url || '',
  video_url: e.video_url || '',
  layout_image: e.layout_image || '',
  mainMedia: e.mainMedia || e.main_media || [],
  layoutMedia: e.layoutMedia || e.layout_media || [],
  gallery: e.gallery || []
});

const mapTransaction = (t: any): Transaction => ({
  id: t.id || t.transaction_id,
  to: t.to || t.user_name || 'System',
  amount: t.amount,
  date: formatDate(t.date || t.created_at),
  type: t.type || t.payment_method || 'Payment',
  status: t.status 
});

const mapAttendee = (a: any): Attendee => ({
  id: a.id,
  fullName: a.fullName || a.user_name || 'Anonymous',
  mobileNumber: a.mobileNumber || a.user_phone || '',
  email: a.email || a.user_email || '',
  category: a.category || a.ticket_type_name || '',
  eventId: a.eventId || a.event_id,
  ticketType: a.ticketType || a.ticket_type_name || '',
  ticketCount: parseInt(a.ticketCount || a.quantity || '1'),
  bookingDate: formatDate(a.bookingDate || a.booking_date || a.created_at),
  status: a.status || 'Confirmed'
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [events, setEvents] = useState<AppEvent[]>(initialEvents);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [scanners, setScanners] = useState<any[]>([]);
  
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!stored) return null;
    
    try {
      const user = JSON.parse(stored) as AdminUser;
      
      const roleKey = Object.keys(DEFAULT_ROLE_PERMISSIONS).find(
        key => key.toLowerCase().replace(/\s/g, '') === user.role?.toLowerCase().replace(/\s/g, '')
      );

      if (roleKey && DEFAULT_ROLE_PERMISSIONS[roleKey]) {
        user.permissions = DEFAULT_ROLE_PERMISSIONS[roleKey];
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }
      return user;
    } catch (e) {
      console.error('Failed to parse stored user data', e);
      return null;
    }
  });
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const addAuditLog = React.useCallback((action: string, type: AuditLog['type'], metadata?: any) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId: currentAdminUser?.id || 'System',
      userName: currentAdminUser?.name || 'System',
      action,
      type,
      timestamp: new Date().toISOString(),
      metadata
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentAdminUser]);

  useEffect(() => {
    const initializeApp = async () => {
      if (!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) return;
      
      try {
          // Fetch Events
          const eventsRes = await EventService.getAllEvents();
          if (eventsRes) {
            const eventsData = Array.isArray(eventsRes) ? eventsRes : (eventsRes as any).data;
            if (Array.isArray(eventsData) && eventsData.length > 0) {
              setEvents(eventsData.map(mapEvent));
            }
          }
 
          // Fetch Team
          const usersRes = await AuthService.getAllUsers();
          if (usersRes) {
            const usersData = Array.isArray(usersRes) ? usersRes : (usersRes as any).data;
            if (Array.isArray(usersData) && usersData.length > 0) {
              const mappedUsers = usersData.map((u: any) => ({
                ...u,
                status: u.is_active ? 'Active' : 'Inactive',
                permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || [])
              }));
              setAdminUsers(mappedUsers);
            }
          }
 
          // Fetch Transactions ledger
          const trxRes = await AdminService.getTransactions();
          if (trxRes) {
            const trxData = Array.isArray(trxRes) ? trxRes : (trxRes as any).data;
            if (Array.isArray(trxData)) setTransactions(trxData.map(mapTransaction));
          }

          // Fetch Categories
          const catRes = await CategoryService.getAllCategories();
          if (catRes) {
            const catData = Array.isArray(catRes) ? catRes : (catRes as any).data;
            if (Array.isArray(catData) && catData.length > 0) {
              const mapped = catData.map(mapCategory);
              // Deduplicate by name (case-insensitive), keep first occurrence
              const seen = new Set<string>();
              const unique = mapped.filter(cat => {
                const key = cat.name.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              setCategories(unique);
            }
          }
 
          // Fetch Promos
          const [couponRes, discountRes] = await Promise.all([
             PromoService.getCoupons(),
             PromoService.getDiscounts()
          ]);
          
          if (couponRes) {
            const couponData = (couponRes as any).data || couponRes;
            if (Array.isArray(couponData)) setCoupons(couponData.map(mapCoupon));
          }
          if (discountRes) {
            const discData = (discountRes as any).data || discountRes;
            if (Array.isArray(discData)) setDiscounts(discData.map(mapDiscount));
          }
 
          // Fetch Dashboard Stats
          const statsRes = await AdminService.getDashboardStats();
          if (statsRes) {
            const statsData = (statsRes as any).data || statsRes;
            setDashboardStats(statsData);
          }

          // Fetch Attendees
          const attendeeRes = await AdminService.getAttendees();
          if (attendeeRes) {
             const attData = (attendeeRes as any).data || attendeeRes;
             if (Array.isArray(attData)) setAttendees(attData.map(mapAttendee));
          }

          // Fetch Pending Events
          const pendingRes = await AdminService.getPendingEvents();
          if (pendingRes) {
             const pendingData = (pendingRes as any).data || pendingRes;
             if (Array.isArray(pendingData)) setPendingEvents(pendingData.map(mapEvent));
          }

          // Fetch Scanners
          const scannersRes = await AdminService.getScanners();
          if (scannersRes) {
             const scannerData = (scannersRes as any).data || scannersRes;
             if (Array.isArray(scannerData)) setScanners(scannerData);
          }

       } catch (err) {
         console.error('System Initialization Error:', err);
      }
    };

    initializeApp();
  }, [currentAdminUser?.id]);

  // Check login credentials mapped from localstorage globally
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as AdminUser;
        const roleKey = Object.keys(DEFAULT_ROLE_PERMISSIONS).find(
          key => key.toLowerCase().replace(/\s/g, '') === user.role?.toLowerCase().replace(/\s/g, '')
        );
        if (roleKey && DEFAULT_ROLE_PERMISSIONS[roleKey]) {
          user.permissions = DEFAULT_ROLE_PERMISSIONS[roleKey];
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        }
        setTimeout(() => setCurrentAdminUser(user), 0);
      } catch (e) {
        console.error('Auth session corrupted, clearing...');
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    }
  }, []);

  const addEvent = React.useCallback(async (newEvent: AppEvent) => {
    try {
       const res = await EventService.createEvent(newEvent);
       if (res) {
         const eventData = (res as any).data || res;
         setEvents(prev => [...prev, mapEvent(eventData)]);
       }
    } catch (err) { 
      console.error('Failed to create event', err);
      throw err;
    }
  }, []);

  const deleteEvent = React.useCallback(async (id: string) => {
    try {
      await EventService.deleteEvent(id);
      setEvents(prev => prev.filter(evt => evt.id !== id));
    } catch (err) {
      console.error('Failed to delete event', err);
      throw err;
    }
  }, []);

  const deleteCategory = React.useCallback(async (id: number | string) => {
    // Always remove locally first for instant UI feedback
    setCategories(prev => prev.filter(cat => cat.id !== id));
    
    // Also update events that might be using this category
    setEvents(prev => prev.map(evt => {
      if (evt.categoryIds && evt.categoryIds.includes(id as any)) {
        return {
          ...evt,
          categoryIds: evt.categoryIds.filter(catId => catId !== id)
        };
      }
      return evt;
    }));

    try {
      await CategoryService.deleteCategory(id as any);
    } catch (err) {
      console.error('API delete failed (local removal persisted):', err);
    }
  }, []);

  const addCategory = React.useCallback(async (categoryData: Partial<Category>) => {
    try {
      const res = await CategoryService.createCategory(categoryData) as unknown as ApiResponse<any>;
      const serverCat = res?.data || res;
      if (serverCat && serverCat.id) {
        setCategories(prev => [mapCategory(serverCat), ...prev]);
      } else {
        // API returned but no data — add locally
        const localCat: Category = {
          id: Date.now(),
          name: categoryData.name || '',
          iconName: 'Sparkles',
          icon_name: 'Sparkles',
          color: 'indigo',
          status: categoryData.status || 'Active',
          events: 0
        };
        setCategories(prev => [localCat, ...prev]);
      }
    } catch (err) {
      console.error('API failed for category, adding locally:', err);
      // Fallback: add category locally so UI is never stuck
      const localCat: Category = {
        id: Date.now(),
        name: categoryData.name || '',
        iconName: 'Sparkles',
        icon_name: 'Sparkles',
        color: 'indigo',
        status: categoryData.status || 'Active',
        events: 0
      };
      setCategories(prev => [localCat, ...prev]);
    }
  }, []);

  const updateCategory = React.useCallback(async (id: number | string, updatedData: Partial<Category>) => {
    try {
      const res = await CategoryService.updateCategory(id as any, updatedData) as unknown as ApiResponse<any>;
      if (res?.data) {
        const mapped = mapCategory(res.data);
        setCategories(prev => prev.map(cat => cat.id === id ? mapped : cat));
      }
    } catch (err) {
      console.error('Failed to update category', err);
      throw err;
    }
  }, []);

  const updateEvent = React.useCallback(async (id: string, updatedData: Partial<AppEvent>) => {
    try {
      const res = await EventService.updateEvent(id, updatedData);
      if (res) {
        const eventData = (res as any).data || res;
        setEvents(prev => prev.map(evt => evt.id === id ? mapEvent(eventData) : evt));
      }
    } catch (err) { 
      console.error('Failed to update event', err);
      throw err;
    }
  }, []);

  const refreshEvents = React.useCallback(async () => {
    try {
      const res = await EventService.getAllEvents() as any;
      const eventsData = res?.data || res;
      if (Array.isArray(eventsData)) setEvents(eventsData.map(mapEvent));
    } catch (err) { 
      console.error('Failed to refresh events', err);
      throw err;
    }
  }, []);

  const refreshDashboardStats = React.useCallback(async (eventId?: string, categoryId?: string) => {
    try {
      const res = await AdminService.getDashboardStats(eventId, categoryId);
      if (res) {
        const statsData = (res as any).data || res;
        setDashboardStats(statsData);
      }
    } catch (err) {
      console.error('Failed to refresh dashboard stats', err);
    }
  }, []);

  const updateAdminPermissions = React.useCallback(async (id: string, permissions: PermissionRoute[]) => {
    try {
      const user = adminUsers.find(u => u.id === id);
      const res = await AuthService.updatePermissions(id, permissions, user?.role) as unknown as ApiResponse<AdminUser>;
      
      if (res?.data) {
        setAdminUsers(prev => prev.map(u => u.id === id ? res.data : u));
        if (currentAdminUser?.id === id) {
           setCurrentAdminUser(res.data);
           localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.data));
        }
      }
    } catch (err) { 
      console.error('Failed to update permissions', err);
      throw err;
    }
  }, [adminUsers, currentAdminUser]);

  const addAdminUser = React.useCallback(async (user: AdminUser) => {
    try {
      const res = await AuthService.createUser(user) as unknown as ApiResponse<AdminUser>;
      if (res?.data) setAdminUsers(prev => [res.data, ...prev]);
    } catch (err) { 
      console.error('Failed to create staff', err);
      throw err;
    }
  }, []);

  const updateAdminUser = React.useCallback(async (id: string, updatedData: Partial<AdminUser>) => {
    try {
      const res = await AuthService.updateUser(id, updatedData) as unknown as ApiResponse<AdminUser>;
      
      if (res?.data) {
        setAdminUsers(prev => prev.map(user => 
          user.id === id ? res.data : user
        ));
        if (currentAdminUser?.id === id) {
           setCurrentAdminUser(res.data);
           localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.data));
        }
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
      // Fallback update current local state if API fails
      setAdminUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...updatedData } : user
      ));
    }
  }, [currentAdminUser]);

  const deleteAdminUser = React.useCallback(async (id: string) => {
    try {
      await AuthService.deleteUser(id);
      setAdminUsers(prev => prev.filter(user => user.id !== id));
      addAuditLog(`Permanently deleted user ${id}`, 'User');
    } catch (err) { 
      console.error('Failed to permanently delete user', err);
      throw err;
    }
  }, [addAuditLog]);

  const switchCurrentUser = (id: string) => {
    const user = adminUsers.find(u => u.id === id);
    if (user) {
      setCurrentAdminUser(user);
    }
  };

  const loginUser = React.useCallback((user: AdminUser, token: string) => {
    const roleKey = Object.keys(DEFAULT_ROLE_PERMISSIONS).find(
      key => key.toLowerCase().replace(/\s/g, '') === user.role?.toLowerCase().replace(/\s/g, '')
    );
    
    if (roleKey && DEFAULT_ROLE_PERMISSIONS[roleKey]) {
      user.permissions = DEFAULT_ROLE_PERMISSIONS[roleKey];
    }
    
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    setCurrentAdminUser(user);
    addAuditLog('User logged in', 'Auth', { email: user.email });
    
    setAdminUsers(prev => {
      if (!prev.find(u => u.id === user.id)) {
        return [user, ...prev];
      }
      return prev;
    });
  }, [addAuditLog]);

  const addCoupon = async (coupon: Coupon) => {
    try {
      const res = await PromoService.createCoupon(coupon) as unknown as ApiResponse<Coupon>;
      if (res?.data) setCoupons(prev => [mapCoupon(res.data), ...prev]);
    } catch (err) {
      console.error('Failed to create coupon', err);
      throw err;
    }
  };
  
  const updateCoupon = async (id: string, updatedData: Partial<Coupon>) => {
    try {
      const res = await PromoService.updateCoupon(id, updatedData) as unknown as ApiResponse<Coupon>;
      if (res?.data) {
        const mapped = mapCoupon(res.data);
        setCoupons(prev => prev.map(c => c.id === id ? mapped : c));
      }
    } catch (err) {
      console.error('Failed to update coupon', err);
      throw err;
    }
  };
  
  const deleteCoupon = async (id: string) => {
     try {
       await PromoService.deleteCoupon(id);
       setCoupons(prev => prev.filter(c => c.id !== id));
     } catch (err) {
       console.error('Failed to delete coupon', err);
       throw err;
     }
  };

  const addDiscount = async (discount: Discount) => {
     try {
       const res = await PromoService.createDiscount(discount) as unknown as ApiResponse<Discount>;
       if (res?.data) setDiscounts(prev => [mapDiscount(res.data), ...prev]);
     } catch (err) {
       console.error('Failed to create discount', err);
       throw err;
     }
  };
  
  const updateDiscount = async (id: string, updatedData: Partial<Discount>) => {
      try {
        const res = await PromoService.updateDiscount(id, updatedData) as unknown as ApiResponse<Discount>;
        if (res?.data) {
          const mapped = mapDiscount(res.data);
          setDiscounts(prev => prev.map(d => d.id === id ? mapped : d));
        }
      } catch (err) {
        console.error('Failed to update discount', err);
        throw err;
      }
  };
  
  const deleteDiscount = async (id: string) => {
     try {
       await PromoService.deleteDiscount(id);
       setDiscounts(prev => prev.filter(d => d.id !== id));
     } catch (err) {
       console.error('Failed to delete discount', err);
       throw err;
     }
  };

  const assignEventToScanner = (userId: string, eventId: string) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, assignedEvents: [...(u.assignedEvents || []), eventId] };
      }
      return u;
    }));
    addAuditLog(`Assigned event ${eventId} to scanner ${userId}`, 'Access', { userId, eventId });
  };

  const removeEventFromScanner = (userId: string, eventId: string) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, assignedEvents: (u.assignedEvents || []).filter(e => e !== eventId) };
      }
      return u;
    }));
    addAuditLog(`Removed event ${eventId} from scanner ${userId}`, 'Access', { userId, eventId });
  };
  
  const approveAdminEvent = async (id: string) => {
    await AdminService.approveEvent(id);
    setPendingEvents(prev => prev.filter(e => e.id !== id));
    refreshEvents();
  };

  const rejectAdminEvent = async (id: string) => {
    await AdminService.rejectEvent(id);
    setPendingEvents(prev => prev.filter(e => e.id !== id));
    refreshEvents();
  };

  const assignAdminScanner = async (scannerId: string, eventId: string) => {
    await AdminService.assignScanner({ scannerId, eventId });
    const res = await AdminService.getScanners();
    if (res) setScanners((res as any).data || res);
  };

  const unassignAdminScanner = async (assignmentId: string) => {
    await AdminService.unassignScanner(assignmentId);
    const res = await AdminService.getScanners();
    if (res) setScanners((res as any).data || res);
  };


  return (
    <AppContext.Provider value={{
      categories,
      setCategories,
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      addCategory,
      updateCategory,
      deleteCategory,
      transactions,
      attendees,
      adminUsers,
      currentAdminUser,
      addAdminUser,
      updateAdminPermissions,
      updateAdminUser,
      deleteAdminUser,
      switchCurrentUser,
      coupons,
      addCoupon,
      updateCoupon,
      deleteCoupon,
      discounts,
      addDiscount,
      updateDiscount,
      deleteDiscount,
      refreshEvents,
      pendingEvents,
      approveAdminEvent,
      rejectAdminEvent,
      scanners,
      assignAdminScanner,
      unassignAdminScanner,
      auditLogs,
      addAuditLog,
      assignEventToScanner,
      removeEventFromScanner,
      dashboardStats,
      refreshDashboardStats,
      loginUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
