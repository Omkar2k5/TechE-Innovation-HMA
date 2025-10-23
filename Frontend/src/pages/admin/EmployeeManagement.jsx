import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    employeeName: '',
    employeeEmail: '',
    employeePhone: '',
    features: {
      feature1: false,
      feature2: false,
      feature3: false
    }
  });
  const [message, setMessage] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      if (response && response.success) {
        setEmployees(response.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!formData.role || !formData.employeeName || !formData.employeeEmail) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/employees/add', formData);
      
      if (response && response.success) {
        // Only show credentials notification for non-waiter roles
        if (formData.role !== 'waiter') {
          setGeneratedCredentials(response.employee);
        }
        setMessage({ type: 'success', text: response.message });
        setFormData({
          role: '',
          employeeName: '',
          employeeEmail: '',
          employeePhone: '',
          features: { feature1: false, feature2: false, feature3: false }
        });
        setShowAddForm(false);
        // Refresh employee list
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setMessage({ type: 'error', text: 'Failed to add employee' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (roleId, roleName) => {
    if (!confirm(`Are you sure you want to reset the password for ${roleName}?`)) {
      return;
    }

    try {
      const response = await api.put('/employees/update', {
        roleId: roleId,
        resetPassword: true
      });
      
      if (response && response.success) {
        setMessage({ type: 'success', text: `Password reset for ${roleName}` });
        setGeneratedCredentials({
          role: roleName,
          password: response.newPassword,
          email: response.employee.email
        });
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: 'Failed to reset password' });
    }
  };

  const handleRemoveEmployee = async (roleId, employeeName) => {
    if (!confirm(`Are you sure you want to remove ${employeeName}? This cannot be undone.`)) {
      return;
    }

    try {
      console.log('Removing employee with roleId:', roleId);
      const response = await api.delete('/employees/remove', { roleId: roleId });
      
      console.log('Remove response:', response);
      
      if (response && response.success) {
        setMessage({ type: 'success', text: response.message });
        fetchEmployees();
      } else {
        setMessage({ type: 'error', text: response?.message || 'Failed to remove employee' });
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      setMessage({ type: 'error', text: 'Failed to remove employee' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add Employee'}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
              <button 
                onClick={() => setMessage(null)}
                className="float-right text-xl leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Generated Credentials Display */}
          {generatedCredentials && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                {generatedCredentials.password ? '🔑 Generated Credentials' : '✅ Employee Added'}
              </h3>
              <div className="bg-white p-3 rounded border">
                <p><strong>Role:</strong> {generatedCredentials.role}</p>
                <p><strong>Email:</strong> {generatedCredentials.email}</p>
                {generatedCredentials.password && (
                  <p><strong>Password:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{generatedCredentials.password}</span></p>
                )}
              </div>
              {generatedCredentials.password ? (
                <p className="text-sm text-yellow-700 mt-2">
                  ⚠️ Please share these credentials with the employee securely. The password will not be shown again.
                </p>
              ) : (
                <p className="text-sm text-yellow-700 mt-2">
                  ℹ️ Employee added successfully. No login credentials needed for this role.
                </p>
              )}
              <button 
                onClick={() => setGeneratedCredentials(null)}
                className="mt-2 text-yellow-800 hover:text-yellow-900 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add Employee Form */}
          {showAddForm && (
            <div className="mb-8 bg-gray-50 p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="manager">Manager</option>
                      <option value="receptionalist">Receptionist</option>
                      <option value="cook">Cook</option>
                      <option value="waiter">Waiter</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Name *
                    </label>
                    <input
                      type="text"
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="employeeEmail"
                      value={formData.employeeEmail}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="employeePhone"
                      value={formData.employeePhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Features - Hide for waiter role */}
                {formData.role && formData.role !== 'waiter' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Features
                    </label>
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="features.feature1"
                          checked={formData.features.feature1}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Feature 1
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="features.feature2"
                          checked={formData.features.feature2}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Feature 2
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="features.feature3"
                          checked={formData.features.feature3}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Feature 3
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Employee'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Employee List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div key={employee.roleId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold capitalize">{employee.role}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    employee.hasCredentials 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {employee.hasCredentials ? 'Active' : 'No Credentials'}
                  </span>
                </div>
                
                {employee.hasCredentials ? (
                  <>
                    <div className="space-y-2 mb-4">
                      <p><strong>Name:</strong> {employee.name}</p>
                      <p><strong>Email:</strong> {employee.email}</p>
                      <p><strong>Phone:</strong> {employee.phone}</p>
                    </div>
                    
                    {/* Only show features for non-waiter roles */}
                    {employee.role !== 'waiter' && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Features:</p>
                        <div className="flex space-x-2">
                          {Object.entries(employee.features || {}).map(([feature, enabled]) => (
                            <span
                              key={feature}
                              className={`px-2 py-1 rounded text-xs ${
                                enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {/* Only show reset password for non-waiter roles */}
                      {employee.role !== 'waiter' && (
                        <button
                          onClick={() => handleResetPassword(employee.roleId, employee.role)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                        >
                          Reset Password
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveEmployee(employee.roleId, employee.name)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3">No credentials set up</p>
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, role: employee.role }));
                        setShowAddForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Add Credentials
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;