import NetInfo from '@react-native-community/netinfo';
import api from './api';
import storage from './storage';

class SyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.listeners = [];
    
    // Monitor network status
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      // If we just came back online, sync pending operations
      if (wasOffline && this.isOnline) {
        console.log('📡 Back online - syncing pending operations');
        this.syncPendingOperations();
      }
      
      // Notify listeners
      this.notifyListeners({ online: this.isOnline });
    });
  }

  // Subscribe to sync events
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }

  // Check if online
  async checkOnline() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected;
    return this.isOnline;
  }

  // Sync pending operations
  async syncPendingOperations() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    try {
      this.syncInProgress = true;
      const pending = await storage.getPendingSync();
      
      if (pending.length === 0) {
        console.log('✅ No pending operations to sync');
        return;
      }

      console.log(`🔄 Syncing ${pending.length} pending operations`);
      
      for (const operation of pending) {
        try {
          await this.executePendingOperation(operation);
          await storage.removePendingSync(operation.id);
          console.log(`✅ Synced operation: ${operation.type}`);
        } catch (error) {
          console.error(`❌ Failed to sync operation ${operation.id}:`, error);
          // Keep the operation in pending queue
        }
      }

      await storage.setLastSync();
      this.notifyListeners({ type: 'sync_complete', success: true });
      
    } catch (error) {
      console.error('❌ Sync error:', error);
      this.notifyListeners({ type: 'sync_complete', success: false, error });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Execute a pending operation
  async executePendingOperation(operation) {
    const { type, data } = operation;

    switch (type) {
      case 'CREATE_ORDER':
        return api.orders.create(data);
      
      case 'UPDATE_ORDER_STATUS':
        return api.orders.updateStatus(data.orderId, data.status);
      
      case 'UPDATE_TABLE_STATUS':
        return api.tables.updateStatus(data.tableId, data.status);
      
      case 'CREATE_TABLE':
        return api.tables.create(data);
      
      case 'UPDATE_ITEM_STATUS':
        return api.orders.updateItemStatus(data.orderId, data.itemId, data.status);
      
      case 'ASSIGN_WAITER':
        return api.orders.assignWaiter(data.orderId, data.waiterId);
      
      case 'CREATE_BILL':
        return api.bills.create(data);
      
      case 'PAY_BILL':
        return api.bills.pay(data.billId, data.paymentData);
      
      default:
        console.warn(`Unknown operation type: ${type}`);
        return null;
    }
  }

  // Add operation to pending queue (for offline mode)
  async queueOperation(type, data) {
    const operation = { type, data };
    await storage.addPendingSync(operation);
    console.log(`📝 Queued operation: ${type}`);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  // Fetch and cache data
  async fetchAndCacheTables() {
    try {
      if (!this.isOnline) {
        console.log('📱 Offline - loading tables from cache');
        return await storage.getTables();
      }

      const response = await api.tables.getAll();
      if (response.success) {
        await storage.saveTables(response.data);
        return response.data;
      }
      
      // Fallback to cache if API fails
      return await storage.getTables();
    } catch (error) {
      console.error('Error fetching tables:', error);
      return await storage.getTables();
    }
  }

  async fetchAndCacheOrders() {
    try {
      if (!this.isOnline) {
        console.log('📱 Offline - loading orders from cache');
        return await storage.getOrders();
      }

      const response = await api.orders.getAll();
      if (response.success) {
        await storage.saveOrders(response.data);
        return response.data;
      }
      
      return await storage.getOrders();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return await storage.getOrders();
    }
  }

  async fetchAndCacheMenu() {
    try {
      if (!this.isOnline) {
        console.log('📱 Offline - loading menu from cache');
        return await storage.getMenu();
      }

      console.log('🍽️ Fetching menu from API...');
      const response = await api.menu.getAll();
      console.log('📋 Menu API response:', response);
      
      if (response && response.success && response.data) {
        // Backend returns menuItems inside data object
        const rawMenuItems = response.data.menuItems || [];
        console.log('✅ Menu items fetched:', rawMenuItems.length);
        
        // Map backend fields to frontend expected format
        const menuItems = rawMenuItems.map(item => ({
          _id: item.itemId || item._id,
          itemId: item.itemId,
          name: item.name,
          price: item.price || 0,
          avgPrepTimeMins: item.preparationTime || item.avgPrepTimeMins || 15,
          preparationTime: item.preparationTime,
          category: item.category,
          description: item.description,
          ingredients: item.ingredients || [],
          isAvailable: item.isAvailable !== false
        }));
        
        console.log('✅ Mapped menu items:', menuItems.length);
        await storage.saveMenu(menuItems);
        return menuItems;
      }
      
      console.log('⚠️ No menu data, loading from cache');
      return await storage.getMenu();
    } catch (error) {
      console.error('❌ Error fetching menu:', error);
      return await storage.getMenu();
    }
  }

  // Cleanup
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Export singleton instance
const syncService = new SyncService();
export default syncService;
