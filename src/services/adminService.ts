import api from './api';

export const AdminService = {
  getDashboardStats: async (eventId?: string, categoryId?: string) => {
    let url = '/admin/dashboard/stats';
    const params = new URLSearchParams();
    if (eventId && eventId !== 'all') params.append('eventId', eventId);
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },

  getAllBookings: async (page: number = 1, limit: number = 20, filters: Record<string, string | number | boolean> = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    }).toString();
    
    return api.get(`/admin/bookings?${params}`);
  },

  getBookingDetail: async (id: string) => {
    return api.get(`/admin/bookings/${id}`);
  },

  getTransactions: async () => {
    return api.get('/admin/transactions');
  },

  getAttendees: async () => {
    return api.get('/admin/attendees');
  },

  getPendingEvents: async () => {
    return api.get('/admin/events/pending');
  },

  approveEvent: async (id: string) => {
    return api.post(`/admin/events/${id}/approve`);
  },

  rejectEvent: async (id: string) => {
    return api.post(`/admin/events/${id}/reject`);
  },

  getScanners: async () => {
    return api.get('/admin/scanners');
  },

  assignScanner: async (data: { scannerId: string, eventId: string }) => {
    return api.post('/admin/scanners/assign', data);
  },

  unassignScanner: async (assignmentId: string) => {
    return api.delete(`/admin/scanners/assign/${assignmentId}`);
  }
};
