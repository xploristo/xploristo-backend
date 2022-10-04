import mongoose from 'mongoose';

const credentialsSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  password: { type: String, required: true },
  mustResetPassword: { type: Boolean, default: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'] }
}, {
  timestamps: true
});

const Credentials = new mongoose.model('Credentials', credentialsSchema, 'credentials');

export { Credentials };

// TODO Add timestamps to all models
