import api from './api';
import type { AppEvent } from '../context/AppContext';

export const EventService = {
  getAllEvents: async () => {
    return api.get('/events');
  },

  getEventById: async (id: string) => {
    return api.get(`/events/${id}`);
  },

  createEvent: async (eventData: Partial<AppEvent>) => {
    return api.post('/events', eventData);
  },

  updateEvent: async (id: string, eventData: Partial<AppEvent>) => {
    return api.put(`/events/${id}`, eventData);
  },

  patchEventStatus: async (id: string, status: string) => {
    return api.patch(`/events/${id}`, { status });
  },

  deleteEvent: async (id: string) => {
    return api.delete(`/events/${id}`);
  }
};
