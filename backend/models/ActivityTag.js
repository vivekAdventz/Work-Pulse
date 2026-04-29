import mongoose from 'mongoose';

const activityTagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sortOrder: { type: Number, default: 0 },
});

export default mongoose.model('ActivityTag', activityTagSchema);
