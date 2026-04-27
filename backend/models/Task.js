import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubProject', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('Task', taskSchema);
