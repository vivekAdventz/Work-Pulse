import mongoose from 'mongoose';

const subProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('SubProject', subProjectSchema);
