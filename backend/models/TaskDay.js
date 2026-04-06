import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  subProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubProject', default: null },
  status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
  dependsOn: { type: mongoose.Schema.Types.ObjectId, default: null }, // references another task._id in same or earlier day
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const taskDaySchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tasks: [taskSchema],
}, { timestamps: true });

// Ensure one date card per manager per date
taskDaySchema.index({ date: 1, managerId: 1 }, { unique: true });

export default mongoose.model('TaskDay', taskDaySchema);
