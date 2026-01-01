import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_ROLE: 'userRole',
  HOTEL_ID: 'hotelId',
  HOTEL_NAME: 'hotelName',
  USER_EMAIL: 'userEmail',
  TABLES_CACHE: 'tablesCache',
  ORDERS_CACHE: 'ordersCache',
  MENU_CACHE: 'menuCache',
  PENDING_SYNC: 'pendingSync',
  LAST_SYNC: 'lastSync',
};

const storage = {
  // Auth storage
  async saveAuthData(token, role, hotelId, hotelName, email) {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        [STORAGE_KEYS.USER_ROLE, role],
        [STORAGE_KEYS.HOTEL_ID, hotelId],
        [STORAGE_KEYS.HOTEL_NAME, hotelName],
        [STORAGE_KEYS.USER_EMAIL, email],
      ]);
      return true;
    } catch (error) {
      console.error('Error saving auth data:', error);
      return false;
    }
  },

  async getAuthData() {
    try {
      const keys = [
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.HOTEL_ID,
        STORAGE_KEYS.HOTEL_NAME,
        STORAGE_KEYS.USER_EMAIL,
      ];
      const values = await AsyncStorage.multiGet(keys);
      
      return {
        token: values[0][1],
        role: values[1][1],
        hotelId: values[2][1],
        hotelName: values[3][1],
        email: values[4][1],
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return null;
    }
  },

  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.HOTEL_ID,
        STORAGE_KEYS.HOTEL_NAME,
        STORAGE_KEYS.USER_EMAIL,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  },

  // Cache management
  async saveToCache(key, data) {
    try {
      const jsonData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(key, jsonData);
      return true;
    } catch (error) {
      console.error(`Error saving to cache (${key}):`, error);
      return false;
    }
  },

  async getFromCache(key, maxAge = 3600000) { // Default 1 hour
    try {
      const jsonData = await AsyncStorage.getItem(key);
      if (!jsonData) return null;

      const { data, timestamp } = JSON.parse(jsonData);
      const age = Date.now() - new Date(timestamp).getTime();

      if (age > maxAge) {
        // Cache expired
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error getting from cache (${key}):`, error);
      return null;
    }
  },

  async clearCache(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error clearing cache (${key}):`, error);
      return false;
    }
  },

  // Tables cache
  async saveTables(tables) {
    return this.saveToCache(STORAGE_KEYS.TABLES_CACHE, tables);
  },

  async getTables() {
    return this.getFromCache(STORAGE_KEYS.TABLES_CACHE, 300000); // 5 minutes
  },

  // Orders cache
  async saveOrders(orders) {
    return this.saveToCache(STORAGE_KEYS.ORDERS_CACHE, orders);
  },

  async getOrders() {
    return this.getFromCache(STORAGE_KEYS.ORDERS_CACHE, 60000); // 1 minute
  },

  // Menu cache
  async saveMenu(menu) {
    return this.saveToCache(STORAGE_KEYS.MENU_CACHE, menu);
  },

  async getMenu() {
    return this.getFromCache(STORAGE_KEYS.MENU_CACHE, 3600000); // 1 hour
  },

  // Pending sync operations
  async addPendingSync(operation) {
    try {
      const pending = await this.getPendingSync();
      pending.push({
        ...operation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
      return true;
    } catch (error) {
      console.error('Error adding pending sync:', error);
      return false;
    }
  },

  async getPendingSync() {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      return jsonData ? JSON.parse(jsonData) : [];
    } catch (error) {
      console.error('Error getting pending sync:', error);
      return [];
    }
  },

  async removePendingSync(operationId) {
    try {
      const pending = await this.getPendingSync();
      const filtered = pending.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing pending sync:', error);
      return false;
    }
  },

  async clearPendingSync() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
      return true;
    } catch (error) {
      console.error('Error clearing pending sync:', error);
      return false;
    }
  },

  // Last sync timestamp
  async setLastSync() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Error setting last sync:', error);
      return false;
    }
  },

  async getLastSync() {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Error getting last sync:', error);
      return null;
    }
  },

  // Clear all data
  async clearAll() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all storage:', error);
      return false;
    }
  },
};

export default storage;
export { STORAGE_KEYS };
