import express from 'express';
import Bill from '../models/Bill.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all bills for a hotel
// @route   GET /api/bills
// @access  Private (Receptionist, Manager, Owner)
router.get('/', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching bills for hotel:', hotelId);

    // Find or create bill document for hotel ID
    let billDocument = await Bill.findById(hotelId);

    if (!billDocument) {
      console.log('📝 No bill document found for hotel:', hotelId, '- Creating new one');
      
      // Get hotel information to create bill document
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);
      
      if (!hotel) {
        console.log('❌ Hotel not found:', hotelId);
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      // Create new bill document with empty arrays
      billDocument = new Bill({
        _id: hotelId,
        hotelName: hotel.name,
        bills: [],
        isActive: true
      });
      
      await billDocument.save();
      console.log('✅ Created new bill document for hotel:', hotel.name);
    }

    console.log('✅ Bills found:', billDocument.bills.length, 'bills');

    // Calculate summary statistics
    const pendingBills = billDocument.bills.filter(bill => bill.paymentDetails?.paymentStatus === 'PENDING');
    const paidBills = billDocument.bills.filter(bill => bill.paymentDetails?.paymentStatus === 'PAID');
    
    const billStats = {
      totalBills: billDocument.bills.length,
      pendingPayments: pendingBills.length,
      paidBills: paidBills.length,
      totalRevenue: paidBills.reduce((sum, bill) => sum + (bill.paymentDetails?.grandTotal || 0), 0),
      pendingAmount: pendingBills.reduce((sum, bill) => sum + (bill.paymentDetails?.grandTotal || 0), 0),
      todayBills: billDocument.bills.filter(bill => {
        const today = new Date();
        const billDate = new Date(bill.billGeneratedAt);
        return billDate.toDateString() === today.toDateString();
      }).length
    };

    res.status(200).json({
      success: true,
      message: 'Bills retrieved successfully',
      data: {
        hotelId: billDocument._id,
        hotelName: billDocument.hotelName,
        bills: billDocument.bills,
        stats: billStats,
        updatedAt: billDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Get Bills Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching bills',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get bill by ID
// @route   GET /api/bills/:billId
// @access  Private (Receptionist, Manager, Owner)
router.get('/:billId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { billId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching bill:', { hotelId, billId });

    const billDocument = await Bill.findById(hotelId);

    if (!billDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel bills not found'
      });
    }

    const bill = billDocument.bills.find(b => b.billId === billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: `Bill ${billId} not found`
      });
    }

    console.log(`✅ Bill ${billId} found`);

    res.status(200).json({
      success: true,
      message: 'Bill retrieved successfully',
      data: {
        bill: bill
      }
    });

  } catch (error) {
    console.error('❌ Get Bill Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching bill',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update payment status
// @route   PUT /api/bills/:billId/payment
// @access  Private (Receptionist, Manager, Owner)
router.put('/:billId/payment', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { billId } = req.params;
    const { paymentMethod, paymentStatus, paidAmount, discount } = req.body;
    const hotelId = req.user.hotelId;

    console.log('💳 Updating payment:', { hotelId, billId, paymentMethod, paymentStatus });

    const billDocument = await Bill.findById(hotelId);

    if (!billDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel bills not found'
      });
    }

    const billIndex = billDocument.bills.findIndex(b => b.billId === billId);

    if (billIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Bill ${billId} not found`
      });
    }

    const bill = billDocument.bills[billIndex];

    // Apply discount if provided
    if (discount !== undefined) {
      bill.paymentDetails.discount = Math.max(0, discount);
      // Recalculate grand total
      const subtotal = bill.paymentDetails.subtotal;
      const tax = bill.paymentDetails.tax;
      const serviceCharge = bill.paymentDetails.serviceCharge || 0;
      bill.paymentDetails.grandTotal = Math.max(0, subtotal + tax + serviceCharge - discount);
    }

    // Update payment details
    if (paymentMethod !== undefined) {
      bill.paymentDetails.paymentMethod = paymentMethod;
    }

    if (paymentStatus !== undefined) {
      bill.paymentDetails.paymentStatus = paymentStatus;
      
      if (paymentStatus === 'PAID') {
        bill.paymentDetails.paidAt = new Date();
        bill.paymentDetails.paidAmount = paidAmount || bill.paymentDetails.grandTotal;
        bill.paymentDetails.changeAmount = Math.max(0, bill.paymentDetails.paidAmount - bill.paymentDetails.grandTotal);
      }
    }

    await billDocument.save();

    console.log(`✅ Payment updated for bill ${billId}`);

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: {
        bill: billDocument.bills[billIndex],
        updatedAt: billDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Update Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get bills for specific table
// @route   GET /api/bills/table/:tableId
// @access  Private (Receptionist, Manager, Owner)
router.get('/table/:tableId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { tableId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching bills for table:', { hotelId, tableId });

    const billDocument = await Bill.findById(hotelId);

    if (!billDocument) {
      return res.status(200).json({
        success: true,
        message: 'No bills found for table',
        data: {
          bills: []
        }
      });
    }

    const tableBills = billDocument.bills.filter(bill => bill.tableId === tableId);

    console.log(`✅ Found ${tableBills.length} bills for table ${tableId}`);

    res.status(200).json({
      success: true,
      message: 'Table bills retrieved successfully',
      data: {
        tableId: tableId,
        bills: tableBills,
        pendingBills: tableBills.filter(bill => bill.paymentDetails?.paymentStatus === 'PENDING'),
        paidBills: tableBills.filter(bill => bill.paymentDetails?.paymentStatus === 'PAID')
      }
    });

  } catch (error) {
    console.error('❌ Get Table Bills Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching table bills',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete bill
// @route   DELETE /api/bills/:billId
// @access  Private (Manager, Owner)
router.delete('/:billId', protect, authorize('manager', 'owner'), async (req, res) => {
  try {
    const { billId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🗑️ Deleting bill:', { hotelId, billId });

    const billDocument = await Bill.findById(hotelId);

    if (!billDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel bills not found'
      });
    }

    const billIndex = billDocument.bills.findIndex(b => b.billId === billId);

    if (billIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Bill ${billId} not found`
      });
    }

    const deletedBill = billDocument.bills[billIndex];
    billDocument.bills.splice(billIndex, 1);

    await billDocument.save();

    console.log(`✅ Bill ${billId} deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
      data: {
        deletedBill: deletedBill,
        remainingBills: billDocument.bills.length
      }
    });

  } catch (error) {
    console.error('❌ Delete Bill Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting bill',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
