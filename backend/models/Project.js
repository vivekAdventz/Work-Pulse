import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  purpose: { type: String },
  companyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }],
  stakeholderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stakeholder', required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('Project', projectSchema);
