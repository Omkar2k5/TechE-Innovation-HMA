import express from 'express';
import jwt from 'jsonwebtoken';
import Hotel from '../models/Hotel.js';

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { hotelId, role, username, password } = req.body;

    // Validation
    if (!hotelId || !role || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'hotelId, role, username, and password are required!',
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

    // Determine username/password field names based on role
    let roleUsernameKey = "";
    let rolePasswordKey = "";

    switch (role.toLowerCase()) {
      case "owner":
        roleUsernameKey = "Owner username";
        rolePasswordKey = "Owner Password";
        break;
      case "manager":
        roleUsernameKey = "Manager username";
        rolePasswordKey = "Manager Password";
        break;
      case "receptionalist":
        roleUsernameKey = "Receptionalist username";
        rolePasswordKey = "Receptionalist Password";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be owner, manager, or receptionalist.",
        });
    }

    // Validate credentials
    if (
      foundRole[roleUsernameKey] === username &&
      foundRole[rolePasswordKey] === password
    ) {
      // Generate JWT token
      const token = jwt.sign(
        {
          hotelId: hotel._id,
          role: role.toLowerCase(),
          username: username,
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
          username: username,
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
        message: "Invalid username or password!",
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