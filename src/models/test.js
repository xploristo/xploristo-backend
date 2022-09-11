import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
  documentId: { type: mongoose.Types.ObjectId, required: true },
  name: { type: String, required: true },
  questions: { type: Object, required: true }
}, {
  timestamps: true
});

const Test = new mongoose.model('Test', testSchema, 'tests');

export { Test };
