import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [{ type: String, enum: ['Superadmin', 'Manager', 'Employee'] }],
  password: { type: String, select: false },
  active: { type: Boolean, default: true },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

export default mongoose.model('User', userSchema);
