import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// API Configuration
const API_BASE_URL = 'http://10.254.198.75:5000/api'; // Change this to your backend URL (TechE-Innovation backend runs on port 5000)

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userRole');
        await AsyncStorage.removeItem('hotelId');
        // You might want to navigate to login screen here
      }

      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
      return Promise.reject({ success: false, message: 'Network error. Please check your connection.' });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({ success: false, message: error.message });
    }
  }
);

// Check network connectivity
export const checkConnectivity = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

// API Service
const api = {
  // Auth APIs
  auth: {
    login: async (hotelId, role, email, password) => {
      return apiClient.post('/auth/login', { hotelId, role, email, password });
    },
    me: async () => {
      return apiClient.get('/auth/me');
    },
  },

  // Table APIs
  tables: {
    getAll: async () => {
      return apiClient.get('/tables');
    },
    getById: async (tableId) => {
      return apiClient.get(`/tables/${tableId}`);
    },
    create: async (tableData) => {
      return apiClient.post('/tables', tableData);
    },
    updateStatus: async (tableId, status) => {
      return apiClient.put(`/tables/${tableId}/status`, { status });
    },
    update: async (tableId, data) => {
      return apiClient.put(`/tables/${tableId}`, data);
    },
  },

  // Order APIs
  orders: {
    getAll: async () => {
      return apiClient.get('/orders');
    },
    getKitchen: async () => {
      return apiClient.get('/orders/kitchen');
    },
    getByTable: async (tableId) => {
      return apiClient.get(`/orders/table/${tableId}`);
    },
    getPreviousOrders: async (tableId) => {
      return apiClient.get(`/orders/table/${tableId}/previous`);
    },
    getTimers: async () => {
      return apiClient.get('/orders/timers');
    },
    create: async (orderData) => {
      return apiClient.post('/orders', orderData);
    },
    updateStatus: async (orderId, status) => {
      return apiClient.put(`/orders/${orderId}/status`, { status });
    },
    updateItemStatus: async (orderId, itemId, status) => {
      return apiClient.put(`/orders/${orderId}/items/${itemId}/status`, { status });
    },
    assignWaiter: async (orderId, waiterId) => {
      return apiClient.put(`/orders/${orderId}/assign-waiter`, { waiterId });
    },
    assignCook: async (orderId, cookId) => {
      return apiClient.put(`/orders/${orderId}/assign-cook`, { cookId });
    },
  },

  // Menu APIs
  menu: {
    getAll: async () => {
      return apiClient.get('/menu');
    },
    getById: async (itemId) => {
      return apiClient.get(`/menu/items/${itemId}`);
    },
    create: async (menuData) => {
      return apiClient.post('/menu/items', menuData);
    },
    update: async (itemId, menuData) => {
      return apiClient.put(`/menu/items/${itemId}`, menuData);
    },
    delete: async (itemId) => {
      return apiClient.delete(`/menu/items/${itemId}`);
    },
    // Menu Items
    getAllItems: async () => {
      return apiClient.get('/menu');
    },
    createItem: async (itemData) => {
      return apiClient.post('/menu/items', itemData);
    },
    updateItem: async (itemId, itemData) => {
      return apiClient.put(`/menu/items/${itemId}`, itemData);
    },
    deleteItem: async (itemId) => {
      return apiClient.delete(`/menu/items/${itemId}`);
    },
    // Ingredients
    getIngredients: async () => {
      return apiClient.get('/menu/ingredients');
    },
    addIngredient: async (ingredientData) => {
      return apiClient.post('/menu/ingredients', ingredientData);
    },
    updateIngredientStock: async (ingredientName, adjustment) => {
      return apiClient.put(`/menu/ingredients/${encodeURIComponent(ingredientName)}/stock`, { adjustment });
    },
    deleteIngredient: async (ingredientName) => {
      return apiClient.delete(`/menu/ingredients/${encodeURIComponent(ingredientName)}`);
    },
  },

  // Bill APIs
  bills: {
    getAll: async () => {
      return apiClient.get('/bills');
    },
    getById: async (billId) => {
      return apiClient.get(`/bills/${billId}`);
    },
    create: async (billData) => {
      return apiClient.post('/bills', billData);
    },
    pay: async (billId, paymentData) => {
      return apiClient.post(`/bills/${billId}/pay`, paymentData);
    },
  },

  // Employee APIs
  employees: {
    getAll: async () => {
      return apiClient.get('/employees');
    },
    getById: async (employeeId) => {
      return apiClient.get(`/employees/${employeeId}`);
    },
    create: async (employeeData) => {
      return apiClient.post('/employees', employeeData);
    },
    update: async (employeeId, employeeData) => {
      return apiClient.put(`/employees/${employeeId}`, employeeData);
    },
    delete: async (employeeId) => {
      return apiClient.delete(`/employees/${employeeId}`);
    },
  },

  // Analytics APIs
  analytics: {
    getDashboard: async (range = 'today') => {
      return apiClient.get(`/analytics/dashboard?range=${range}`);
    },
    getRevenue: async (startDate, endDate) => {
      return apiClient.get(`/analytics/revenue?start=${startDate}&end=${endDate}`);
    },
    getOccupancy: async () => {
      return apiClient.get('/analytics/occupancy');
    },
  },

  // Reservation APIs
  reservations: {
    getAll: async () => {
      return apiClient.get('/reservations');
    },
    create: async (reservationData) => {
      return apiClient.post('/reservations', reservationData);
    },
    update: async (reservationId, reservationData) => {
      return apiClient.put(`/reservations/${reservationId}`, reservationData);
    },
    cancel: async (reservationId) => {
      return apiClient.delete(`/reservations/${reservationId}`);
    },
  },
};

export default api;
