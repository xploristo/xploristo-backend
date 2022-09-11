import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: { type: String, default: 'application/pdf' },
  name: { type: String, required: true } // TODO Index
}, {
  timestamps: true
});

const Document = new mongoose.model('Document', documentSchema, 'documents');

export { Document };
