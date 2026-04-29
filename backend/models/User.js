import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [{ type: String, enum: ['Superadmin', 'Manager', 'Employee'] }],
  password: { type: String, select: false },
  active: { type: Boolean, default: true },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activityTagIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActivityTag' }],
    default: [],
  },
  otp: { type: String, select: false },
  otpExpiresAt: { type: Date, select: false }
});

export default mongoose.model('User', userSchema);
