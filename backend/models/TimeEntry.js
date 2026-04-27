import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  hours: { type: Number, required: true },
  description: { type: String, default: '' },
  priority: { type: String, default: 'Medium' },
  workLocation: { type: String, default: 'Office' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  subProjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubProject' }],
  activityTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ActivityType', required: true },
  teamMemberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember' }],
  stakeholderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stakeholder' }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

export default mongoose.model('TimeEntry', timeEntrySchema);
