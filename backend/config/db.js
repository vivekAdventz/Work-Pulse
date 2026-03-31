import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';

export async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
}
