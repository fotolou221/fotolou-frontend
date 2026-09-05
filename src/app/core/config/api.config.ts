import { environment } from '../../../environments/environment';

/**
 * Centralized API configuration for Fotolou.
 * Dynamically switches between local JSON Server and Render / Spring Boot production backend.
 */
export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  endpoints: {
    salons: '/salons',
    tickets: '/tickets',
    products: '/products',
    categories: '/categories',
    orders: '/orders',
    relatives: '/relatives',
    notifications: '/notifications',
    users: '/users'
  },
  timeoutMs: 10000
};
