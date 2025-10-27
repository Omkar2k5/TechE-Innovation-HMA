import express from 'express';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Table from '../models/Table.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Owner, Manager)
router.get('/dashboard', protect, authorize('owner', 'manager'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { range = 'today' } = req.query; // today, 7d, 30d

    console.log('📊 Fetching dashboard analytics:', { hotelId, range });

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'today':
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
    }

    // Fetch all required data
    const [tableDocument, orderDocument, billDocument] = await Promise.all([
      Table.findById(hotelId),
      Order.findById(hotelId),
      Bill.findById(hotelId)
    ]);

    // Table status overview
    const tables = tableDocument?.tables || [];
    const activeTables = tables.filter(t => t.isActive);
    
    const tableStats = {
      total: activeTables.length,
      vacant: activeTables.filter(t => t.status === 'VACANT').length,
      occupied: activeTables.filter(t => t.status === 'OCCUPIED').length,
      reserved: activeTables.filter(t => t.status === 'RESERVED').length,
      maintenance: activeTables.filter(t => t.status === 'MAINTENANCE').length
    };

    // Occupancy metrics
    const occupancyRate = tableStats.total > 0 
      ? ((tableStats.occupied / tableStats.total) * 100).toFixed(1)
      : 0;

    // Table details with order timers
    const tableDetails = tables.map(table => {
      // Find active orders for this table
      const tableOrders = orderDocument?.orders?.filter(o => 
        o.tableId === table.tableId && 
        ['PENDING', 'PREPARING', 'READY'].includes(o.orderStatus) &&
        o.isActive
      ) || [];

      // Calculate time since order placed
      let orderTimer = null;
      if (tableOrders.length > 0) {
        const latestOrder = tableOrders[tableOrders.length - 1];
        const orderTime = new Date(latestOrder.orderTime?.placedAt || latestOrder.createdAt);
        const minutesElapsed = Math.floor((now - orderTime) / 60000);
        orderTimer = {
          orderId: latestOrder.orderId,
          status: latestOrder.orderStatus,
          minutesElapsed,
          estimatedCompletion: latestOrder.estimatedCompletionTime
        };
      }

      return {
        tableId: table.tableId,
        capacity: table.capacity,
        status: table.status,
        isActive: table.isActive,
        orderTimer
      };
    });

    // Filter bills in date range
    const billsInRange = billDocument?.bills?.filter(bill => {
      const billDate = new Date(bill.billGeneratedAt);
      return billDate >= startDate && billDate <= now;
    }) || [];

    // Revenue metrics
    const paidBills = billsInRange.filter(b => b.paymentDetails?.paymentStatus === 'PAID');
    const pendingBills = billsInRange.filter(b => b.paymentDetails?.paymentStatus === 'PENDING');
    
    const totalRevenue = paidBills.reduce((sum, bill) => 
      sum + (bill.paymentDetails?.grandTotal || 0), 0
    );

    const pendingAmount = pendingBills.reduce((sum, bill) => 
      sum + (bill.paymentDetails?.grandTotal || 0), 0
    );

    // Order metrics
    const ordersInRange = orderDocument?.orders?.filter(order => {
      const orderDate = new Date(order.orderTime?.placedAt || order.createdAt);
      return orderDate >= startDate && orderDate <= now;
    }) || [];

    const completedOrders = ordersInRange.filter(o => o.orderStatus === 'COMPLETED');

    // Average turnaround time (from order placed to served)
    let avgTurnaroundMinutes = 0;
    if (completedOrders.length > 0) {
      const turnaroundTimes = completedOrders
        .filter(o => o.orderTime?.placedAt && o.orderTime?.servedAt)
        .map(o => {
          const placed = new Date(o.orderTime.placedAt);
          const served = new Date(o.orderTime.servedAt);
          return (served - placed) / 60000; // minutes
        });

      if (turnaroundTimes.length > 0) {
        avgTurnaroundMinutes = Math.round(
          turnaroundTimes.reduce((sum, time) => sum + time, 0) / turnaroundTimes.length
        );
      }
    }

    // Order status breakdown
    const orderStats = {
      total: ordersInRange.length,
      pending: ordersInRange.filter(o => o.orderStatus === 'PENDING').length,
      preparing: ordersInRange.filter(o => o.orderStatus === 'PREPARING').length,
      ready: ordersInRange.filter(o => o.orderStatus === 'READY').length,
      served: ordersInRange.filter(o => o.orderStatus === 'SERVED').length,
      completed: completedOrders.length
    };

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    paidBills.forEach(bill => {
      const method = bill.paymentDetails?.paymentMethod || 'Unknown';
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[method].count++;
      paymentMethodBreakdown[method].amount += bill.paymentDetails?.grandTotal || 0;
    });

    // Peak hours analysis (hourly breakdown)
    const hourlyOrders = Array(24).fill(0);
    ordersInRange.forEach(order => {
      const orderDate = new Date(order.orderTime?.placedAt || order.createdAt);
      const hour = orderDate.getHours();
      hourlyOrders[hour]++;
    });

    const peakHour = hourlyOrders.indexOf(Math.max(...hourlyOrders));

    // Construct response
    const analytics = {
      dateRange: {
        range,
        startDate,
        endDate: now
      },
      overview: {
        activeTables: `${tableStats.occupied}/${tableStats.total}`,
        occupancyRate: `${occupancyRate}%`,
        totalRevenue,
        pendingAmount,
        avgTurnaroundMinutes,
        avgTurnaroundDisplay: `${avgTurnaroundMinutes} mins`
      },
      tables: {
        stats: tableStats,
        details: tableDetails
      },
      orders: orderStats,
      revenue: {
        total: totalRevenue,
        pending: pendingAmount,
        billCount: paidBills.length,
        avgBillAmount: paidBills.length > 0 ? (totalRevenue / paidBills.length).toFixed(2) : 0
      },
      paymentMethods: paymentMethodBreakdown,
      peakHour: {
        hour: peakHour,
        orderCount: hourlyOrders[peakHour],
        display: `${peakHour}:00 - ${(peakHour + 1) % 24}:00`
      },
      hourlyBreakdown: hourlyOrders
    };

    console.log('✅ Dashboard analytics generated successfully');

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: analytics
    });

  } catch (error) {
    console.error('❌ Get Dashboard Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
