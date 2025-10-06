import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Enhanced MongoDB connection options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    };

    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('🌐 URI:', process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@'));
    
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('   2. Verify your internet connection');
    console.error('   3. Check if MongoDB Atlas cluster is running');
    console.error('   4. Verify username/password in connection string');
    
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('⚠️  Continuing in development mode without database...');
      return null;
    }
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔴 Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;