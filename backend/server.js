import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed.js';

const PORT = process.env.PORT || 5207;

connectDB()
  .then(async () => {
    await seedDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
