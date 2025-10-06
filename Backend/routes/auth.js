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
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found!',
      });
    }

    // Search for the role inside roles array
    const foundRole = hotel.roles.find(r => r.role.toLowerCase() === role.toLowerCase());
    if (!foundRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found in this hotel!',
      });
    }

    // Determine email/password field names based on role
    let roleEmailKey = "";
    let rolePasswordKey = "";

    switch (role.toLowerCase()) {
      case "owner":
        roleEmailKey = "Owner Email";
        rolePasswordKey = "Owner Password";
        break;
      case "manager":
        roleEmailKey = "Manager Email";
        rolePasswordKey = "Manager Password";
        break;
      case "receptionalist":
        roleEmailKey = "Receptionalist Email";
        rolePasswordKey = "Receptionalist Password";
        break;
      case "cook":
        roleEmailKey = "Cook Email";
        rolePasswordKey = "Cook Password";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be owner, manager, receptionalist, or cook.",
        });
    }

    // Check if role has credentials defined
    if (!foundRole[roleEmailKey] || !foundRole[rolePasswordKey]) {
      return res.status(401).json({
        success: false,
        message: `No credentials found for ${role} role. Please contact administrator.`,
      });
    }

    // Validate credentials
    if (
      foundRole[roleEmailKey] === email &&
      foundRole[rolePasswordKey] === password
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
          features: foundRole.features
        },
        roleDetails: {
          roleId: foundRole.roleId,
          role: foundRole.role,
          features: foundRole.features
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