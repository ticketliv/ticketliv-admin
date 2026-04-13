import api from './api';
import type { AdminUser, PermissionRoute } from '../context/AppContext';

export const AuthService = {
  login: async (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },

  getAllUsers: async () => {
    return api.get('/auth/users');
  },

  createUser: async (userData: Partial<AdminUser>) => {
    return api.post('/auth/users', userData);
  },

  updatePermissions: async (id: string, permissions: PermissionRoute[], role?: string) => {
    return api.put(`/auth/users/${id}/permissions`, { permissions, role });
  },

  deleteUser: async (id: string) => {
    return api.delete(`/auth/users/${id}`);
  }
};
