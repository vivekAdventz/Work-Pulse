import mongoose from 'mongoose';

const stakeholderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('Stakeholder', stakeholderSchema);
