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
    const allowedRoles = ['manager', 'receptionalist', 'cook', 'waiter'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be manager, receptionalist, cook, or waiter.'
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

    // Determine field names based on role (using underscore notation to match database)
    let emailFieldName, passwordFieldName, nameFieldName, phoneFieldName;
    
    switch (role.toLowerCase()) {
      case 'manager':
        emailFieldName = 'Manager_Email';
        passwordFieldName = 'Manager_Password';
        nameFieldName = 'Manager_Name';
        phoneFieldName = 'Manager_Phone';
        break;
      case 'receptionalist':
        emailFieldName = 'Receptionalist_Email';
        passwordFieldName = 'Receptionalist_Password';
        nameFieldName = 'Receptionalist_Name';
        phoneFieldName = 'Receptionalist_Phone';
        break;
      case 'cook':
        emailFieldName = 'Cook_Email';
        passwordFieldName = 'Cook_Password';
        nameFieldName = 'Cook_Name';
        phoneFieldName = 'Cook_Phone';
        break;
      case 'waiter':
        emailFieldName = 'Waiter_Email';
        passwordFieldName = 'Waiter_Password'; // Not used, but defined for consistency
        nameFieldName = 'Waiter_Name';
        phoneFieldName = 'Waiter_Phone';
        break;
    }

    // Generate password only for non-waiter roles (waiters don't need login)
    const generatedPassword = role.toLowerCase() === 'waiter' ? null : generatePassword();

    // Generate unique roleId based on existing roles of same type
    const existingRolesOfType = hotel.roles.filter(r => r.role.toLowerCase() === role.toLowerCase());
    const roleNumber = String(existingRolesOfType.length + 1).padStart(3, '0');
    const rolePrefix = role.substring(0, 3).toUpperCase();
    const newRoleId = `${rolePrefix}${roleNumber}`;

    // Create new role entry
    const newRoleEntry = {
      roleId: newRoleId,
      role: role.toLowerCase(),
      [emailFieldName]: employeeEmail,
      [nameFieldName]: employeeName
    };

    // Add password only for non-waiter roles
    if (role.toLowerCase() !== 'waiter' && generatedPassword) {
      newRoleEntry[passwordFieldName] = generatedPassword;
    }

    // Add phone if provided
    if (employeePhone) {
      newRoleEntry[phoneFieldName] = employeePhone;
    }

    // Add features for non-waiter roles
    if (role.toLowerCase() !== 'waiter') {
      newRoleEntry.features = features && typeof features === 'object' ? features : {
        feature1: false,
        feature2: false,
        feature3: false
      };
    }

    // Append the new role entry to the roles array
    hotel.roles.push(newRoleEntry);

    // Save the updated hotel
    hotel.updatedAt = new Date();
    await hotel.save();

    console.log(`✅ Employee added as new ${role} role:`, employeeName, employeeEmail, newRoleId);

    // Prepare response
    const responseData = {
      success: true,
      message: `${role} ${role.toLowerCase() === 'waiter' ? 'added' : 'credentials added'} successfully!`,
      employee: {
        role: role,
        name: employeeName,
        email: employeeEmail,
        phone: employeePhone,
        roleId: newRoleId
      }
    };

    // Include password only for non-waiter roles
    if (role.toLowerCase() !== 'waiter' && generatedPassword) {
      responseData.employee.password = generatedPassword;
    }

    res.status(200).json(responseData);

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

        // Check for employee information based on role (using underscore notation)
        const roleType = role.role.toLowerCase();
        // Capitalize first letter for field names
        const roleTypeCap = roleType.charAt(0).toUpperCase() + roleType.slice(1);
        const emailField = `${roleTypeCap}_Email`;
        const nameField = `${roleTypeCap}_Name`;
        const phoneField = `${roleTypeCap}_Phone`;

        // Convert role document to plain object to access fields
        const roleData = role.toObject ? role.toObject() : role;

        if (roleData[emailField]) {
          employee.email = roleData[emailField];
          employee.name = roleData[nameField] || 'Not specified';
          employee.phone = roleData[phoneField] || 'Not specified';
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
    const { roleId, employeeName, employeeEmail, employeePhone, resetPassword } = req.body;
    const hotelId = req.user.hotelId;

    // Validation
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required!'
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

    // Find the specific role by roleId
    const roleIndex = hotel.roles.findIndex(r => r.roleId === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Employee with role ID ${roleId} not found!`
      });
    }

    // Get the role type from the found role entry
    const roleType = hotel.roles[roleIndex].role.toLowerCase();
    const roleTypeCap = roleType.charAt(0).toUpperCase() + roleType.slice(1);
    const emailField = `${roleTypeCap}_Email`;
    const nameField = `${roleTypeCap}_Name`;
    const phoneField = `${roleTypeCap}_Phone`;
    const passwordField = `${roleTypeCap}_Password`;
    
    // Don't allow password reset for waiters
    if (resetPassword && roleType === 'waiter') {
      return res.status(400).json({
        success: false,
        message: 'Waiters do not have login credentials. Password reset is not applicable.'
      });
    }

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
      message: `Employee information updated successfully!`,
      employee: {
        role: roleType,
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
    const { roleId } = req.body;
    const hotelId = req.user.hotelId;

    // Validation
    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Role ID is required!'
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

    // Find the specific role by roleId
    const roleIndex = hotel.roles.findIndex(r => r.roleId === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Employee with role ID ${roleId} not found!`
      });
    }

    // Get employee info before removing
    const removedRole = hotel.roles[roleIndex];
    const employeeName = removedRole[`${removedRole.role.charAt(0).toUpperCase() + removedRole.role.slice(1)} Name`] || removedRole.role;
    
    // Remove the entire role entry from the array
    hotel.roles.splice(roleIndex, 1);

    // Save the updated hotel
    hotel.updatedAt = new Date();
    await hotel.save();

    console.log(`✅ Employee removed: ${employeeName} (${roleId})`);

    res.status(200).json({
      success: true,
      message: `${employeeName} removed successfully!`
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