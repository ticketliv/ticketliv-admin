import api from './api';
import type { Coupon, Discount } from '../context/AppContext';

export const PromoService = {
  getCoupons: async () => {
    return api.get('/marketing/coupons');
  },

  createCoupon: async (couponData: Partial<Coupon>) => {
    return api.post('/marketing/coupons', couponData);
  },

  updateCoupon: async (id: string, couponData: Partial<Coupon>) => {
    return api.put(`/marketing/coupons/${id}`, couponData);
  },

  deleteCoupon: async (id: string) => {
    return api.delete(`/marketing/coupons/${id}`);
  },

  getDiscounts: async () => {
    return api.get('/marketing/discounts');
  },

  createDiscount: async (discountData: Partial<Discount>) => {
    return api.post('/marketing/discounts', discountData);
  },

  updateDiscount: async (id: string, discountData: Partial<Discount>) => {
    return api.put(`/marketing/discounts/${id}`, discountData);
  },

  deleteDiscount: async (id: string) => {
    return api.delete(`/marketing/discounts/${id}`);
  }
};
