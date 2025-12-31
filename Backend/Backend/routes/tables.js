import express from 'express';
import Table from '../models/Table.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all tables for a hotel
// @route   GET /api/tables
// @access  Private (Receptionist, Manager, Owner)
router.get('/', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching tables for hotel:', hotelId);

  // Find or create tables document for hotel ID
    let tableDocument = await Table.findById(hotelId);

    if (!tableDocument) {
      console.log('📝 No table document found for hotel:', hotelId, '- Creating new one');
      
      // Get hotel information to create table document
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);
      
      if (!hotel) {
        console.log('❌ Hotel not found:', hotelId);
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      // Create new table document with empty tables array
      tableDocument = new Table({
        _id: hotelId,
        name: hotel.name,
        tables: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await tableDocument.save();
      console.log('✅ Created new table document for hotel:', hotel.name);
    }

    console.log('✅ Tables found:', tableDocument.tables.length, 'tables');

    // Return tables with summary statistics
    const tableStats = {
      total: tableDocument.tables.length,
      vacant: tableDocument.tables.filter(t => t.status === 'VACANT' && t.isActive).length,
      occupied: tableDocument.tables.filter(t => t.status === 'OCCUPIED' && t.isActive).length,
      reserved: tableDocument.tables.filter(t => t.status === 'RESERVED' && t.isActive).length,
      maintenance: tableDocument.tables.filter(t => t.status === 'MAINTENANCE' && t.isActive).length,
      inactive: tableDocument.tables.filter(t => !t.isActive).length
    };

    res.status(200).json({
      success: true,
      message: 'Tables retrieved successfully',
      data: {
        hotelId: tableDocument._id,
        hotelName: tableDocument.name,
        tables: tableDocument.tables,
        stats: tableStats,
        lastUpdated: tableDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Get Tables Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching tables',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update table status
// @route   PUT /api/tables/:tableId/status
// @access  Private (Receptionist, Manager, Owner)
router.put('/:tableId/status', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Updating table status:', { hotelId, tableId, status });

    // Validate status
    const validStatuses = ['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find the table document
    const tableDocument = await Table.findById(hotelId);

    if (!tableDocument) {
      console.log('❌ Hotel tables not found:', hotelId);
      return res.status(404).json({
        success: false,
        message: 'Hotel tables not found'
      });
    }

    // Find the specific table
    const tableIndex = tableDocument.tables.findIndex(t => t.tableId === tableId);

    if (tableIndex === -1) {
      console.log('❌ Table not found:', tableId);
      return res.status(404).json({
        success: false,
        message: `Table ${tableId} not found`
      });
    }

    // Check if table is active
    if (!tableDocument.tables[tableIndex].isActive) {
      return res.status(400).json({
        success: false,
        message: `Table ${tableId} is currently inactive`
      });
    }

    // Update the table status
    const oldStatus = tableDocument.tables[tableIndex].status;
    tableDocument.tables[tableIndex].status = status;
    tableDocument.tables[tableIndex].updatedAt = new Date();

    // Save the document
    await tableDocument.save();

    console.log(`✅ Table ${tableId} status updated from ${oldStatus} to ${status}`);

    res.status(200).json({
      success: true,
      message: `Table ${tableId} status updated successfully`,
      data: {
        tableId: tableId,
        oldStatus: oldStatus,
        newStatus: status,
        updatedAt: tableDocument.tables[tableIndex].updatedAt,
        table: tableDocument.tables[tableIndex]
      }
    });

  } catch (error) {
    console.error('❌ Update Table Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating table status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get specific table details
// @route   GET /api/tables/:tableId
// @access  Private (Receptionist, Manager, Owner)
router.get('/:tableId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { tableId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching table details:', { hotelId, tableId });

    // Find the table document
    const tableDocument = await Table.findById(hotelId);

    if (!tableDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel tables not found'
      });
    }

    // Find the specific table
    const table = tableDocument.tables.find(t => t.tableId === tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table ${tableId} not found`
      });
    }

    console.log(`✅ Table ${tableId} details retrieved`);

    res.status(200).json({
      success: true,
      message: 'Table details retrieved successfully',
      data: {
        hotelId: tableDocument._id,
        hotelName: tableDocument.name,
        table: table
      }
    });

  } catch (error) {
    console.error('❌ Get Table Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching table details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update table information (capacity, active status)
// @route   PUT /api/tables/:tableId
// @access  Private (Manager, Owner only)
router.put('/:tableId', protect, authorize('manager', 'owner'), async (req, res) => {
  try {
    const { tableId } = req.params;
    const { capacity, isActive } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Updating table info:', { hotelId, tableId, capacity, isActive });

    // Find the table document
    const tableDocument = await Table.findById(hotelId);

    if (!tableDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel tables not found'
      });
    }

    // Find the specific table
    const tableIndex = tableDocument.tables.findIndex(t => t.tableId === tableId);

    if (tableIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Table ${tableId} not found`
      });
    }

    // Update fields if provided
    if (capacity !== undefined) {
      if (capacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Table capacity must be at least 1'
        });
      }
      tableDocument.tables[tableIndex].capacity = capacity;
    }

    if (isActive !== undefined) {
      tableDocument.tables[tableIndex].isActive = isActive;
    }

    tableDocument.tables[tableIndex].updatedAt = new Date();

    // Save the document
    await tableDocument.save();

    console.log(`✅ Table ${tableId} information updated`);

    res.status(200).json({
      success: true,
      message: `Table ${tableId} updated successfully`,
      data: {
        table: tableDocument.tables[tableIndex]
      }
    });

  } catch (error) {
    console.error('❌ Update Table Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating table',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Add new table to hotel
// @route   POST /api/tables
// @access  Private (Receptionist, Manager, Owner)
router.post('/', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { tableId, capacity, status = 'VACANT' } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Adding new table:', { hotelId, tableId, capacity, status });

    // Validation
    if (!tableId || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Table ID and capacity are required'
      });
    }

    if (capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Table capacity must be at least 1'
      });
    }

    // Validate status
    const validStatuses = ['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find or create the table document
    let tableDocument = await Table.findById(hotelId);

    if (!tableDocument) {
      // Create new table document for this hotel
      console.log('📝 Creating new table document for hotel:', hotelId);
      
      // We need the hotel name - let's get it from the Hotel collection
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      tableDocument = new Table({
        _id: hotelId,
        name: hotel.name,
        tables: [],
        isActive: true
      });
    }

    // Check if table ID already exists
    const existingTable = tableDocument.tables.find(t => t.tableId === tableId);
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `Table with ID '${tableId}' already exists`
      });
    }

    // Create new table object
    const newTable = {
      tableId: tableId.trim(),
      capacity: parseInt(capacity),
      status: status,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add the new table
    tableDocument.tables.push(newTable);
    tableDocument.updatedAt = new Date();

    // Save the document
    await tableDocument.save();

    console.log(`✅ New table ${tableId} added successfully`);

    // Return the new table with updated stats
    const tableStats = {
      total: tableDocument.tables.length,
      vacant: tableDocument.tables.filter(t => t.status === 'VACANT' && t.isActive).length,
      occupied: tableDocument.tables.filter(t => t.status === 'OCCUPIED' && t.isActive).length,
      reserved: tableDocument.tables.filter(t => t.status === 'RESERVED' && t.isActive).length,
      maintenance: tableDocument.tables.filter(t => t.status === 'MAINTENANCE' && t.isActive).length,
      inactive: tableDocument.tables.filter(t => !t.isActive).length
    };

    res.status(201).json({
      success: true,
      message: `Table ${tableId} created successfully`,
      data: {
        table: newTable,
        stats: tableStats,
        totalTables: tableDocument.tables.length
      }
    });

  } catch (error) {
    console.error('❌ Add Table Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while adding table',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
