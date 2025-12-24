import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from '../models/Hotel.js';

dotenv.config();

const qweHotel = {
  "_id": "QWE001",
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
      "Owner Password": "Omkar@9211"
    },
    {
      "roleId": "REC001",
      "role": "receptionalist",
      "features": {
        "feature1": true,
        "feature2": false,
        "feature3": true
      }
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
      }
    }
  ]
};

async function addQWEHotel() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Connected to MongoDB');

    // Check if hotel already exists
    const existingHotel = await Hotel.findById('QWE001');
    
    if (existingHotel) {
      console.log('🏨 QWE001 hotel already exists, updating...');
      await Hotel.findByIdAndUpdate('QWE001', qweHotel);
      console.log('✅ Hotel updated successfully');
    } else {
      console.log('🏨 Creating QWE001 hotel...');
      await Hotel.create(qweHotel);
      console.log('✅ Hotel created successfully');
    }

    console.log('\n🎉 QWE001 hotel data added successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Hotel ID: QWE001');
    console.log('Owner Email: gondkaromkar53@gmail.com');
    console.log('Owner Password: Omkar@9211');
    console.log('Role: owner');

    // Verify the hotel exists
    const verifyHotel = await Hotel.findById('QWE001');
    if (verifyHotel) {
      console.log('\n✅ Verification: Hotel found in database');
      console.log('Hotel Name:', verifyHotel.name);
      console.log('Number of roles:', verifyHotel.roles.length);
      
      // List all roles
      verifyHotel.roles.forEach(role => {
        console.log(`- ${role.role} (${role.roleId})`);
      });
    }

  } catch (error) {
    console.error('❌ Error adding hotel:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

addQWEHotel();