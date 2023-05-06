import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    document: {
      type: { type: String, default: 'application/pdf' },
      name: { type: String, required: true },
      path: { type: String, required: true },
    },
    questions: { type: Object, default: [] },
  },
  {
    timestamps: true,
  }
);

const Test = new mongoose.model('Test', testSchema, 'tests');

export { Test };
