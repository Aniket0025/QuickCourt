import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import { UserModel } from './models/User';

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://shreya:shreya123@oddo.8vdawkj.mongodb.net/?retryWrites=true&w=majority&appName=oddo';
  await connectDB(MONGO_URI);
  //34
  const email = 'yasinshaikh2186@gmail.com';
  const password = '123456';

  // Always ensure this admin exists with the latest credentials
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await UserModel.findOne({ email });
  if (existing) {
    existing.name = 'Admin';
    existing.role = 'admin' as any;
    (existing as any).passwordHash = passwordHash;
    (existing as any).isVerified = true;
    await existing.save();
    console.log(`Updated admin user with latest credentials: ${email}`);
    process.exit(0);
  }

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
