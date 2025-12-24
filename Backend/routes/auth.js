import express from 'express';
import jwt from 'jsonwebtoken';
import Hotel from '../models/Hotel.js';

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { hotelId, role, email, password } = req.body;

    // Validation
    if (!hotelId || !role || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'hotelId, role, email, and password are required!',
      });
    }

    // Find hotel by ID
    console.log('🔍 Searching for hotel with ID:', hotelId);
    const hotel = await Hotel.findOne({ _id: hotelId }); 
    console.log('🏨 Hotel search result:', hotel ? 'Found' : 'Not found');
    
    if (!hotel) {
      console.log('❌ Hotel not found in database with ID:', hotelId);
      return res.status(404).json({
        success: false,
        message: 'Hotel not found!',
      });
    }
    
    console.log('✅ Hotel found:', hotel.name, 'with', hotel.roles.length, 'roles');

    // Search for the role inside roles array
    console.log('🔍 Searching for role:', role);
    console.log('📁 Available roles:', hotel.roles.map(r => r.role));
    
    // Handle role name mapping (receptionist <-> receptionalist)
    let roleToFind = role.toLowerCase();
    if (roleToFind === 'receptionist') {
      roleToFind = 'receptionalist'; // Convert to database format
    }
    
    const foundRole = hotel.roles.find(r => r.role.toLowerCase() === roleToFind);
    
    if (!foundRole) {
      console.log('❌ Role not found:', role);
      return res.status(404).json({
        success: false,
        message: 'Role not found in this hotel!',
      });
    }
    
    // Convert Mongoose subdocument to plain object to access fields properly
    const roleData = foundRole.toObject ? foundRole.toObject() : foundRole;
    
    console.log('✅ Role found:', roleData.role, 'with roleId:', roleData.roleId);

    // Determine email/password field names based on role
    let roleEmailKey = "";
    let rolePasswordKey = "";

    switch (role.toLowerCase()) {
      case "owner":
        roleEmailKey = "owner_Email";
        rolePasswordKey = "owner_Password";
        break;
      case "manager":
        roleEmailKey = "Manager_Email";
        rolePasswordKey = "Manager_Password";
        break;
      case "receptionalist":
      case "receptionist":
        roleEmailKey = "Receptionalist_Email";
        rolePasswordKey = "Receptionalist_Password";
        break;
      case "cook":
        roleEmailKey = "Cook_Email";
        rolePasswordKey = "Cook_Password";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be owner, manager, receptionalist/receptionist, or cook.",
        });
    }

    // Check if role has credentials defined
    console.log('🔑 Checking credentials for role:', role);
    console.log('📧 Looking for email field:', roleEmailKey);
    console.log('🔒 Looking for password field:', rolePasswordKey);
    console.log('📊 Role data keys:', Object.keys(roleData));
    
    if (!roleData[roleEmailKey] || !roleData[rolePasswordKey]) {
      console.log('❌ Credentials not found. Email field value:', roleData[roleEmailKey]);
      console.log('❌ Password field value:', roleData[rolePasswordKey] ? '[EXISTS]' : '[MISSING]');
      return res.status(401).json({
        success: false,
        message: `No credentials found for ${role} role. Please contact administrator.`,
      });
    }

    console.log('✅ Credentials found. Validating...');
    console.log('📧 Database email:', roleData[roleEmailKey]);
    console.log('📧 Provided email:', email);
    console.log('🔒 Password match:', roleData[rolePasswordKey] === password);

    // Validate credentials
    if (
      roleData[roleEmailKey] === email &&
      roleData[rolePasswordKey] === password
    ) {
      // Generate JWT token
      const token = jwt.sign(
        {
          hotelId: hotel._id,
          role: role.toLowerCase(),
          email: email,
          hotelName: hotel.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: `Login successful as ${role}.`,
        token,
        hotel: {
          _id: hotel._id,
          name: hotel.name,
        },
        user: {
          role: role.toLowerCase(),
          email: email,
          features: roleData.features || {}
        },
        roleDetails: {
          roleId: roleData.roleId,
          role: roleData.role,
          features: roleData.features || {}
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password!",
      });
    }

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred!',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private (requires JWT token)
router.get('/me', async (req, res) => {
  try {
    // This route would need authentication middleware
    // For now, it's a placeholder
    res.status(401).json({
      success: false,
      message: 'Authentication middleware not implemented yet'
    });
  } catch (error) {
    console.error('❌ Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred!'
    });
  }
});

export default router;