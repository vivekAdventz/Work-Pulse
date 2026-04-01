import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  purpose: { type: String },
  yourRole: { type: String },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  stakeholderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stakeholder', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('Project', projectSchema);
