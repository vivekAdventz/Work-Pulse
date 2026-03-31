import { PORT } from './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed.js';

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
