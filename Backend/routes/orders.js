import express from 'express';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Table from '../models/Table.js';
import Menu from '../models/Menu.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get orders for cook dashboard (kitchen view)
// @route   GET /api/orders/kitchen
// @access  Private (Cook, Manager, Owner)
router.get('/kitchen', protect, authorize('cook', 'manager', 'owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching orders for kitchen:', hotelId);

    // Find order document for hotel ID
    let orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(200).json({
        success: true,
        message: 'No orders found',
        data: {
          orders: [],
          stats: {
            pending: 0,
            preparing: 0,
            ready: 0,
            totalActive: 0
          }
        }
      });
    }

    // Filter active orders (not served or cancelled)
    const activeOrders = orderDocument.orders.filter(order => 
      ['PENDING', 'PREPARING', 'READY'].includes(order.orderStatus) && order.isActive
    );

    // Calculate statistics
    const stats = {
      pending: activeOrders.filter(o => o.orderStatus === 'PENDING').length,
      preparing: activeOrders.filter(o => o.orderStatus === 'PREPARING').length,
      ready: activeOrders.filter(o => o.orderStatus === 'READY').length,
      totalActive: activeOrders.length
    };

    console.log('✅ Kitchen orders found:', activeOrders.length, 'active orders');

    res.status(200).json({
      success: true,
      message: 'Kitchen orders retrieved successfully',
      data: {
        orders: activeOrders,
        stats: stats
      }
    });

  } catch (error) {
    console.error('❌ Get Kitchen Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching kitchen orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all orders for a hotel
// @route   GET /api/orders
// @access  Private (Receptionist, Manager, Owner)
router.get('/', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching orders for hotel:', hotelId);

    // Find or create orders document for hotel ID
    let orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      console.log('📝 No order document found for hotel:', hotelId, '- Creating new one');
      
      // Get hotel information to create order document
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);
      
      if (!hotel) {
        console.log('❌ Hotel not found:', hotelId);
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      // Create new order document with empty arrays (new schema)
      orderDocument = new Order({
        _id: hotelId,
        hotelName: hotel.name,
        orders: [],
        isActive: true
      });
      
      await orderDocument.save();
      console.log('✅ Created new order document for hotel:', hotel.name);
    }

    console.log('✅ Orders found:', orderDocument.orders.length, 'orders');

    // Calculate summary statistics (kitchen-focused, no billing data)
    const pendingOrders = orderDocument.orders.filter(order => order.orderStatus === 'PENDING');
    const preparingOrders = orderDocument.orders.filter(order => order.orderStatus === 'PREPARING');
    const readyOrders = orderDocument.orders.filter(order => order.orderStatus === 'READY');
    const servedOrders = orderDocument.orders.filter(order => order.orderStatus === 'SERVED');
    const completedOrders = orderDocument.orders.filter(order => order.orderStatus === 'COMPLETED');
    
    const orderStats = {
      totalOrders: orderDocument.orders.length,
      pendingOrders: pendingOrders.length,
      preparingOrders: preparingOrders.length,
      readyOrders: readyOrders.length,
      servedOrders: servedOrders.length,
      completedOrders: completedOrders.length,
      todayOrders: orderDocument.orders.filter(order => {
        const today = new Date();
        const orderDate = new Date(order.orderTime?.placedAt || order.createdAt);
        return orderDate.toDateString() === today.toDateString();
      }).length
    };

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        hotelId: orderDocument._id,
        hotelName: orderDocument.hotelName,
        orders: orderDocument.orders,
        stats: orderStats,
        updatedAt: orderDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Get Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Receptionist, Manager, Owner)
router.post('/', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { tableId, customer, items, orderType, notes, priority } = req.body;
    const hotelId = req.user.hotelId;

    console.log('➕ Creating new order:', { hotelId, tableId, itemCount: items?.length });

    // Validate required fields
    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one order item is required'
      });
    }

    // Get hotel information
    const Hotel = (await import('../models/Hotel.js')).default;
    const hotel = await Hotel.findById(hotelId);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Get menu document to fetch preparation times
    const menuDocument = await Menu.findById(hotelId);
    
    if (!menuDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel menu not found'
      });
    }

    // Find or create order document
    let orderDocument = await Order.findById(hotelId);
    if (!orderDocument) {
      orderDocument = new Order({
        _id: hotelId,
        hotelName: hotel.name,
        orders: [],
        isActive: true
      });
    }

    // Find or create bill document
    let billDocument = await Bill.findById(hotelId);
    if (!billDocument) {
      billDocument = new Bill({
        _id: hotelId,
        hotelName: hotel.name,
        bills: [],
        isActive: true
      });
    }

    // Check if there's an existing unpaid bill for this table
    // If the last bill for this table is PAID, create new order/bill (new customer)
    // Otherwise, append items to existing order/bill
    
    // Filter all bills for this table that are NOT paid
    const unpaidTableBills = billDocument.bills.filter(b => 
      b.tableId === tableId && 
      b.isActive && 
      b.paymentDetails?.paymentStatus !== 'PAID'
    );
    
    console.log(`🔍 Checking table ${tableId} for existing unpaid bills...`);
    console.log(`📊 Found ${unpaidTableBills.length} unpaid bills for table ${tableId}`);
    
    let shouldCreateNew = true;
    let existingOrder = null;
    let existingBill = null;
    
    if (unpaidTableBills.length > 0) {
      // Get the most recent unpaid bill
      const lastUnpaidBill = unpaidTableBills[unpaidTableBills.length - 1];
      console.log(`📝 Found unpaid bill ${lastUnpaidBill.billId} for table ${tableId} with status: ${lastUnpaidBill.paymentDetails?.paymentStatus}`);
      console.log(`➡️ Appending items to existing order/bill instead of creating new`);
      
      shouldCreateNew = false;
      // Find the corresponding order
      existingOrder = orderDocument.orders.find(o => o.billId === lastUnpaidBill.billId);
      existingBill = lastUnpaidBill;
      
      if (!existingOrder) {
        console.warn(`⚠️ Could not find order for bill ${lastUnpaidBill.billId}`);
        shouldCreateNew = true; // Fallback to creating new if order not found
      }
    } else {
      console.log(`✅ No unpaid bills found for table ${tableId} - Creating new order/bill`);
      shouldCreateNew = true;
    }

    // Process items for order (kitchen-focused)
    const orderItems = [];
    let totalEstimatedTime = 0;
    
    // Process items for bill (payment-focused)
    const billItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      if (!item.menuItemId || !item.name || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have menuItemId, name, quantity, and unitPrice'
        });
      }

      // Find menu item to get preparation time
      const menuItem = menuDocument.menuItems.find(mi => mi._id.toString() === item.menuItemId);
      const prepTime = menuItem?.avgPrepTimeMins || menuDocument.menuSettings?.defaultPreparationTime || 15;
      
      if (prepTime > totalEstimatedTime) {
        totalEstimatedTime = prepTime;
      }

      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      
      // Add to order items (kitchen)
      orderItems.push({
        menuItemId: item.menuItemId,
        itemName: item.name,
        quantity: item.quantity,
        preparationTimeMinutes: prepTime,
        status: 'PENDING',
        startedAt: null,
        completedAt: null,
        specialInstructions: item.specialInstructions || ''
      });

      // Add to bill items (payment)
      billItems.push({
        menuItemId: item.menuItemId,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice
      });
    }

    if (shouldCreateNew) {
      // Create new order and bill for new customer
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const billId = `BILL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Calculate tax and service charge (5% tax, 2% service charge)
      const tax = subtotal * 0.05;
      const serviceCharge = subtotal * 0.02;
      const grandTotal = subtotal + tax + serviceCharge;

      // Calculate estimated completion time
      const estimatedCompletion = new Date();
      estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + totalEstimatedTime);

      // Create new order (for kitchen)
      const newOrder = {
        orderId: orderId,
        billId: billId,
        tableId: tableId,
        orderStatus: 'PENDING',
        priority: priority || 'NORMAL',
        orderedItems: orderItems,
        orderTime: {
          placedAt: new Date(),
          startedPreparationAt: null,
          allItemsReadyAt: null,
          servedAt: null
        },
        waiterAssigned: req.user.email || 'Unknown',
        cookAssigned: null,
        estimatedCompletionTime: estimatedCompletion,
        notes: notes || '',
        isActive: true
      };

      // Create new bill (for payment)
      const newBill = {
        billId: billId,
        orderId: orderId,
        tableId: tableId,
        customerInfo: {
          name: customer?.name || 'Walk-in Guest',
          phone: customer?.phone || '',
          groupSize: customer?.groupSize || 1
        },
        items: billItems,
        paymentDetails: {
          subtotal: subtotal,
          tax: tax,
          serviceCharge: serviceCharge,
          discount: 0,
          grandTotal: grandTotal,
          paymentMethod: null,
          paymentStatus: 'PENDING',
          paidAmount: 0,
          changeAmount: 0,
          paidAt: null
        },
        waiterAssigned: req.user.email || 'Unknown',
        billGeneratedAt: new Date(),
        isActive: true,
        notes: notes || ''
      };

      // Add to documents
      orderDocument.orders.push(newOrder);
      billDocument.bills.push(newBill);

      // Save both documents
      await Promise.all([
        orderDocument.save(),
        billDocument.save()
      ]);

      console.log(`✅ NEW Order "${orderId}" and Bill "${billId}" created for table ${tableId}`);

      res.status(201).json({
        success: true,
        message: 'Order and bill created successfully',
        data: {
          orderId: orderId,
          billId: billId,
          order: newOrder,
          bill: newBill,
          estimatedCompletionTime: estimatedCompletion
        }
      });
    } else {
      // Append items to existing order and bill
      if (!existingOrder || !existingBill) {
        return res.status(404).json({
          success: false,
          message: 'Could not find existing order/bill to append to'
        });
      }

      // Append new items to existing order
      existingOrder.orderedItems.push(...orderItems);
      
      // Update estimated completion time if new items take longer
      const currentEstimate = new Date(existingOrder.estimatedCompletionTime);
      const newEstimate = new Date();
      newEstimate.setMinutes(newEstimate.getMinutes() + totalEstimatedTime);
      if (newEstimate > currentEstimate) {
        existingOrder.estimatedCompletionTime = newEstimate;
      }

      // Append notes if provided
      if (notes) {
        existingOrder.notes = existingOrder.notes ? `${existingOrder.notes}; ${notes}` : notes;
      }

      // Append new items to existing bill
      existingBill.items.push(...billItems);
      
      // Recalculate bill totals
      const newSubtotal = existingBill.paymentDetails.subtotal + subtotal;
      const newTax = newSubtotal * 0.05;
      const newServiceCharge = newSubtotal * 0.02;
      const newGrandTotal = newSubtotal + newTax + newServiceCharge - existingBill.paymentDetails.discount;
      
      existingBill.paymentDetails.subtotal = newSubtotal;
      existingBill.paymentDetails.tax = newTax;
      existingBill.paymentDetails.serviceCharge = newServiceCharge;
      existingBill.paymentDetails.grandTotal = newGrandTotal;

      // Append notes if provided
      if (notes) {
        existingBill.notes = existingBill.notes ? `${existingBill.notes}; ${notes}` : notes;
      }

      // Save both documents
      await Promise.all([
        orderDocument.save(),
        billDocument.save()
      ]);

      console.log(`✅ APPENDED ${orderItems.length} items to existing order "${existingOrder.orderId}" for table ${tableId}`);

      res.status(200).json({
        success: true,
        message: `Items appended to existing order successfully`,
        data: {
          orderId: existingOrder.orderId,
          billId: existingBill.billId,
          order: existingOrder,
          bill: existingBill,
          itemsAdded: orderItems.length,
          estimatedCompletionTime: existingOrder.estimatedCompletionTime
        }
      });
    }

  } catch (error) {
    console.error('❌ Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while creating order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Start order preparation (for cook)
// @route   POST /api/orders/:orderId/start
// @access  Private (Cook, Manager, Owner)
router.post('/:orderId/start', protect, authorize('cook', 'manager', 'owner'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('👨‍🍳 Starting order preparation:', { hotelId, orderId });

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel orders not found'
      });
    }

    // Find the specific order
    const orderIndex = orderDocument.orders.findIndex(order => order.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    const order = orderDocument.orders[orderIndex];

    // Update order status to PREPARING
    const startTime = new Date();
    order.orderStatus = 'PREPARING';
    order.orderTime.startedPreparationAt = startTime;
    order.cookAssigned = req.user.email || 'Unknown';

    // Calculate total estimated preparation time
    let maxPrepTime = 0;
    order.orderedItems.forEach(item => {
      if (item.preparationTimeMinutes > maxPrepTime) {
        maxPrepTime = item.preparationTimeMinutes;
      }
    });

    // Recalculate estimated completion time from NOW (when cooking actually starts)
    const newEstimatedCompletion = new Date(startTime);
    newEstimatedCompletion.setMinutes(newEstimatedCompletion.getMinutes() + maxPrepTime);
    order.estimatedCompletionTime = newEstimatedCompletion;

    // Update all items to PREPARING status
    order.orderedItems.forEach(item => {
      if (item.status === 'PENDING') {
        item.status = 'PREPARING';
        item.startedAt = startTime;
      }
    });

    // Save the document
    await orderDocument.save();

    console.log(`✅ Order ${orderId} preparation started`);

    res.status(200).json({
      success: true,
      message: 'Order preparation started',
      data: {
        order: orderDocument.orders[orderIndex],
        updatedAt: orderDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Start Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while starting order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update order item status (for cook)
// @route   PUT /api/orders/:orderId/items/:itemIndex
// @access  Private (Cook, Manager, Owner)
router.put('/:orderId/items/:itemIndex', protect, authorize('cook', 'manager', 'owner'), async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { status } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Updating order item:', { hotelId, orderId, itemIndex, status });

    if (!['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, PREPARING, READY, or SERVED'
      });
    }

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel orders not found'
      });
    }

    // Find the specific order
    const orderIndex = orderDocument.orders.findIndex(order => order.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    const order = orderDocument.orders[orderIndex];
    const idx = parseInt(itemIndex);

    if (idx < 0 || idx >= order.orderedItems.length) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const item = order.orderedItems[idx];

    // Update item status
    item.status = status;

    if (status === 'PREPARING' && !item.startedAt) {
      item.startedAt = new Date();
    }

    if (status === 'READY' && !item.completedAt) {
      item.completedAt = new Date();
    }

    // Check if all items are ready
    const allReady = order.orderedItems.every(i => i.status === 'READY' || i.status === 'SERVED');
    
    if (allReady) {
      order.orderStatus = 'READY';
      if (!order.orderTime.allItemsReadyAt) {
        order.orderTime.allItemsReadyAt = new Date();
      }
    } else if (order.orderedItems.some(i => i.status === 'PREPARING')) {
      order.orderStatus = 'PREPARING';
    }

    // Save the document
    await orderDocument.save();

    console.log(`✅ Order item ${idx} updated to ${status}`);

    res.status(200).json({
      success: true,
      message: 'Order item updated successfully',
      data: {
        order: orderDocument.orders[orderIndex],
        updatedItem: item,
        allReady: allReady
      }
    });

  } catch (error) {
    console.error('❌ Update Order Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating order item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:orderId
// @access  Private (Receptionist, Manager, Owner)
router.put('/:orderId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, completedAt } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Updating order status:', { hotelId, orderId, orderStatus });

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel orders not found'
      });
    }

    // Find the specific order
    const orderIndex = orderDocument.orders.findIndex(order => order.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    // Update the order status
    const order = orderDocument.orders[orderIndex];
    const oldStatus = order.orderStatus;
    
    // Special handling for cancelled orders - delete them completely
    if (orderStatus === 'CANCELLED') {
      // Remove the order from the array
      const deletedOrder = orderDocument.orders[orderIndex];
      orderDocument.orders.splice(orderIndex, 1);
      
      // Update document timestamps
      orderDocument.updatedAt = new Date();
      
      // Save the document
      await orderDocument.save();
      
      console.log(`🗑️ Order ${orderId} cancelled and deleted from database`);
      console.log(`📊 Remaining orders: ${orderDocument.orders.length}`);
      
      res.status(200).json({
        success: true,
        message: 'Order cancelled and removed successfully',
        data: {
          orderId: orderId,
          status: 'deleted',
          tableId: deletedOrder.tableId,
          remainingOrders: orderDocument.orders.length
        }
      });
      return;
    }
    
    // For all other status updates, just update the status
    if (orderStatus !== undefined) {
      order.orderStatus = orderStatus;
      
      // If marking as completed, set completion time
      if (orderStatus === 'COMPLETED' && completedAt) {
        order.orderTime.completedAt = new Date(completedAt);
      }
      
      // Update isActive flag
      order.isActive = orderStatus === 'ONGOING';
    }
    
    // Update document timestamps
    orderDocument.updatedAt = new Date();

    // Save the document
    await orderDocument.save();

    console.log(`✅ Order ${orderId} status updated from ${oldStatus} to ${orderStatus}`);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: orderDocument.orders[orderIndex],
        updatedAt: orderDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Update Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update billing status (payment)
// @route   PUT /api/orders/:orderId/billing
// @access  Private (Receptionist, Manager, Owner)
router.put('/:orderId/billing', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentMethod, billDetails } = req.body;
    const hotelId = req.user.hotelId;

    console.log('💳 Updating billing:', { hotelId, orderId, paymentStatus, paymentMethod, billDetails });

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel orders not found'
      });
    }

    // Find the specific order
    const orderIndex = orderDocument.orders.findIndex(order => order.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    // Update the billing information
    const order = orderDocument.orders[orderIndex];
    
    if (paymentStatus !== undefined) {
      order.billDetails.paymentStatus = paymentStatus;
    }
    
    if (paymentMethod !== undefined) {
      order.billDetails.paymentMethod = paymentMethod;
    }
    
    // Update bill details (subtotal, tax, grandTotal) if provided
    if (billDetails !== undefined) {
      if (billDetails.subtotal !== undefined) {
        order.billDetails.subtotal = billDetails.subtotal;
      }
      if (billDetails.tax !== undefined) {
        order.billDetails.tax = billDetails.tax;
      }
      if (billDetails.grandTotal !== undefined) {
        order.billDetails.grandTotal = billDetails.grandTotal;
      }
    }
    
    // Update document timestamps
    orderDocument.updatedAt = new Date();

    // Save the document
    await orderDocument.save();

    console.log(`✅ Billing updated for order ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Billing status updated successfully',
      data: {
        order: orderDocument.orders[orderIndex],
        updatedAt: orderDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Update Billing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating billing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:orderId
// @access  Private (Receptionist, Manager, Owner)
router.delete('/:orderId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🗑️ Deleting order:', { hotelId, orderId });

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel orders not found'
      });
    }

    // Find the specific order
    const orderIndex = orderDocument.orders.findIndex(order => order.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    // Remove the order
    const deletedOrder = orderDocument.orders[orderIndex];
    orderDocument.orders.splice(orderIndex, 1);

    // Save the document
    await orderDocument.save();

    console.log(`✅ Order ${orderId} deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      data: {
        deletedOrder: deletedOrder,
        remainingOrders: orderDocument.orders.length
      }
    });

  } catch (error) {
    console.error('❌ Delete Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get orders for specific table
// @route   GET /api/orders/table/:tableId
// @access  Private (Receptionist, Manager, Owner)
router.get('/table/:tableId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { tableId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching orders for table:', { hotelId, tableId });

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(200).json({
        success: true,
        message: 'No orders found for table',
        data: {
          orders: []
        }
      });
    }

    // Find orders for the specific table
    const tableOrders = orderDocument.orders.filter(order => order.tableId === tableId);

    console.log(`✅ Found ${tableOrders.length} orders for table ${tableId}`);

    res.status(200).json({
      success: true,
      message: 'Table orders retrieved successfully',
      data: {
        tableId: tableId,
        orders: tableOrders,
        activeOrders: tableOrders.filter(order => order.status === 'active'),
        completedOrders: tableOrders.filter(order => order.status === 'completed')
      }
    });

  } catch (error) {
    console.error('❌ Get Table Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching table orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Process payment for order
// @route   POST /api/orders/:orderId/payment
// @access  Private (Receptionist, Manager, Owner)
router.post('/:orderId/payment', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, paidAmount, discount } = req.body;
    const hotelId = req.user.hotelId;

    console.log('💳 Processing payment for order:', { hotelId, orderId, paymentMethod, paidAmount });

    // Find the order document
    const orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel orders not found'
      });
    }

    // Find the specific order
    const orderIndex = orderDocument.orders.findIndex(order => order.orderId === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Order ${orderId} not found`
      });
    }

    const order = orderDocument.orders[orderIndex];

    // Apply discount if provided
    if (discount !== undefined) {
      order.billing.discount = Math.max(0, discount);
    }

    // Recalculate total with discount
    const subtotal = order.billing.subtotal;
    const tax = order.billing.tax;
    const serviceCharge = order.billing.serviceCharge;
    const finalTotal = Math.max(0, subtotal + tax + serviceCharge - order.billing.discount);
    order.billing.total = finalTotal;

    // Process payment
    order.billing.paymentMethod = paymentMethod || 'cash';
    order.billing.paidAmount = paidAmount || finalTotal;
    order.billing.changeAmount = Math.max(0, order.billing.paidAmount - finalTotal);
    order.billing.isPaid = true;
    order.billing.paidAt = new Date();
    
    // Mark order as completed if not already
    if (order.status === 'active') {
      order.status = 'completed';
      order.completedAt = new Date();
    }
    
    order.updatedAt = new Date();

    // Save the document
    await orderDocument.save();

    console.log(`✅ Payment processed for order ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        order: orderDocument.orders[orderIndex],
        receipt: {
          orderId: orderId,
          tableId: order.tableId,
          subtotal: order.billing.subtotal,
          tax: order.billing.tax,
          serviceCharge: order.billing.serviceCharge,
          discount: order.billing.discount,
          total: order.billing.total,
          paidAmount: order.billing.paidAmount,
          changeAmount: order.billing.changeAmount,
          paymentMethod: order.billing.paymentMethod,
          paidAt: order.billing.paidAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Process Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while processing payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;