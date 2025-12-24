import jwt from 'jsonwebtoken';
import Staff from '../models/Staff.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // For our hotel-based system, we store hotel and user info in token
      req.user = {
        hotelId: decoded.hotelId,
        role: decoded.role,
        email: decoded.email,
        hotelName: decoded.hotelName
      };

      console.log('✅ Token verified for user:', req.user.email, 'at hotel:', req.user.hotelName);
      next();
    } catch (error) {
      console.error('❌ Auth Middleware Error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

// Check specific permissions
export const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasRequiredPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource'
      });
    }

    next();
  };
};