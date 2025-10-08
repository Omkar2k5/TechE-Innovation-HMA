import express from 'express';
import Hotel from '../models/Hotel.js';
import { protect, authorize } from '../middleware/auth.js';
import { generatePassword } from '../utils/passwordGenerator.js';

const router = express.Router();

// @desc    Add employee credentials to a role
// @route   POST /api/employees/add
// @access  Private (Owner only)
router.post('/add', protect, authorize('owner'), async (req, res) => {
  try {
    const { role, employeeName, employeeEmail, employeePhone, features } = req.body;
    const hotelId = req.user.hotelId;

    // Validation
    if (!role || !employeeName || !employeeEmail) {
      return res.status(400).json({
        success: false,
        message: 'Role, employee name, and email are required!'
      });
    }

    // Validate role
    const allowedRoles = ['manager', 'receptionalist', 'cook'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be manager, receptionalist, or cook.'
      });
    }

    // Find the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found!'
      });
    }

    // Find the specific role in the hotel
    const roleIndex = hotel.roles.findIndex(r => r.role.toLowerCase() === role.toLowerCase());
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `${role} role not found in hotel!`
      });
    }

    // Generate password
    const generatedPassword = generatePassword();

    // Determine field names based on role
    let emailFieldName, passwordFieldName, nameFieldName, phoneFieldName;
    
    switch (role.toLowerCase()) {
      case 'manager':
        emailFieldName = 'Manager Email';
        passwordFieldName = 'Manager Password';
        nameFieldName = 'Manager Name';
        phoneFieldName = 'Manager Phone';
        break;
      case 'receptionalist':
        emailFieldName = 'Receptionalist Email';
        passwordFieldName = 'Receptionalist Password';
        nameFieldName = 'Receptionalist Name';
        phoneFieldName = 'Receptionalist Phone';
        break;
      case 'cook':
        emailFieldName = 'Cook Email';
        passwordFieldName = 'Cook Password';
        nameFieldName = 'Cook Name';
        phoneFieldName = 'Cook Phone';
        break;
    }

    // Update the role with employee information
    hotel.roles[roleIndex][emailFieldName] = employeeEmail;
    hotel.roles[roleIndex][passwordFieldName] = generatedPassword;
    hotel.roles[roleIndex][nameFieldName] = employeeName;
    
    if (employeePhone) {
      hotel.roles[roleIndex][phoneFieldName] = employeePhone;
    }

    // Update features if provided
    if (features && typeof features === 'object') {
      hotel.roles[roleIndex].features = {
        ...hotel.roles[roleIndex].features,
        ...features
      };
    }

    // Save the updated hotel
    hotel.updatedAt = new Date();
    await hotel.save();

    console.log(`✅ Employee added to ${role} role:`, employeeName, employeeEmail);

    res.status(200).json({
      success: true,
      message: `${role} credentials added successfully!`,
      employee: {
        role: role,
        name: employeeName,
        email: employeeEmail,
        phone: employeePhone,
        password: generatedPassword, // Return password so owner can share it
        roleId: hotel.roles[roleIndex].roleId
      }
    });

  } catch (error) {
    console.error('❌ Add Employee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred!',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all employees for a hotel
// @route   GET /api/employees
// @access  Private (Owner only)
router.get('/', protect, authorize('owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    // Find the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found!'
      });
    }

    // Extract employee information from roles (excluding passwords for security)
    const employees = [];

    hotel.roles.forEach(role => {
      if (role.role !== 'owner') {
        const employee = {
          roleId: role.roleId,
          role: role.role,
          features: role.features
        };

        // Check for employee information based on role
        const roleType = role.role.toLowerCase();
        const emailField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Email`;
        const nameField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Name`;
        const phoneField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Phone`;

        if (role[emailField]) {
          employee.email = role[emailField];
          employee.name = role[nameField] || 'Not specified';
          employee.phone = role[phoneField] || 'Not specified';
          employee.hasCredentials = true;
        } else {
          employee.hasCredentials = false;
        }

        employees.push(employee);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      hotel: {
        _id: hotel._id,
        name: hotel.name
      },
      employees: employees
    });

  } catch (error) {
    console.error('❌ Get Employees Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred!',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update employee credentials
// @route   PUT /api/employees/update
// @access  Private (Owner only)
router.put('/update', protect, authorize('owner'), async (req, res) => {
  try {
    const { role, employeeName, employeeEmail, employeePhone, resetPassword } = req.body;
    const hotelId = req.user.hotelId;

    // Validation
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required!'
      });
    }

    // Find the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found!'
      });
    }

    // Find the specific role
    const roleIndex = hotel.roles.findIndex(r => r.role.toLowerCase() === role.toLowerCase());
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `${role} role not found!`
      });
    }

    // Determine field names
    const roleType = role.toLowerCase();
    const emailField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Email`;
    const nameField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Name`;
    const phoneField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Phone`;
    const passwordField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Password`;

    // Update fields if provided
    if (employeeName) {
      hotel.roles[roleIndex][nameField] = employeeName;
    }
    if (employeeEmail) {
      hotel.roles[roleIndex][emailField] = employeeEmail;
    }
    if (employeePhone) {
      hotel.roles[roleIndex][phoneField] = employeePhone;
    }

    let newPassword = null;
    if (resetPassword) {
      newPassword = generatePassword();
      hotel.roles[roleIndex][passwordField] = newPassword;
    }

    // Save the updated hotel
    hotel.updatedAt = new Date();
    await hotel.save();

    const response = {
      success: true,
      message: `${role} information updated successfully!`,
      employee: {
        role: role,
        name: hotel.roles[roleIndex][nameField],
        email: hotel.roles[roleIndex][emailField],
        phone: hotel.roles[roleIndex][phoneField]
      }
    };

    if (newPassword) {
      response.newPassword = newPassword;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Update Employee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred!',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Remove employee credentials
// @route   DELETE /api/employees/remove
// @access  Private (Owner only)
router.delete('/remove', protect, authorize('owner'), async (req, res) => {
  try {
    const { role } = req.body;
    const hotelId = req.user.hotelId;

    // Validation
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required!'
      });
    }

    // Find the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found!'
      });
    }

    // Find the specific role
    const roleIndex = hotel.roles.findIndex(r => r.role.toLowerCase() === role.toLowerCase());
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `${role} role not found!`
      });
    }

    // Determine field names and remove credentials
    const roleType = role.toLowerCase();
    const emailField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Email`;
    const nameField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Name`;
    const phoneField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Phone`;
    const passwordField = `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Password`;

    // Remove employee fields by setting to undefined (works better with Mongoose schemas)
    hotel.roles[roleIndex][emailField] = undefined;
    hotel.roles[roleIndex][nameField] = undefined;
    hotel.roles[roleIndex][phoneField] = undefined;
    hotel.roles[roleIndex][passwordField] = undefined;

    // Save the updated hotel
    hotel.updatedAt = new Date();
    await hotel.save();

    res.status(200).json({
      success: true,
      message: `${role} credentials removed successfully!`
    });

  } catch (error) {
    console.error('❌ Remove Employee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred!',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;