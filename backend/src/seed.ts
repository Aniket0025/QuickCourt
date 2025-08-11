import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import { UserModel } from './models/User';

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/QuickCourt';
  await connectDB(MONGO_URI);

  const email = 'aniket93yadav@gmail.com';
  const password = 'Aniket@0025';

  const existing = await UserModel.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin' as any;
      await existing.save();
      console.log(`Updated existing user to admin: ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await UserModel.create({
    name: 'Admin',
    email,
    passwordHash,
    role: 'admin',
    isVerified: true
  });
  console.log('Seeded admin user:', email);
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
