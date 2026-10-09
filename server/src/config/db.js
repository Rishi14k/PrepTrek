import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);

    // First attempt to connect to configured URI with short timeout
    console.log(`Connecting to MongoDB at: ${env.MONGODB_URI}...`);
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log('MongoDB connected successfully via MONGODB_URI.');
      return;
    } catch (err) {
      console.warn('Could not connect to external MongoDB URI:', err.message);
      console.log('Spinning up embedded MongoDB Memory Server for local development/testing...');
      
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      
      await mongoose.connect(memoryUri);
      console.log(`Embedded MongoDB Memory Server connected successfully at: ${memoryUri}`);
    }
  } catch (error) {
    console.error('Fatal error connecting to database:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error closing database connection:', err);
  }
};
