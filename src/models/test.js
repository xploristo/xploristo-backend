import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  document: {
    name: { type: String, default: 'application/pdf' },
    path: { type: String, required: true }
  },
  questions: { type: Object }
}, {
  timestamps: true
});

const Test = new mongoose.model('Test', testSchema, 'tests');

export { Test };
