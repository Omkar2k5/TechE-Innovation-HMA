// Push notifications temporarily disabled due to build conflicts
// import PushNotification from 'react-native-push-notification';
import { Platform, Alert } from 'react-native';

class NotificationService {
  constructor() {
    this.configure();
    this.lastNotificationTime = {};
    this.shownNotifications = new Set(); // Track shown notifications
  }

  configure() {
    // Push notifications temporarily disabled
    console.log('Notification service initialized (using Alert fallback)');
  }

  // Send local notification (using Alert as fallback)
  sendNotification(title, message, data = {}, channelId = 'table-reminders') {
    console.log(`📢 Notification: ${title} - ${message}`);
    
    // Show alert for important notifications (order ready, new order)
    if (data.type === 'order_ready' || data.type === 'new_order') {
      // Create unique key including item name if present
      const notificationKey = data.itemName 
        ? `${data.type}_${data.orderId}_${data.itemName}`
        : `${data.type}_${data.orderId}`;
      
      // Check if this notification was already shown
      if (this.shownNotifications.has(notificationKey)) {
        console.log('⏭️ Notification already shown:', notificationKey);
        return;
      }
      
      // Mark as shown and display
      this.shownNotifications.add(notificationKey);
      Alert.alert(title, message, [
        { 
          text: "OK",
          onPress: () => {
            console.log('✅ Notification acknowledged:', notificationKey);
          }
        }
      ]);
    }
  }
  
  // Clear notification tracking for an order (when served/cancelled)
  clearNotification(orderId) {
    const keys = ['order_ready', 'new_order'];
    keys.forEach(type => {
      this.shownNotifications.delete(`${type}_${orderId}`);
    });
  }

  // Schedule notification
  scheduleNotification(title, message, date, data = {}, channelId = 'table-reminders') {
    console.log(`⏰ Scheduled: ${title} - ${message} at ${date}`);
  }

  // Table reminder notification (every 15 minutes)
  sendTableReminder(tableId, elapsedMinutes) {
    const key = `table_${tableId}`;
    const now = Date.now();
    
    // Throttle notifications - don't send more than once per 15 minutes
    if (this.lastNotificationTime[key] && (now - this.lastNotificationTime[key]) < 15 * 60 * 1000) {
      return;
    }

    this.lastNotificationTime[key] = now;
    
    this.sendNotification(
      '⏰ Table Reminder',
      `Table ${tableId} needs attention - ${elapsedMinutes} minutes elapsed`,
      { type: 'table_reminder', tableId, elapsedMinutes },
      'table-reminders'
    );
  }

  // Order ready notification
  sendOrderReadyNotification(tableId, orderId) {
    this.sendNotification(
      '✅ Order Ready',
      `Order for Table ${tableId} is ready to serve`,
      { type: 'order_ready', tableId, orderId },
      'order-updates'
    );
  }

  // Order delayed notification
  sendOrderDelayedNotification(tableId, orderId, delayMinutes) {
    this.sendNotification(
      '⚠️ Order Delayed',
      `Order for Table ${tableId} is delayed by ${delayMinutes} minutes`,
      { type: 'order_delayed', tableId, orderId, delayMinutes },
      'order-updates'
    );
  }

  // New order notification
  sendNewOrderNotification(tableId, orderId) {
    this.sendNotification(
      '🆕 New Order',
      `New order received for Table ${tableId}`,
      { type: 'new_order', tableId, orderId },
      'order-updates'
    );
  }

  // Bill pending notification
  sendBillPendingNotification(tableId) {
    this.sendNotification(
      '💰 Bill Pending',
      `Table ${tableId} is waiting for bill`,
      { type: 'bill_pending', tableId },
      'table-reminders'
    );
  }

  // Cancel all notifications
  cancelAllNotifications() {
    console.log('📢 All notifications cancelled');
  }

  // Cancel notification by ID
  cancelNotification(id) {
    console.log(`📢 Notification ${id} cancelled`);
  }

  // Clear notification badge
  clearBadge() {
    console.log('📢 Badge cleared');
  }

  // Get scheduled notifications
  getScheduledNotifications(callback) {
    console.log('📢 Getting scheduled notifications');
    if (callback) callback([]);
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
