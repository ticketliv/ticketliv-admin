import api from './api';

export const AdminService = {
  getDashboardStats: async () => {
    return api.get('/admin/dashboard/stats');
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
