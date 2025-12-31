import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from '../models/Hotel.js';

dotenv.config();

const yourHotel = {
  "_id": "ABC001",
  "name": "ABCD",
  "address": {
    "street": "A-2 Mahalaxmi Nagar",
    "city": "Solapur",
    "state": "Maharashtra",
    "zip": "413004",
    "country": "India"
  },
  "contact": {
    "phone": "08855916700",
    "email": "gondkaromkar53@gmail.com"
  },
  "taxConfig": {
    "taxPercentage": 0,
    "serviceCharge": 0
  },
  "roles": [
    {
      "roleId": "OWN001",
      "role": "owner",
      "owner_Name": "Omkar",
      "owner_Phone": "08855916700",
      "features": {
        "feature1": true,
        "feature2": true,
        "feature3": false
      },
      "Owner Email": "gondkaromkar53@gmail.com",
      "Owner username": "Omkar",
      "Owner Password": "Omkar@921"
    },
    {
      "roleId": "REC001",
      "role": "receptionalist",
      "features": {
        "feature1": true,
        "feature2": false,
        "feature3": true
      },
      // Add sample credentials for receptionist
      "Receptionalist Email": "reception@abcd-hotel.com",
      "Receptionalist Password": "reception123"
    },
    {
      "roleId": "COOK001",
      "role": "cook",
      "features": {
        "feature1": true,
        "feature2": false,
        "feature3": false
      }
    },
    {
      "roleId": "MGR001",
      "role": "manager",
      "features": {
        "feature1": true,
        "feature2": true,
        "feature3": false
      },
      // Add sample credentials for manager
      "Manager Email": "manager@abcd-hotel.com",
      "Manager Password": "manager123"
    }
  ]
};

async function addYourHotel() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Connected to MongoDB');

    // Check if hotel already exists
    const existingHotel = await Hotel.findById('ABC001');
    
    if (existingHotel) {
      console.log('🏨 Your hotel already exists, updating...');
      await Hotel.findByIdAndUpdate('ABC001', yourHotel);
      console.log('✅ Hotel updated successfully');
    } else {
      console.log('🏨 Creating your hotel...');
      await Hotel.create(yourHotel);
      console.log('✅ Hotel created successfully');
    }

    console.log('\n🎉 Your hotel data added successfully!');
    console.log('\n📋 Your Login Credentials:');
    console.log('Hotel ID: ABC001');
    console.log('Owner: gondkaromkar53@gmail.com / Omkar@921');
    console.log('Manager: manager@abcd-hotel.com / manager123 (sample)');
    console.log('Receptionist: reception@abcd-hotel.com / reception123 (sample)');
    console.log('\n💡 Note: Manager and Receptionist credentials are sample data.');
    console.log('   You can update them in MongoDB or through your admin panel.');

  } catch (error) {
    console.error('❌ Error adding hotel:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

addYourHotel();