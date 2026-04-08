import './config/env.js'; // loads dotenv and validates env vars
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { connectDB } from './config/db.js';

export async function seedDatabase() {
  console.log('Seeding initial users...');

  // Optional: You can delete existing users if you want a complete wipe each time:
  // await User.deleteMany({});

  const exists = await User.findOne({ email: 'superadmin@adventz.com' });
  if (exists) {
    console.log('Superadmin already exists! Skipping seeding.');
    return;
  }

  const hashedPassword = await bcrypt.hash('superadmin@1234', 10);

  await User.create({
    name: 'Super Admin',
    email: 'superadmin@adventz.com',
    roles: ['Superadmin'],
    password: hashedPassword,
    active: true
  });

  console.log('Database seeded with superadmin (email: superadmin@adventz.com, password: superadmin@123)');
}

// Run executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  connectDB()
    .then(async () => {
      await seedDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
