import express from 'express';
import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all reservations for a hotel
router.get('/', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    
    // Find or create reservation document for this hotel
    let reservationDoc = await Reservation.findOne({ _id: hotelId });
    
    if (!reservationDoc) {
      // Create empty reservation document if none exists
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findOne({ _id: hotelId });
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }
      
      reservationDoc = new Reservation({
        _id: hotelId,
        hotelName: hotel.name,
        reservations: [],
        isActive: true
      });
      
      await reservationDoc.save();
    }

    res.json({
      success: true,
      data: reservationDoc.reservations || []
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
});

// Get all reservations without date filter (must be before parameterized routes)
router.get('/all', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    
    // Find reservation document for this hotel
    let reservationDoc = await Reservation.findOne({ _id: hotelId });
    
    if (!reservationDoc) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Return all reservations regardless of date
    res.json({
      success: true,
      data: reservationDoc.reservations || []
    });
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all reservations',
      error: error.message
    });
  }
});

// Get available tables for reservation
router.get('/available-tables', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { guests, date, time } = req.query;
    
    console.log('Fetching available tables for hotel:', hotelId, 'guests:', guests);
    
    // Get table document for hotel
    const tableDoc = await Table.findOne({ _id: hotelId });
    
    if (!tableDoc || !tableDoc.tables || tableDoc.tables.length === 0) {
      console.log('No tables found for hotel:', hotelId);
      return res.json({
        success: true,
        data: []
      });
    }

    console.log('Found', tableDoc.tables.length, 'tables');
    
    // Filter available tables that can accommodate the number of guests
    const availableTables = tableDoc.tables.filter(table => {
      const isAvailable = table.status === 'AVAILABLE' || table.status === 'VACANT';
      const hasCapacity = table.capacity >= parseInt(guests || 1);
      const isActive = table.isActive !== false;
      
      console.log(`Table ${table.tableId}: status=${table.status}, capacity=${table.capacity}, active=${isActive}, available=${isAvailable}, hasCapacity=${hasCapacity}`);
      
      return isAvailable && hasCapacity && isActive;
    });

    console.log('Available tables after filtering:', availableTables.length);

    // If date and time are provided, check for conflicting reservations
    if (date && time) {
      const reservationDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      const requestedStart = new Date(reservationDate);
      requestedStart.setHours(hours, minutes, 0, 0);
      
      const requestedEnd = new Date(requestedStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
      
      // Check for conflicting reservations
      const reservationDoc = await Reservation.findOne({ _id: hotelId });
      
      let conflictingTableNumbers = [];
      if (reservationDoc && reservationDoc.reservations) {
        conflictingTableNumbers = reservationDoc.reservations
          .filter(res => {
            const hasConflictingStatus = ['pending', 'confirmed', 'reserved', 'seated'].includes(res.status);
            const hasTimeConflict = res.start < requestedEnd && res.end > requestedStart;
            return hasConflictingStatus && hasTimeConflict;
          })
          .map(res => res.tableNumber);
      }
      
      const finalAvailableTables = availableTables.filter(table => 
        !conflictingTableNumbers.includes(table.tableId)
      );
      
      return res.json({
        success: true,
        data: finalAvailableTables
      });
    }

    res.json({
      success: true,
      data: availableTables
    });
  } catch (error) {
    console.error('Error fetching available tables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tables',
      error: error.message
    });
  }
});

// Create new reservation
router.post('/', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { 
      reservationType, 
      customerDetails, 
      tableId, 
      tableNumber,
      reservationTime, 
      reservationDate,
      specialRequests, 
      notes 
    } = req.body;

    console.log('Creating reservation:', { reservationType, customerDetails, tableId, reservationTime });

    // Validate required fields
    if (!customerDetails.name || !customerDetails.phone || !tableId || !reservationTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, tableId, and reservationTime are required'
      });
    }

    // Calculate timing for the reservation
    const today = new Date();
    const resDate = reservationDate ? new Date(reservationDate) : today;
    
    let timeStr = reservationTime;
    if (reservationType === 'walkin' || reservationType === 'walk-in') {
      // For walk-ins, use current time
      const hh = String(today.getHours()).padStart(2, '0');
      const mm = String(today.getMinutes()).padStart(2, '0');
      timeStr = `${hh}:${mm}`;
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(resDate);
    start.setHours(hours, minutes, 0, 0);
    
    const bufferStart = new Date(start.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    // Check if table is available
    const tableDoc = await Table.findOne({ _id: hotelId });
    if (!tableDoc) {
      return res.status(404).json({
        success: false,
        message: 'No tables found for this hotel'
      });
    }

    console.log('Looking for tableId:', tableId);
    console.log('Available tables:', tableDoc.tables.map(t => ({ tableId: t.tableId, status: t.status })));
    
    const table = tableDoc.tables.find(t => t.tableId === tableId);
    if (!table) {
      console.log('Table not found with tableId:', tableId);
      return res.status(404).json({
        success: false,
        message: `Table not found with ID: ${tableId}`
      });
    }

    console.log('Found table:', { tableId: table.tableId, status: table.status, capacity: table.capacity });

    if (table.status !== 'AVAILABLE' && table.status !== 'VACANT') {
      return res.status(400).json({
        success: false,
        message: 'Table is not available'
      });
    }

    // Find or create reservation document
    let reservationDoc = await Reservation.findOne({ _id: hotelId });
    if (!reservationDoc) {
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findOne({ _id: hotelId });
      
      reservationDoc = new Reservation({
        _id: hotelId,
        hotelName: hotel.name,
        reservations: [],
        isActive: true
      });
    }

    // Check for conflicting reservations
    const conflictingReservation = reservationDoc.reservations.find(res => {
      const hasConflictingStatus = ['pending', 'confirmed', 'reserved', 'seated'].includes(res.status);
      const isSameTable = res.tableId === table.tableId;
      const hasTimeConflict = res.start < end && res.end > start;
      return hasConflictingStatus && isSameTable && hasTimeConflict;
    });

    if (conflictingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Table is already reserved for this time slot'
      });
    }

    // Generate unique reservation ID
    const reservationId = `RES${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create the reservation object
    const newReservation = {
      reservationId,
      reservationType,
      customerDetails,
      tableId: table.tableId,
      tableNumber: table.tableId, // using tableId for compatibility
      reservationDate: resDate,
      reservationTime: timeStr,
      bufferStart,
      start,
      end,
      specialRequests: specialRequests || '',
      notes: notes || '',
      createdBy: req.user.userId,
      status: 'pending'
    };

    // Add reservation to document
    reservationDoc.reservations.push(newReservation);
    await reservationDoc.save();

    // Update table status to RESERVED
    await Table.updateOne(
      { _id: hotelId, 'tables.tableId': table.tableId },
      { $set: { 'tables.$.status': 'RESERVED' } }
    );

    console.log('Reservation created successfully:', reservationId);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: newReservation
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: error.message
    });
  }
});

// Update reservation status
router.patch('/:id/status', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const { id: reservationId } = req.params;
    const { status } = req.body;
    const hotelId = req.user.hotelId;

    const validStatuses = ['pending', 'confirmed', 'reserved', 'seated', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find reservation document
    const reservationDoc = await Reservation.findOne({ _id: hotelId });
    if (!reservationDoc) {
      return res.status(404).json({
        success: false,
        message: 'Hotel reservations not found'
      });
    }

    // Find specific reservation
    const reservationIndex = reservationDoc.reservations.findIndex(r => r.reservationId === reservationId);
    if (reservationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = reservationDoc.reservations[reservationIndex];
    const oldStatus = reservation.status;
    
    // Special handling for cancelled reservations - delete them
    if (status === 'cancelled') {
      // Remove the reservation from the array
      reservationDoc.reservations.splice(reservationIndex, 1);
      await reservationDoc.save();
      
      // Update table status back to VACANT
      await Table.updateOne(
        { _id: hotelId, 'tables.tableId': reservation.tableId },
        { $set: { 'tables.$.status': 'VACANT' } }
      );
      
      console.log(`Reservation ${reservationId} cancelled and deleted from database`);
      console.log(`Table ${reservation.tableId} status updated to VACANT`);
      
      res.json({
        success: true,
        message: 'Reservation cancelled and removed successfully',
        data: { reservationId, status: 'deleted', tableId: reservation.tableId }
      });
      return;
    }
    
    // For all other status updates, just update the status
    reservation.status = status;
    await reservationDoc.save();

    // Update table status based on reservation status
    let newTableStatus = 'VACANT';
    if (status === 'reserved' || status === 'confirmed') {
      newTableStatus = 'RESERVED';
    } else if (status === 'seated') {
      newTableStatus = 'OCCUPIED';
    } else if (status === 'completed') {
      newTableStatus = 'VACANT';
    }

    // Update table status in Table collection
    await Table.updateOne(
      { _id: hotelId, 'tables.tableId': reservation.tableId },
      { $set: { 'tables.$.status': newTableStatus } }
    );

    console.log(`Reservation ${reservationId} status updated from ${oldStatus} to ${status}`);
    console.log(`Table ${reservation.tableId} status updated to ${newTableStatus}`);

    res.json({
      success: true,
      message: 'Reservation status updated successfully',
      data: reservation
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reservation status',
      error: error.message
    });
  }
});

// Delete reservation
router.delete('/:id', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const { id } = req.params;
    const hotelId = req.user.hotelId;

    const reservation = await Reservation.findOne({ _id: id, hotelId });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Update table status back to VACANT
    await Table.updateOne(
      { _id: hotelId, 'tables.tableId': reservation.tableId },
      { $set: { 'tables.$.status': 'VACANT' } }
    );

    await Reservation.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reservation',
      error: error.message
    });
  }
});

// Get reservations by status
router.get('/status/:status', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { status } = req.params;

    const reservationDoc = await Reservation.findOne({ _id: hotelId });
    
    if (!reservationDoc) {
      return res.json({
        success: true,
        data: []
      });
    }

    const filteredReservations = reservationDoc.reservations.filter(r => r.status === status);

    res.json({
      success: true,
      data: filteredReservations
    });
  } catch (error) {
    console.error('Error fetching reservations by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
});

// Get reservations by type (walk-in, online)
router.get('/type/:type', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { type } = req.params;

    const reservationDoc = await Reservation.findOne({ _id: hotelId });
    
    if (!reservationDoc) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Handle different type formats
    let filteredReservations;
    if (type === 'walkin' || type === 'walk-in') {
      filteredReservations = reservationDoc.reservations.filter(r => 
        r.reservationType === 'walkin' || r.reservationType === 'walk-in'
      );
    } else if (type === 'online' || type === 'reservation') {
      filteredReservations = reservationDoc.reservations.filter(r => 
        r.reservationType === 'online' || r.reservationType === 'reservation'
      );
    } else {
      filteredReservations = reservationDoc.reservations.filter(r => r.reservationType === type);
    }

    res.json({
      success: true,
      data: filteredReservations
    });
  } catch (error) {
    console.error('Error fetching reservations by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    });
  }
});

export default router;
