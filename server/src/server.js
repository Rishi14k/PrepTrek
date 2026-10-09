import app from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { env } from './config/env.js';
import Subject from './models/Subject.js';
import User from './models/User.js';
import { seedSubjectsAndChapters } from '../scripts/seedSubjects.js';
import { seedAdmin } from '../scripts/seedAdmin.js';

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed initial subjects if DB is blank
    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0) {
      console.log('No subjects detected. Running automatic subject initialization...');
      await seedSubjectsAndChapters();
    }

    // Ensure configured administrator account exists with admin role
    await seedAdmin();

    const server = app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`PrepTrack Backend API running on port ${env.PORT}`);
      console.log(`Mode: ${env.NODE_ENV}`);
      console.log(`Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`===============================================`);
    });

    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await closeDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start PrepTrack server:', error);
    process.exit(1);
  }
};

startServer();
