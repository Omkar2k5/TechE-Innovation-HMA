import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from '../models/Hotel.js';

dotenv.config();

const sampleHotel = {
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
  ]
};

async function populateDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Connected to MongoDB');

    // Check if hotel already exists
    const existingHotel = await Hotel.findById('hotel123');
    
    if (existingHotel) {
      console.log('🏨 Test hotel already exists, updating...');
      await Hotel.findByIdAndUpdate('hotel123', sampleHotel);
      console.log('✅ Hotel updated successfully');
    } else {
      console.log('🏨 Creating new test hotel...');
      await Hotel.create(sampleHotel);
      console.log('✅ Hotel created successfully');
    }

    console.log('\n🎉 Database populated successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Hotel ID: hotel123');
    console.log('Owner: admin / admin123');
    console.log('Manager: manager1 / manager123');
    console.log('Receptionist: reception1 / reception123');

  } catch (error) {
    console.error('❌ Error populating database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

populateDatabase();