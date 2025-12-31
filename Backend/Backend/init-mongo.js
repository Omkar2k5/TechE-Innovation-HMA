// MongoDB initialization script
// This runs when the container starts for the first time

db = db.getSiblingDB('HMS');

// Create hotels collection with sample data
db.hotels.insertOne({
  "_id": "hotel123",
  "name": "Grand Test Hotel",
  "address": {
    "street": "123 Test Street",
    "city": "Test City", 
    "state": "Test State",
    "zip": "12345",
    "country": "Test Country"
  },
  "contact": {
    "phone": "+1-555-0123",
    "email": "test@grandhotel.com"
  },
  "taxConfig": {
    "taxPercentage": 10,
    "serviceCharge": 5
  },
  "roles": [
    {
      "roleId": "owner1",
      "role": "owner",
      "features": {
        "feature1": true,
        "feature2": true,
        "feature3": false
      },
      "owner_Name": "John Doe",
      "owner_Phone": "+1-555-0124",
      "Owner Email": "owner@grandhotel.com",
      "Owner username": "admin",
      "Owner Password": "admin123"
    },
    {
      "roleId": "manager1",
      "role": "manager",
      "features": {
        "feature1": true,
        "feature2": false,
        "feature3": true
      },
      "Manager username": "manager1",
      "Manager Password": "manager123"
    },
    {
      "roleId": "receptionist1",
      "role": "receptionalist",
      "features": {
        "feature1": false,
        "feature2": true,
        "feature3": false
      },
      "Receptionalist username": "reception1",
      "Receptionalist Password": "reception123"
    }
  ],
  "createdAt": new Date(),
  "updatedAt": new Date()
});

// Create indexes for better performance
db.hotels.createIndex({ "_id": 1 });
db.hotels.createIndex({ "roles.role": 1 });

print("✅ Database initialized with sample hotel data");
print("🏨 Test Hotel ID: hotel123");
print("👤 Test Credentials:");
print("   Owner: admin / admin123");
print("   Manager: manager1 / manager123"); 
print("   Receptionist: reception1 / reception123");