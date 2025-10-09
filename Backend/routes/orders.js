import express from 'express';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Menu from '../models/Menu.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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

    // Calculate summary statistics (using new schema)
    const ongoingOrders = orderDocument.orders.filter(order => order.orderStatus === 'ONGOING');
    const completedOrders = orderDocument.orders.filter(order => order.orderStatus === 'COMPLETED');
    const pendingPayments = orderDocument.orders.filter(order => order.billDetails?.paymentStatus === 'PENDING');
    const paidOrders = orderDocument.orders.filter(order => order.billDetails?.paymentStatus === 'PAID');
    
    const orderStats = {
      totalOrders: orderDocument.orders.length,
      ongoingOrders: ongoingOrders.length,
      completedOrders: completedOrders.length,
      pendingPayments: pendingPayments.length,
      totalRevenue: paidOrders.reduce((sum, order) => sum + (order.billDetails?.grandTotal || 0), 0),
      pendingAmount: pendingPayments.reduce((sum, order) => sum + (order.billDetails?.grandTotal || 0), 0),
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
    const { tableId, customer, items, orderType, notes } = req.body;
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

    // Find the order document
    let orderDocument = await Order.findById(hotelId);

    if (!orderDocument) {
      // If no order document exists, create one first
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      orderDocument = new Order({
        _id: hotelId,
        hotelName: hotel.name,
        orders: [],
        isActive: true
      });
    }

    // Generate unique order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Validate and process order items (new schema)
    const processedItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      if (!item.menuItemId || !item.name || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have menuItemId, name, quantity, and unitPrice'
        });
      }

      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      
      processedItems.push({
        itemId: item.menuItemId,
        itemName: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        totalPrice: totalPrice
      });
    }

    // Calculate tax (assuming 5% tax rate)
    const tax = subtotal * 0.05;
    const grandTotal = subtotal + tax;

    // Create new order (new schema)
    const newOrder = {
      orderId: orderId,
      tableId: tableId,
      orderStatus: 'ONGOING',
      orderedItems: processedItems,
      billDetails: {
        subtotal: subtotal,
        tax: tax,
        grandTotal: grandTotal,
        paymentMethod: null,
        paymentStatus: 'PENDING'
      },
      orderTime: {
        placedAt: new Date(),
        completedAt: null
      },
      waiterAssigned: req.user.email || 'Unknown',
      isActive: true
    };

    // Add the order
    orderDocument.orders.push(newOrder);

    // Save the document (pre-save middleware will calculate totals)
    await orderDocument.save();

    // Get the created order (with calculated totals)
    const createdOrder = orderDocument.orders[orderDocument.orders.length - 1];

    console.log(`✅ Order "${orderId}" created successfully for table ${tableId}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: createdOrder,
        orderId: orderId,
        totalOrders: orderDocument.orders.length
      }
    });

  } catch (error) {
    console.error('❌ Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while creating order',
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

    console.log(`✅ Order ${orderId} status updated to ${orderStatus}`);

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