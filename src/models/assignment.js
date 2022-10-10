import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const assignmentSchema = new mongoose.Schema(
  {
    groupId: { type: ObjectId, required: true },
    testId: { type: ObjectId, required: true },
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Assignment = new mongoose.model('Assignment', assignmentSchema, 'assignments');

export { Assignment };
