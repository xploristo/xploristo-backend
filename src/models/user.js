import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    email: { type: String, required: true, index: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    pid: { type: String },
    credentialsId: { type: mongoose.Types.ObjectId, required: true, index: true },
    groupIds: { type: [mongoose.Types.ObjectId] },
  },
  {
    timestamps: true,
  }
);

const User = new mongoose.model('User', userSchema, 'users');

export { User };
