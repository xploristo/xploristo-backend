import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const testSchema = new mongoose.Schema(
  {
    templateId: { type: ObjectId, required: true },
    name: { type: String, required: true },
    document: {
      type: { type: String, default: 'application/pdf' },
      name: { type: String, required: true },
      path: { type: String, required: true },
    },
    questions: { type: Object, default: [] },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const assignmentSchema = new mongoose.Schema(
  {
    groupId: { type: ObjectId, required: true },
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    test: { type: testSchema, required: true },
    resultCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Assignment = new mongoose.model('Assignment', assignmentSchema, 'assignments');

export { Assignment };
