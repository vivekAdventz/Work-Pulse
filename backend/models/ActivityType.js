import mongoose from 'mongoose';

const activityTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tagId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityTag', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model('ActivityType', activityTypeSchema);
