import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import { connectDB, closeDB } from '../src/config/db.js';

dotenv.config();

export const seedAdmin = async () => {
  const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'rishikothari.14.2006@gmail.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Rishi@1423';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    existing.role = 'admin';
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    console.log(`Administrator account verified & updated: ${adminEmail}`);
    return existing;
  }

  const admin = await User.create({
    name: 'Rishi Kothari (Admin)',
    email: adminEmail,
    passwordHash,
    role: 'admin',
    displayName: 'Rishi Admin',
    targetExam: 'Platform Administration',
    dailyStudyGoalSeconds: 7200,
    leaderboardOptIn: false,
    isActive: true,
  });

  console.log(`Administrator created successfully:`);
  console.log(`Email: ${adminEmail}`);
  return admin;
};

if (process.argv[1]?.endsWith('seedAdmin.js')) {
  (async () => {
    await connectDB();
    await seedAdmin();
    await closeDB();
    process.exit(0);
  })();
}
