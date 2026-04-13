import api from './api';
import type { Coupon, Discount } from '../context/AppContext';

export const PromoService = {
  getCoupons: async () => {
    return api.get('/promos/coupons');
  },

  createCoupon: async (couponData: Partial<Coupon>) => {
    return api.post('/promos/coupons', couponData);
  },

  updateCoupon: async (id: string, couponData: Partial<Coupon>) => {
    return api.put(`/promos/coupons/${id}`, couponData);
  },

  deleteCoupon: async (id: string) => {
    return api.delete(`/promos/coupons/${id}`);
  },

  getDiscounts: async () => {
    return api.get('/promos/discounts');
  },

  createDiscount: async (discountData: Partial<Discount>) => {
    return api.post('/promos/discounts', discountData);
  },

  updateDiscount: async (id: string, discountData: Partial<Discount>) => {
    return api.put(`/promos/discounts/${id}`, discountData);
  },

  deleteDiscount: async (id: string) => {
    return api.delete(`/promos/discounts/${id}`);
  }
};
