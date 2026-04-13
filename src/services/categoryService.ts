import api from './api';
import type { Category } from '../context/AppContext';

export const CategoryService = {
  getAllCategories: async () => {
    return api.get('/categories');
  },

  createCategory: async (categoryData: Partial<Category>) => {
    const data = {
      ...categoryData,
      icon_name: categoryData.iconName
    };
    return api.post('/categories', data);
  },

  updateCategory: async (id: number, categoryData: Partial<Category>) => {
    const data = {
      ...categoryData,
      icon_name: categoryData.iconName
    };
    return api.put(`/categories/${id}`, data);
  },

  deleteCategory: async (id: number) => {
    return api.delete(`/categories/${id}`);
  }
};
