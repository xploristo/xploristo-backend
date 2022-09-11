import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['student', 'teacher'], required: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  pid: { type: String },
  credentialsId: { type: mongoose.Types.ObjectId, required: true }
}, {
  timestamps: true
});

const User = new mongoose.model('User', userSchema, 'users');

export { User };
